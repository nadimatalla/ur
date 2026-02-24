import { MatchData, Session, Socket } from "@heroiclabs/nakama-js";

import { PlayerColor } from "@/logic/types";
import { MatchOpCode, decodePayload, isStateSnapshotPayload } from "@/shared/urMatchProtocol";
import { nakamaService } from "./nakama";

const CONNECT_TIMEOUT_MS = 10_000;
const START_MATCHMAKING_TIMEOUT_MS = 10_000;
const WAIT_FOR_MATCH_TIMEOUT_MS = 20_000;
const JOIN_MATCH_TIMEOUT_MS = 10_000;

let activeMatchmakerTicket: string | null = null;

const ensureAuthenticated = async (): Promise<Session> => nakamaService.ensureAuthenticatedDevice();

const ensureSocket = async (): Promise<Socket> =>
  nakamaService.connectSocketWithRetry({ attempts: 3, retryDelayMs: 1_000, createStatus: true });

const waitForMatchmaker = (socket: Socket, ticket: string, timeoutMs: number): Promise<{ matchId: string; token?: string }> =>
  new Promise((resolve, reject) => {
    const previousHandler = socket.onmatchmakermatched;
    const timeout = setTimeout(() => {
      socket.onmatchmakermatched = previousHandler;
      reject(new Error("Matchmaking timed out. Please try again."));
    }, timeoutMs);

    socket.onmatchmakermatched = (matched) => {
      if (matched.ticket !== ticket) {
        return;
      }
      clearTimeout(timeout);
      socket.onmatchmakermatched = previousHandler;
      resolve({ matchId: matched.match_id, token: matched.token || undefined });
    };
  });

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

type StatusLikeError = {
  status?: number;
  statusText?: string;
  headers?: {
    get?: (name: string) => string | null;
  };
};

const normalizeMatchmakingError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const responseLike = error as StatusLikeError;
    const status = responseLike.status;
    const statusText = responseLike.statusText;
    const authenticateHeader =
      responseLike.headers?.get?.("www-authenticate") ?? responseLike.headers?.get?.("WWW-Authenticate");

    if (status === 401 && authenticateHeader?.toLowerCase().includes("server key invalid")) {
      return new Error("Authentication failed: Nakama server key is invalid or mismatched.");
    }

    if (typeof status === "number") {
      return new Error(`Matchmaking request failed (${status}${statusText ? ` ${statusText}` : ""}).`);
    }
  }

  return new Error("No opponents found. Try again later.");
};

const waitForInitialAssignment = (
  socket: Socket,
  matchId: string,
  userId: string,
  timeoutMs: number
): Promise<PlayerColor | null> =>
  new Promise((resolve) => {
    const previousHandler = socket.onmatchdata;
    const timeout = setTimeout(() => {
      socket.onmatchdata = previousHandler;
      resolve(null);
    }, timeoutMs);

    socket.onmatchdata = (matchData: MatchData) => {
      if (matchData.match_id !== matchId || matchData.op_code !== MatchOpCode.STATE_SNAPSHOT) {
        if (previousHandler) {
          previousHandler(matchData);
        }
        return;
      }

      let rawPayload = "";
      if (typeof matchData.data === "string") {
        rawPayload = matchData.data;
      } else if (typeof TextDecoder !== "undefined") {
        rawPayload = new TextDecoder().decode(matchData.data);
      } else {
        rawPayload = String.fromCharCode(...Array.from(matchData.data));
      }

      const payload = decodePayload(rawPayload);
      if (isStateSnapshotPayload(payload)) {
        const assignment = payload.assignments[userId];
        if (assignment === "light" || assignment === "dark") {
          clearTimeout(timeout);
          socket.onmatchdata = previousHandler;
          resolve(assignment);
          return;
        }
      }

      if (previousHandler) {
        previousHandler(matchData);
      }
    };
  });

export type MatchResult = {
  matchId: string;
  session: Session;
  userId: string;
  matchmakerTicket: string | null;
  playerColor: PlayerColor | null;
  matchToken: string | null;
};

export type MatchmakingHandlers = {
  onSearching?: () => void;
};

export const cancelMatchmaking = async (): Promise<void> => {
  const ticket = activeMatchmakerTicket;
  if (!ticket) {
    return;
  }

  activeMatchmakerTicket = null;
  const socket = nakamaService.getSocket();
  if (!socket) {
    return;
  }

  try {
    await socket.removeMatchmaker(ticket);
  } catch {
    // Ignore removal errors if the ticket was already consumed or the socket dropped.
  }
};

export const findMatch = async (handlers?: MatchmakingHandlers): Promise<MatchResult> => {
  const session = await ensureAuthenticated();
  const socket = await withTimeout(
    ensureSocket(),
    CONNECT_TIMEOUT_MS,
    "Connecting to the game server timed out. Please retry."
  );

  try {
    const ticket = await withTimeout(
      socket.addMatchmaker("*", 2, 2),
      START_MATCHMAKING_TIMEOUT_MS,
      "Unable to start matchmaking. Please retry."
    );

    activeMatchmakerTicket = ticket.ticket;
    handlers?.onSearching?.();

    const matched = await waitForMatchmaker(socket, ticket.ticket, WAIT_FOR_MATCH_TIMEOUT_MS);
    activeMatchmakerTicket = null;

    const match = await withTimeout(
      socket.joinMatch(matched.matchId, matched.token),
      JOIN_MATCH_TIMEOUT_MS,
      "Joining the match timed out. Please retry."
    );

    if (!match.match_id) {
      throw new Error("Match join did not return a match ID.");
    }

    if (!session.user_id) {
      throw new Error("Authenticated session is missing user ID.");
    }

    const playerColor = await waitForInitialAssignment(socket, match.match_id, session.user_id, 3_000);

    return {
      matchId: match.match_id,
      session,
      userId: session.user_id,
      matchmakerTicket: ticket.ticket,
      playerColor,
      matchToken: matched.token ?? null,
    };
  } catch (error) {
    await cancelMatchmaking();
    nakamaService.disconnectSocket(false);
    throw normalizeMatchmakingError(error);
  }
};
