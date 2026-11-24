# Project documentation notes

## Title
Smart Office Seat & Co-working Space Allocation System

## Problem statement
In shared offices and co-working spaces, people may not know which seats are free. Manual seat allocation can cause confusion and duplicate reservations. This project provides a central website to view work zones, check seat availability and reserve seats for a selected time period.

## Objectives
1. Display available seats in different office zones.
2. Allow a user to reserve a seat for a selected time.
3. Prevent overlapping reservations for the same seat.
4. Store users, seats, zones and bookings in a relational database.
5. Allow users to view and cancel their reservations.

## Modules
- Dashboard module
- Work-zone module
- Seat availability module
- Booking module
- Booking history and cancellation module
- Database/report module

## Suggested ER diagram relationships
USERS (1) -------- (M) BOOKINGS (M) -------- (1) SEATS (M) -------- (1) ZONES

## Suggested future scope
- Login with verified accounts
- Admin panel to add/remove seats and zones
- QR-code check-in
- Email booking confirmation
- Live availability updates
- Role-based access for employees and administrators

## Limitations of this student version
- Demo mode uses browser local storage.
- Supabase mode uses simple public demo policies; it is not production-grade authentication.
- There is no separate administrator interface in this version.
