# Titan 🦅

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.1.0--beta-orange.svg)](https://github.com/Rayyan-x95/Titan/releases)
[![Build Status](https://github.com/Rayyan-x95/Titan/actions/workflows/ci.yml/badge.svg)](https://github.com/Rayyan-x95/Titan/actions)
[![Tests](https://img.shields.io/badge/tests-37%20passing-brightgreen.svg)](#-testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](https://www.typescriptlang.org/)

**Titan** is a purely open-source, privacy-first **Personal Life Operating System**. It unifies tasks, notes, and financial tracking into a high-performance, offline-first Progressive Web App (PWA).

> **100% of your data stays on your device.** No cloud. No tracking. No silos.

## ✨ Features

### 🗂️ Unified Intelligence
- **Tasks** — Kanban boards, subtask hierarchies, recurring tasks, due dates, energy & priority tagging
- **Notes** — Markdown-ready notes with bidirectional linking to tasks and other notes
- **Finance** — Expense/income tracking, multi-account management, budget monitoring, spending charts
- **Contextual Links** — Tasks ↔ Notes ↔ Expenses linked automatically with referential integrity

### 💰 Precision Finance
- Integer-based money math (cents) — no floating-point errors
- Multi-account support (Cash, Bank, custom accounts)
- Recurring transactions with automatic processing
- Budget suggestions based on spending patterns
- SMS/receipt parsing for quick expense entry (OCR via Tesseract.js)

### 👥 Split Expenses
- Group expense splitting (equal & weighted)
- Friend management with automatic debt settlement
- QR code generation for UPI payments
- Per-group balance tracking

### 📱 PWA Native
- Installable on iOS, Android, and Desktop
- Offline-first — works without a network connection
- Background sync and service worker caching
- Web Share API integration

### 🔒 Privacy & Security
- All data stored locally via IndexedDB — nothing leaves your device
- App PIN lock with PBKDF2-HMAC-SHA256 hashing (100K iterations)
- Optional biometric unlock (WebAuthn)
- XSS prevention via DOM-based HTML sanitization
- Export/import your data as JSON at any time

## 🏗️ Architecture

```
User Action → Zustand Store → Dexie (IndexedDB) → State Update → UI Re-render
                   ↓
           Pure Logic Engines (validation, normalization, sync)
```

| Layer | Purpose | Location |
|-------|---------|----------|
| **UI** | React components, pages | `src/features/`, `src/components/` |
| **State** | Zustand store (7 slices) | `src/core/store/` |
| **Logic** | Pure business functions | `src/lib/core/` |
| **Database** | Dexie IndexedDB (10 tables) | `src/core/db/` |
| **Utils** | Sanitization, parsing, dates | `src/utils/` |

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) |
| **Build** | [Vite 7](https://vitejs.dev/) |
| **State** | [Zustand 5](https://docs.pmnd.rs/zustand) |
| **Database** | [Dexie 4](https://dexie.org/) (IndexedDB) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Testing** | [Vitest](https://vitest.dev/) |
| **PWA** | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + [Workbox](https://developer.chrome.com/docs/workbox/) |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
```bash
git clone https://github.com/Rayyan-x95/Titan.git
cd Titan
npm install
```

### Development
```bash
npm run dev         # Start dev server (http://localhost:5173)
```

### Testing & Quality
```bash
npm test            # Run unit tests (Vitest)
npm run typecheck   # Validate TypeScript
npm run lint        # Run ESLint checks
npm run check:ci    # Run all CI checks (typecheck + lint + test)
npm run build       # Production build → dist/
```

## 📂 Project Structure

```
src/
├── core/                     # State management & persistence
│   ├── store/                # Zustand store (7 slices)
│   │   ├── useStore.ts       # Main store composition
│   │   ├── slices/           # taskSlice, noteSlice, financeSlice, etc.
│   │   ├── taskNoteSync.ts   # Bidirectional linking engine
│   │   ├── selectors.ts      # Derived state hooks
│   │   └── types.ts          # All entity type definitions
│   ├── db/db.ts              # Dexie schema (10 tables)
│   └── settings.ts           # App settings (currency, PIN, notifications)
├── lib/core/                 # Pure business logic engines
│   ├── taskEngine.ts         # Task normalization, recurrence, hierarchy
│   ├── financeEngine.ts      # Money math, budgets, recurring transactions
│   ├── noteEngine.ts         # Note normalization & sanitization
│   ├── splitEngine.ts        # Expense splitting & settlements
│   ├── parserEngine.ts       # SMS/OCR text → structured data
│   └── timelineEngine.ts     # Daily snapshot computation
├── features/                 # Feature pages (lazy-loaded)
│   ├── dashboard/            # Overview & quick actions
│   ├── tasks/                # Task CRUD, Kanban, Calendar
│   ├── notes/                # Notes CRUD, editor, tagging
│   ├── finance/              # Expenses, budgets, charts
│   ├── split/                # Group expenses, QR, settlements
│   ├── settings/             # Preferences, data management
│   ├── onboarding/           # Multi-step onboarding flow
│   ├── timeline/             # Historical activity view
│   └── marketing/            # Public landing & SEO pages
├── components/               # Shared UI primitives
│   ├── ui/                   # Button, Modal, Card, Calendar, etc.
│   ├── Navigation.tsx        # Bottom nav bar
│   ├── CommandPalette.tsx    # Ctrl+K global search
│   └── ErrorBoundary.tsx     # Error recovery UI
├── hooks/                    # Custom React hooks
├── utils/                    # Sanitization, date helpers, parsers
└── styles/                   # Global CSS & theme tokens
```

## 🧪 Testing

**37 tests** across **11 test files** — all passing.

| Module | Coverage | Tests |
|--------|----------|-------|
| Task Engine | Recurrence, cycles, hierarchy, due dates | 4 |
| Finance Engine | Balance ops, cross-account, filtering, totals | 4 |
| Split Engine | Equal/weighted split, settlements, edge cases | 7 |
| Task-Note Sync | Link/unlink, reconciliation, validation | 4 |
| Parser Engine | SMS, OCR, quick capture, edge cases | 5 |
| SMS Parser | Amount, merchant, date, category extraction | 4 |
| Store Integration | Task CRUD, note linking, expense references | 3 |
| Delete Cascades | Reference cleanup, hierarchy detection | 3 |
| Integration Flows | Recurring tasks, parsing, reconciliation | 3 |

```bash
npm test                        # Run all tests
npm test -- -t "taskEngine"     # Run specific test
npm test -- --coverage          # Coverage report
```

## 🤝 Contributing

We love contributors! Whether you're fixing a bug, adding a feature, or improving docs — your help is welcome.

1. Read the [Contributing Guide](CONTRIBUTING.md)
2. Follow the [Code of Conduct](CODE_OF_CONDUCT.md)
3. Check the [AGENTS.md](AGENTS.md) for architecture details

## 🛡️ Security

If you discover a security vulnerability, please refer to our [Security Policy](SECURITY.md).

## 📄 License

Titan is open-source software licensed under the **[MIT License](LICENSE)**.

---

*Built with precision for the modern professional. Your data, your device, your rules.*
