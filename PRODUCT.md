# Product Contract

## What This Project Is

`alex-uqyh-test-3` is a private Vite + React + TypeScript single-page clock
application. It renders a live local clock with a persisted 12-hour/24-hour
format preference and a client-side current-weather panel.

## Current Behavior

- Shows the current local time with hours, minutes, and seconds.
- Updates the displayed time once per second.
- Shows the full current date under the time.
- Lets the user switch between `12h` and `24h` display modes.
- Persists the selected format in `localStorage` and restores it after reload.
- Defaults to `24h` when no valid saved preference exists.
- Provides a `useGeolocation` hook that requests browser latitude/longitude and
  returns structured loading/error state for manual-location fallback.
- Shows a weather card below the clock when coordinates are available.
- Fetches current weather from Open-Meteo, including temperature, condition, and
  feels-like temperature.
- Falls back to manual city search when browser geolocation is denied,
  unavailable, or the user wants to override location.
- Persists the selected city and caches the last matching weather response in
  `localStorage`.
- Provides a `useBackgroundImage` hook that stores a selected background image
  blob in IndexedDB, exposes an object URL for rendering, and supports clearing
  the saved image with graceful unavailable/error states.

There is no backend, routing, authentication, database, or API key. Weather and
city search use public Open-Meteo browser APIs.

## Architecture

- `src/main.tsx` mounts the React app into `#root`.
- `src/App.tsx` composes the clock page by wiring hooks to presentational
  components.
- `src/hooks/useCurrentTime.ts` owns the one-second timer and interval cleanup.
- `src/hooks/useFormatPref.ts` owns the `12h`/`24h` preference, validation, and
  `localStorage` persistence.
- `src/hooks/useGeolocation.ts` wraps `navigator.geolocation`, maps permission
  and timeout failures to explicit error codes, and avoids late state updates
  after unmount.
- `src/hooks/useWeather.ts` fetches Open-Meteo current conditions, maps weather
  codes to labels, and caches the last matching result.
- `src/hooks/useBackgroundImage.ts` persists one user-selected background image
  blob in IndexedDB and manages object URL cleanup.
- `src/components/ClockDisplay.tsx` renders formatted time and date.
- `src/components/FormatToggle.tsx` renders the controlled format switch.
- `src/components/WeatherCard.tsx` renders weather data, loading, and fallback
  states.
- `src/components/CitySearch.tsx` resolves manual city searches through
  Open-Meteo geocoding.
- `src/components/citySearchStorage.ts` validates and persists selected city
  data.
- `src/index.css` contains Tailwind directives plus minimal global base styles.
- `vite.config.ts` configures Vite React and dev/preview servers on
  `0.0.0.0:8080`.
- `playwright.config.ts` runs the end-to-end smoke test against the Vite dev
  server.
- Production builds are static Vite artifacts written to `dist/`, with
  `dist/index.html` and hashed assets under `dist/assets/`.

## Tooling and Conventions

- Package manager: npm, with `package-lock.json` committed.
- Runtime framework: React 19.
- Build tool: Vite 8.
- Language: TypeScript 6 with strict mode enabled.
- Styling: Tailwind CSS via PostCSS and Autoprefixer.
- Linting/formatting: ESLint flat config and Prettier.
- Unit tests: Vitest + React Testing Library under `src/**/*.test.ts(x)`.
  Weather tests mock `fetch`, `navigator.geolocation`, and `localStorage`;
  background-image tests mock IndexedDB and object URL behavior.
- End-to-end tests: Playwright under `tests/e2e/`.
- Commands:
  - `npm run dev` starts the Vite development server.
  - `npm run build` runs TypeScript project builds and creates the production
    Vite bundle.
  - `npm run lint` runs ESLint with zero warnings allowed.
  - `npm run format` formats the project with Prettier.
  - `npm test` runs the unit test suite.
  - `npm run test:e2e` runs the Playwright smoke test.
  - `npm run preview -- --host 0.0.0.0 --port 8080` serves the built `dist/`
    directory for local static verification.

## Scope Boundary

The app is intentionally small and client-only. Future work should keep state
local unless a concrete feature requires a broader state model, API, routing, or
backend integration.
