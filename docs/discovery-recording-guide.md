# Experience Search & Discovery — 2–3 Minute Recording

This walkthrough shows **only the Experience Search & Discovery feature** with real database records. No sample fixture is substituted.

## 1. Set up your Mac

You need Node.js 24, Git, and the existing working Supabase database connection.

If you already have a local working copy of the original team project with `backend/.env`, **preserve that file**. Never put the `.env` file or database passwords into GitHub, chat, or the recording.

In a VS Code terminal:

```bash
cd ~
git clone https://github.com/jm-hudson/crowd-sourced-travel-planner.git cs467-recording
cd cs467-recording
git switch feature/discovery-live-experiences
```

If `cs467-recording` already exists, open it in VS Code and run `git fetch origin && git switch feature/discovery-live-experiences && git pull --ff-only`.

Copy **only** your existing working `backend/.env` from the old local checkout into the new clone's `backend/.env`. Use Finder or `cp` and keep the file private. The project's `backend/.env.example` is not a usable secret configuration on its own.

## 2. Start the recording environment

Run this from the repository root:

```bash
bash scripts/run-discovery-demo.sh
```

The helper installs dependencies when needed, checks the Node version and available ports, starts Express and Vite, verifies the backend-to-Supabase connection, prints actual saved experience titles/addresses/ratings/keywords, and opens:

**http://localhost:5173/experiences**

Leave the terminal open during the recording. Press **Ctrl+C** after recording to stop the demo processes. If your terminal reports a busy port, stop the old application first rather than using `killall node` or deleting your other projects.

If the helper prints **0 experiences**, create an authentic experience with the app's **Create an Experience** form, then return to discovery. The recording must not describe hard-coded test fixtures as real database content. Create an authenticated trip in advance only if you want to demonstrate "Add to trip".

## 3. Verify before pressing Record

- [ ] The backend health and Supabase checks succeed.
- [ ] `/experiences` loads without an API error.
- [ ] A real experience title appears in the search results.
- [ ] The terminal preflight shows an address and keyword that actually exist.
- [ ] At least one real experience has a rating if you plan to demonstrate rating filters.
- [ ] For the optional Add to trip action, log in and create a real trip ahead of recording.
- [ ] Close unrelated tabs and hide terminal output, passwords, email addresses, and personal account details.
- [ ] Browser zoom is comfortable (100–110%) and the experience grid is visible.

## 4. Two-minute-thirty-second screen recording

| Video time | What to click | What to say |
|---|---|---|
| 0:00–0:20 | Show the **Discover travel experiences** heading and initial result cards | "This is my Experience Search & Discovery feature in the Crowd-Sourced Travel Planner. It now retrieves user-submitted experiences through our backend and PostgreSQL database instead of relying on static sample entries." |
| 0:20–0:50 | Enter a real city or location in **Destination or address** | "Travelers can narrow down experiences by destination or address. The search retrieves matching database records, and the results update automatically." |
| 0:50–1:20 | Clear destination and enter an actual keyword from a saved experience | "The keyword search covers experience titles, descriptions, locations and tags. It supports multiple search words, making discovery more flexible." |
| 1:20–1:50 | Change **Minimum rating** and **Sort results** | "Users can filter by community ratings and sort by the highest-rated experiences or alphabetically. The displayed ratings are calculated from ratings stored in the database." |
| 1:50–2:15 | Click **View details** on an existing result and use the browser Back button | "Each search result connects to the actual experience details page, where travelers can see the full experience information." |
| 2:15–2:35 | If prepared, choose a saved trip and click **Add to trip** on a different unsaved experience | "Authenticated travelers can also save a discovered experience to a trip. This connects discovery directly to trip planning." |
| 2:35–2:45 | Return to search, clear filters, show results | "Overall, my feature moves the application from static discovery to a database-backed, searchable experience catalog." |

**If there is no eligible rating or saved trip**, omit that specific click and explain the capability from the UI without pretending it completed. Use the time for search and detail navigation instead.

## 5. Record with QuickTime

Open **QuickTime Player → File → New Screen Recording** (or press **Shift–Command–5**). Select the browser window, enable your microphone in **Options**, and click **Record**. When finished, click the stop icon in the macOS menu bar and save the recording as **CS467-Experience-Search-Discovery-Demo.mov**.

Before submitting, play the video back to confirm that narration, page changes, and search results are legible. Upload to Canvas as directed by the instructor.

## Troubleshooting

**Port 5173 or 3000 in use:** Stop any old backend or Vite terminal with Ctrl+C and rerun the launch script.

**DATABASE_URL missing / database test failed:** Copy the working `backend/.env` from your previously configured project; verify Supabase availability. Don't share this file.

**Search shows empty results:** A real database may contain zero experiences. Create one using the application's normal experience form; a fixture is not substituted.

**Search shows an API error:** Confirm the new feature branch is checked out, not the team's `main` branch, and the backend is running on port 3000.

**Image unavailable:** Search still works; choose a record with a valid image if you want imagery in your recording.

**No saved trips:** Log in and create one in Trip Management before recording; the Add to trip button is optional.

**What is not yet verified:** The feature's complete live Supabase workflow and full Node/Express test suite have not been executed on your Mac. Verify the above checklist before describing specific actions as successful.

AI assistance: The launcher, read-only preflight, and recording instructions were prepared with ChatGPT assistance on November 28, 2026.
