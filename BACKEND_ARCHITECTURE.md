# Volga Services - Backend Architecture

## Overview

This application uses a **fully self-contained backend** powered by **Supabase Edge Functions**. The backend is completely independent of Netlify or any other hosting platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React SPA)                        │
│                   Lovable Preview / Any Host                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase Backend                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 Edge Functions (Deno)                    │   │
│  │  • admin-login      - Admin authentication               │   │
│  │  • admin-bookings   - Booking management (CRUD)          │   │
│  │  • user-bookings    - User booking operations            │   │
│  │  • driver-login     - Driver authentication              │   │
│  │  • guide-login      - Guide authentication               │   │
│  │  • manage-drivers   - Driver CRUD                        │   │
│  │  • manage-guides    - Guide CRUD                         │   │
│  │  • send-booking-email - Email notifications              │   │
│  │  • get-mapbox-token - Mapbox API proxy                   │   │
│  │  • ai-tourist-guide - AI chat functionality              │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   PostgreSQL Database                    │   │
│  │  • Tables: bookings, profiles, drivers, guides, etc.     │   │
│  │  • Views: v_admin_bookings, v_payment_audit, etc.        │   │
│  │  • RLS Policies: Row-level security enforced             │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Authentication                         │   │
│  │  • Supabase Auth (phone, email, password)                │   │
│  │  • Role-based access (admin, driver, guide, user)        │   │
│  │  • JWT tokens with in-code validation                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Storage                                │   │
│  │  • payment-receipts bucket                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

All API endpoints are Supabase Edge Functions accessible at:
```
https://tujborgbqzmcwolntvas.supabase.co/functions/v1/{function-name}
```

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin-login` | POST | Admin authentication with rate limiting |
| `/driver-login` | POST | Driver authentication |
| `/guide-login` | POST | Guide authentication |

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin-bookings` | GET | List all bookings with filters |
| `/admin-bookings/{id}` | GET | Get single booking |
| `/admin-bookings/{id}` | PUT | Update booking |
| `/admin-bookings/{id}` | DELETE | Delete booking |
| `/admin-bookings/{id}/set-price` | POST | Set/lock booking price |
| `/admin-bookings/{id}/unlock-price` | POST | Unlock locked price |
| `/admin-bookings/{id}/confirm` | POST | Confirm booking |
| `/admin-bookings/{id}/reject` | POST | Reject booking |
| `/admin-bookings/{id}/payment` | POST | Update payment status |

### User Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/user-bookings` | GET | Get user's bookings |
| `/user-bookings` | POST | Create new booking |

### Driver/Guide Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/manage-drivers` | GET/POST/PUT/DELETE | Driver CRUD |
| `/manage-guides` | GET/POST/PUT/DELETE | Guide CRUD |

## Environment Variables

The backend requires these secrets (configured in Supabase):

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password |
| `RESEND_API_KEY` | Email service API key |
| `MAPBOX_PUBLIC_TOKEN` | Mapbox API token |
| `LOVABLE_API_KEY` | AI features API key |

## Running the Application

### Lovable Preview (Recommended)

The application runs automatically in Lovable's preview environment:
- **Preview URL**: `https://id-preview--b238bb7e-b514-4246-a3e4-443a438dd85c.lovable.app`
- All Edge Functions are auto-deployed
- Database and auth are fully functional

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file:
   ```env
   VITE_SUPABASE_URL=https://tujborgbqzmcwolntvas.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

The frontend will connect to the Supabase backend automatically.

## Frontend Routing

All routes are handled client-side by React Router:

### Public Routes
- `/` - Home page
- `/services` - Services listing
- `/gallery` - Photo gallery
- `/about` - About us
- `/contact` - Contact form
- `/auth` - User authentication
- `/privacy-policy` - Privacy policy
- `/terms-of-service` - Terms of service

### User Routes (Protected)
- `/user-dashboard` - User dashboard
- `/profile-settings` - Profile settings
- `/booking` - Booking form
- `/payment` - Payment page
- `/payments-history` - Payment history

### Admin Routes (Admin Role Required)
- `/admin-login` - Admin login
- `/admin` - Admin panel
- `/admin/dashboard` - Admin dashboard
- `/admin/bookings` - Bookings management

### Driver Routes (Driver Role Required)
- `/driver-login` - Driver login
- `/driver-dashboard` - Driver dashboard

### Guide Routes (Guide Role Required)
- `/guide-login` - Guide login
- `/guide-dashboard` - Guide dashboard

## Security

### Authentication Flow
1. User submits credentials to Edge Function
2. Edge Function validates against Supabase Auth
3. JWT token returned to client
4. Client includes token in subsequent requests
5. Edge Functions validate JWT in-code (not via gateway)

### Role-Based Access Control
- All admin functions check for `admin` role
- Driver functions check for `driver` role
- Guide functions check for `guide` role
- User functions check for authenticated user

### Rate Limiting
- Admin login: 5 attempts per 15 minutes
- IP-based and email-based tracking
- Automatic lockout on exceeded attempts

## Netlify vs Lovable

| Feature | Netlify | Lovable Preview |
|---------|---------|-----------------|
| Purpose | Production hosting | Development/Preview |
| Backend | Same Supabase | Same Supabase |
| Edge Functions | Same | Same |
| Database | Same | Same |
| Custom Domain | Yes | No |
| HTTPS Redirects | Configured | N/A |
| SPA Routing | `_redirects` file | Built-in |

**The backend is identical regardless of where the frontend is hosted.**
