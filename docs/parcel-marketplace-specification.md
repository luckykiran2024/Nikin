# Parcel-Travel Partner Marketplace

## System Overview

A fully connected 3-application ecosystem for intercity parcel delivery using verified travelers.

### Applications

1. **Sender/Requester Mobile App**
2. **Travel Partner Mobile App**
3. **Admin Web + Mobile Dashboard**

All three applications are interconnected through a common backend, database, authentication, and notification system.

---

## Platform Architecture

### Core Components

- Shared backend (Node.js/Express)
- Central PostgreSQL database
- Role-based authentication (Sender, Travel Partner, Admin)
- Real-time notifications (Firebase)
- GPS tracking integration
- Secure payment gateway
- Chat + AI chatbot + Admin escalation
- Image upload support
- KYC verification system

---

## User Roles

### Sender
- Create shipments/parcel requests
- Accept traveler quotes
- Make payments
- Track shipment status
- Chat with Travel Partner and Admin

### Travel Partner (Traveler)
- Complete mandatory KYC verification
- Create travel routes
- Submit delivery quotations
- Update delivery status
- Upload parcel images
- Receive payouts (80% of quote amount)

### Receiver
- Confirm delivery via OTP
- Rate traveler

### Admin
- Approve or reject KYC
- Manage users and disputes
- Control payouts and commissions (20% platform fee)
- Full system oversight

---

## Sender / Requester App Features

### Registration & Login
- Username
- Phone Number (OTP verification)
- Basic demographics: Name, Gender, Address, Email

### Create Parcel Request
- Auto-generate unique ParcelRequestID (alphanumeric)
- Parcel details:
  - Size
  - Weight
  - Pickup location
  - Drop location
  - Delivery date/time
  - Special instructions

### Quotation Management
- View received quotations from travel partners
- Accept or reject quotes

### Tracking & Status
- Live GPS tracking of parcel
- Parcel status states:
  - Requested
  - Quote received
  - Quote accepted
  - In transit
  - Delivered
  - Payment completed

### Payment
- Payment activated only after receiver confirms delivery
- Payment options: UPI, Credit Card, Debit Card, Cash on Delivery
- Payment history and invoices

### Communication
- Chat with Travel Partner
- Chat with Admin (via AI or escalation)
- AI Chatbot for FAQs and guidance

---

## Travel Partner App Features

### Registration & Profile
- Personal details
- Vehicle details
- Route preference

### KYC Upload (Mandatory)
- ID proof
- Address proof
- Vehicle documents
- Status: Pending / Approved / Rejected
- Must be approved before receiving requests

### Parcel Requests
- Receive requests based on route and location
- Submit quotations:
  - Price
  - Estimated delivery time

### Delivery Process
- Upload parcel image at pickup
- Live GPS tracking during transit
- Update delivery status

### Communication
- Chat with sender
- Chat with Admin
- AI Chatbot for support

### Earnings
- Receive 80% of accepted quotation
- 20% platform commission deducted

---

## Admin Dashboard Features

### Dashboard Overview
- Total users
- Active parcels
- Revenue analytics
- Disputes count
- KYC status summary

### KYC Verification
- Review submitted documents
- Accept / Reject travel partner applications
- View uploaded images and documents

### User Management
- View all users (Senders, Travel Partners)
- Edit or block users
- Full access to user details

### Order Management
- View all parcel requests
- Monitor active deliveries
- Access parcel images uploaded by Travel Partners

### Transaction Management
- Payment status monitoring
- Refund processing
- Escrow handling
- 20% commission tracking

### Chat Control
- Receive escalated AI chatbot queries
- Manual intervention capability
- Direct communication with users

### Reports
- Order history
- Payment history
- Performance analytics

---

## Database Schema

### User
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Full name |
| phone | String | Phone number |
| email | String | Email address |
| roles | Array | User roles |
| kyc_status | Enum | Pending/Approved/Rejected |
| rating | Decimal | Average rating |
| gender | String | Gender |
| address | Text | Full address |

### Shipment
| Field | Type | Description |
|-------|------|-------------|
| id | String | ParcelRequestID (alphanumeric) |
| sender_id | UUID | Foreign key to User |
| receiver_id | UUID | Foreign key to User |
| pickup_city | String | Pickup location |
| destination_city | String | Drop location |
| parcel_details | JSON | Size, weight, instructions |
| status | Enum | Current status |
| assigned_traveler_id | UUID | Foreign key to User |
| pickup_image | String | Image URL |
| delivery_date | DateTime | Expected delivery |

### TravelRoute
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| traveler_id | UUID | Foreign key to User |
| from_city | String | Origin city |
| to_city | String | Destination city |
| travel_date | DateTime | Travel date |

### Quote
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| shipment_id | String | Foreign key to Shipment |
| traveler_id | UUID | Foreign key to User |
| amount | Decimal | Quoted price |
| estimated_delivery | String | Delivery time estimate |
| status | Enum | Pending/Accepted/Rejected |

### Payment
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| shipment_id | String | Foreign key to Shipment |
| total_amount | Decimal | Total payment |
| platform_fee | Decimal | 20% commission |
| traveler_amount | Decimal | 80% to traveler |
| status | Enum | Payment status |
| method | Enum | UPI/Card/COD |

### KYC
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to User |
| document_urls | Array | Uploaded documents |
| status | Enum | Pending/Approved/Rejected |
| rejection_reason | Text | If rejected |

### Review
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| shipment_id | String | Foreign key to Shipment |
| reviewer_id | UUID | Foreign key to User |
| reviewee_id | UUID | Foreign key to User |
| rating | Integer | 1-5 stars |
| comment | Text | Review text |

