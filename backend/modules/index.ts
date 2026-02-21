/*
  Nakama runtime entrypoint.
  Authoritative Royal Game of Ur match implementation.
*/

import { applyMove, createInitialState, getValidMoves, rollDice } from "../../logic/engine";
import { GameState, PlayerColor } from "../../logic/types";
import {
  MatchOpCode,
  MoveRequestPayload,
  RollRequestPayload,
  ServerErrorCode,
  StateSnapshotPayload,
  decodePayload,
  encodePayload,
  isMoveRequestPayload,
  isRollRequestPayload,
} from "../../shared/urMatchProtocol";

declare namespace nkruntime {
  type Context = any;
  type Logger = any;
  type Nakama = any;
  type Initializer = any;
  type Presence = any;
  type MatchmakerMatched = any;
  type MatchDispatcher = any;
  type MatchMessage = any;
}

type MatchState = {
  presences: Record<string, nkruntime.Presence>;
  assignments: Record<string, PlayerColor>;
  gameState: GameState;
  revision: number;
};

type RuntimeRecord = Record<string, unknown>;

const TICK_RATE = 10;
const MAX_PLAYERS = 2;

const RPC_AUTH_LINK_CUSTOM = "auth_link_custom";
const RPC_MATCHMAKER_ADD = "matchmaker_add";
const MATCH_HANDLER = "authoritative_match";

const asRecord = (value: unknown): RuntimeRecord | null =>
  typeof value === "object" && value !== null ? (value as RuntimeRecord) : null;

const readStringField = (value: unknown, keys: string[]): string | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "string" && field.length > 0) {
      return field;
    }
  }

  return null;
};

const readNumberField = (value: unknown, keys: string[]): number | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "number" && Number.isFinite(field)) {
      return field;
    }
  }

  return null;
};

const encodeBytesToString = (bytes: Uint8Array): string => {
  if (typeof TextDecoder !== "undefined") {
    try {
      return new TextDecoder().decode(bytes);
    } catch {
      // Fall through to manual decode.
    }
  }

  let output = "";
  for (let i = 0; i < bytes.length; i += 1) {
    output += String.fromCharCode(bytes[i]);
  }
  return output;
};

const decodeMessageData = (data: unknown, nk?: nkruntime.Nakama): string => {
  if (typeof data === "string") {
    return data;
  }

  const binaryToString = asRecord(nk)?.binaryToString;
  if (typeof binaryToString === "function") {
    try {
      return String(binaryToString(data));
    } catch {
      // Fall back to local decoding when runtime helper is unavailable.
    }
  }

  if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) {
    return encodeBytesToString(new Uint8Array(data));
  }

  if (typeof Uint8Array !== "undefined" && data instanceof Uint8Array) {
    return encodeBytesToString(data);
  }

  if (Array.isArray(data) && data.every((value) => typeof value === "number")) {
    return encodeBytesToString(Uint8Array.from(data));
  }

  return String(data ?? "");
};

const getPresenceUserId = (presence: unknown): string | null =>
  readStringField(presence, ["userId", "user_id"]);

const getSenderUserId = (sender: unknown): string | null =>
  readStringField(sender, ["userId", "user_id"]);

const getMatchId = (ctx: nkruntime.Context): string =>
  readStringField(ctx, ["matchId", "match_id"]) ?? "";

const getMessageOpCode = (message: nkruntime.MatchMessage): number | null =>
  readNumberField(message, ["opCode", "op_code"]);

// Nakama's JS runtime parser can panic on shorthand object properties in registerMatch.
// Use distinct local aliases so emitted JS keeps explicit key:value pairs.
const matchInitHandler = matchInit;
const matchJoinAttemptHandler = matchJoinAttempt;
const matchJoinHandler = matchJoin;
const matchLeaveHandler = matchLeave;
const matchLoopHandler = matchLoop;
const matchTerminateHandler = matchTerminate;
const matchSignalHandler = matchSignal;

