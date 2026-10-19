# Crowd-Sourced Travel Planner

## Citation
The bash commands for getting the projected started from the initial GitHub repo and files to ignore when committing to GitHub were generated with the help of Claude VSCode extension.  This transcript [[insert link here](https://docs.google.com/document/d/1kcTE1qxboMk_0MH4SVl7NGlqB1efHRfydPvJrMjyQSM/edit?tab=t.0)] documents the GenAI interaction that led to the primary README.md and .gitignore files"

## Prerequisites

- **Node.js 24** (npm comes with it)

Check which version of Node.js you have:

```bash
node -v
```

If it prints a version starting with `v24`, you're set. If it prints an older version, or you get "command not found", download and install the **Node.js 24** installer for your operating system from [nodejs.org](https://nodejs.org/en/download). Then open a new terminal and run `node -v` again to confirm.

## Getting started

1. Clone the repo:

   ```bash
   git clone https://github.com/SYee50/crowd-sourced-travel-planner.git
   cd crowd-sourced-travel-planner
   ```

2. Install the frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

## Frontend scripts

Run these from the `frontend/` folder:

| Command           | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Starts the local dev server with hot reload         |
| `npm run lint`    | Checks the code with ESLint                         |
