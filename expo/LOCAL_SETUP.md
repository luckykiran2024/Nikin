# ParcelPeer — Local Development Guide

Run the full stack locally: **Expo app (Android + iOS + Web)** + **Supabase (Postgres, Auth, Storage, Edge Functions) via Docker**.

---

## 1. Prerequisites

| Tool | Version | Check |
|---|---|---|
| Docker Desktop | 24+ | `docker --version` |
| Node.js | 20+ | `node -v` |
| Bun | 1.1+ | `bun -v` |
| Supabase CLI | 1.200+ | `supabase --version` |
| Android Studio (optional, for Android emulator) | latest | — |

Install Supabase CLI:
```bash
# macOS
brew install supabase/tap/supabase
# Linux
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
# Windows (scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

---

## 2. Start Supabase (Docker)

From the project root:

```bash
cd expo
supabase start
```

Supabase CLI will pull the Docker images and boot:
- Postgres on `localhost:54322`
- API gateway (PostgREST / Auth / Storage) on `localhost:54321`
- Studio UI on `localhost:54323`
- Inbucket (emails) on `localhost:54324`

When it finishes, it prints keys like:
```
API URL: http://127.0.0.1:54321
anon key: eyJhbGciOi...
service_role key: eyJhbGciOi...
```

Copy these into `expo/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<paste anon key>
```

> **Android emulator tip:** replace `127.0.0.1` with `10.0.2.2`.
> **Physical device tip:** use your machine's LAN IP, e.g. `http://192.168.1.20:54321`.

---

## 3. Apply the SQL schema

Migrations live in `expo/supabase/migrations/`:
- `001_initial_schema.sql` – tables, triggers, base RLS
- `002_helper_functions.sql` – RPC helpers
- `003_rls_policies.sql` – complete RLS policies for every role

Apply them:

```bash
supabase db reset           # fresh DB + run every migration
# OR, keeping existing data:
supabase migration up
```

Verify in Studio → `http://localhost:54323`.

---

## 4. Install app dependencies

```bash
cd expo
bun install
```

---

## 5. Run the app

```bash
bun run start            # dev menu + QR
bun run start-web        # web build only
```

### Android
1. Open Android Studio → Device Manager → start an emulator **or** plug in a phone with USB debugging.
2. Press `a` in the Expo terminal, or open Expo Go and scan the QR.
3. Ensure `EXPO_PUBLIC_SUPABASE_URL` uses `10.0.2.2` (emulator) or LAN IP (device).

### iOS (Mac only)
Press `i` in the Expo terminal to boot the simulator.

### Web
Press `w` or run `bun run start-web`. Opens at `http://localhost:8081`.

---

## 6. Three role-based apps (same codebase)

The single app routes to one of three flows based on login role:

| Role | Entry route | Description |
|---|---|---|
| Sender | `/(tabs)` | Create & track shipments, review quotes |
| Traveler | `/(tabs)` (traveler view) | Browse shipments, quote, deliver, earnings |
| Admin | `/(admin)` | KYC review, users, shipments, payments |

Demo credentials (visible on each login screen):
- Sender — `sender@test.com / sender123`
- Traveler — `traveler@test.com / traveler123`
- Admin — `admin@parcelpeer.com / admin123`

---

## 7. Useful commands

```bash
supabase status          # current service URLs
supabase stop            # stop containers
supabase db reset        # wipe + re-migrate
supabase functions serve # run edge functions locally
supabase logs            # stream logs
docker ps                # see supabase containers
```

---

## 8. Troubleshooting

**“Failed to fetch” on mobile**
Your phone can't reach `127.0.0.1`. Use LAN IP or `10.0.2.2` in `EXPO_PUBLIC_SUPABASE_URL`.

**Port already in use**
`supabase stop` then `supabase start`. Or edit `supabase/config.toml` to pick other ports.

**Migrations fail**
`supabase db reset` performs a clean slate. Data is lost but migrations will re-run cleanly.

**Android build: permission errors**
Rebuild dev client after editing `app.json`: `bunx expo prebuild --clean` (only needed outside Expo Go).
