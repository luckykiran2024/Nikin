# ParcelPeer Production Deployment Guide

This guide walks you through deploying ParcelPeer as a complete production application.

## Overview

ParcelPeer consists of:
- **Mobile App**: React Native/Expo app (iOS, Android, Web)
- **Backend**: Supabase (Database + Edge Functions + Auth)
- **API**: tRPC endpoints via Supabase Edge Functions

## Prerequisites

1. [Supabase Account](https://supabase.com) (Free tier available)
2. [Expo Account](https://expo.dev) (For app builds)
3. Node.js 18+ installed locally

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from Settings > API
3. Keep the service role key secure (for server-side operations only)

### 1.2 Run Database Migrations

In your Supabase SQL Editor, run the migrations in order:

```bash
# Run these SQL files in your Supabase SQL Editor:
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_helper_functions.sql
```

### 1.3 Configure Row Level Security

The migrations already include RLS policies. Verify they're enabled in your Supabase dashboard under Authentication > Policies.

---

## Step 2: Deploy Edge Functions

### 2.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 2.2 Login and Link Project

```bash
supabase login
supabase link --project-ref your-project-id
```

### 2.3 Deploy the API Function

```bash
supabase functions deploy api --no-verify-jwt
```

### 2.4 Set Secrets

```bash
supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Step 3: Configure Mobile App

### 3.1 Create Environment File

```bash
cp .env.example .env
```

### 3.2 Fill in Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=https://your-project-id.supabase.co/functions/v1/api
```

### 3.3 Test Locally

```bash
npm install
npm start
```

---

## Step 4: Build for Production

### 4.1 Configure app.json

Update `app.json` with your app details:
- `name`: Your app name
- `slug`: Unique identifier
- `ios.bundleIdentifier`: e.g., "com.yourcompany.parcelpeer"
- `android.package`: e.g., "com.yourcompany.parcelpeer"

### 4.2 Build with EAS (Expo Application Services)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## Step 5: App Store Submission

### iOS (App Store)

1. Create an Apple Developer account ($99/year)
2. Create App ID in Apple Developer Portal
3. Configure app in App Store Connect
4. Submit build via EAS or Transporter

### Android (Play Store)

1. Create Google Play Developer account ($25 one-time)
2. Create app listing in Google Play Console
3. Upload AAB file from EAS build
4. Complete store listing and submit for review

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Sender    │  │  Traveler   │  │     Admin       │  │
│  │    App      │  │    App      │  │   Dashboard     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS/tRPC
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase Edge Functions                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │                 tRPC API Router                  │    │
│  │  • users    • shipments  • quotes   • payments  │    │
│  │  • kyc      • chat       • tickets  • routes    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Supabase Database                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  users   │ │shipments │ │  quotes  │ │ payments │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │kyc_reqs  │ │  chats   │ │ tickets  │ │  routes  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Security Checklist

- [ ] Row Level Security enabled on all tables
- [ ] Service role key only used server-side
- [ ] Anon key used client-side (safe to expose)
- [ ] Input validation on all user inputs
- [ ] Rate limiting configured on Edge Functions
- [ ] HTTPS enforced for all API calls

---

## Monitoring & Analytics

### Supabase Dashboard
- Monitor database usage
- View Edge Function logs
- Track API calls and errors

### Recommended Additions
- Sentry for error tracking
- Analytics (Firebase, Mixpanel, etc.)
- Performance monitoring

---

## Troubleshooting

### Common Issues

**1. API Connection Errors**
- Verify EXPO_PUBLIC_API_URL is correct
- Check Edge Function is deployed: `supabase functions list`
- View logs: `supabase functions logs api`

**2. Database Errors**
- Ensure migrations ran successfully
- Check RLS policies aren't blocking queries
- Verify service role key for Edge Functions

**3. Build Errors**
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Expo SDK compatibility

**4. Auth Errors**
- Verify Supabase Auth is enabled
- Check email/phone providers are configured
- Ensure redirect URLs are set correctly

---

## Development vs Production

### Development Mode (Rork Platform)
- Works out of the box with no configuration
- Uses in-memory storage (data resets on reload)
- Admin login: `admin@parcelpeer.com` / `admin123`
- Great for testing and demos

### Production Mode (Supabase)
- Requires Supabase configuration
- Persistent data storage
- Real authentication (email/phone)
- Secure and scalable

### Hybrid Mode
- The app automatically detects which backend to use
- If Supabase is configured, it uses Supabase
- If not, falls back to in-memory storage
- Auth falls back to local storage for development

---

## Feature Checklist for Production

### Core Features
- [x] User registration and login
- [x] Role-based access (Sender/Traveler/Admin)
- [x] Shipment creation and management
- [x] Quote system for travelers
- [x] Real-time chat between parties
- [x] Payment tracking (simulated)
- [x] KYC verification workflow
- [x] OTP verification for pickup/delivery
- [x] Admin dashboard

### Production Requirements
- [ ] Configure Supabase project
- [ ] Deploy database migrations
- [ ] Deploy Edge Functions
- [ ] Configure environment variables
- [ ] Set up payment gateway (Razorpay)
- [ ] Configure push notifications
- [ ] Set up analytics
- [ ] Configure error tracking (Sentry)

### App Store Requirements
- [ ] App icons (all sizes)
- [ ] Splash screen
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] App Store screenshots
- [ ] App description and keywords

---

## Support

For issues specific to:
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Expo**: [docs.expo.dev](https://docs.expo.dev)
- **App Store**: Contact app store support channels
