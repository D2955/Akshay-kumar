# SeatWise — Smart Office Seat & Co-working Space Allocation System

A second-year B.Tech CSE / DBMS mini project. It has a responsive web interface, seat availability, zone filters, booking and cancellation, and a PostgreSQL database option.

## 1. Run it without Terminal (demo mode)

1. Download and extract this ZIP.
2. Open the extracted folder in **Visual Studio Code**.
3. Open the Extensions icon on the left and install **Live Server** (by Ritwick Dey), if it is not already installed.
4. In VS Code, right-click `index.html` → **Open with Live Server**.
5. Your browser opens the website. Demo mode works without a database setup. You can book seats, see bookings and cancel them. Demo bookings are saved in your browser's local storage.

You do not need to type commands in Terminal.

## 2. Connect a real DBMS database (Supabase PostgreSQL)

This is optional for the first demo, but recommended for your DBMS submission.

1. Open https://supabase.com and create a free project.
2. Open **SQL Editor** → **New query**.
3. Open `database.sql` from this project, copy all its contents, paste into SQL Editor and click **Run**.
4. In Supabase, open **Project Settings → API** (or the API keys page).
5. Copy the **Project URL** and the **anon/public key**.
6. Open `app.js` in VS Code. At the top, paste those values:
   - `SUPABASE_URL = "your project URL"`
   - `SUPABASE_ANON_KEY = "your anon/public key"`
7. Save the file and refresh the Live Server browser tab.

When connected, the app reads seats/zones from PostgreSQL and saves bookings in the database. Do not use a `service_role` or secret key in frontend code. The open policies in this student demo are for classroom demonstration only, not for a real public office system.

## 3. Project features

- Dashboard with total seats, available seats, bookings and zones
- Three work zones: Open Workspace, Quiet Zone and Collaboration Hub
- Seat list with zone, seat type and search filters
- Booking form with name, email, date/time and purpose
- Prevents overlapping bookings for the same seat
- My Bookings page with reservation details and cancellation
- Responsive layout for laptop and mobile
- Demo mode using browser local storage, plus PostgreSQL mode using Supabase

## 4. Database design (DBMS concepts)

| Table | Purpose | Important columns |
|---|---|---|
| users | Stores users | id (PK), full_name, email (unique) |
| zones | Stores office zones | id (PK), name (unique) |
| seats | Stores individual seats | id (PK), seat_number (unique), zone_id (FK) |
| bookings | Stores reservations | id (PK), seat_id (FK), user_id (FK), start_time, end_time, status |

Relationships:
- One zone has many seats (zones 1 — many seats).
- One seat can have many bookings over time (seats 1 — many bookings).
- One user can create many bookings (users 1 — many bookings).

DBMS concepts shown:
- Primary keys and foreign keys
- UNIQUE and CHECK constraints
- One-to-many relationships
- SQL JOIN through `booking_report` view
- Indexes for zone and booking lookups
- Transaction-safe PL/pgSQL booking function
- CRUD operations (create booking, read bookings, update status/cancel)

## 5. What to demonstrate to your teacher

1. Open Overview and explain the dashboard cards.
2. Open Seat allocation and filter by Quiet Zone.
3. Click an available seat and create a booking.
4. Open My bookings and show the reservation.
5. Try booking the same seat for an overlapping time (database mode) to show conflict prevention.
6. Cancel a booking.
7. In Supabase Table Editor, show `users`, `zones`, `seats`, and `bookings`.
8. In SQL Editor, run: `select * from public.booking_report;`

## 6. Short project explanation

" Our project is Smart Office Seat and Co-working Space Allocation System. It helps employees or students find and reserve available seats in different office zones. The system has four main database tables: users, zones, seats and bookings. We used primary keys, foreign keys, constraints and indexes to maintain organised data. When a user books a seat, the system checks whether another confirmed booking overlaps with the selected time. This avoids double booking. The website provides a dashboard, seat filters, booking history and cancellation. The frontend is made with HTML, CSS and JavaScript, and PostgreSQL is used as the DBMS through Supabase."

## 7. Important note

Demo mode stores data only in the browser where you opened the website. Supabase mode stores shared data in PostgreSQL. The included public demo policies are intentionally simple for a college demonstration; a production system must use proper user authentication and restrictive row-level security.
