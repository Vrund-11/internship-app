# Data Sources

This file tracks what the current `apps/user-app` reads from the real backend/database and what still comes from static or mock files.

## Real Data From Backend / Database

- Auth session
  - `POST /auth/send-otp`
  - `POST /auth/verify-otp`
  - `POST /auth/refresh`
  - `GET /auth/me`
- Cities
  - `GET /cities`
- Pets
  - `GET /booking/pets`
  - `POST /booking/pets`
- Addresses
  - `GET /booking/addresses`
  - `POST /booking/addresses`
- Booking slots
  - `GET /booking/slots`
- Booking creation
  - `POST /booking`
- Booking history
  - `GET /booking/history`
- Booking detail
  - `GET /booking/:id`
- Partner list / availability checks
  - `GET /partners`
- Reviews
  - `POST /review`
- Complaints
  - `POST /complaint`

## Static Or Mock Data Still In The User App

- Service catalog and prices
  - `apps/user-app/src/features/home/data/services.ts`
- Doctor cards shown on home
  - `apps/user-app/src/features/home/data/doctors.ts`
- Clinic cards and clinic picker data
  - `apps/user-app/src/features/booking/data/clinics.ts`
- Serviceable states/cities UI list
  - `apps/user-app/src/features/booking/data/locations.ts`
- Pet breed options
  - `apps/user-app/src/features/booking/data/mock-data.ts`
- Follow-up reminder derivation logic
  - `apps/user-app/src/features/bookings/lib/followUps.ts`
  - This is computed locally from real bookings, not stored in DB.

## Mixed

- Bookings page
  - Core booking records come from the backend.
  - Follow-up reminder cards are derived client-side from real booking history.
- Profile page
  - Pets and addresses come from the backend.
  - The displayed user name is still generic because the auth user model only stores phone today.
- Booking flow
  - Pets, addresses, available slots, and booking creation are real.
  - Clinic selection list and service variant catalog are still static UI data.

## Verified Live On 2026-05-12

The following were tested successfully against the configured backend and live database:

- city fetch
- OTP auth
- pet insert
- address insert
- booking insert
- booking history fetch
- booking detail fetch

## Schema Fix Applied

The live database was missing fields required by the current Prisma schema.
This migration was added and applied:

- `prisma/migrations/20260512190000_add_pet_and_address_profile_fields/migration.sql`

It adds:

- `Pet.type`
- `Pet.breed`
- `Pet.age`
- `Pet.weight`
- `Address.label`
- `Address.house`
- `Address.area`
- `Address.city`
- `Address.state`
- `Address.pincode`
