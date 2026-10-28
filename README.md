# Crowd-Sourced Travel Planner

## Citation
The bash commands and instructions for getting the projected started from the initial GitHub repo and files to ignore when committing to GitHub were generated with the help of Claude VSCode extension.  This transcript [[link here](https://docs.google.com/document/d/1kcTE1qxboMk_0MH4SVl7NGlqB1efHRfydPvJrMjyQSM/edit?tab=t.0)] documents the GenAI interaction that led to the primary README.md and .gitignore files.

## Prerequisites

- **Node.js 24** (npm comes with it)

Check which version of Node.js you have:

```bash
node -v
```

If it prints a version starting with `v24`, you're set. If it prints an older version, or you get "command not found", download and install the **Node.js 24** installer for your operating system from [nodejs.org](https://nodejs.org/en/download). Then open a new terminal and run `node -v` again to confirm.

## Getting started

Clone the repo:

   ```bash
   git clone https://github.com/SYee50/crowd-sourced-travel-planner.git
   cd crowd-sourced-travel-planner
   ```
   
## Frontend setup

1. Install the frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

## Frontend scripts

Run these from the `frontend/` folder:

| Command           | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Starts the local dev server with hot reload         |
| `npm run lint`    | Checks the code with ESLint                         |

## Backend and Database Setup

The backend is a Node.js Express server that connects to a PostgreSQL database, which can be hosted locally or on Supabase. Table definitions are in `database/schema.sql`.

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Fill in form. (Try to create/generate a password that only contains letters and numbers. Special characters in the password will need to be URL-encoded in the .env file. Save password for step 3)
4. Click **Create new project** and wait 1–2 minutes for setup.

### 2. Create the database tables

1. In your Supabase project, click **SQL Editor** in the left sidebar.
2. Open `database/schema.sql` from this repo, copy its entire contents, and paste it into the editor under the **New** tab.
3. Click **Run**. You should see: Success. No rows returned.
4. Click **Table Editor** in the left sidebar to confirm the tables were created: users, trips, experiences, ratings, trip_experiences, and password_reset_token.

### 3. Configure the backend

1. From the repo root, install the backend dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Create your local environment file from the template:

   ```bash
   cp .env.example .env
   ```

3. Get your connection string from Supabase:  
   a. Click the **Connect** button at the top of your project dashboard.  
   b. Click on the **Direct Connection string** tab. For **Connection Method** select **Session Pooler**. Scroll down and copy the **Connection String**. The connection string looks similar to this:

      ```
      postgresql://postgres.abcdefg:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
      ```

4. Open `backend/.env` in your editor and set `DATABASE_URL` to the connection string. Replace `[YOUR-PASSWORD]`, including the square brackets, with the password you saved in step 1. The .env file should look similar to this:

   ```
   DATABASE_URL=postgresql://postgres.abcdefg:myPassword@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   PORT=3000
   ```

### 4. Start the backend

From the `backend/` folder:

```bash
npm run dev
```

You should see:

```
Server running on http://localhost:3000
```

Leave this terminal running. The server restarts automatically when you save changes to backend code. To run the frontend at the same time, open a **second terminal** and run `npm run dev` from the `frontend/` folder.

### 5. Test the connection

With the backend running, open these URLs in your browser:

| URL                                     | What it checks                                    | What you should see                                               |
| --------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| http://localhost:3000/api/health        | The Express server is running                     | `{"status":"ok","message":"Crowd-Sourced Travel Planner API is running"}` |
| http://localhost:3000/api/db-test       | The server can connect to your Supabase database  | `{"status":"connected","database_time":"...","database_name":"postgres"}` |

### Backend scripts

Run these from the `backend/` folder:

| Command       | What it does                                              |
| ------------- | --------------------------------------------------------- |
| `npm run dev` | Starts the server and restarts it automatically on file changes |
| `npm start`   | Starts the server without auto-restart                    |

