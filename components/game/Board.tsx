import { urTheme } from '@/constants/urTheme';
import { BOARD_COLS, BOARD_ROWS, PATH_DARK, PATH_LENGTH, PATH_LIGHT } from '@/logic/constants';
import { GameState, MoveAction, PlayerColor } from '@/logic/types';
import { useGameStore } from '@/store/useGameStore';
import React, { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle as SvgCircle,
  Defs,
  Line as SvgLine,
  LinearGradient,
  Rect as SvgRect,
  Stop,
} from 'react-native-svg';
import { Piece } from './Piece';
import { Tile } from './Tile';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface BoardProps {
  showRailHints?: boolean;
  highlightMode?: 'subtle' | 'theatrical';
  boardScale?: number;
  orientation?: 'horizontal' | 'vertical';
  gameStateOverride?: GameState;
  validMovesOverride?: MoveAction[];
  onMakeMoveOverride?: (move: MoveAction) => void;
  playerColorOverride?: PlayerColor | null;
  allowInteraction?: boolean;
}

interface Point {
  x: number;
  y: number;
}

const FRAME_PADDING = urTheme.spacing.sm;
const INNER_PADDING = urTheme.spacing.xs;
const GRID_GAP = 0;
const CUE_SIZE = 48;
const SCORE_CUE_MIN_SIZE = 44;
const SCORE_CUE_MAX_SIZE = 58;
const MIN_TILE_SHELL_PADDING = 2;

interface BoardSkinCell {
  key: string;
  displayRow: number;
  displayCol: number;
  x: number;
  y: number;
  width: number;
  height: number;
  neighbors: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
}

type BoardSkinLayerMode = 'frame' | 'stone' | 'grid';

const seededUnit = (seed: number) => {
  const raw = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return raw - Math.floor(raw);
};

interface BoardSkinLayerProps {
  mode: BoardSkinLayerMode;
  width: number;
  height: number;
  cells: BoardSkinCell[];
  cellSize: number;
  tileShellPadding: number;
  frameBand: number;
}

