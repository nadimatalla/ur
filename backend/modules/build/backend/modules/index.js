var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// logic/constants.ts
var ROSETTES = [
  { row: 0, col: 0 },
  { row: 2, col: 0 },
  { row: 1, col: 3 },
  // The central war rosette
  { row: 0, col: 6 },
  { row: 2, col: 6 }
];
var PATH_LIGHT = [
  { row: 2, col: 3 },
  { row: 2, col: 2 },
  { row: 2, col: 1 },
  { row: 2, col: 0 },
  // 0-3
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  // 4-7
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 1, col: 7 },
  // 8-11
  { row: 2, col: 7 },
  { row: 2, col: 6 }
  // 12-13
  // 14 is "off board" finish
];
var PATH_DARK = [
  { row: 0, col: 3 },
  { row: 0, col: 2 },
  { row: 0, col: 1 },
  { row: 0, col: 0 },
  // 0-3
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  // 4-7
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 1, col: 7 },
  // 8-11
  { row: 0, col: 7 },
  { row: 0, col: 6 }
  // 12-13
];
var PATH_LENGTH = 14;
var isRosette = (r, c) => ROSETTES.some((coord) => coord.row === r && coord.col === c);
var isWarZone = (r, c) => r === 1;

// logic/engine.ts
var INITIAL_PIECE_COUNT = 7;
var createPlayer = (color) => ({
  id: color,
  color,
  pieces: Array.from({ length: INITIAL_PIECE_COUNT }).map((_, i) => ({
    id: `${color}-${i}`,
    owner: color,
    position: -1,
    isFinished: false
  })),
  capturedCount: 0,
  finishedCount: 0
});
var createInitialState = () => ({
  currentTurn: "light",
  rollValue: null,
  phase: "rolling",
  light: createPlayer("light"),
  dark: createPlayer("dark"),
  winner: null,
  history: []
});
var rollDice = () => {
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    if (Math.random() > 0.5) sum++;
  }
  return sum;
};
var getPathCoord = (color, index) => {
  const path = color === "light" ? PATH_LIGHT : PATH_DARK;
  return path[index];
};
var getValidMoves = (state, roll) => {
  if (roll === 0) return [];
  const player = state[state.currentTurn];
  const opponent = state[state.currentTurn === "light" ? "dark" : "light"];
  const moves = [];
  const processedPositions = /* @__PURE__ */ new Set();
  for (const piece of player.pieces) {
    if (piece.isFinished) continue;
    if (piece.position === -1 && processedPositions.has(-1)) continue;
    if (piece.position === -1) processedPositions.add(-1);
    const targetIndex = piece.position + roll;
    if (targetIndex > PATH_LENGTH) continue;
    if (targetIndex === PATH_LENGTH) {
      moves.push({ pieceId: piece.id, fromIndex: piece.position, toIndex: targetIndex });
      continue;
    }
    const myPieceAtTarget = player.pieces.find((p) => p.position === targetIndex && !p.isFinished);
    if (myPieceAtTarget) continue;
    const targetCoord = getPathCoord(player.color, targetIndex);
    const isShared = isWarZone(targetCoord.row, targetCoord.col);
    const opponentPiece = opponent.pieces.find((p) => {
      if (p.isFinished || p.position === -1) return false;
      const opCoord = getPathCoord(opponent.color, p.position);
      return opCoord.row === targetCoord.row && opCoord.col === targetCoord.col;
    });
    if (opponentPiece) {
      const targetIsRosette = isRosette(targetCoord.row, targetCoord.col);
      if (targetIsRosette && isShared) {
        continue;
      }
    }
    moves.push({ pieceId: piece.id, fromIndex: piece.position, toIndex: targetIndex });
  }
  return moves;
};
var applyMove = (state, move) => {
  const newState = JSON.parse(JSON.stringify(state));
  const player = newState[newState.currentTurn];
  const opponent = newState[newState.currentTurn === "light" ? "dark" : "light"];
  const piece = player.pieces.find((p) => p.id === move.pieceId);
  piece.position = move.toIndex;
  if (move.toIndex === PATH_LENGTH) {
    piece.isFinished = true;
    player.finishedCount++;
  }
  if (move.toIndex < PATH_LENGTH) {
    const targetCoord = getPathCoord(player.color, move.toIndex);
    const opponentPiece = opponent.pieces.find((p) => {
      if (p.isFinished || p.position === -1) return false;
      const opCoord = getPathCoord(opponent.color, p.position);
      return opCoord.row === targetCoord.row && opCoord.col === targetCoord.col;
    });
    if (opponentPiece) {
      opponentPiece.position = -1;
      player.capturedCount++;
      newState.history.push(`${player.color} captured ${opponent.color}`);
    }
  }
  let isRosetteLanding = false;
  if (move.toIndex < PATH_LENGTH) {
    const coord = getPathCoord(player.color, move.toIndex);
    if (isRosette(coord.row, coord.col)) {
      isRosetteLanding = true;
    }
  }
  newState.history.push(`${player.color} moved to ${move.toIndex}. Rosette: ${isRosetteLanding}`);
  if (isRosetteLanding) {
    newState.phase = "rolling";
    newState.rollValue = null;
  } else {
    newState.currentTurn = newState.currentTurn === "light" ? "dark" : "light";
    newState.phase = "rolling";
    newState.rollValue = null;
  }
  if (player.finishedCount >= INITIAL_PIECE_COUNT) {
    newState.winner = player.color;
    newState.phase = "ended";
  }
  return newState;
};

