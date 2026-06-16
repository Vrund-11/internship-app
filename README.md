# 🐾 Canovet - Pet-Care Platform

Welcome to **Canovet**, a modern pet-care booking platform built using a monorepo architecture. This project consists of a Next.js user web app, an Expo React Native mobile app, an Express.js backend API with Prisma ORM, and shared library packages.

---

## 📁 Repository Structure

The project is structured as an npm workspaces monorepo:

```tree
canovet/
├── apps/
│   ├── user-app/       # Next.js user-facing web application (Next.js 15, React 19)
│   └── mobile/         # Expo / React Native mobile application (Expo 54, React Native 0.81)
├── backend/            # Express.js REST API server (TypeScript)
├── packages/
│   ├── shared/         # Common TypeScript interfaces, Zod validation schemas, and constants
│   └── core/           # Core API client adapters and shared hooks/utilities
├── prisma/             # Prisma schema definition, migrations, and global configuration
├── .env.example        # Reference environment variables for the root backend
├── package.json        # Workspace configuration and global scripts
└── README.md           # This setup and instruction guide
```

---

## ⚙️ Prerequisites

Ensure you have the following installed on your local machine:
* **Node.js** (v18.0.0 or higher, LTS recommended) — [Download Node.js](https://nodejs.org/)
* **npm** (comes bundled with Node.js)
* **PostgreSQL Database** — [Download PostgreSQL](https://www.postgresql.org/) (or use a hosted instance from [Neon.tech](https://neon.tech/) or [Supabase](https://supabase.com/))
* **Redis Server** (Optional, fallback to in-memory caching is supported, but recommended for production and session features) — [Redis Setup](https://redis.io/download/)

---

## 🚀 Step-by-Step Setup Guide

### 1. Clone & Install Dependencies
First, clone the repository or extract the ZIP archive, and navigate to the project root:
```bash
cd canovet
npm install
```
*Note: Running `npm install` at the root automatically installs dependencies for all workspaces and symlinks the shared library packages.*

---

### 2. Environment Variables Configuration
The platform requires a few environment files to run. We have provided template files to make configuration simple:

#### A. Root / Backend Environment File
Create a `.env` file in the root folder (`canovet/.env`):
```bash
cp .env.example .env
```
Open `.env` and fill in your PostgreSQL connection string, JWT secret, and optional payment credentials:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"
JWT_SECRET="your-jwt-secret-key-change-this-in-production"
PORT=5000
REDIS_URL="redis://localhost:6379"
```

#### B. User Web App Environment File
Create a `.env.local` file inside the user web application directory (`apps/user-app/`):
```bash
cp apps/user-app/.env.local.example apps/user-app/.env.local
```
Fill in the backend API URL:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

#### C. Mobile App Environment File
Create a `.env` file inside the mobile application directory (`apps/mobile/`):
```bash
cp apps/mobile/.env.example apps/mobile/.env
```
Set the API URL for Expo:
```env
# If using a physical device, replace localhost with your local machine's IP (e.g., http://192.168.1.100:5000)
EXPO_PUBLIC_API_URL="http://localhost:5000"
```

---

### 3. Database Migration and Seeding
Initialize your database, run migrations, and seed mock/testing data using the following root commands:

1. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```
2. **Apply Migrations to PostgreSQL:**
   ```bash
   npm run db:migrate
   ```
3. **Seed Database:**
   Seeds the database with a default city (Ahmedabad), service areas, mock partners (groomers, vets, clinics), test users, promo codes, waitlists, and historical bookings.
   ```bash
   npm run db:seed
   ```

---

## 🏃‍♂️ Running the Applications

### Start the Core Services (Web App + Backend API)
Run the following command in the root folder to start both the Express backend API and Next.js web application concurrently:
```bash
npm run dev
```
* The **User Web App** will run at [http://localhost:3000](http://localhost:3000)
* The **Backend API** will run at [http://localhost:5000](http://localhost:5000)

### Start the Mobile Application (Expo Router)
Start the Expo Metro Bundler for React Native:
```bash
npm run dev:mobile
```
* Press `w` to run the mobile app on the web browser.
* Press `a` to run on an Android emulator.
* Press `i` to run on an iOS simulator.
* To run on a **physical device**, install the **Expo Go** app from your app store, ensure your mobile device and computer are on the same Wi-Fi network, update `EXPO_PUBLIC_API_URL` to your computer's local IP address, and scan the QR code printed in the terminal.

---

## 🛠️ Common Monorepo Commands Reference

These commands are run from the project root:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the user web app and backend API concurrently |
| `npm run dev:mobile` | Starts the Expo mobile application Metro bundler |
| `npm run dev:user` | Starts the user web app only |
| `npm run dev:backend` | Starts the backend Express server only |
| `npm run db:generate` | Generates the Prisma client library |
| `npm run db:migrate` | Applies new migrations to the PostgreSQL database |
| `npm run db:seed` | Runs the database seeding script |
| `npx prisma studio` | Opens the Prisma database viewer GUI |

---

## 🧪 Test Credentials

Once seeded, you can log in to the apps using these pre-configured user credentials:

* **Email:** `user1@example.com`
* **Password:** `CanovetPass123!`

---

## 📦 Shared Packages
* **`@canovet/shared`**: Houses shared interfaces, TypeScript types, and validation schemas (e.g. Zod validators). This ensures absolute type safety between the client applications and the backend API.
* **`@canovet/core`**: Implements global HTTP client adapters, API call structures, constants, and custom hooks/context helpers used by both React applications.