function InitModule(
  _ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
) {
  initializer.registerRpc(RPC_AUTH_LINK_CUSTOM, rpcAuthLinkCustom);
  initializer.registerRpc(RPC_MATCHMAKER_ADD, rpcMatchmakerAdd);
  initializer.registerMatch(MATCH_HANDLER, {
    matchInit: matchInitHandler,
    matchJoinAttempt: matchJoinAttemptHandler,
    matchJoin: matchJoinHandler,
    matchLeave: matchLeaveHandler,
    matchLoop: matchLoopHandler,
    matchTerminate: matchTerminateHandler,
    matchSignal: matchSignalHandler,
  });
  initializer.registerMatchmakerMatched(matchmakerMatched);

  logger.info("Nakama runtime module loaded.");
}

function rpcAuthLinkCustom(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  const data = payload ? JSON.parse(payload) : {};
  const customId = data.customId as string | undefined;
  const username = data.username as string | undefined;

  if (!customId) {
    throw new Error("customId is required.");
  }

  nk.linkCustom(ctx.userId, customId, username);
  logger.info("Linked custom ID to user %s", ctx.userId);

  return JSON.stringify({
    userId: ctx.userId,
    customId,
  });
}

function rpcMatchmakerAdd(
  ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId || !ctx.sessionId) {
    throw new Error("Authentication required.");
  }

  const data = payload ? JSON.parse(payload) : {};
  const minCount = Number.isInteger(data.minCount) ? data.minCount : 2;
  const maxCount = Number.isInteger(data.maxCount) ? data.maxCount : 2;
  const query = typeof data.query === "string" ? data.query : "*";
  const stringProperties = typeof data.stringProperties === "object" ? data.stringProperties : {};
  const numericProperties = typeof data.numericProperties === "object" ? data.numericProperties : {};

  const ticket = nk.matchmakerAdd(
    ctx.userId,
    ctx.sessionId,
    query,
    minCount,
    maxCount,
    stringProperties,
    numericProperties
  );

  return JSON.stringify({ ticket });
}

function matchmakerMatched(
  _ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  matched: nkruntime.MatchmakerMatched
): string {
  const users = Array.isArray(matched.users) ? matched.users : [];
  const playerIds = users
    .map((user: any) => getPresenceUserId(user?.presence))
    .filter((userId: string | null): userId is string => Boolean(userId))
    .slice(0, MAX_PLAYERS);
  logger.info("Matchmaker matched %s players", playerIds.length);

  return nk.matchCreate(MATCH_HANDLER, { playerIds });
}

function matchInit(
  _ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  params: Record<string, unknown>
): { state: MatchState; tickRate: number; label: string } {
  const playerIds = Array.isArray(params.playerIds) ? (params.playerIds as string[]) : [];

  const assignments: Record<string, PlayerColor> = {};
  if (playerIds[0]) {
    assignments[playerIds[0]] = "light";
  }
  if (playerIds[1]) {
    assignments[playerIds[1]] = "dark";
  }

  const state: MatchState = {
    presences: {},
    assignments,
    gameState: createInitialState(),
    revision: 0,
  };

  return { state, tickRate: TICK_RATE, label: MATCH_HANDLER };
}

function matchJoinAttempt(
  _ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  _dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  presence: nkruntime.Presence
): { state: MatchState; accept: boolean; rejectMessage?: string } {
  const userId = getPresenceUserId(presence);
  if (!userId) {
    logger.warn("Rejecting join attempt with missing user ID.");
    return { state, accept: false, rejectMessage: "Unable to identify player." };
  }

  const activeCount = Object.keys(state.presences).length;
  const hasExistingAssignment = Boolean(state.assignments[userId]);

  if (activeCount >= MAX_PLAYERS && !hasExistingAssignment) {
    return { state, accept: false, rejectMessage: "Match is full." };
  }

  state.presences[userId] = presence;
  ensureAssignment(state, userId);

  return { state, accept: true };
}