// shared/urMatchProtocol.ts
var MatchOpCode = {
  ROLL_REQUEST: 1,
  MOVE_REQUEST: 2,
  STATE_SNAPSHOT: 100,
  SERVER_ERROR: 101
};
var isRecord = (value) => typeof value === "object" && value !== null;
var isMoveAction = (value) => {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.pieceId === "string" && typeof value.fromIndex === "number" && Number.isInteger(value.fromIndex) && typeof value.toIndex === "number" && Number.isInteger(value.toIndex);
};
var isRollRequestPayload = (value) => isRecord(value) && value.type === "roll_request";
var isMoveRequestPayload = (value) => isRecord(value) && value.type === "move_request" && isMoveAction(value.move);
var encodePayload = (payload) => JSON.stringify(payload);
var decodePayload = (raw) => {
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

// backend/modules/index.ts
var TICK_RATE = 10;
var MAX_PLAYERS = 2;
var RPC_AUTH_LINK_CUSTOM = "auth_link_custom";
var RPC_MATCHMAKER_ADD = "matchmaker_add";
var MATCH_HANDLER = "authoritative_match";
var asRecord = (value) => typeof value === "object" && value !== null ? value : null;
var readStringField = (value, keys) => {
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
var readNumberField = (value, keys) => {
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
var encodeBytesToString = (bytes) => {
  if (typeof TextDecoder !== "undefined") {
    try {
      return new TextDecoder().decode(bytes);
    } catch (e) {
    }
  }
  let output = "";
  for (let i = 0; i < bytes.length; i += 1) {
    output += String.fromCharCode(bytes[i]);
  }
  return output;
};
var decodeMessageData = (data, nk) => {
  var _a;
  if (typeof data === "string") {
    return data;
  }
  const binaryToString = (_a = asRecord(nk)) == null ? void 0 : _a.binaryToString;
  if (typeof binaryToString === "function") {
    try {
      return String(binaryToString(data));
    } catch (e) {
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
  return String(data != null ? data : "");
};
var getPresenceUserId = (presence) => readStringField(presence, ["userId", "user_id"]);
var getSenderUserId = (sender) => readStringField(sender, ["userId", "user_id"]);
var getMatchId = (ctx) => {
  var _a;
  return (_a = readStringField(ctx, ["matchId", "match_id"])) != null ? _a : "";
};
var getMessageOpCode = (message) => readNumberField(message, ["opCode", "op_code"]);
var matchInitHandler = matchInit;
var matchJoinAttemptHandler = matchJoinAttempt;
var matchJoinHandler = matchJoin;
var matchLeaveHandler = matchLeave;
var matchLoopHandler = matchLoop;
var matchTerminateHandler = matchTerminate;
var matchSignalHandler = matchSignal;
function InitModule(_ctx, logger, _nk, initializer) {
  initializer.registerRpc(RPC_AUTH_LINK_CUSTOM, rpcAuthLinkCustom);
  initializer.registerRpc(RPC_MATCHMAKER_ADD, rpcMatchmakerAdd);
  initializer.registerMatch(MATCH_HANDLER, {
    matchInit: matchInitHandler,
    matchJoinAttempt: matchJoinAttemptHandler,
    matchJoin: matchJoinHandler,
    matchLeave: matchLeaveHandler,
    matchLoop: matchLoopHandler,
    matchTerminate: matchTerminateHandler,
    matchSignal: matchSignalHandler
  });
  initializer.registerMatchmakerMatched(matchmakerMatched);
  logger.info("Nakama runtime module loaded.");
}
function rpcAuthLinkCustom(ctx, logger, nk, payload) {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  const data = payload ? JSON.parse(payload) : {};
  const customId = data.customId;
  const username = data.username;
  if (!customId) {
    throw new Error("customId is required.");
  }
  nk.linkCustom(ctx.userId, customId, username);
  logger.info("Linked custom ID to user %s", ctx.userId);
  return JSON.stringify({
    userId: ctx.userId,
    customId
  });
}
function rpcMatchmakerAdd(ctx, _logger, nk, payload) {
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
function matchmakerMatched(_ctx, logger, nk, matched) {
  const users = Array.isArray(matched.users) ? matched.users : [];
  const playerIds = users.map((user) => getPresenceUserId(user == null ? void 0 : user.presence)).filter((userId) => Boolean(userId)).slice(0, MAX_PLAYERS);
  logger.info("Matchmaker matched %s players", playerIds.length);
  return nk.matchCreate(MATCH_HANDLER, { playerIds });
}
function matchInit(_ctx, _logger, _nk, params) {
  const playerIds = Array.isArray(params.playerIds) ? params.playerIds : [];
  const assignments = {};
  if (playerIds[0]) {
    assignments[playerIds[0]] = "light";
  }
  if (playerIds[1]) {
    assignments[playerIds[1]] = "dark";
  }
  const state = {
    presences: {},
    assignments,
    gameState: createInitialState(),
    revision: 0
  };
  return { state, tickRate: TICK_RATE, label: MATCH_HANDLER };
}
function matchJoinAttempt(_ctx, logger, _nk, _dispatcher, _tick, state, presence) {
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
function matchJoin(ctx, logger, _nk, dispatcher, _tick, state, presences) {
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
function matchLeave(_ctx, logger, _nk, _dispatcher, _tick, state, presences) {
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
function matchLoop(ctx, logger, nk, dispatcher, _tick, state, messages) {
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
function matchTerminate(_ctx, _logger, _nk, _dispatcher, _tick, state, _graceSeconds) {
  return { state };
}
function matchSignal(ctx, _logger, _nk, dispatcher, _tick, state, data) {
  if (data === "snapshot") {
    broadcastSnapshot(dispatcher, state, getMatchId(ctx));
  }
  return { state };
}
function ensureAssignment(state, userId) {
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
function applyRollRequest(logger, dispatcher, state, userId, playerColor, _payload, matchId) {
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
  const rollingState = __spreadProps(__spreadValues({}, state.gameState), {
    rollValue,
    phase: "moving"
  });
  const validMoves = getValidMoves(rollingState, rollValue);
  if (validMoves.length === 0) {
    state.gameState = __spreadProps(__spreadValues({}, rollingState), {
      currentTurn: rollingState.currentTurn === "light" ? "dark" : "light",
      phase: "rolling",
      rollValue: null,
      history: [...rollingState.history, `${rollingState.currentTurn} rolled ${rollValue} but had no moves.`]
    });
  } else {
    state.gameState = rollingState;
  }
  state.revision += 1;
  logger.debug("Applied roll for %s (revision %d)", userId, state.revision);
  broadcastSnapshot(dispatcher, state, matchId);
}
function applyMoveRequest(logger, dispatcher, state, userId, playerColor, payload, matchId) {
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
    (validMove) => validMove.pieceId === payload.move.pieceId && validMove.fromIndex === payload.move.fromIndex && validMove.toIndex === payload.move.toIndex
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
function sendError(dispatcher, state, userId, code, message) {
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
      revision: state.revision
    }),
    [target]
  );
}
function broadcastSnapshot(dispatcher, state, matchId) {
  const payload = {
    type: "state_snapshot",
    matchId,
    revision: state.revision,
    gameState: state.gameState,
    assignments: state.assignments
  };
  dispatcher.broadcastMessage(MatchOpCode.STATE_SNAPSHOT, encodePayload(payload));
}
var runtimeGlobals = {
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
  matchSignal
};
Object.assign(globalThis, runtimeGlobals);
