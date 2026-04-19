# Titan

Titan is an offline-first productivity app for managing tasks, notes, and expenses in one place. It is built as a PWA with React, Vite, TypeScript, Tailwind CSS, Zustand, and Dexie, and it is designed to keep working when the network is unavailable.

Current app version: V1.0.0

## What Titan Includes

- Task management with create, edit, due dates, and status tracking.
- Notes with tagging and task linking.
- Finance tracking with currency-aware formatting.
- Offline support through a service worker and installable PWA flow.
- Mobile-first navigation and responsive page shells.
- Local persistence using IndexedDB so data stays on the device.

## Getting Started

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

### Type-check the project

```bash
npm run typecheck
```

### Run tests

```bash
npm test
```

## Feature Overview

### Tasks

- Create tasks with titles, status, and optional due dates.
- Link tasks to notes where needed.
- Track task progress from todo to done.

### Notes

- Capture ideas and reference them from tasks.
- Organize content with tags.
- Import shared content directly into a note.

### Finance

- Record expenses as integer cents.
- Format values using the selected currency.
- Track finance data locally without a server.

### PWA Experience

- Prompt users to install Titan as an app.
- Keep the app usable offline.
- Handle service worker updates with a reload prompt.

## Architecture

- `src/main.tsx` bootstraps the React tree, theme provider, and PWA registration.
- `src/App.tsx` defines the route map and lazy-loaded pages.
- `src/app/Layout.tsx` renders the global shell, header, and bottom navigation.
- `src/core/store/` holds the Zustand store and task-note synchronization logic.
- `src/core/db/` defines the Dexie IndexedDB schema.
- `src/components/` contains shared layout and UI primitives.
- `src/modules/` contains the dashboard, tasks, notes, finance, settings, and share flows.
- `src/styles/` contains global styling, theme tokens, and animation utilities.

## Data Model

### Task

- `id`
- `title`
- `status` (`todo`, `doing`, `done`)
- `dueDate?`
- `noteId?`
- `createdAt`

### Note

- `id`
- `content`
- `tags[]`
- `linkedTaskIds[]?`
- `createdAt`

### Expense

- `id`
- `amount` in cents
- `category`
- `linkedTaskId?`
- `createdAt`

## Deployment

### Vercel

1. Install the Vercel CLI.

```bash
npm i -g vercel
```

2. Deploy a preview build.

```bash
vercel
```

3. Deploy production.

```bash
vercel --prod
```

The repository includes `vercel.json` for SPA rewrites and PWA-friendly cache headers.

### Netlify

1. Connect the repository in the Netlify dashboard.
2. Build command: `npm run build`
3. Publish directory: `dist`

The repository includes `netlify.toml` and `public/_redirects` for route handling.

## Notes

- Dark mode is the default theme.
- Navigation is mobile-first and bottom anchored.
- Data stays on-device unless you export or import it manually.
- The app version is surfaced in the header, the settings About section, and the startup fallback.
