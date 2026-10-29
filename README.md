# FINOVA

## Name and purpose

FINOVA is a personal finance website that helps users manage their income, spending, budgets, and savings in one place.

## Website description

A responsive website with a financial dashboard, transaction records, interactive reports, and Nova, a personal finance assistant. Users can work locally in their browser or sign in to a server-backed account.

## Technologies and tools

- HTML5, CSS3, and JavaScript.
- Node.js with built-in HTTP, SQLite, and cryptography modules.
- Browser localStorage for local workspaces.
- OpenAI API for optional AI assistance, voice transcription, and semantic search.
- Git and GitHub for version control and project hosting.

## Installation and running

1. Install Node.js 22.13 or later.
2. Clone the repository and enter the project folder:

   ```sh
   git clone https://github.com/DeniasNghiwedua/FinNOVA.git
   cd FinNOVA
   ```

3. Start the server:

   ```sh
   node server/index.mjs
   ```

4. Open `http://localhost:8787` in your browser.
5. Create a local workspace, or select **Cloud sign in** and register an account with your name, email, and a password of at least 12 characters.

No npm package installation is required. For local-only use, open `index.html` directly in a modern browser.

## Additional setup requirements

- Optional AI features require an OpenAI API key with available API credit. Set `OPENAI_API_KEY` in the server environment before starting the server. In PowerShell:

  ```powershell
  $env:OPENAI_API_KEY = 'your-api-key'
  node server/index.mjs
  ```

- Enable the GPT agent in Nova and provide consent to use AI features. Voice input also requires microphone permission and localhost or HTTPS.
- Account data is stored automatically in `finova-private-data/`. Set `FINOVA_DATA_DIR` to use another private directory.
- For HTTPS hosting, set `FINOVA_HTTPS=true` and run the server behind an HTTPS reverse proxy.

## Main features

- Dashboard with income, expenses, balance, and financial charts in Namibian dollars.
- Transaction management with search, filtering, and CSV import/export.
- Monthly budgets, savings goals, recurring payment reminders, and a financial calendar.
- Analytics and insights based on recorded transactions.
- Nova guided assistant with optional AI conversation, voice input, and semantic search.
- Separate local workspaces and password-protected accounts with server storage.
- Workspace backup and restore, appearance settings, and keyboard command navigation.
