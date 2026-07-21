# Development Workflow

## Branching

- Create feature branch per module:
  - `feat/module-1-4-dx-quality-gates`

## Commit style

Use Conventional Commits:

- `feat(scope): ...`
- `fix(scope): ...`
- `chore(scope): ...`
- `test(scope): ...`
- `ci(scope): ...`

## Local checks before push

```bash
pnpm format:check
pnpm lint:all
pnpm test:all
pnpm build:all
```

## TDD practice

1. Write failing test first.
2. Implement minimal code to pass.
3. Refactor safely with tests green.