---

## Workflows

### Sender Flow

1. Install App
2. Register → Login
3. Fill basic profile
4. Create Parcel Request → System generates ParcelRequestID
5. Request goes to all eligible Travel Partners
6. Receive multiple quotations
7. Select a Travel Partner
8. Chat opens automatically
9. Parcel pickup → GPS tracking starts
10. Travel Partner uploads parcel photo
11. Receiver confirms delivery (OTP)
12. Payment gateway activates
13. Payment completed
14. Order moved to history

### Travel Partner Flow

1. Install App
2. Register
3. Upload KYC documents
4. Wait for Admin approval
5. Once approved:
   - Start receiving parcel requests
   - Submit quotations
6. If accepted:
   - Pickup parcel
   - Upload parcel image
   - Start GPS tracking
   - Deliver parcel
7. Receiver confirms delivery (OTP)
8. Payment released (80%)
9. Earnings updated

### Admin Flow

1. Login to Admin Dashboard
2. Approve / Reject Travel Partner KYC
3. Monitor:
   - Parcel requests
   - Active deliveries
   - Payments
4. Handle escalated chat queries
5. Review transaction history
6. Resolve disputes
7. Generate reports

### AI Chatbot Workflow

```
User → AI Bot
    ↓
If resolved → End
    ↓
If not → Escalate → Admin Chat Panel
    ↓
Admin replies → User receives response
```

### Payment Workflow

```
Sender creates parcel → No payment yet
    ↓
Delivery confirmed (OTP) → Payment gateway activated
    ↓
Payment success →
    ↓
Commission split (80/20) →
    ↓
Partner wallet updated + Admin ledger updated
```

---

## API Structure

### Authentication APIs
- POST `/auth/register` - User registration
- POST `/auth/login` - User login
- POST `/auth/verify-otp` - OTP verification
- POST `/auth/logout` - User logout

### KYC APIs
- POST `/kyc/submit` - Submit KYC documents
- GET `/kyc/status` - Check KYC status
- PUT `/admin/kyc/:id/approve` - Admin approve
- PUT `/admin/kyc/:id/reject` - Admin reject

### Shipment APIs
- POST `/shipments` - Create parcel request
- GET `/shipments` - List shipments
- GET `/shipments/:id` - Get shipment details
- PUT `/shipments/:id/status` - Update status
- POST `/shipments/:id/image` - Upload parcel image

### Travel Route APIs
- POST `/routes` - Create travel route
- GET `/routes` - List routes
- GET `/routes/matching` - Get matching shipments

### Quote APIs
- POST `/quotes` - Submit quotation
- GET `/shipments/:id/quotes` - List quotes for shipment
- PUT `/quotes/:id/accept` - Accept quote
- PUT `/quotes/:id/reject` - Reject quote

### Payment APIs
- POST `/payments/initiate` - Initiate payment
- POST `/payments/verify` - Verify payment
- GET `/payments/history` - Payment history

### OTP APIs
- POST `/otp/generate-pickup` - Generate pickup OTP
- POST `/otp/verify-pickup` - Verify pickup OTP
- POST `/otp/generate-delivery` - Generate delivery OTP
- POST `/otp/verify-delivery` - Verify delivery OTP

### Chat APIs
- GET `/chats` - List conversations
- GET `/chats/:id/messages` - Get messages
- POST `/chats/:id/messages` - Send message
- POST `/chats/escalate` - Escalate to admin

### Admin APIs
- GET `/admin/dashboard` - Dashboard stats
- GET `/admin/users` - List all users
- GET `/admin/shipments` - List all shipments
- GET `/admin/payments` - List all payments
- PUT `/admin/users/:id/block` - Block user

---

## Security Requirements

- JWT-based authentication
- Role-based access control (RBAC)
- Encrypted data storage
- Secure payment processing
- Input validation
- Rate limiting
- Audit logs for admin actions

---

## Payment Gateway Integration

### Supported Methods
- UPI
- Credit Card
- Debit Card
- Cash on Delivery

### Commission Structure
- **Platform Fee:** 20% of quotation amount
- **Travel Partner:** 80% of quotation amount

---

## Data Flow

```
Sender App ↔ Backend ↔ Travel Partner App
Sender App ↔ Backend ↔ Admin App
Travel Partner App ↔ Backend ↔ Admin App
```

All data flows through a single backend system ensuring consistency and real-time synchronization.

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React Native / Expo |
| Backend | Node.js with Express |
| Database | PostgreSQL |
| Cache | Redis |
| Authentication | JWT |
| Maps | Google Maps API |
| Payments | Stripe / Razorpay |
| Notifications | Firebase |
| File Storage | Cloud Storage (S3) |

---

## Feature Checklist

### Sender App
- [x] User registration & login
- [x] Profile management
- [x] Create parcel request
- [x] View quotations
- [x] Accept/reject quotes
- [x] GPS tracking
- [x] Payment processing
- [x] Chat with Travel Partner
- [x] AI Chatbot support
- [x] Order history

### Travel Partner App
- [x] Registration & login
- [x] KYC document upload
- [x] Profile with vehicle details
- [x] View matching requests
- [x] Submit quotations
- [x] Upload parcel images
- [x] GPS tracking
- [x] Chat functionality
- [x] Earnings dashboard

### Admin Dashboard
- [x] Dashboard analytics
- [x] KYC verification workflow
- [x] User management
- [x] Order management
- [x] Payment monitoring
- [x] Chat escalation handling
- [x] Reports generation
- [x] Dispute resolution
