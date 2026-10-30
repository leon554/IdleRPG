# IdleRPG

npm-workspaces monorepo:

| Path | What |
| --- | --- |
| `apps/mobile` | Expo (SDK 58) + Expo Router + NativeWind v4. Runs on your machine. |
| `apps/api` | Node + TypeScript + Express + Drizzle ORM. Runs in Docker. |
| `packages/shared` | Types shared by both apps (`@idlerpg/shared`). |

Postgres 16 runs in Docker alongside the API.

## Prerequisites

- Node 22+ and npm
- Docker Desktop
- Expo Go on a device, or an iOS simulator / Android emulator

## First-time setup

```sh
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
npm install
```

## Development

Start Postgres and the API (hot reloads on changes in `apps/api` and `packages/shared`):

```sh
npm run dev:api        # docker compose up --build
```

In another terminal, start the mobile app:

```sh
npm run dev:mobile     # expo start (press i / a / w for iOS / Android / web)
```

Check the API: `curl localhost:3001/health`

### Ports

| Service | Host port | Inside Docker |
| --- | --- | --- |
| API | `3001` (`API_PORT`) | `api:3000` |
| Postgres | `5433` (`POSTGRES_PORT`) | `db:5432` |

Change them in `.env` if they clash with other projects.

### Pointing the app at the API

Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`:

- iOS simulator / web: `http://localhost:3001`
- Android emulator: `http://10.0.2.2:3001`
- Physical device: `http://<your-computer-LAN-IP>:3001`

Restart Expo after changing it.

## Database (Drizzle)

Edit the schema in `apps/api/src/db/schema.ts`, then (with the containers running):

```sh
npm run db:generate    # create a SQL migration in apps/api/drizzle
npm run db:migrate     # apply migrations
npm run db:push        # or: push the schema directly without a migration (prototyping)
```

Connect a DB client with `postgres://idlerpg:idlerpg@localhost:5433/idlerpg`.

## Useful commands

```sh
npm run down                          # stop containers
docker compose down -v                # stop and wipe the database volume
docker compose logs -f api            # tail API logs
npm run typecheck -w apps/api         # typecheck the API
npx tsc --noEmit -p apps/mobile       # typecheck the app
```

If you add API dependencies, rebuild the image: `npm run dev:api` (it passes `--build`).
