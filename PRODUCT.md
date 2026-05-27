# Product Contract

## What This Project Is

`alex-uqyh-test-3` is a private Vite + React + TypeScript single-page clock
application. It renders a live local clock with a persisted 12-hour/24-hour
format preference.

## Current Behavior

- Shows the current local time with hours, minutes, and seconds.
- Updates the displayed time once per second.
- Shows the full current date under the time.
- Lets the user switch between `12h` and `24h` display modes.
- Persists the selected format in `localStorage` and restores it after reload.
- Defaults to `24h` when no valid saved preference exists.

There is no backend, routing, authentication, or remote data dependency.

## Architecture

- `src/main.tsx` mounts the React app into `#root`.
- `src/App.tsx` composes the clock page by wiring hooks to presentational
  components.
- `src/hooks/useCurrentTime.ts` owns the one-second timer and interval cleanup.
- `src/hooks/useFormatPref.ts` owns the `12h`/`24h` preference, validation, and
  `localStorage` persistence.
- `src/components/ClockDisplay.tsx` renders formatted time and date.
- `src/components/FormatToggle.tsx` renders the controlled format switch.
- `src/index.css` contains Tailwind directives plus minimal global base styles.
- `vite.config.ts` configures Vite React and dev/preview servers on
  `0.0.0.0:8080`.
- `playwright.config.ts` runs the end-to-end smoke test against the Vite dev
  server.

## Tooling and Conventions

- Package manager: npm, with `package-lock.json` committed.
- Runtime framework: React 19.
- Build tool: Vite 8.
- Language: TypeScript 6 with strict mode enabled.
- Styling: Tailwind CSS via PostCSS and Autoprefixer.
- Linting/formatting: ESLint flat config and Prettier.
- Unit tests: Vitest + React Testing Library under `src/**/*.test.ts(x)`.
- End-to-end tests: Playwright under `tests/e2e/`.
- Commands:
  - `npm run dev` starts the Vite development server.
  - `npm run build` runs TypeScript project builds and creates the production
    Vite bundle.
  - `npm run lint` runs ESLint with zero warnings allowed.
  - `npm run format` formats the project with Prettier.
  - `npm test` runs the unit test suite.
  - `npm run test:e2e` runs the Playwright smoke test.
  - `npm run preview` serves the production build preview.

## Scope Boundary

The app is intentionally small and client-only. Future work should keep state
local unless a concrete feature requires a broader state model, API, routing, or
backend integration.
