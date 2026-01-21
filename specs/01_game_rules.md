# Specification: Game Rules & Engine Logic

## 1. Overview
The Royal Game of Ur is a race game played on a board of 20 squares. Two players (Light and Dark) race their 7 pieces from start to finish.

## 2. Board Layout
- **Dimensions**: The board is irregular.
    - Rows: 3
    - Columns: 8
- **Zones**:
    - **Safe Zones**: The grid has "cutouts" at (0,4) and (0,5) for top player, and (2,4) and (2,5) for bottom player.
    - **War Zone**: The middle row (Row 1) is shared combat territory.
- **Rosettes**: Special tiles that grant a second turn and invulnerability.
    - Locations: (0,0), (2,0), (1,3), (0,6), (2,6).

## 3. Movement Rules
- **Dice**: 4 Tetrahedral dice (d4), but effectively 4 coins.
    - Each die has 2 marked corners (Value 1) and 2 unmarked (Value 0).
    - range: 0 to 4.
    - 0 is a lost turn.
- **Pathing**:
    - **Player 1 (Bottom/Light)**: Starts off-board -> (2,3) to (2,0) -> (1,0) to (1,7) -> (2,7) to (2,6) -> Finish.
    - **Player 2 (Top/Dark)**: Starts off-board -> (0,3) to (0,0) -> (1,0) to (1,7) -> (0,7) to (0,6) -> Finish.
    - *Note*: The middle row (1,0 to 1,7) is where captures happen.

## 4. Capturing
- If a piece lands on a square occupied by an opponent's piece in the War Zone (Row 1), the opponent's piece is captured and returned to their "Off Board" start area.
- You strictly CANNOT land on your own piece.

## 5. Rosette Rules
- Landing on a Rosette grants an immediate extra roll.
- A piece on a Rosette in the War Zone (1,3) cannot be captured.

## 6. Winning
- The first player to bear off all 7 pieces wins.
- To bear off, a piece must roll the exact number to leave the last square.
