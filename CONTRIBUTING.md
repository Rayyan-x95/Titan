# Contributing to Titan 🦅

First off, thank you for considering contributing to Titan! It's people like you that make open source such a great community.

## 🚀 Quick Start

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally.
3. **Install** dependencies: `npm install`.
4. **Create** a feature branch: `git checkout -b feat/my-awesome-feature`.
5. **Develop**: `npm run dev`.
6. **Verify**: Ensure `npm run check:ci` passes (typecheck + lint + test).
7. **Commit**: Use descriptive commit messages.
8. **Push** to your fork and **Submit a PR**.

## 🏗️ Architecture at a Glance

Before diving in, familiarize yourself with the codebase layers:

| Layer | Location | Purpose |
|-------|----------|---------|
| **UI** | `src/features/`, `src/components/` | React components & pages |
| **State** | `src/core/store/slices/` | Zustand slice actions (7 slices) |
| **Logic** | `src/lib/core/` | Pure business functions (engines) |
| **Database** | `src/core/db/db.ts` | Dexie IndexedDB schema (10 tables) |
| **Utils** | `src/utils/` | Sanitization, dates, helpers |

> **Deep dive**: See [AGENTS.md](AGENTS.md) for architecture details, critical patterns, and code review checklists.

## 🛠️ Development Standards

### 🛡️ Privacy First
Titan is a privacy-first app. **Never** introduce third-party trackers, external fonts (unless self-hosted), or any logic that transmits personal user data to a remote server without explicit, transparent user consent.

### 🧠 Logic Engines
All business logic (math, validation, recurrence) should live in `src/lib/core/` as **pure functions**. This ensures the logic is easily testable and decoupled from the UI.

### 📐 Store Actions
Every store action must follow: **Normalize → Validate → Sync → Transact → Update**

```
1. Normalize input (engines)
2. Validate constraints (engines)
3. Sync bidirectional refs (taskNoteSync)
4. Transact atomically (Dexie)
5. Update state (Zustand)
```

### 💰 Money
All monetary values are stored as **integer cents**. Never use floats for money. Use `dollarsToCentsSafe()` / `safeAddCents()` / `safeSubCents()` from `financeEngine.ts`.

### 🎨 UI & Styling
- Use **Tailwind CSS** for all styling.
- Follow the existing **Dark Mode** design tokens.
- Use **Lucide React** for icons.
- Ensure components are accessible (ARIA labels, focus states).

### 🧪 Testing
We use **Vitest** for unit testing (37 tests passing). Every new engine function or core store action should have a corresponding `.test.ts` file.

```bash
npm test                     # Run all tests
npm test -- -t "taskEngine"  # Run specific test
npm run check:ci             # Full CI check
```

## 📋 Pull Request Guidelines

- **Keep it focused**: One PR per feature or bug fix.
- **Link issues**: Mention relevant issues in the description (e.g., `Fixes #123`).
- **Tests**: PRs that improve or maintain test coverage are prioritized.
- **Linting**: Ensure `npm run lint` and `npm run format` have been run.
- **CI must pass**: `npm run check:ci` (typecheck + lint + test) must pass before merge.

## 🔍 Before You Submit

Run this checklist locally:

```bash
npm run typecheck   # ✅ 0 TypeScript errors
npm run lint        # ✅ 0 ESLint errors/warnings
npm test            # ✅ All tests passing
npm run build       # ✅ Production build succeeds
```

Or all at once: `npm run check:ci`

## 🤝 Code of Conduct
By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## ❓ Need Help?
Open an [Issue](https://github.com/Rayyan-x95/Titan/issues) with the `question` label.

---
*Happy coding!*
