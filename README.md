# Capital Eye — Frontend

> Personal finance & wealth dashboard. Track liquidity, assets and net worth, register
> movements, and visualise trends — all in a fast, server‑rendered Angular app.

[![Angular](https://img.shields.io/badge/Angular-21-dd0031?logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-21-22c55e?logo=prime&logoColor=white)](https://primeng.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange?logo=firebase&logoColor=white)](https://firebase.google.com/products/auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Capital Eye is the frontend of a personal finance application. It talks to a REST
backend (not included in this repository) and uses **Firebase Authentication** for
identity. The UI is built entirely with **PrimeNG** and **Tailwind CSS**, the state is
**Signals‑first** on a **zoneless** runtime, and pages are **server‑side rendered** with
hydration for fast first paint.

---

## Table of contents

- [Capital Eye — Frontend](#capital-eye--frontend)
  - [Table of contents](#table-of-contents)
  - [Features](#features)
  - [Tech stack](#tech-stack)
  - [Architecture](#architecture)
  - [Prerequisites](#prerequisites)
  - [Getting started](#getting-started)
  - [Environment configuration](#environment-configuration)
  - [Available scripts](#available-scripts)
  - [Project structure](#project-structure)
  - [Docker](#docker)
  - [Testing](#testing)
  - [Security](#security)
  - [Contributing](#contributing)
  - [License](#license)

---

## Features

- **Authentication** — email/password plus OAuth providers (Google, Apple, GitHub,
  Facebook) via Firebase Auth, with route guards for authenticated and guest areas.
- **Dashboard** — at‑a‑glance net worth, liquidity and asset totals (intangible &
  physical), plus monthly trend.
- **Assets** — searchable/filterable list, distribution and monthly trend charts, full
  create/update/delete flows and account‑link management with optimistic updates.
- **Liquidity** — total liquidity, accounts & bank cards, monthly breakdown table and a
  stacked chart.
- **Current accounts** — dedicated management screen.
- **Register (Transactions)** — register liquidity snapshots (`accountUuid`, `date`,
  `amount`) and asset BUY/SELL movements (`assetUuid`, `accountUuid`, `type`, `date`,
  `quantity`, `totalAmount`); a merged history table ordered by date.
- **Settings** — user preferences.
- **Responsive & themable** — light/dark theme via the PrimeNG Nora preset, JetBrains
  Mono typography, mobile‑aware date pickers.

## Tech stack

| Area             | Choice                                                                    |
| ---------------- | ------------------------------------------------------------------------- |
| Framework        | Angular 21 (standalone components, lazy routes)                           |
| Change detection | Zoneless — Signals‑first (`signal`, `computed`, `effect`, `linkedSignal`) |
| Remote data      | `resource` / `httpResource` consumed through feature stores               |
| Rendering        | SSR with Express + hydration & event replay                               |
| UI components    | PrimeNG 21 (Nora theme via `@primeuix/themes`, `tailwindcss-primeui`)     |
| Styling          | Tailwind CSS 4 (global theme tokens in `src/styles.css`)                  |
| Icons            | Lucide Angular                                                            |
| Charts           | Chart.js via PrimeNG chart components                                     |
| Auth             | Firebase Auth (client SDK)                                                |
| Forms            | Angular Signal Forms                                                      |
| Language         | TypeScript (strict)                                                       |
| Tests            | Jasmine / Karma                                                           |
| Runtime          | Node 22.21.1 (pinned via Volta)                                           |

## Architecture

- **Signal‑first state** — local and derived state live in Signals; reads from the
  backend go through `resource`/`httpResource`, encapsulated in feature **store
  services** and exposed to pages as read‑only state.
- **Optimistic updates** — mutations that affect visible lists/tables update the UI
  immediately, roll back on error and reconcile with the next `httpResource` reload.
  Shared helpers (`src/app/utils/resource.utils.ts`,
  `src/app/utils/optimistic-collection.utils.ts`) keep the pattern consistent.
- **Guards** — functional `authGuard` / `guestGuard` in `app.routes.ts` drive the
  logged‑in vs. guest layouts.
- **HTTP interceptors** — `authInterceptor` attaches a Firebase ID bearer token
  **only** to requests targeting `environment.apiUrl` (host allowlist, never to third
  parties); `apiErrorInterceptor` surfaces backend errors as global toasts.
- **UI & styling constraints** — PrimeNG is the only UI library; styling is Tailwind
  only with tokens declared globally (no component‑level custom CSS).
- **Bootstrap** — `provideAppInitializer` calls `AuthStore.bootstrapAuth()` before the
  app starts; the router then dispatches to the guest or logged layout.

```text
Browser/SSR -> App bootstrap -> AuthStore.bootstrapAuth()
  -> Firebase authState$ -> Router guard -> Guest/Logged layout
  -> Page component -> Store service -> API service
  -> HttpClient + authInterceptor -> Backend REST
```

## Prerequisites

- **Node 22.21.1** — the version is pinned in `package.json` via [Volta](https://volta.sh).
  If Volta is installed it switches automatically; otherwise use a Node version manager.
- **npm** (ships with Node).
- A running **backend REST API** and a **Firebase project** with Auth enabled.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment files from the committed template
cp src/environments/environment.template.ts src/environments/environment.development.ts
cp src/environments/environment.template.ts src/environments/environment.ts

# 3. Fill in apiUrl and your Firebase config (see Environment configuration)

# 4. Start the dev server
npm start
```

The app is served at `http://localhost:4200/` and reloads on source changes.

## Environment configuration

The real environment files are **git‑ignored** (they may contain project‑specific
values). Only `environment.template.ts` is committed.

Edit both local files and provide:

| Field                        | Description                          |
| ---------------------------- | ------------------------------------ |
| `apiUrl`                     | Base URL of the backend REST API     |
| `firebase.apiKey`            | Firebase Web API key                 |
| `firebase.authDomain`        | e.g. `<project>.firebaseapp.com`     |
| `firebase.projectId`         | Firebase project ID                  |
| `firebase.storageBucket`     | e.g. `<project>.firebasestorage.app` |
| `firebase.messagingSenderId` | Firebase messaging sender ID         |
| `firebase.appId`             | Firebase app ID                      |
| `firebase.measurementId`     | (optional) Analytics measurement ID  |

`angular.json` swaps `environment.ts` with `environment.development.ts` for the
development build, so usually you only need to fill the development file for local work.

> Firebase Web API keys are **public by design** — they identify a project, they do not
> grant access on their own. See [Security](#security) for how to actually protect your
> project.

## Available scripts

| Command                                  | Description                                                 |
| ---------------------------------------- | ----------------------------------------------------------- |
| `npm install`                            | Install dependencies                                        |
| `npm start`                              | Run the dev server (`ng serve`) at `http://localhost:4200/` |
| `npm run build`                          | Production build (SSR server output into `dist/`)           |
| `npm run watch`                          | Development build with watch                                |
| `npm test`                               | Run unit tests (Karma + Jasmine)                            |
| `npm run serve:ssr:capital_eye-frontend` | Serve the SSR build (`node dist/.../server/server.mjs`)     |

> No `lint` script or end‑to‑end framework is configured yet.

## Project structure

```text
src/
├── app/
│   ├── app.config.ts            # Providers: zoneless, router, hydration, HTTP, PrimeNG
│   ├── app.routes.ts            # Routes + authGuard / guestGuard
│   ├── core/                    # Shared app shell (sidebar)
│   ├── layout/                  # guest-layout / logged-layout
│   ├── pages/                   # Feature pages
│   │   ├── auth/                # login / registration
│   │   ├── dashboard/
│   │   ├── assets/              # + components/<task>
│   │   ├── liquidity/
│   │   ├── current-accounts/
│   │   ├── transactions/        # "Registro" (liquidity + asset snapshots)
│   │   └── settings/
│   ├── interceptors/            # auth + apiError interceptors
│   ├── services/
│   │   ├── api/                 # Thin HTTP + Firebase wrappers
│   │   ├── store/               # Signal/httpResource stores (auth, assets, liquidity…)
│   │   └── device/              # Mobile/desktop detection
│   ├── shared/
│   │   ├── components/          # bar-chart, distribution-chart, trend-chart,
│   │   │                        # summary-card, date-picker, api-error-toast
│   │   └── config/              # Shared static options / enum labels
│   ├── models/  enum/  icons/  utils/
├── environments/                # environment.*.ts (git-ignored) + template (committed)
├── styles.css  styles/*         # Tailwind, PrimeUI, global theme tokens, fonts
└── server.ts  main.server.ts    # SSR entry
Dockerfile                       # Multi-stage production SSR image
```

## Docker

A multi‑stage `Dockerfile` builds the SSR app and runs it as a non‑privileged `node`
user.

```bash
# Build the image
docker build -t capital-eye-frontend .

# Run on http://localhost:4000
docker run -p 4000:4000 capital-eye-frontend
```

> The container runs the prebuilt bundle. The Firebase/`apiUrl` values are baked in at
> build time from the environment files present during `docker build`, so make sure the
> production `environment.ts` is in place before building.

## Testing

```bash
npm test
```

Unit tests use **Jasmine** with the **Karma** runner. Specs live next to their
components, stores and API services. A headless/CI test script is not configured yet.

## Security

- **Environment files are git‑ignored.** Only `src/environments/environment.template.ts`
  (with empty placeholders) is committed; `environment.ts` and
  `environment.development.ts` stay local.
- **Bearer token scoping.** The auth interceptor attaches the Firebase ID token only to
  requests whose URL starts with `environment.apiUrl`, so the token is never sent to
  third‑party hosts.
- **Firebase Web API keys are public by design.** They identify a project but do not
  grant data access on their own. The real protection layers are:
  1. **Firebase Security Rules** — restrict Firestore/Storage reads & writes to
     authenticated users (and to the least privilege they need).
  2. **Authorized domains** — in the Firebase Console, limit the domains allowed to use
     Auth.
  3. **API key restrictions** — in Google Cloud Console, restrict the Web API key by
     HTTP referrer so only your domains can call it.
  4. (Optional) **App Check** — to block non‑app clients.
- **History note.** An early version of `firebase-api.ts` contained the hardcoded
  Firebase config. It was later moved into the git‑ignored environment files, but the
  original configuration remains in the **git history**. Because Firebase Web API keys
  are not secret credentials this is not a credential leak, but before making the repo
  public you should: apply the restrictions above, and (optionally) rotate the API key
  in Google Cloud Console and/or rewrite the history to purge the old config.

## Contributing

Contributions are welcome. It captures
the project conventions (Signals‑first, PrimeNG‑only UI, Tailwind‑only styling, no
`any`, Angular Signal Forms, optimistic‑update patterns) that keep the codebase
consistent. Keep changes small and aligned with existing patterns.

## License

Distributed under the [MIT License](./LICENSE).
