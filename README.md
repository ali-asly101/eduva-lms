# PERN Stack Project

This project is a **PERN stack** (PostgreSQL, Express, React, Node.js) application.  
It comes with a simple **migration system** for managing your database schema over time.
Commit history is not available as it was pulled from a private repo with Google Client Secret in commit history.
---

## 📦 Clone and Install

Clone the repository and install dependencies:

```bash
git clone 
npm install
```

---

## ⚙️ Backend & Frontend Setup

Backend
Copy `.env.example` to `.env` and adjust values as needed:

```bash
cp '.env backend template' .env
```

Frontend
Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

### Example

```dotenv
# ==============================
# DATABASE CONFIGURATION (Neon Cloud)
# ==============================
DATABASE_URL=postgresql://neondb_owner:npg_nBPUHLXRs15f@ep-empty-shape-a10vyv4o-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eduvadb
DB_USER=postgres
DB_PASSWORD=password

# ==============================
# SERVER CONFIGURATION
# ==============================
NODE_ENV=development
PORT=4000
SESSION_SECRET=dev-secret-change-me
FRONTEND_URL=http://localhost:5173
```

---

## 🚀 Running the App

### Backend (API)

```bash
npm run dev
```

Starts the Express server with `nodemon` (auto-restarts on file changes).

### Frontend

```bash
cd frontend
npm run dev
```

Starts the React frontend with Vite.

---

## 🔑 Login Accounts

You can use these sample accounts from the seeded EDUVA database:

```bash
Role          Email                   Password
Admin	        admin@eduva.com         Admin123
Instructor	  johndoe@eduva.com       12345678@
Instructor	  janedoe@eduva.com       12345678@
Student	      jonathan@eduva.com      !2345678
Student	      lowjiahao@eduva.com     12345678@
Student	      garv@eduva.com          12345678@
Student	      aly@eduva.com           12345678@
Student	      amanda@eduva.com        12345678@
Student	      shuyu@eduva.com         12345678@
```

---


## 🛠 Database Migrations

The project automatically connects to the **Neon Cloud PostgreSQL database** after setting up the .env file.  
It supports running, rolling back, and checking the status of SQL migrations.

