# Product Contract

## What This Project Is

`alex-uqyh-test-3` is a private Vite + React + TypeScript frontend application.
It currently contains the initial scaffolded single-page app and development
tooling foundation.

## Current Behavior

The app renders a starter React/Vite screen with:

- A centered "Get started" section.
- A counter button backed by React state.
- Links to Vite and React documentation.
- Links to Vite community channels.

There is no backend, routing, persistence, authentication, or domain-specific
product workflow merged yet.

## Architecture

- `src/main.tsx` mounts the React app into `#root`.
- `src/App.tsx` owns the current starter UI and local counter state.
- `src/App.css` and `src/index.css` contain the scaffolded component and global
  styles.
- `public/` contains static assets served directly by Vite.
- `src/assets/` contains imported image and SVG assets.
- `vite.config.ts` enables the React plugin and configures dev/preview servers
  to listen on `0.0.0.0:8080`.

## Tooling and Conventions

- Package manager: npm, with `package-lock.json` committed.
- Runtime framework: React 19.
- Build tool: Vite 8.
- Language: TypeScript 6 with strict mode enabled.
- Commands:
  - `npm run dev` starts the Vite development server.
  - `npm run build` runs TypeScript project builds and creates the production
    Vite bundle.
  - `npm run lint` runs ESLint.
  - `npm run preview` serves the production build preview.
- Generated dependencies and build outputs are ignored via `.gitignore`
  (`node_modules/`, `dist/`, logs, and local environment files).

## Current Scope Boundary

The repository is only initialized as a frontend scaffold. Future work should
add product-specific modules, shared types, routing, state management, tests, or
backend integration only when a concrete issue requires them.
