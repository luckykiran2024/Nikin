# Security remediation: first tranche

This branch closes the most direct unauthenticated access paths and removes unsafe demo verification flows. It is **not a production launch approval**.

## Implemented

- tRPC business procedures require a Supabase access token verified with `auth.getUser`. Admin procedures use only server-controlled `app_metadata.role`.
- Registration binds the app profile to the authenticated Supabase user ID and email. Profile edits cannot set roles, KYC approval, balances, or ratings.
- The client no longer accepts hard-coded admin credentials, local plaintext passwords, or cached profiles as authentication. The fixed-code signup OTP was removed.
- Production API traffic is refused while business data uses process-local Maps. Nonproduction testing requires `NIKIN_ENABLE_IN_MEMORY_API=true` and a Supabase URL and anon key. Never set this flag in a production deployment.
- Cash payment creation derives amounts from the accepted quote. Online order creation permits only Razorpay test keys. Client payment completion is disabled, and capture no longer credits traveler earnings or marks funds released.
- KYC submission, approval, and cancellation are unavailable until a verified provider and secure document storage are implemented. The app no longer collects KYC data through the mock flow.
- `npm run typecheck` is available. The Bun-only tests are excluded from the app TypeScript build.

## Required before launch

1. Migrate every business router and webhook to a durable database. Add row-level authorization for shipment, quote, chat, notification, ticket, and payment reads and writes. Remove the `NIKIN_ENABLE_IN_MEMORY_API` gate only after that migration is verified.
2. Create transactional payment and payout ledgers, durable webhook idempotency, refund/reconciliation jobs, and a proof-based COD workflow. Enable live Razorpay orders only after these are tested.
3. Integrate a real KYC provider and secure document storage with retention and access controls. Rebuild the user flow and enable approval only with verified evidence.
4. Finish account onboarding for Google sign-in and email-confirmation sessions. Use a persistent profile store keyed by Supabase auth user ID.
5. Make `npm ci` reproducible, run the Bun service suite against the live routers or replace it, add CI, and resolve dependency audit findings.

The current app will show an unavailable message for KYC. The production API will return HTTP 503 for business routes until the storage and authorization work above is complete.
