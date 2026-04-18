# Test Automation Suite

Full automation suite for the Parcel Marketplace app. Covers trust/abuse, OTP,
payments, tracking, cancellation, concurrency, notifications, performance,
security, and end-to-end chaos tests.

## Run

```bash
cd expo
bun test
```

Run a single file:

```bash
bun test tests/otp.test.ts
```

Run a category (glob):

```bash
bun test tests/abuse
bun test tests/e2e
```

Watch mode:

```bash
bun test --watch
```

## Layout

```
tests/
  services/           # Framework-agnostic reference implementations
    otp.ts            # OTP lifecycle (issue/verify/resend/lock/consume)
    fraud.ts          # Abuse/fraud rate-limits using TRUST_LIMITS
    payment.ts        # Razorpay-like auth/capture/refund/tip split
    tracking.ts       # GPS anomalies (spoof/teleport/deviation/idle)
    notifications.ts  # Multi-channel send with retries + fallback
    locks.ts          # Assignment lock manager for concurrency
    cancellation.ts   # Refund/penalty resolver
    auth.ts           # Role + KYC + resource authorization
  abuse.test.ts       # AB-01..AB-03
  otp.test.ts         # OTP-01..OTP-03 + edge cases
  payment.test.ts     # PAY-06..PAY-08 + edge cases
  tracking.test.ts    # TR-05..TR-07
  cancellation.test.ts# CAN-01..CAN-02
  concurrency.test.ts # CON-01..CON-02
  notifications.test.ts # NTF-01..NTF-04
  performance.test.ts # PERF-01..PERF-03
  security.test.ts    # SEC-01..SEC-02
  e2e.test.ts         # E2E-01..E2E-03
  stateMachine.test.ts
  validation.test.ts
```

## Coverage Map

| ID        | Scenario                                           | File                    |
|-----------|----------------------------------------------------|-------------------------|
| AB-01     | Fake parcel dispute needs evidence                 | abuse.test.ts           |
| AB-02     | Repeated high-value requests rate-limited          | abuse.test.ts           |
| AB-03     | Static GPS flags inactivity                        | abuse.test.ts           |
| OTP-01    | Expired OTP rejected                               | otp.test.ts             |
| OTP-02    | Lock after max wrong attempts                      | otp.test.ts             |
| OTP-03    | Resend invalidates old code                        | otp.test.ts             |
| PAY-06    | Capture retry after transient failure              | payment.test.ts         |
| PAY-07    | Refund after dispute / partial refund              | payment.test.ts         |
| PAY-08    | Tip split correctness                              | payment.test.ts         |
| TR-05     | Spoof / teleport detection                         | tracking.test.ts        |
| TR-06     | Route deviation alert                              | tracking.test.ts        |
| TR-07     | App killed -> resume tracking                      | tracking.test.ts        |
| CAN-01    | Cancel post-assignment voids auth / refunds        | cancellation.test.ts    |
| CAN-02    | Traveler repeated cancel -> penalty                | cancellation.test.ts    |
| CON-01/02 | Locked assignment: first confirmed wins            | concurrency.test.ts     |
| NTF-01..04| Quote/assignment/OTP SMS/push-fallback             | notifications.test.ts   |
| PERF-01..03| Load, chat scroll, OTP throughput                 | performance.test.ts     |
| SEC-01..02| Unauthorized access + role escalation              | security.test.ts        |
| E2E-01..03| Perfect / failure / fraud chaos flows              | e2e.test.ts             |

## CI

Add to GitHub Actions:

```yaml
- uses: oven-sh/setup-bun@v2
- run: bun install
  working-directory: expo
- run: bun test
  working-directory: expo
```
