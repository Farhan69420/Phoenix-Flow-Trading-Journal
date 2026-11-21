<div align="center">

# Phoenix Flow

### Multi-Asset Long & Short Trading Journal, Risk Cockpit & Live PDF Strategy Vault

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)

*Master both sides of the market in one cosmic cockpit — log long & short trades across 5 asset classes, analyze leverage & R-multiples, monitor prop-firm risk guardrails, and reference your PDF strategy playbooks live.*

</div>

---

## Highlights

### Long & Short Multi-Asset Execution
- Full support for **LONG** (stop loss below entry) and **SHORT** (stop loss above entry) positions across **US Stocks**, **Index / Futures**, **Commodities**, **Forex**, and **Crypto**.
- Automatic directional stop-loss validation, live preview while logging trades, and one-click closing of open positions.
- Real-time **Long vs Short** split telemetry in the dashboard sidebar and analytics breakdown.

### Leverage, Margin & ROE% Engine
- Built-in **Leverage (`1x` – `100x`)** support with quick-pick presets (`1x`, `2x`, `5x`, `10x`, `20x`, `50x`, `100x`) and automatic instrument contract sizing (`NQ`, `MNQ`, `ES`, `MES`, `XAUUSD`, `USOIL`, Forex standard lots, and Crypto/Equities units).
- Computes **Notional Position Value**, **Required Margin (`Position / Leverage`)**, **Initial Risk (`1R`)**, **Realized P&L**, **Account Impact %**, **Return on Margin (`ROE %`)**, and **R-Multiple** in real time.

### Analytics, Calendar & Risk Guardrails
- Interactive **Equity Curve** powered by Recharts with per-trade tooltips showing symbol, direction, setup, balance, P&L, and R-multiple.
- **KPI Suite**: Win Rate, Profit Factor, Average R, Expectancy, and live Drawdown meter.
- **Monthly P&L Calendar Heatmap**: Click any day to filter the trade log to trades closed on that date.
- **Multi-Dimensional Breakdowns**: Analyze profitability by Asset Class, Symbol, **Long / Short & Leverage Tier**, Strategy/Confluence Tag, Trading Session, and Day of Week.
- **Multi-Account Support & Guardrails**: Manage multiple personal or prop-firm accounts with per-account starting balance, currency, max drawdown limit %, daily loss alerts, open risk exposure, active UTC session indicator, and win/loss streak tracking.

### Strategy Vault & Live PDF Playbooks (`/strategies`)
- Upload strategy **PDF documents** (up to 15 MB each, stored persistently in PostgreSQL) and view them anytime in an embedded **Live PDF Viewer** with expand/compact toggle, open-in-tab, download, and drag-and-drop replacement.
- **Custom Name Fields Builder**: Customize every strategy with your own unlimited named fields (e.g., `Entry Trigger`, `Target R:R`, `Invalidation`, `Timeframe`, `Best Session`, `Max Risk`) plus market bias (`Long`, `Short`, `Both`) and accent colors.
- Saved strategy names automatically sync into the Dashboard's trade confluence/strategy tags.

### Modern Interactive Landing Page & Adaptive Cosmic UI
- Dedicated landing page (`/`) featuring smooth **scroll-driven ambient background transitions**, a live interactive **Long / Short & Leverage Simulator**, interactive **P&L Calendar / Session Edge / Drawdown Guardrail** previews, an interactive **Strategy Vault** demo, and a cursor-reactive **constellation & stardust hover highlight**.
- **Light Mode & Dark Mode Toggle** persisted in `localStorage` with zero-flash hydration:
  - **Dark Mode**: Deep-space nebula sky with twinkling starfield, shooting stars, a glowing black hole with accretion disk, ringed gas giant, crescent exoplanet, and spiral galaxy.
  - **Light Mode**: Luminous celestial sky with pastel nebula washes, subtle constellation filaments, and crisp high-contrast glass surfaces.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 15](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) + Custom HTML5 Canvas Cosmic Engine |
