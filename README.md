# FINOVA 5.0 — Personal finance, personally yours

A responsive, dependency-free personal finance website with separate **local browser workspaces** for different people, an action-oriented assistant, real transaction-based charts and reports, budgets, savings goals, recurring payment reminders, a financial calendar, and a global command center.

Built as a functional website for the Golden Switch Technologies coding challenge.

## Run locally

1. Unzip the FINOVA 5.0 release.
2. Open `FINOVA/index.html` in a modern browser.
3. Select **Launch Dashboard**, enter your name, and create a workspace.

Local-only mode needs no package dependencies or API keys. Secure cloud accounts and GPT use the Node server described below. Alternatively, from the `FINOVA` folder run `python -m http.server 8000` and visit `http://localhost:8000/`.

## Pages

**Public website:** Home, Features, About.

**Application:** Overview, Transactions, Analytics, Budgets, Savings Goals, Recurring, Calendar, Insights, Settings.

## Features

- **Personal local workspaces:** Onboard with a name. FINOVA remembers each workspace on the same browser. Switch workspaces using the profile button. Transactions, budgets, savings goals, recurring reminders and preferences are separated by workspace.
- **Actual transactions, not sample transactions:** No demo financial records are created. Add, edit, delete, search, sort and filter income/expense records; import/export CSV. Amounts are stored as integer cents and shown in Namibian dollars.
- **Live visualizations:** Overview and Analytics chart actual recorded income, expenses, cash flow trends and expense categories. Charts and financial totals recalculate whenever saved transactions change. Click an expense category in the donut legend to examine matching transactions.
- **Nova local conversational assistant:** Guided prompts can create income/expense transactions, monthly budgets, savings goals, recurring reminders and show financial summaries. Changes need confirmation. **Nova is rule-based, not a cloud LLM**; it does not understand arbitrary natural language.
- **Budget management:** Track monthly category limits; progress bars and warnings at high utilization.
- **Savings goals:** Track money saved and target amounts, add contributions, set a target date, view estimated monthly contributions needed. Goal contributions do not automatically affect the account balance.
- **Recurring reminders:** Record weekly/monthly expected income or expense reminders. Press **Record & advance** to create a transaction and move the reminder to its next date. No banking/payment automation.
- **Financial calendar:** Navigate months, view dates with transactions and recurring reminders, inspect dates and create entries.
- **Smart insights:** Monthly income/spending summaries, comparisons with the previous month, largest category, savings-rate metric and budget alerts.
- **Command palette:** Press `Ctrl+K` / `⌘K` to navigate and start actions.
- **Settings:** Change name, change appearance, export CSV, back up/restore all profile data as JSON, import CSV and reset the active workspace's financial data.

## Important privacy and data limitations

**These are browser-local named profiles, not secure user accounts.** Each person gets a separate data collection in localStorage within the same browser. Anybody with access to that browser can change profiles and read financial information. FINOVA does not synchronize between browsers, computers or phones. Browser storage can be cleared or lost. For production use with real users and private accounts across devices, a secure backend, authenticated accounts, server database, and appropriate privacy/security controls are required.

The **Export full workspace** button downloads a JSON backup you can later restore in a profile in another browser. CSV export contains transactions only.

There is no bank integration or live external financial feed. “Live” means charts react immediately to transactions entered or imported in FINOVA. Real account data only enters when the user provides it.

Earlier FINOVA version 2 non-sample transactions and valid budgets are copied into the **first** local workspace created on the same browser, when they are available. Existing older storage keys are left untouched for safety.

## Code architecture

- `index.html`: HTML entry point.
- `styles.css`: responsive visual system, components, charts, assistant and local-profile onboarding.
- `app.js`: hash-router, page rendering, validation, transaction/calculation utilities, storage management, Nova conversation state, events and settings.

No build step or external UI libraries are needed. Designed with visual inspiration from Monera and UI patterns seen in the 21st.dev community; **not a direct installation of 21st.dev React components**.

## Verification

`node --check app.js` passes the JavaScript syntax check. A local JavaScript smoke test checked profile separation/persistence, Nova goal and recurring flows, and rendering of Calendar and Insights. Full visual end-to-end browser verification was not possible in the execution environment; test navigation, forms, imports and mobile layout in your target browser before submitting.

## Suggested interview demo

1. Create a workspace named Denias; add a grocery expense and show the updated chart.
2. Set the Food monthly budget and show progress.
3. Ask Nova to create a savings goal, confirm, then contribute to the goal.
4. Create a rent recurring reminder, record it and check the Calendar.
5. Create another workspace and demonstrate that it starts empty; switch back to restore the original workspace.
6. Press Ctrl+K and navigate to Insights. Export a full JSON backup from Settings.

## Submission

Upload all files to GitHub, include this README, test them as a fresh download, and add the two Golden Switch Technologies reviewers as collaborators using the email addresses in the challenge document. Submit the repository URL by the stated deadline.

## FINOVA 4.0: Optional GPT-powered Nova with voice and semantic lookup