const BoardSkinLayer: React.FC<BoardSkinLayerProps> = ({
  mode,
  width,
  height,
  cells,
  cellSize,
  tileShellPadding,
  frameBand,
}) => {
  const stoneInset = Math.max(1, Math.min(tileShellPadding - 1, Math.round(cellSize * 0.04) + 1));
  const panelRadius = Math.max(2, Math.round(cellSize * 0.045));
  const frameRadius = Math.max(2, Math.round(cellSize * 0.05));
  const gradientPrefix = useMemo(
    () => `${mode}-${Math.round(width)}-${Math.round(height)}-${Math.round(cellSize)}-${cells.length}`,
    [cellSize, cells.length, height, mode, width],
  );

  const panelRects = useMemo(
    () =>
      cells.map((cell) => ({
        x: cell.x + stoneInset,
        y: cell.y + stoneInset,
        width: Math.max(2, cell.width - stoneInset * 2),
        height: Math.max(2, cell.height - stoneInset * 2),
      })),
    [cells, stoneInset],
  );

  const frameEdgeRects = useMemo(() => {
    const rects: { x: number; y: number; width: number; height: number; key: string }[] = [];

    for (const cell of cells) {
      if (!cell.neighbors.top) {
        rects.push({
          key: `${cell.key}-edge-top`,
          x: cell.x,
          y: cell.y - frameBand,
          width: cell.width,
          height: frameBand,
        });
      }
      if (!cell.neighbors.right) {
        rects.push({
          key: `${cell.key}-edge-right`,
          x: cell.x + cell.width,
          y: cell.y,
          width: frameBand,
          height: cell.height,
        });
      }
      if (!cell.neighbors.bottom) {
        rects.push({
          key: `${cell.key}-edge-bottom`,
          x: cell.x,
          y: cell.y + cell.height,
          width: cell.width,
          height: frameBand,
        });
      }
      if (!cell.neighbors.left) {
        rects.push({
          key: `${cell.key}-edge-left`,
          x: cell.x - frameBand,
          y: cell.y,
          width: frameBand,
          height: cell.height,
        });
      }

      if (!cell.neighbors.top && !cell.neighbors.left) {
        rects.push({
          key: `${cell.key}-corner-tl`,
          x: cell.x - frameBand,
          y: cell.y - frameBand,
          width: frameBand,
          height: frameBand,
        });
      }
      if (!cell.neighbors.top && !cell.neighbors.right) {
        rects.push({
          key: `${cell.key}-corner-tr`,
          x: cell.x + cell.width,
          y: cell.y - frameBand,
          width: frameBand,
          height: frameBand,
        });
      }
      if (!cell.neighbors.bottom && !cell.neighbors.right) {
        rects.push({
          key: `${cell.key}-corner-br`,
          x: cell.x + cell.width,
          y: cell.y + cell.height,
          width: frameBand,
          height: frameBand,
        });
      }
      if (!cell.neighbors.bottom && !cell.neighbors.left) {
        rects.push({
          key: `${cell.key}-corner-bl`,
          x: cell.x - frameBand,
          y: cell.y + cell.height,
          width: frameBand,
          height: frameBand,
        });
      }
    }

    return rects;
  }, [cells, frameBand]);

  const woodScratches = useMemo(() => {
    if (mode !== 'frame') return [];

    const lines: { key: string; x1: number; y1: number; x2: number; y2: number; opacity: number; width: number }[] =
      [];

    cells.forEach((cell, cellIndex) => {
      const lineCount = 4;
      for (let i = 0; i < lineCount; i += 1) {
        const seed = cellIndex * 17 + i * 13 + 5;
        const startX = cell.x + seededUnit(seed) * cell.width;
        const startY = cell.y + seededUnit(seed + 1) * cell.height;
        const len = cell.width * (0.18 + seededUnit(seed + 2) * 0.42);
        const angle = (seededUnit(seed + 3) - 0.5) * 0.8;
        const x2 = startX + Math.cos(angle) * len;
        const y2 = startY + Math.sin(angle) * len;
        lines.push({
          key: `${cell.key}-scratch-${i}`,
          x1: startX,
          y1: startY,
          x2,
          y2,
          opacity: 0.08 + seededUnit(seed + 4) * 0.12,
          width: 0.8 + seededUnit(seed + 5) * 1.1,
        });
      }
    });

    return lines;
  }, [cells, mode]);

  const stoneSpeckles = useMemo(() => {
    if (mode !== 'stone') return [];

    const dots: { key: string; cx: number; cy: number; r: number; opacity: number; dark: boolean }[] = [];
    panelRects.forEach((panel, panelIndex) => {
      const count = 14;
      for (let i = 0; i < count; i += 1) {
        const seed = panelIndex * 31 + i * 7 + 3;
        dots.push({
          key: `speck-${panelIndex}-${i}`,
          cx: panel.x + seededUnit(seed) * panel.width,
          cy: panel.y + seededUnit(seed + 1) * panel.height,
          r: 0.45 + seededUnit(seed + 2) * 1.4,
          opacity: 0.04 + seededUnit(seed + 3) * 0.09,
          dark: seededUnit(seed + 4) > 0.52,
        });
      }
    });
    return dots;
  }, [mode, panelRects]);

  const stoneVeins = useMemo(() => {
    if (mode !== 'stone') return [];

    const veins: { key: string; x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
    panelRects.forEach((panel, panelIndex) => {
      for (let i = 0; i < 2; i += 1) {
        const seed = panelIndex * 23 + i * 19 + 11;
        const x1 = panel.x + seededUnit(seed) * panel.width;
        const y1 = panel.y + seededUnit(seed + 1) * panel.height;
        const x2 = x1 + (seededUnit(seed + 2) - 0.5) * panel.width * 0.55;
        const y2 = y1 + (seededUnit(seed + 3) - 0.5) * panel.height * 0.35;
        veins.push({
          key: `vein-${panelIndex}-${i}`,
          x1,
          y1,
          x2,
          y2,
          opacity: 0.06 + seededUnit(seed + 4) * 0.07,
        });
      }
    });

    return veins;
  }, [mode, panelRects]);

  const pegPoints = useMemo(() => {
    if (mode !== 'grid') return [];

    const pointMap = new Map<string, { x: number; y: number; count: number }>();

    const addPoint = (x: number, y: number) => {
      const px = Math.round(x * 2) / 2;
      const py = Math.round(y * 2) / 2;
      const key = `${px}:${py}`;
      const existing = pointMap.get(key);
      if (existing) {
        existing.count += 1;
        return;
      }
      pointMap.set(key, { x: px, y: py, count: 1 });
    };

    cells.forEach((cell) => {
      addPoint(cell.x, cell.y);
      addPoint(cell.x + cell.width, cell.y);
      addPoint(cell.x + cell.width, cell.y + cell.height);
      addPoint(cell.x, cell.y + cell.height);
    });

    return [...pointMap.values()].filter((point) => point.count >= 2 || seededUnit(point.x + point.y) > 0.7);
  }, [cells, mode]);

  const renderWoodRects = () => (
    <>
      {cells.map((cell) => (
        <SvgRect
          key={`${cell.key}-core`}
          x={cell.x}
          y={cell.y}
          width={cell.width}
          height={cell.height}
          fill={`url(#${gradientPrefix}-wood)`}
        />
      ))}
      {frameEdgeRects.map((rect) => (
        <SvgRect
          key={rect.key}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill={`url(#${gradientPrefix}-wood)`}
          rx={frameRadius}
          ry={frameRadius}
        />
      ))}
      {cells.map((cell) => (
        <SvgRect
          key={`${cell.key}-rim-stroke`}
          x={cell.x + 0.5}
          y={cell.y + 0.5}
          width={Math.max(1, cell.width - 1)}
          height={Math.max(1, cell.height - 1)}
          fill="none"
          stroke="rgba(26, 14, 8, 0.36)"
          strokeWidth={1}
        />
      ))}
      {woodScratches.map((line) => (
        <SvgLine
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={`rgba(23, 12, 6, ${line.opacity})`}
          strokeWidth={line.width}
          strokeLinecap="round"
        />
      ))}
      {woodScratches.map((line) => (
        <SvgLine
          key={`${line.key}-hi`}
          x1={line.x1}
          y1={line.y1 - 0.35}
          x2={line.x2}
          y2={line.y2 - 0.35}
          stroke={`rgba(255, 228, 180, ${line.opacity * 0.32})`}
          strokeWidth={Math.max(0.5, line.width * 0.35)}
          strokeLinecap="round"
        />
      ))}
    </>
  );

  const renderStonePanels = () => (
    <>
      {panelRects.map((panel, index) => (
        <SvgRect
          key={`panel-${index}`}
          x={panel.x}
          y={panel.y}
          width={panel.width}
          height={panel.height}
          rx={panelRadius}
          ry={panelRadius}
          fill={`url(#${gradientPrefix}-stone)`}
        />
      ))}
      {stoneSpeckles.map((dot) => (
        <SvgCircle
          key={dot.key}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          fill={dot.dark ? 'rgba(48, 38, 26, 0.55)' : 'rgba(240, 225, 191, 0.6)'}
          opacity={dot.opacity}
        />
      ))}
      {stoneVeins.map((vein) => (
        <SvgLine
          key={vein.key}
          x1={vein.x1}
          y1={vein.y1}
          x2={vein.x2}
          y2={vein.y2}
          stroke={`rgba(74, 57, 39, ${vein.opacity})`}
          strokeWidth={1}
          strokeLinecap="round"
        />
      ))}
    </>
  );

  const renderGridDetail = () => (
    <>
      {panelRects.map((panel, index) => (
        <React.Fragment key={`panel-detail-${index}`}>
          <SvgRect
            x={panel.x}
            y={panel.y}
            width={panel.width}
            height={panel.height}
            rx={panelRadius}
            ry={panelRadius}
            fill="none"
            stroke="rgba(24, 14, 9, 0.28)"
            strokeWidth={1}
          />
          <SvgLine
            x1={panel.x + 1}
            y1={panel.y + 1}
            x2={panel.x + panel.width - 1}
            y2={panel.y + 1}
            stroke="rgba(255, 237, 205, 0.13)"
            strokeWidth={1}
            strokeLinecap="round"
          />
          <SvgLine
            x1={panel.x + 1}
            y1={panel.y + 1}
            x2={panel.x + 1}
            y2={panel.y + panel.height - 1}
            stroke="rgba(255, 237, 205, 0.09)"
            strokeWidth={1}
            strokeLinecap="round"
          />
          <SvgLine
            x1={panel.x + 1}
            y1={panel.y + panel.height - 1}
            x2={panel.x + panel.width - 1}
            y2={panel.y + panel.height - 1}
            stroke="rgba(26, 14, 8, 0.18)"
            strokeWidth={1}
            strokeLinecap="round"
          />
          <SvgLine
            x1={panel.x + panel.width - 1}
            y1={panel.y + 1}
            x2={panel.x + panel.width - 1}
            y2={panel.y + panel.height - 1}
            stroke="rgba(26, 14, 8, 0.14)"
            strokeWidth={1}
            strokeLinecap="round"
          />
        </React.Fragment>
      ))}

      {pegPoints.map((point, index) => (
        <React.Fragment key={`peg-${index}`}>
          <SvgCircle cx={point.x} cy={point.y} r={Math.max(1.8, cellSize * 0.032)} fill="rgba(36, 20, 12, 0.72)" />
          <SvgCircle cx={point.x - 0.45} cy={point.y - 0.45} r={Math.max(0.7, cellSize * 0.012)} fill="rgba(252, 230, 186, 0.34)" />
        </React.Fragment>
      ))}
    </>
  );

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id={`${gradientPrefix}-wood`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8A5A35" stopOpacity={0.97} />
          <Stop offset="32%" stopColor="#6E452A" stopOpacity={1} />
          <Stop offset="72%" stopColor="#4D301F" stopOpacity={1} />
          <Stop offset="100%" stopColor="#332015" stopOpacity={0.98} />
        </LinearGradient>
        <LinearGradient id={`${gradientPrefix}-stone`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#D8C39A" stopOpacity={0.95} />
          <Stop offset="38%" stopColor="#C7AE82" stopOpacity={0.98} />
          <Stop offset="72%" stopColor="#B99C71" stopOpacity={0.99} />
          <Stop offset="100%" stopColor="#A88C62" stopOpacity={1} />
        </LinearGradient>
      </Defs>

      {mode === 'frame' && renderWoodRects()}
      {mode === 'stone' && renderStonePanels()}
      {mode === 'grid' && renderGridDetail()}

      {mode === 'frame' && (
        <>
          <SvgRect x={0} y={0} width={width} height={height} fill="rgba(0,0,0,0)" />
          <SvgRect x={0} y={0} width={width} height={height * 0.22} fill="rgba(255, 227, 173, 0.05)" />
          <SvgRect x={0} y={height * 0.72} width={width} height={height * 0.28} fill="rgba(13, 7, 3, 0.08)" />
        </>
      )}
    </Svg>
  );
};

export const Board: React.FC<BoardProps> = ({
  showRailHints = false,
  highlightMode = 'theatrical',
  boardScale = 1,
  orientation = 'horizontal',
  gameStateOverride,
  validMovesOverride,
  onMakeMoveOverride,
  playerColorOverride,
  allowInteraction = true,
}) => {
  const storeGameState = useGameStore((state) => state.gameState);
  const storeValidMoves = useGameStore((state) => state.validMoves);
  const storeMakeMove = useGameStore((state) => state.makeMove);
  const storePlayerColor = useGameStore((state) => state.playerColor);
  const { width } = useWindowDimensions();
  const [selectedMove, setSelectedMove] = useState<MoveAction | null>(null);

  const cuePulse = useSharedValue(0);
  const scoreCuePulse = useSharedValue(0);
  const previewPulse = useSharedValue(0);

  const gameState = gameStateOverride ?? storeGameState;
  const validMoves = validMovesOverride ?? storeValidMoves;
  const makeMove = onMakeMoveOverride ?? storeMakeMove;
  const playerColor = playerColorOverride ?? storePlayerColor;
  const isVertical = orientation === 'vertical';
  const displayRows = isVertical ? BOARD_COLS : BOARD_ROWS;
  const displayCols = isVertical ? BOARD_ROWS : BOARD_COLS;

  const boardWidth = useMemo(
    () => Math.min(width - urTheme.spacing.lg, urTheme.layout.boardMax) * boardScale,
    [boardScale, width],
  );

  const cellSize = useMemo(() => {
    const gridWidth = boardWidth - FRAME_PADDING * 2 - INNER_PADDING * 2;
    return gridWidth / displayCols;
  }, [boardWidth, displayCols]);
  const tileShellPadding = useMemo(
    () => Math.max(MIN_TILE_SHELL_PADDING, Math.round(cellSize * 0.04)),
    [cellSize],
  );
  const renderedTileSize = useMemo(
    () => Math.max(18, Math.round(cellSize - tileShellPadding * 2)),
    [cellSize, tileShellPadding],
  );
  const gridHeight = cellSize * displayRows + GRID_GAP * Math.max(0, displayRows - 1);
  const frameHeight = FRAME_PADDING * 2 + INNER_PADDING * 2 + gridHeight;
  const gridOrigin = {
    x: FRAME_PADDING + INNER_PADDING,
    y: FRAME_PADDING + INNER_PADDING,
  };
  const frameBand = useMemo(
    () => Math.max(5, Math.min(FRAME_PADDING + INNER_PADDING - 2, Math.round(cellSize * 0.1))),
    [cellSize],
  );

  const mapLogicalToDisplayCoord = (r: number, c: number): { row: number; col: number } => {
    if (!isVertical) {
      return { row: r, col: c };
    }

    return {
      row: c,
      col: BOARD_ROWS - 1 - r,
    };
  };

  const mapDisplayToLogicalCoord = (r: number, c: number): { row: number; col: number } => {
    if (!isVertical) {
      return { row: r, col: c };
    }

    return {
      row: BOARD_ROWS - 1 - c,
      col: r,
    };
  };

  const mapIndexToCoord = (color: 'light' | 'dark', index: number, r: number, c: number) => {
    const path = color === 'light' ? PATH_LIGHT : PATH_DARK;
    const coord = path[index];
    if (!coord) return false;
    return coord.row === r && coord.col === c;
  };

  const boardSkinCells = useMemo(() => {
    const rawCells: Omit<BoardSkinCell, 'neighbors'>[] = [];
    const activeKeys = new Set<string>();

    for (let displayRow = 0; displayRow < displayRows; displayRow += 1) {
      for (let displayCol = 0; displayCol < displayCols; displayCol += 1) {
        const row = isVertical ? BOARD_ROWS - 1 - displayCol : displayRow;
        const col = isVertical ? displayRow : displayCol;
        const isGap = (row === 0 || row === 2) && (col === 4 || col === 5);
        if (isGap) continue;

        const key = `${displayRow}:${displayCol}`;
        activeKeys.add(key);
        rawCells.push({
          key,
          displayRow,
          displayCol,
          x: gridOrigin.x + displayCol * cellSize,
          y: gridOrigin.y + displayRow * (cellSize + GRID_GAP),
          width: cellSize,
          height: cellSize,
        });
      }
    }

    return rawCells.map((cell) => ({
      ...cell,
      neighbors: {
        top: activeKeys.has(`${cell.displayRow - 1}:${cell.displayCol}`),
        right: activeKeys.has(`${cell.displayRow}:${cell.displayCol + 1}`),
        bottom: activeKeys.has(`${cell.displayRow + 1}:${cell.displayCol}`),
        left: activeKeys.has(`${cell.displayRow}:${cell.displayCol - 1}`),
      },
    }));
  }, [cellSize, displayCols, displayRows, gridOrigin.x, gridOrigin.y, isVertical]);

  const getCellCenter = (r: number, c: number): Point => ({
    x: (() => {
      const displayCoord = mapLogicalToDisplayCoord(r, c);
      return FRAME_PADDING + INNER_PADDING + displayCoord.col * cellSize + cellSize / 2;
    })(),
    y: (() => {
      const displayCoord = mapLogicalToDisplayCoord(r, c);
      return FRAME_PADDING + INNER_PADDING + displayCoord.row * (cellSize + GRID_GAP) + cellSize / 2;
    })(),
  });

  const projectLogicalOffset = (x: number, y: number): Point => {
    if (!isVertical) {
      return { x, y };
    }

    return {
      x: -y,
      y: x,
    };
  };

  const coordForPathIndex = (color: 'light' | 'dark', index: number): Point | null => {
    const path = color === 'light' ? PATH_LIGHT : PATH_DARK;

    if (index === -1) {
      const startCenter = getCellCenter(path[0].row, path[0].col);
      const reserveOffset = projectLogicalOffset(cellSize * 0.58, 0);
      return {
        x: startCenter.x + reserveOffset.x,
        y: startCenter.y + reserveOffset.y,
      };
    }

    if (index === PATH_LENGTH) {
      const finalCenter = getCellCenter(path[path.length - 1].row, path[path.length - 1].col);
      const finishOffset = projectLogicalOffset(cellSize * 0.95, 0);
      return {
        x: finalCenter.x + finishOffset.x,
        y: finalCenter.y + finishOffset.y,
      };
    }

    const coord = path[index];
    if (!coord) return null;
    return getCellCenter(coord.row, coord.col);
  };

  const getPieceAt = (r: number, c: number): { id: string; color: 'light' | 'dark' } | undefined => {
    const lightPiece = gameState.light.pieces.find(
      (piece) =>
        !piece.isFinished && piece.position !== -1 && mapIndexToCoord('light', piece.position, r, c),
    );
    if (lightPiece) return { id: lightPiece.id, color: 'light' };

    const darkPiece = gameState.dark.pieces.find(
      (piece) => !piece.isFinished && piece.position !== -1 && mapIndexToCoord('dark', piece.position, r, c),
    );
    if (darkPiece) return { id: darkPiece.id, color: 'dark' };

    return undefined;
  };

  const assignedPlayerColor: 'light' | 'dark' | null = playerColor === 'light' || playerColor === 'dark'
    ? playerColor
    : null;

  const mapAssignedIndexToCoord = (index: number, r: number, c: number) =>
    assignedPlayerColor ? mapIndexToCoord(assignedPlayerColor, index, r, c) : false;

  const isMyTurn = assignedPlayerColor !== null && gameState.currentTurn === assignedPlayerColor;
  const isInteractiveTurn = allowInteraction && isMyTurn;

  const spawnMove = useMemo(
    () => validMoves.find((move) => move.fromIndex === -1) ?? null,
    [validMoves],
  );
  const scoringMoves = useMemo(() => validMoves.filter((move) => move.toIndex === PATH_LENGTH), [validMoves]);

  const spawnCueColor: 'light' | 'dark' = gameState.currentTurn;
  const hasScoringMove = scoringMoves.length > 0;
  const scoreCueSize = Math.round(Math.min(Math.max(cellSize * 0.92, SCORE_CUE_MIN_SIZE), SCORE_CUE_MAX_SIZE));

  const spawnCueAnchor = spawnMove
    ? (() => {
        const start = spawnCueColor === 'light' ? PATH_LIGHT[0] : PATH_DARK[0];
        const startCenter = getCellCenter(start.row, start.col);
        const spawnOffset = projectLogicalOffset(cellSize * 0.58, 0);
        return {
          x: startCenter.x + spawnOffset.x,
          y: startCenter.y + spawnOffset.y,
        };
      })()
    : null;

  const scoreCueAnchor =
    hasScoringMove && assignedPlayerColor
      ? (() => {
          const path = assignedPlayerColor === 'light' ? PATH_LIGHT : PATH_DARK;
          const final = path[path.length - 1];
          return getCellCenter(final.row, final.col - 1);
        })()
      : null;

  const previewPoints = (() => {
    if (!selectedMove) return [] as Point[];

    const color: 'light' | 'dark' = selectedMove.pieceId.startsWith('dark') ? 'dark' : 'light';
    const points: Point[] = [];

    if (selectedMove.fromIndex === -1) {
      const reservePoint = coordForPathIndex(color, -1);
      if (reservePoint) {
        points.push(reservePoint);
      }
      for (let index = 0; index <= Math.min(selectedMove.toIndex, PATH_LENGTH - 1); index += 1) {
        const point = coordForPathIndex(color, index);
        if (point) {
          points.push(point);
        }
      }
    } else {
      const startPoint = coordForPathIndex(color, selectedMove.fromIndex);
      if (startPoint) {
        points.push(startPoint);
      }
      for (
        let index = selectedMove.fromIndex + 1;
        index <= Math.min(selectedMove.toIndex, PATH_LENGTH - 1);
        index += 1
      ) {
        const point = coordForPathIndex(color, index);
        if (point) {
          points.push(point);
        }
      }
    }

    if (selectedMove.toIndex === PATH_LENGTH) {
      const finishPoint = coordForPathIndex(color, PATH_LENGTH);
      if (finishPoint) {
        points.push(finishPoint);
      }
    }

    return points;
  })();

  const previewSegments = useMemo(() => {
    const segments: { x: number; y: number; width: number; angle: number }[] = [];

    for (let index = 0; index < previewPoints.length - 1; index += 1) {
      const current = previewPoints[index];
      const next = previewPoints[index + 1];
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const width = Math.sqrt(dx * dx + dy * dy);

      segments.push({
        x: (current.x + next.x) / 2,
        y: (current.y + next.y) / 2,
        width,
        angle: Math.atan2(dy, dx),
      });
    }

    return segments;
  }, [previewPoints]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [gameState.history.length]);

  useEffect(() => {
    if (!spawnMove) {
      cancelAnimation(cuePulse);
      cuePulse.value = withTiming(0, { duration: urTheme.motion.duration.fast });
      return;
    }

    cuePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 760, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.2, { duration: 760, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [cuePulse, spawnMove]);

  useEffect(() => {
    if (!isInteractiveTurn || !hasScoringMove) {
      cancelAnimation(scoreCuePulse);
      scoreCuePulse.value = withTiming(0, { duration: urTheme.motion.duration.fast });
      return;
    }

    scoreCuePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 640, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.25, { duration: 640, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [hasScoringMove, isInteractiveTurn, scoreCuePulse]);

  useEffect(() => {
    if (!selectedMove) {
      cancelAnimation(previewPulse);
      previewPulse.value = withTiming(0, { duration: urTheme.motion.duration.fast });
      return;
    }

    previewPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 620, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 620, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [previewPulse, selectedMove]);

  useEffect(() => {
    if (!selectedMove) return;

    const stillValid = validMoves.some(
      (move) =>
        move.pieceId === selectedMove.pieceId &&
        move.fromIndex === selectedMove.fromIndex &&
        move.toIndex === selectedMove.toIndex,
    );

    if (!stillValid) {
      setSelectedMove(null);
    }
  }, [selectedMove, validMoves]);

  useEffect(() => {
    setSelectedMove(null);
  }, [gameState.currentTurn, gameState.phase, gameState.rollValue]);

  const executeMove = (move: MoveAction) => {
    console.info('[Board][executeMove]', {
      pieceId: move.pieceId,
      fromIndex: move.fromIndex,
      toIndex: move.toIndex,
      phase: gameState.phase,
      turn: gameState.currentTurn,
      playerColor: assignedPlayerColor,
    });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    makeMove(move);
    setSelectedMove(null);
  };

  const handleSpawnCuePress = () => {
    if (!spawnMove || !isInteractiveTurn || gameState.phase !== 'moving') return;

    if (
      selectedMove &&
      selectedMove.pieceId === spawnMove.pieceId &&
      selectedMove.fromIndex === spawnMove.fromIndex &&
      selectedMove.toIndex === spawnMove.toIndex
    ) {
      executeMove(spawnMove);
      return;
    }

    setSelectedMove(spawnMove);
  };

  const handleScoreCuePress = () => {
    if (!isInteractiveTurn || gameState.phase !== 'moving') return;

    if (selectedMove && selectedMove.toIndex === PATH_LENGTH) {
      const selectedScoringMove = validMoves.find(
        (move) =>
          move.pieceId === selectedMove.pieceId &&
          move.fromIndex === selectedMove.fromIndex &&
          move.toIndex === selectedMove.toIndex,
      );

      if (selectedScoringMove) {
        executeMove(selectedScoringMove);
        return;
      }
    }

    const fallbackScoringMove = scoringMoves[0];
    if (!fallbackScoringMove) return;

    executeMove(fallbackScoringMove);
  };

  const handleTilePress = (r: number, c: number) => {
    if (!assignedPlayerColor || !isInteractiveTurn || gameState.phase !== 'moving') return;

    const moveFromTile = validMoves.find(
      (move) => move.fromIndex >= 0 && mapAssignedIndexToCoord(move.fromIndex, r, c),
    );

    if (moveFromTile) {
      if (
        selectedMove &&
        selectedMove.pieceId === moveFromTile.pieceId &&
        selectedMove.fromIndex === moveFromTile.fromIndex &&
        selectedMove.toIndex === moveFromTile.toIndex
      ) {
        setSelectedMove(null);
      } else {
        setSelectedMove(moveFromTile);
      }
      return;
    }

    if (selectedMove) {
      const selectedToTileMatch =
        selectedMove.toIndex !== PATH_LENGTH && mapAssignedIndexToCoord(selectedMove.toIndex, r, c);

      if (selectedToTileMatch) {
        executeMove(selectedMove);
        return;
      }
    }

    const moveToTile = validMoves.find(
      (move) => move.toIndex !== PATH_LENGTH && mapAssignedIndexToCoord(move.toIndex, r, c),
    );

    if (moveToTile) {
      executeMove(moveToTile);
      return;
    }

    setSelectedMove(null);
  };

  const cueAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + cuePulse.value * 0.7,
    transform: [{ scale: 0.94 + cuePulse.value * 0.14 }],
  }));

  const scoreCueAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.48 + scoreCuePulse.value * 0.52,
    transform: [{ scale: 0.94 + scoreCuePulse.value * 0.12 }],
    shadowOpacity: 0.28 + scoreCuePulse.value * 0.44,
  }));

  const previewPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + previewPulse.value * 0.64,
    shadowOpacity: 0.26 + previewPulse.value * 0.5,
  }));

  const renderGrid = () => {
    const rows = [];

    for (let displayRow = 0; displayRow < displayRows; displayRow += 1) {
      const rowCells = [];

      for (let displayCol = 0; displayCol < displayCols; displayCol += 1) {
        const { row: r, col: c } = mapDisplayToLogicalCoord(displayRow, displayCol);
        const isGap = (r === 0 || r === 2) && (c === 4 || c === 5);
        if (isGap) {
          rowCells.push(
            <View
              key={`gap-${displayRow}-${displayCol}`}
              style={[styles.gapCell, { width: `${100 / displayCols}%`, padding: tileShellPadding }]}
            />,
          );
          continue;
        }

        const piece = getPieceAt(r, c);
        const moveFromTile = validMoves.find(
          (move) => move.fromIndex >= 0 && isMyTurn && mapAssignedIndexToCoord(move.fromIndex, r, c),
        );

        const isDestination =
          isMyTurn &&
          validMoves.some(
            (move) => move.toIndex !== PATH_LENGTH && mapAssignedIndexToCoord(move.toIndex, r, c),
          );

        const isSelectedDestination =
          !!selectedMove &&
          selectedMove.toIndex !== PATH_LENGTH &&
          mapAssignedIndexToCoord(selectedMove.toIndex, r, c);

        const isSelectedPiece =
          !!selectedMove && selectedMove.fromIndex >= 0 && mapAssignedIndexToCoord(selectedMove.fromIndex, r, c);

        const isValidTarget = isSelectedDestination || isDestination;
        const isInteractable = isInteractiveTurn && (isValidTarget || !!moveFromTile || isSelectedPiece);

        rowCells.push(
          <View
            key={`cell-${displayRow}-${displayCol}`}
            style={[styles.cellShell, { width: `${100 / displayCols}%`, padding: tileShellPadding }]}
          >
            <Tile
              row={r}
              col={c}
              cellSize={renderedTileSize}
              piece={piece}
              isValidTarget={isValidTarget}
              isSelectedPiece={isSelectedPiece}
              isInteractive={isInteractable}
              highlightMode={highlightMode}
              onPress={() => handleTilePress(r, c)}
            />
          </View>,
        );
      }

      rows.push(
        <View key={`row-${displayRow}`} style={styles.row}>
          {rowCells}
        </View>,
      );
    }

    return rows;
  };

  const spawnCueSelected =
    !!spawnMove &&
    !!selectedMove &&
    spawnMove.pieceId === selectedMove.pieceId &&
    spawnMove.fromIndex === selectedMove.fromIndex &&
    spawnMove.toIndex === selectedMove.toIndex;
  const scoreCueSelected = !!selectedMove && selectedMove.toIndex === PATH_LENGTH;

  return (
    <View
      style={[styles.frame, { width: boardWidth, height: frameHeight }]}
    >
      <View pointerEvents="none" style={styles.boardFrameLayer}>
        <BoardSkinLayer
          mode="frame"
          width={boardWidth}
          height={frameHeight}
          cells={boardSkinCells}
          cellSize={cellSize}
          tileShellPadding={tileShellPadding}
          frameBand={frameBand}
        />
      </View>
      <View pointerEvents="none" style={styles.boardStoneBaseLayer}>
        <BoardSkinLayer
          mode="stone"
          width={boardWidth}
          height={frameHeight}
          cells={boardSkinCells}
          cellSize={cellSize}
          tileShellPadding={tileShellPadding}
          frameBand={frameBand}
        />
      </View>
      <View pointerEvents="none" style={styles.boardGridLayer}>
        <BoardSkinLayer
          mode="grid"
          width={boardWidth}
          height={frameHeight}
          cells={boardSkinCells}
          cellSize={cellSize}
          tileShellPadding={tileShellPadding}
          frameBand={frameBand}
        />
      </View>

      <View style={styles.innerFrame}>
        <View style={styles.tileLayer}>
          <View style={styles.gridWrap}>{renderGrid()}</View>
        </View>
      </View>

      {previewSegments.length > 0 && (
        <View pointerEvents="none" style={styles.previewLayer}>
          {previewSegments.map((segment, index) => (
            <Animated.View
              key={`segment-${index}`}
              style={[
                styles.previewSegment,
                {
                  left: segment.x - segment.width / 2,
                  top: segment.y - 3,
                  width: segment.width,
                  transform: [{ rotateZ: `${segment.angle}rad` }],
                },
                previewPulseStyle,
              ]}
            />
          ))}
          {previewPoints.map((point, index) => (
            <Animated.View
              key={`point-${index}`}
              style={[
                styles.previewPoint,
                {
                  left: point.x - 7,
                  top: point.y - 7,
                },
                previewPulseStyle,
              ]}
            />
          ))}
        </View>
      )}

      {isInteractiveTurn && hasScoringMove && scoreCueAnchor && (
        <Pressable
          onPress={handleScoreCuePress}
          style={[
            styles.scoreCueTouchable,
            {
              left: scoreCueAnchor.x - scoreCueSize / 2,
              top: scoreCueAnchor.y - scoreCueSize / 2,
              width: scoreCueSize,
              height: scoreCueSize,
              borderRadius: scoreCueSize / 2,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.scoreCue,
              scoreCueSelected && styles.scoreCueSelected,
              { borderRadius: scoreCueSize / 2 },
              scoreCueAnimatedStyle,
            ]}
          >
            <View
              style={[
                styles.scoreCueInner,
                {
                  width: scoreCueSize - 8,
                  height: scoreCueSize - 8,
                  borderRadius: (scoreCueSize - 8) / 2,
                },
              ]}
            >
              <Text style={styles.scoreCueText}>SCORE</Text>
            </View>
          </Animated.View>
        </Pressable>
      )}

      {spawnCueAnchor && (
        <Pressable
          onPress={handleSpawnCuePress}
          disabled={!isInteractiveTurn}
          style={[
            styles.spawnCueTouchable,
            {
              left: spawnCueAnchor.x - CUE_SIZE / 2,
              top: spawnCueAnchor.y - CUE_SIZE / 2,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.spawnCue,
              spawnCueSelected && styles.spawnCueSelected,
              !isInteractiveTurn && styles.spawnCueReadonly,
              cueAnimatedStyle,
            ]}
          >
            <View style={styles.spawnCueInner}>
              <Piece
                color={spawnCueColor}
                size="sm"
                variant={spawnCueColor}
                highlight={spawnCueSelected}
                state={spawnCueSelected ? 'active' : 'idle'}
              />
            </View>
          </Animated.View>
        </Pressable>
      )}

      {showRailHints && (
        <View pointerEvents="none" style={isVertical ? styles.hintColumn : styles.hintRow}>
          <Text style={styles.hintText}>START</Text>
          <Text style={styles.hintText}>FINISH</Text>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    borderRadius: urTheme.radii.lg + 6,
    padding: FRAME_PADDING,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'visible',
    shadowColor: '#120A05',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  boardFrameLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  boardStoneBaseLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  boardGridLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  frameBorderTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  frameRimOuter: {
    ...StyleSheet.absoluteFillObject,
    margin: 2,
    borderRadius: urTheme.radii.lg + 4,
    borderWidth: 1,
    borderColor: 'rgba(240, 192, 64, 0.32)',
  },
  frameRimInner: {
    ...StyleSheet.absoluteFillObject,
    margin: 7,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(80, 40, 15, 0.58)',
  },
  innerFrame: {
    borderRadius: urTheme.radii.lg,
    overflow: 'visible',
    backgroundColor: 'transparent',
    padding: INNER_PADDING,
  },
  tileLayer: {
    position: 'relative',
  },
  boardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255, 220, 150, 0.16)',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '46%',
    backgroundColor: 'rgba(8, 8, 8, 0.26)',
  },
  innerStroke: {
    ...StyleSheet.absoluteFillObject,
    margin: INNER_PADDING,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 226, 175, 0.22)',
  },
  gridWrap: {
    gap: GRID_GAP,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  cellShell: {
    aspectRatio: 1,
    padding: 0,
  },
  gapCell: {
    aspectRatio: 1,
    padding: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
    opacity: 1,
  },
  previewLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  previewSegment: {
    position: 'absolute',
    height: 6,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(111, 184, 255, 0.95)',
    shadowColor: urTheme.colors.glow,
    shadowRadius: 7,
    elevation: 6,
  },
  previewPoint: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(241, 230, 208, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(63, 40, 18, 0.48)',
    shadowColor: urTheme.colors.glow,
    shadowRadius: 8,
    elevation: 6,
  },
  spawnCueTouchable: {
    position: 'absolute',
    width: CUE_SIZE,
    height: CUE_SIZE,
    borderRadius: urTheme.radii.pill,
  },
  scoreCueTouchable: {
    position: 'absolute',
  },
  scoreCue: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(76, 244, 124, 0.92)',
    backgroundColor: 'rgba(4, 40, 18, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38EF78',
    shadowRadius: 10,
    elevation: 8,
  },
  scoreCueSelected: {
    borderColor: 'rgba(220, 255, 228, 0.98)',
    shadowColor: '#A8FFC4',
  },
  scoreCueInner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 66, 28, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(191, 255, 206, 0.48)',
  },
  scoreCueText: {
    color: 'rgba(236, 255, 240, 0.96)',
    fontSize: 10,
    letterSpacing: 0.7,
    fontWeight: '800',
  },
  spawnCue: {
    flex: 1,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(111, 184, 255, 0.84)',
    backgroundColor: 'rgba(11, 24, 37, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: urTheme.colors.glow,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 7,
  },
  spawnCueReadonly: {
    borderColor: 'rgba(206, 172, 112, 0.58)',
    backgroundColor: 'rgba(40, 31, 19, 0.76)',
  },
  spawnCueSelected: {
    borderColor: 'rgba(245, 214, 149, 0.95)',
    shadowColor: '#F5D695',
  },
  spawnCueInner: {
    width: 42,
    height: 42,
    borderRadius: urTheme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 27, 39, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 229, 183, 0.28)',
  },
  hintRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hintColumn: {
    position: 'absolute',
    top: 14,
    bottom: 14,
    right: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(248, 229, 198, 0.85)',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
  },
});
