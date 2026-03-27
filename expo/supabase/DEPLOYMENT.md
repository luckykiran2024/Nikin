# Supabase Deployment Guide

## Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Create a Supabase project at https://supabase.com/dashboard

## Setup Steps

### 1. Initialize Supabase (if not already done)
```bash
supabase init
```

### 2. Link to your Supabase project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```
You can find your project ref in the Supabase dashboard URL.

### 3. Run Database Migrations
```bash
supabase db push
```
This will apply all migrations in `supabase/migrations/` to your database.

### 4. Deploy Edge Functions
```bash
supabase functions deploy api
```

### 5. Set Environment Variables
In Supabase Dashboard > Settings > Edge Functions, add:
- `SUPABASE_URL` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-set)
- `SUPABASE_ANON_KEY` (auto-set)

## Update App to Use Supabase

### Update `lib/trpc.ts`

Replace the API URL with your Supabase Edge Function URL:

```typescript
const getBaseUrl = () => {
  // Your Supabase Edge Function URL
  return 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/api';
};
```

### Environment Variables for the App

Create/update your `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_API_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/api
```

## Local Development

### Start Supabase locally
```bash
supabase start
```

### Serve Edge Functions locally
```bash
supabase functions serve api --env-file .env.local
```

### Local `.env.local` file
```
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
SUPABASE_ANON_KEY=your_local_anon_key
```

## API Endpoints

Once deployed, your API will be available at:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/api/trpc/[procedure]
```

### Example calls:
- Health check: `GET /functions/v1/api/`
- tRPC: `POST /functions/v1/api/trpc/users.getById`

## Troubleshooting

### Check Edge Function logs
```bash
supabase functions logs api
```

### Reset database
```bash
supabase db reset
```

### View database in Studio
```bash
supabase studio
```
Or visit: https://supabase.com/dashboard/project/YOUR_PROJECT_REF

## Security Notes

1. The Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS
2. Add proper authentication checks in your procedures
3. Never expose the service role key to the client
4. Use the anon key for client-side operations