The upgraded Nova supports **real OpenAI-powered natural-language requests** using the **Responses API with function-calling tools**. For example: “Nova, I just spent N$500 yesterday on fuel” can become a proposed Transport expense for the appropriate date. Missing details trigger follow-up questions. The agent can read user-provided records, answer spending questions, propose transactions, budgets, savings goals and recurring reminders, navigate pages and request CSV exports. It **never writes data directly**: proposed changes are validated and require the user to press **Confirm action** in FINOVA. Your browser remains the authoritative source of all local financial records.

### Start AI mode (Node.js 20+ required)

1. Get your own API key from the OpenAI developer platform. **OpenAI API usage is billed separately from ChatGPT subscriptions.**
2. Set `OPENAI_API_KEY` as a server-side environment variable (never paste it in HTML, JS or a GitHub repository).
   - macOS/Linux: `export OPENAI_API_KEY='your-key'`
   - Windows PowerShell: `$env:OPENAI_API_KEY='your-key'`
3. In the `FINOVA` directory, run `node server/index.mjs`.
4. Open `http://localhost:8787`, launch the dashboard and open Nova.
5. Turn on **Enable GPT agent**, then explicitly consent to sending the current workspace's financial records to OpenAI. The AI button cannot be activated without a configured backend. Switch it off at any time to use the old guided assistant offline.

The server needs **no third-party npm packages**. It uses Node's built-in HTTP and Fetch APIs. It binds to localhost for development. Configuration: optional `PORT`, `NOVA_MODEL` (default `gpt-4.1-mini`), `NOVA_TRANSCRIBE_MODEL` (`gpt-4o-mini-transcribe`) and `NOVA_EMBED_MODEL` (`text-embedding-3-small`). A paid API key with access to the chosen models is necessary for live AI requests. Do not publish the development server directly; a publicly hosted release needs user authentication, per-user data isolation on the server, strong abuse protection, secrets management, HTTPS, and a production database.

### Voice and embeddings

Use 🎙️ in AI mode to record an utterance. The app sends audio to the backend for **speech-to-text transcription** and fills the message field for you to **review before sending**. Voice input needs browser microphone permission and a secure context such as localhost or HTTPS. No audio recording is intentionally stored by FINOVA's backend. Audio is transmitted to OpenAI when you request transcription.

Optional semantic lookup uses the OpenAI embeddings API (`text-embedding-3-small`) to match descriptions by meaning. It is **off by default**, only runs if the optional checkbox is enabled, and sends the query and up to 100 stored transaction descriptions/categories to OpenAI. This lookup can incur additional API costs. Normal searches do not need embeddings.

### Security, privacy and feature boundaries

Cloud mode sends recent conversation turns and the current selected browser workspace snapshot (up to 500 transactions, plus budgets/goals/reminders) to OpenAI only **after explicit consent**. The backend does not persist conversations or workspace data. Switching workspaces clears cloud conversation history and consent. The workspace data remains local to the browser and has no true user authentication. On a shared computer, anyone can still switch profiles and inspect financial entries. **Do not market these as secure private bank accounts.**

The on-device guided Nova continues to work without credentials, albeit without arbitrary natural-language understanding. OpenAI-powered mode cannot run by double-clicking `index.html`; it requires the included Node backend. AI, transcription and embeddings calls have usage costs, and their functionality cannot be verified without a real configured key.

## FINOVA 5.0 — Password-protected cloud accounts (optional)

FINOVA now includes an **optional** account service using Node.js's built-in SQLite (`node:sqlite`), password hashing (`scrypt`), and HttpOnly session cookies. Accounts are stored in a private SQLite database outside the website's public files. Different accounts have separately keyed workspace data. Changes made in an authenticated account are saved to the server and can be loaded from another browser pointing at the **same server**. The original local-only workspace option still works.

**Run:** Node.js 22.13+ recommended. From the `FINOVA` directory, run `node server/index.mjs`, then browse to `http://localhost:8787`. Select **Cloud sign in**, register with your name, email and a 12+ character password. No OpenAI key is required for accounts; cloud Nova still needs `OPENAI_API_KEY`. SQLite files are stored by default in `FINOVA/finova-private-data`; you can change this with `FINOVA_DATA_DIR=/private/server/path`.

**Security boundaries and deployment:** For an HTTPS deployment, set `FINOVA_HTTPS=true` so session cookies are Secure. Keep `FINOVA_DATA_DIR` outside the public web root, back up the database and protect it with filesystem permissions. This example server deliberately binds to `127.0.0.1`; deploy behind a carefully configured HTTPS reverse proxy, not directly exposed. The application uses cookie sessions with SameSite=Lax and origin checking for writes, basic login throttling, optimistic revision checks to avoid silent overwrites, and server-side workspace access control. It is **not independently security-audited**. Before a real multi-user public deployment add email verification, password recovery, stronger distributed rate limiting, monitoring, database backups, account deletion, data-retention policies and a comprehensive security review.

**Synchronization behavior:** Server account data is separate from older local profiles and is not automatically merged. Changes are queued for server storage after a short delay. If a save fails, FINOVA displays a warning; export a backup before closing the tab. Multiple simultaneous devices may cause a version conflict; this prototype does not automatically merge edits. FINOVA does not connect to banks. Cloud GPT agent reads the authenticated account's server-side workspace; voice recording remains opt-in and is sent to OpenAI only when you explicitly use transcription. API usage is billed separately.
