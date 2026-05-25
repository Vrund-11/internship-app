# 🐾 Canovet - Pet-Care Platform

Welcome to **Canovet**, a modern pet-care booking platform built using a monorepo architecture. This project consists of a Next.js user-facing mobile/web application, an Express.js backend API with Prisma ORM, and a partner simulator app for service providers.

---

## 🚀 Getting Started

Follow these step-by-step instructions to download, extract, set up, and run the Canovet platform on your local machine.

### 📥 1. Download & Extract the Code

If you received this project as a ZIP archive:
1. **Download the ZIP file** to a directory of your choice on your computer.
2. **Extract the ZIP file**:
   - **Windows**: Right-click the ZIP file and select **Extract All...**, then choose the destination folder.
   - **macOS/Linux**: Double-click the ZIP file or run `unzip canovet.zip` in your terminal.
3. Open your terminal or code editor (e.g., **VS Code**) in the extracted root directory (`canovet`).

---

### 📋 2. Prerequisites

Ensure you have the following installed on your machine:
*   **Node.js** (LTS version, v18+ recommended) — [Download Node.js](https://nodejs.org/)
*   **npm** (comes bundled with Node.js)
*   **PostgreSQL Database** — [Download PostgreSQL](https://www.postgresql.org/) (or use a hosted database from [Neon.tech](https://neon.tech/) or [Supabase](https://supabase.com/))

---

### ⚙️ 3. Environment Setup

The application reads configuration from environment variables. You need to create two environment files.

#### A. Root Environment File
Create a new file named `.env` in the root folder of the project (`canovet/.env`) and add the following variables (replacing the values with your local Database and payment credentials):

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"

# JSON Web Token Secret (can be any long random string)
JWT_SECRET="your-jwt-secret-key-change-this-in-production"

# Razorpay credentials (for payment integration)
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"

# Backend Server Port (defaults to 5000)
PORT=5000
```

#### B. User App Environment File
Create a new file named `.env.local` inside the user app directory (`canovet/apps/user-app/.env.local`):

```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

---

### 📦 4. Installation & Database Setup

From the root directory of the project, execute the following commands in your terminal:

1. **Install dependencies** for all workspaces (root, frontend, backend, packages):
   ```bash
   npm install
   ```

2. **Generate the Prisma client**:
   ```bash
   npx prisma generate
   ```

3. **Run database migrations** to create tables in your PostgreSQL database:
   ```bash
   npx prisma migrate dev
   ```

4. **Seed test/mock data** (creates cities, test promo codes, and mock service partners):
   ```bash
   # Seed partners (run from root)
   npx ts-node backend/src/scripts/seed-partners.ts

   # Seed promo codes (run from root)
   npx ts-node backend/src/scripts/seed-promo.ts
   ```

---

### 🏃‍♂️ 5. Running the Application

You can run individual parts of the platform or start the main apps concurrently.

#### Start Both Main Apps Concurrently (Recommended)
Runs both the Next.js **User App** and the Express **Backend** at the same time:
```bash
npm run dev
```

#### Start Services Individually
*   **Backend Server only** (runs on [http://localhost:5000](http://localhost:5000)):
    ```bash
    npm run dev:backend
    ```
*   **User Web App only** (runs on [http://localhost:3000](http://localhost:3000)):
    ```bash
    npm run dev:user
    ```
*   **Partner Simulator only** (runs on [http://localhost:3002](http://localhost:3002)):
    ```bash
    npm run dev -w apps/partner-sim
    ```

---

## 🎮 How to Interact with the App

Once all services are running:

1. **Access the User App**: Open your browser and navigate to `http://localhost:3000`.
   - Start by registering or logging in.
   - Set your city (Ahmedabad is seeded by default).
   - Explore and book services (Grooming, Vet on Call, Vet Clinic).
2. **Access the Partner Simulator**: Open `http://localhost:3002` to see incoming bookings and accept/reject/simulate requests as a partner.
3. **Backend API**: The backend is running at `http://localhost:5000` with endpoints like `/auth`, `/booking`, `/payment`, `/promo`, etc.

---

## 📁 Repository Structure

```tree
canovet/
├── apps/
│   ├── user-app/       # Next.js user frontend application
│   └── partner-sim/    # Next.js partner simulation/demo dashboard
├── backend/            # Express.js REST API server
├── packages/           # Shared TypeScript packages & utilities
├── prisma/             # Prisma schema, migrations, and config
├── .env                # Root environment configuration (credentials)
├── package.json        # Workspace definition & global scripts
└── README.md           # This instructions manual
```

---

## 🛠️ Common Commands Reference

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts user app + backend concurrently |
| `npm run dev:user` | Starts user frontend only |
| `npm run dev:backend` | Starts Express backend only |
| `npm run dev -w apps/partner-sim` | Starts partner simulator only |
| `npx prisma generate` | Generates Prisma client |
| `npx prisma migrate dev` | Applies new migrations to DB |
| `npx prisma studio` | Opens Prisma's database GUI tool |
