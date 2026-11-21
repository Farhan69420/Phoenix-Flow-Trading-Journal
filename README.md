# Trade Journal

Multi-asset long & short trading journal with leverage, margin/ROE, and R-multiple analytics. Next.js 15, TypeScript, Tailwind, Recharts, Prisma, Postgres.

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `JWT_SECRET` (`openssl rand -base64 32`).
3. `npx prisma db push`
4. `npm run seed` (optional, creates demo@journal.dev / demo1234)
5. `npm run dev` and open http://localhost:3000

## Deploy: GitHub, Neon and Vercel
1. Create an empty repo on github.com, then in this folder run:
   `git init && git add . && git commit -m "Initial commit" && git branch -M main`
   `git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git && git push -u origin main`
2. On vercel.com choose Add New, Project, import the repo. Do not deploy yet: open Environment Variables first (step 4).
3. In the Vercel dashboard open Storage (or Marketplace), pick Neon Postgres, create the free database and connect it to the project. Vercel adds `DATABASE_URL` for you. If it only adds `POSTGRES_PRISMA_URL`, copy that value into a new `DATABASE_URL` variable.
4. Add `JWT_SECRET` (output of `openssl rand -base64 32`) for Production, Preview and Development.
5. Create the tables once from your machine: put the same `DATABASE_URL` in `.env` (Vercel: Settings, Environment Variables, reveal the value; or use `vercel env pull .env`), then run `npx prisma db push`. Optionally run `npm run seed`.
6. Click Deploy (or Redeploy). The build script runs `prisma generate && next build`. Your app is live at `https://YOUR-PROJECT.vercel.app`.

## CSV format
Columns: direction, symbol, assetClass, entryPrice, stopLoss, exitPrice, size, leverage, fees, entryTime, exitTime, timeframe, session, grade, tags (separated by |), notes. Imports go into the selected account (the first account when "All Accounts" is selected). Leave exitPrice empty for open trades.

## Notes
- Supports both `LONG` (stop below entry) and `SHORT` (stop above entry) trades.
- Uses `leverage` (e.g. `1x`, `5x`, `10x`, `20x`, `50x`) to calculate required margin (`Position Value / Leverage`) and Return on Equity (`P&L / Margin`). Standard contract sizes are applied automatically per asset class and symbol.
- Forex P&L converts to USD for USD-quote pairs (EURUSD) and USD-base pairs (USDJPY).
- Risk (1R) is `|entry - stop| × size × contractSize`. Fees reduce P&L but not 1R.
