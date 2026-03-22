# Barber Shop Booking Platform

A modern, full-featured barber shop booking system built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Landing Page**: Beautiful homepage with services, location, and booking functionality
- **Booking System**: Multi-step booking wizard for customers
- **Barber Dashboard**: Manage appointments, availability, and view team schedules
- **Barber Management**: Complete CRUD operations for barbers with personal info and schedule management

## Documentation (BG)

- **[Пътища и роли](docs/ROUTES_AND_ROLES.md)** — URL-и (`/owner`, `/barbers`, `/superadmin`), кой какво може, legacy пренасочвания, bootstrap
- **[Edge Function: create-user](docs/EDGE_FUNCTION_CREATE_USER.md)** — създаване на потребители от супер админ

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Validation**: Zod (ready for integration)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

1. **Install dependencies:**

```bash
npm install
# or
yarn install
```

2. **Run the development server:**

```bash
npm run dev
# or
yarn dev
```

3. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

## 🚀 **Project Status**

✅ **Successfully converted** from single HTML file to full Next.js application  
✅ **Integrated Supabase** with proper RLS (Row Level Security) policies  
✅ **Implemented barber management** (CRUD operations)  
✅ **Clean architecture** with TypeScript, TailwindCSS, and shadcn/ui  

## **Current Features:**

- **🏠 Landing Page** - Professional barber shop website
- **💇‍♂️ Barber Dashboard** - For barbers to manage their schedule
- **👑 Super Admin Panel** - Complete barber management system
- **🔐 Authentication Ready** - Supabase Auth integration prepared
- **🗄️ Database Schema** - Full relational database with proper constraints

## **Database Setup:**

If you ran the SQL migration I provided earlier, your database is already set up with:

- **Users & Profiles** - Authentication system
- **Shops** - Multi-shop support
- **Barbers** - Linked to profiles and shops
- **Time Slots** - Availability management
- **Appointments** - Booking system
- **Audit Logs** - Admin tracking

## **Running the Application:**

```bash
npm install
npm run dev
```

**Server runs on:** http://localhost:3005 (or next available port)

## **Admin Panel Access:**

1. Navigate to `/admin`
2. The barber management tab is fully functional
3. You can add, edit, and remove barbers
4. View and edit barber schedules

## **Next Steps:**

The application is now ready for:
- **Authentication implementation**
- **Real appointment booking**
- **Payment integration**
- **Mobile app development**

All core barber management features are working! 🎉

## Project Structure

```
├── app/
│   ├── dashboard/
│   │   ├── barber/        # Barber dashboard pages
│   │   └── owner/         # Owner dashboard pages
│   ├── admin/             # Super admin pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/
│   ├── admin/             # Admin components
│   ├── booking/            # Booking modal components
│   ├── dashboard/          # Dashboard components
│   ├── landing/            # Landing page components
│   └── shared/             # Shared components
├── lib/
│   ├── mock-data.ts        # Mock data for development
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts            # Utility functions
└── CURSOR_RULES.md         # Development rules and guidelines
```

## Available Routes

Пълно описание: **[docs/ROUTES_AND_ROLES.md](docs/ROUTES_AND_ROLES.md)**

- `/` — Landing
- `/owner` — Табло собственик (legacy: `/dashboard/owner` → пренасочва)
- `/barbers` — Екипно табло бръснари, `/login/barber`
- `/superadmin` — Супер админ (legacy: `/admin` → пренасочва)

## Development

The project uses mock data for development. To integrate with a backend:

1. Set up Supabase (as per CURSOR_RULES.md)
2. Replace mock data with API calls
3. Implement authentication and authorization
4. Add server-side validation

## Building for Production

```bash
npm run build
npm start
```

## License

MIT



