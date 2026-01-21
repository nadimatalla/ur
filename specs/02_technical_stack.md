# Specification: Technical Architecture & Stack

## 1. Core Frameworks
- **Runtime**: Expo (Managed Workflow)
    - Justification: Best-in-class for cross-platform (Web, iOS, Android).
- **Language**: TypeScript (Strict Mode)
- **Bundler**: Metro (with Expo Router)

## 2. Project Structure (Strict Adherence)
The project MUST follow the provided tree structure:
- `app/` for routes (Expo Router).
- `components/` for React components.
- `logic/` for pure TS game rules.
- `store/` for Zustand state.
- `services/` for API layers.

## 3. Modules & Libraries
| Category | Library | Version | Usage |
| :--- | :--- | :--- | :--- |
| **Routing** | `expo-router` | Latest | File-based navigation. |
| **Styling** | `nativewind` | v2 or v4 | Utility-first CSS for React Native. |
| **State** | `zustand` | Latest | Global game state & ephemeral layout state. |
| **Icons** | `lucide-react-native`| Latest | UI Icons. |
| **Animations**| `react-native-reanimated` | Latest | Game board interaction. |

## 4. Service Mocking Strategy
Since the backend is out of scope for the build phase, all `services/*.ts` files must implement a `Mock` interface by default.
- **`services/matchmaking.ts`**:
    - `findMatch()`: Returns a Promise that resolves after 2s with a fake `matchId`.
- **`services/realtime.ts`**:
    - Must simulate receiving "Opponent Moved" events when playing against the local Bot.

## 5. Code Quality Guardrails
- **No Inline Styles**: Use Tailwind classes.
- **Pure Logic**: The `logic/` folder must NOT import any React or React Native dependencies. It must be testable in Node.js.
- **Component Composition**: Avoid "God Components". Split `Board` into `Row` or `Tile`.