| Charts & Icons | [Recharts](https://recharts.org/) + [Lucide React](https://lucide.dev/) |
| Database & ORM | [PostgreSQL](https://www.postgresql.org/) (Neon-ready) + [Prisma 6](https://www.prisma.io/) |
| Auth & Security | JWT (`jose`) HTTP-only cookies + `bcryptjs` password hashing |

---

## Project Structure

```text
├── app/
│   ├── api/
│   │   ├── accounts/route.ts          # Account CRUD & risk limits
│   │   ├── auth/route.ts              # Sign up, login & logout (JWT cookie)
│   │   ├── strategies/
│   │   │   ├── route.ts               # Strategy CRUD + multipart PDF uploads
│   │   │   └── [id]/pdf/route.ts      # Authenticated inline/download PDF streaming
│   │   └── trades/route.ts            # Trade CRUD, validation & CSV batch import
│   ├── components/
│   │   ├── LandingPage.tsx            # Interactive scroll-transitioning landing page
│   │   ├── LandingMouseGlow.tsx       # Landing-page cursor constellation & stardust glow
│   │   ├── PhoenixLogo.tsx            # Custom SVG Phoenix Flow emblem
│   │   ├── SpaceBackground.tsx        # App-wide starfield, black hole, planets & galaxy
│   │   ├── ThemeProvider.tsx          # Light / dark theme context & persistence
│   │   └── ThemeToggle.tsx            # Sun / moon theme switch button
│   ├── dashboard/
│   │   ├── page.tsx                   # Auth-guarded dashboard entry
│   │   └── Dashboard.tsx              # Main trading cockpit, charts, calendar & log
│   ├── strategies/
│   │   ├── page.tsx                   # Auth-guarded strategy vault entry
│   │   └── StrategiesVault.tsx        # Strategy library, custom fields & live PDF viewer
│   ├── login/page.tsx                 # Sign in / create account page
│   ├── layout.tsx                     # Root layout, font, theme script & SpaceBackground
│   ├── page.tsx                       # Landing page entry (session-aware CTAs)
│   └── globals.css                    # Cosmic dark/light tokens & glass components
├── lib/
│   ├── auth.ts                        # JWT session helpers
│   ├── calc.ts                        # Long/Short, Leverage, Margin, ROE & FX math
│   ├── db.ts                          # Prisma client singleton
│   └── stats.ts                       # Equity curve, KPIs, streak & grouping utilities
└── prisma/
    ├── schema.prisma                  # User, Account, Trade & Strategy models
    └── seed.ts                        # Demo account seeder (long & short sample trades)
```

---

## Quick Start (Local Development)

### Prerequisites
- **Node.js 18+** (Node 20/22 recommended)
- A **PostgreSQL** database (local Postgres or a free [Neon](https://neon.tech/) cloud database)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR-USERNAME/phoenix-flow.git
cd phoenix-flow
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
JWT_SECRET="replace-with-output-of-openssl-rand-base64-32"
```

> Generate a secure `JWT_SECRET` using: `openssl rand -base64 32`

### 3. Push Database Schema

```bash
npx prisma db push
```

### 4. Seed Demo Data *(Optional)*

Creates a ready-to-explore demo account with 3 accounts and 20 realistic long & short trades across Stocks, Futures, Commodities, Forex, and Crypto:

```bash
npm run seed
```

- **Email:** `demo@journal.dev`
- **Password:** `demo1234`

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploy to Vercel + Neon Postgres

1. Push this repository to GitHub.
2. On [Vercel](https://vercel.com/), click **Add New → Project** and import your repository.
3. Connect a **Neon Postgres** database via Vercel Storage / Marketplace so `DATABASE_URL` is configured automatically.
4. Add `JWT_SECRET` in **Project Settings → Environment Variables** for Production, Preview, and Development.
5. Push the Prisma schema to your production database once from your machine:
   ```bash
   npx prisma db push
   # Optional: seed the demo user
   npm run seed
   ```
6. Deploy — the build command runs `prisma generate && next build` automatically.

---

## Trading Calculations Reference

| Metric | Formula |
| --- | --- |
| **Direction Sign** | `+1` for `LONG`, `-1` for `SHORT` |
| **Position Units** | `size × contractSize(assetClass, symbol)` |
| **Notional Position Value** | `entryPrice × units` *(for USD-base Forex pairs like `USDJPY`, `units`)* |
| **Margin Required** | `positionValue ÷ leverage` |
| **Initial Risk (`1R`)** | `sign × (entryPrice - stopLoss) × units × fxFactor` |
| **Realized P&L** | `sign × (exitPrice - entryPrice) × units × fxFactor - fees` |
| **ROE % (on Margin)** | `(pnl ÷ marginRequired) × 100` |
| **R-Multiple** | `pnl ÷ risk` *(fees reduce P&L, not 1R)* |

- **Standard Contract Sizes**: `US Stock` = `1`, `Crypto` = `1`, `Forex` = `100,000` (1 standard lot), `Commodity` = `100` (`XAUUSD` = `100`, `USOIL` = `1,000`), Futures: `NQ` = `20`, `MNQ` = `2`, `ES` = `50`, `MES` = `5`.
- **Forex USD Conversion**: USD-quote pairs (`EURUSD`, `GBPUSD`) convert 1:1; USD-base pairs (`USDJPY`, `USDCAD`) divide by price automatically.

---

## CSV Import & Export Format

Export or import trades directly from the Dashboard Trade Log. Imports are added to the currently selected account (or the first account when **All accounts** is selected). Leave `exitPrice` empty for open positions.

```csv
direction,symbol,assetClass,entryPrice,stopLoss,exitPrice,size,leverage,fees,entryTime,exitTime,timeframe,session,grade,tags,notes
LONG,NVDA,US Stock,138.4,135.9,144.2,300,2,2,2026-10-01T14:05:00Z,2026-10-01T14:50:00Z,5m,NY Open / ORB,4,"Fair Value Gap (FVG)|Order Block","Clean breakout execution."
SHORT,BTCUSD,Crypto,98900,100200,96400,0.4,10,12,2026-10-04T17:05:00Z,2026-10-04T17:50:00Z,5m,NY Afternoon,5,"VWAP|Order Block","Rejection at range highs."
```

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Generate Prisma Client and build for production |
| `npm run start` | Start the production server |
| `npm run seed` | Seed the database with `demo@journal.dev` sample data |
