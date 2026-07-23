# Database Workflow

## Start local Postgres

```bash
pnpm db:up
```

## View database container status

```bash
pnpm db:ps
pnpm db:logs
```

## Apply migrations

Make sure `DATABASE_URL` is set, then run:

```bash
pnpm db:migrate
```

## Roll back latest migration

```bash
pnpm db:rollback
```

## Create a new migration

```bash
pnpm db:migration:new migration_name_here
```

## Local development env

Expected local database URL:

```bash
postgres://postgres:postgres@localhost:5432/psych_booking
```

## Notes

- Keep migrations in `db/migrations/`
- Never edit an already-applied migration in shared branches
- Create a new migration for follow-up schema changes