function matchJoin(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  presences: nkruntime.Presence[]
): { state: MatchState } {
  presences.forEach((presence) => {
    const userId = getPresenceUserId(presence);
    if (!userId) {
      logger.warn("Skipping join presence with missing user ID.");
      return;
    }
    state.presences[userId] = presence;
    ensureAssignment(state, userId);
  });

  broadcastSnapshot(dispatcher, state, getMatchId(ctx));

  return { state };
}

function matchLeave(
  _ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  _dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  presences: nkruntime.Presence[]
): { state: MatchState } {
  presences.forEach((presence) => {
    const userId = getPresenceUserId(presence);
    if (!userId) {
      logger.warn("Skipping leave presence with missing user ID.");
      return;
    }
    delete state.presences[userId];
  });

  return { state };
}

function matchLoop(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  messages: nkruntime.MatchMessage[]
): { state: MatchState } {
  const matchId = getMatchId(ctx);

  messages.forEach((message) => {
    const senderUserId = getSenderUserId(message.sender);
    if (!senderUserId) {
      logger.warn("Ignoring message with missing sender user ID.");
      return;
    }

    const senderPresence = state.presences[senderUserId];
    const senderColor = state.assignments[senderUserId];

    if (!senderPresence || !senderColor) {
      sendError(
        dispatcher,
        state,
        senderUserId,
        "UNAUTHORIZED_PLAYER",
        "Only assigned players can send match commands."
      );
      return;
    }

    const opCode = getMessageOpCode(message);
    if (opCode === null) {
      sendError(dispatcher, state, senderUserId, "UNKNOWN_OP", "Message opcode is missing.");
      return;
    }

    const rawPayload = decodeMessageData(message.data, nk);
    const decodedPayload = decodePayload(rawPayload);

    if (opCode === MatchOpCode.ROLL_REQUEST) {
      if (!isRollRequestPayload(decodedPayload)) {
        sendError(dispatcher, state, senderUserId, "INVALID_PAYLOAD", "Roll payload is invalid.");
        return;
      }

      applyRollRequest(logger, dispatcher, state, senderUserId, senderColor, decodedPayload, matchId);
      return;
    }

    if (opCode === MatchOpCode.MOVE_REQUEST) {
      if (!isMoveRequestPayload(decodedPayload)) {
        sendError(dispatcher, state, senderUserId, "INVALID_PAYLOAD", "Move payload is invalid.");
        return;
      }

      applyMoveRequest(logger, dispatcher, state, senderUserId, senderColor, decodedPayload, matchId);
      return;
    }

    sendError(dispatcher, state, senderUserId, "UNKNOWN_OP", `Unsupported opcode ${opCode}.`);
  });

  return { state };
}

function matchTerminate(
  _ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  _dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  _graceSeconds: number
): { state: MatchState } {
  return { state };
}

function matchSignal(
  ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  data: string
): { state: MatchState } | string {
  if (data === "snapshot") {
    broadcastSnapshot(dispatcher, state, getMatchId(ctx));
  }
  return { state };
}

function ensureAssignment(state: MatchState, userId: string): void {
  if (state.assignments[userId]) {
    return;
  }

  const assignedColors = Object.values(state.assignments);
  if (!assignedColors.includes("light")) {
    state.assignments[userId] = "light";
    return;
  }

  if (!assignedColors.includes("dark")) {
    state.assignments[userId] = "dark";
  }
}

