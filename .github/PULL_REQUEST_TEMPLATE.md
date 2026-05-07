## Description

Summarize the changes made in this Pull Request and the problem they solve.

Fixes # (issue number)

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactor / Optimization

## Checklist

### General
- [ ] I have read the [CONTRIBUTING](CONTRIBUTING.md) guide.
- [ ] My code follows the style guidelines of this project.
- [ ] I have performed a self-review of my own code.
- [ ] I have commented my code, particularly in hard-to-understand areas.

### Testing & CI
- [ ] `npm run check:ci` passes (typecheck + lint + test).
- [ ] I have added tests that prove my fix is effective or that my feature works.
- [ ] New and existing unit tests pass locally with my changes.
- [ ] My changes generate no new warnings.

### Architecture (if modifying store/engine/db)
- [ ] Input is normalized before validation (engines).
- [ ] Task-note linking is synced if affected (`taskNoteSync`).
- [ ] Multi-table operations use `db.transaction()`.
- [ ] Money values are stored as integer cents.
- [ ] No orphaned references after delete (cascading cleanup).

## Screenshots (if applicable)

Add any screenshots of UI changes here.
