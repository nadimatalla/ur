# Specification: UI/UX & Design System

## 1. Theme Philosophy: "Ancient Mystery"
The UI should feel tactile, grounded, and premium. Avoid "flat" modern SaaS looks. Think stone, gold, lapis lazuli, and ancient parchment.

## 2. Color Palette
- **Primary (Royal Blue)**: `#1e3a8a` (Lapis Lazuli)
- **Secondary (Gold)**: `#f59e0b` (Gold highlights)
- **Background (Stone)**: `#f3f4f6` (Light stone) or `#1f2937` (Dark Obsidian mode).
- **Accents**: Deep reds for "Capture/War" zones.

## 3. Typography
- **Headings**: Use a Serif font if possible (e.g., *Cinzel* or *Playfair Display* loaded via `expo-font`).
- **Body**: Clean Sans-Serif for readability (Inter/System).

## 4. Key Components
### Board
- Should be centered and maintain aspect ratio.
- **Tiles**: 
    - Normal: Stone texture background.
    - Rosette: Distinct flower pattern overlay.
- **Pieces**:
    - Circular tokens with bevel effects (CSS/SVG shadows).
    - Smooth animation when moving between tiles.

### Interaction Design
- **Dice Roll**:
    - Tap to roll.
    - Visual feedback (3D rotation or sprite sheet animation).
- **Valid Moves**:
    - When a dice roll completes, highlight valid destination tiles.
    - Dim invalid pieces.

## 5. Responsive Layouts
- **Mobile**: Stack the board vertically if needed, or force Landscape (preferred for board games).
- **Web**: Center the board with a sidebar for Chat/Logs.