function applyRollRequest(
  logger: nkruntime.Logger,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  userId: string,
  playerColor: PlayerColor,
  _payload: RollRequestPayload,
  matchId: string
): void {
  if (state.gameState.winner) {
    sendError(dispatcher, state, userId, "INVALID_PHASE", "The match has already ended.");
    return;
  }

  if (state.gameState.currentTurn !== playerColor) {
    sendError(dispatcher, state, userId, "INVALID_TURN", "It is not your turn to roll.");
    return;
  }

  if (state.gameState.phase !== "rolling") {
    sendError(dispatcher, state, userId, "INVALID_PHASE", "Roll is only valid during rolling phase.");
    return;
  }

  const rollValue = rollDice();
  const rollingState: GameState = {
    ...state.gameState,
    rollValue,
    phase: "moving",
  };

  const validMoves = getValidMoves(rollingState, rollValue);

  if (validMoves.length === 0) {
    state.gameState = {
      ...rollingState,
      currentTurn: rollingState.currentTurn === "light" ? "dark" : "light",
      phase: "rolling",
      rollValue: null,
      history: [...rollingState.history, `${rollingState.currentTurn} rolled ${rollValue} but had no moves.`],
    };
  } else {
    state.gameState = rollingState;
  }

  state.revision += 1;
  logger.debug("Applied roll for %s (revision %d)", userId, state.revision);
  broadcastSnapshot(dispatcher, state, matchId);
}

function applyMoveRequest(
  logger: nkruntime.Logger,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  userId: string,
  playerColor: PlayerColor,
  payload: MoveRequestPayload,
  matchId: string
): void {
  if (state.gameState.winner) {
    sendError(dispatcher, state, userId, "INVALID_PHASE", "The match has already ended.");
    return;
  }

  if (state.gameState.currentTurn !== playerColor) {
    sendError(dispatcher, state, userId, "INVALID_TURN", "It is not your turn to move.");
    return;
  }

  if (state.gameState.phase !== "moving" || state.gameState.rollValue === null) {
    sendError(dispatcher, state, userId, "INVALID_PHASE", "Move is only valid during moving phase.");
    return;
  }

  const validMoves = getValidMoves(state.gameState, state.gameState.rollValue);
  const moveIsValid = validMoves.some(
    (validMove) =>
      validMove.pieceId === payload.move.pieceId &&
      validMove.fromIndex === payload.move.fromIndex &&
      validMove.toIndex === payload.move.toIndex
  );

  if (!moveIsValid) {
    sendError(dispatcher, state, userId, "INVALID_MOVE", "Move is not valid for current state.");
    return;
  }

  state.gameState = applyMove(state.gameState, payload.move);
  state.revision += 1;
  logger.debug("Applied move for %s (revision %d)", userId, state.revision);
  broadcastSnapshot(dispatcher, state, matchId);
}

function sendError(
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  userId: string,
  code: ServerErrorCode,
  message: string
): void {
  const target = state.presences[userId];
  if (!target) {
    return;
  }

  dispatcher.broadcastMessage(
    MatchOpCode.SERVER_ERROR,
    encodePayload({
      type: "server_error",
      code,
      message,
      revision: state.revision,
    }),
    [target]
  );
}

function broadcastSnapshot(dispatcher: nkruntime.MatchDispatcher, state: MatchState, matchId: string): void {
  const payload: StateSnapshotPayload = {
    type: "state_snapshot",
    matchId,
    revision: state.revision,
    gameState: state.gameState,
    assignments: state.assignments,
  };

  dispatcher.broadcastMessage(MatchOpCode.STATE_SNAPSHOT, encodePayload(payload));
}

type RuntimeGlobalBindings = {
  InitModule: typeof InitModule;
  rpcAuthLinkCustom: typeof rpcAuthLinkCustom;
  rpcMatchmakerAdd: typeof rpcMatchmakerAdd;
  matchmakerMatched: typeof matchmakerMatched;
  matchInit: typeof matchInit;
  matchJoinAttempt: typeof matchJoinAttempt;
  matchJoin: typeof matchJoin;
  matchLeave: typeof matchLeave;
  matchLoop: typeof matchLoop;
  matchTerminate: typeof matchTerminate;
  matchSignal: typeof matchSignal;
};

const runtimeGlobals: RuntimeGlobalBindings = {
  InitModule,
  rpcAuthLinkCustom,
  rpcMatchmakerAdd,
  matchmakerMatched,
  matchInit,
  matchJoinAttempt,
  matchJoin,
  matchLeave,
  matchLoop,
  matchTerminate,
  matchSignal,
};

Object.assign(globalThis as Record<string, unknown>, runtimeGlobals);
