
# Crowd-Sourced Travel Planner

## Getting started

1. Check your Node.js version:

   ```bash
   node -v
   ```

   If the version starts with v24, you're set. Otherwise, download and install Node.js 24 from [nodejs.org](https://nodejs.org/en/download).

2. Clone the repository:

   ```bash
   git clone https://github.com/SYee50/crowd-sourced-travel-planner.git
   cd crowd-sourced-travel-planner
   ```

## Database Setup

1. Sign up for a free account at [supabase.com](https://supabase.com/) and create a new project.
2. Open the SQL Editor, copy the contents of database/schema.sql into the editor, and click Run.
3. Verify that the tables were created in the Table Editor.

## Backend Setup

1. Install the backend dependencies and create your environment file:

   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

2. In Supabase, click Connect, select **Session Pooler** under **Connection Method**, and copy the **Connection String**.

   ```text
   postgresql://postgres.abcdefg:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```

3. Get a Geoapify API key by creating a free account at [geoapify.com](https://www.geoapify.com/).

4. Generate a secure JWT secret by running:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. Open backend/.env and fill in the environment variables. For DATABASE_URL, use your Supabase connection string and replace [YOUR-PASSWORD] with your database password.

6. Start the backend:

   ```bash
   npm run dev
   ```

## Frontend setup

1. Install the frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

## Test Backend Connection

- [http://localhost:3000/api/health](http://localhost:3000/api/health) - Checks that the backend server is running.
- [http://localhost:3000/api/db-test](http://localhost:3000/api/db-test) - Checks that the backend can connect to Supabase.
