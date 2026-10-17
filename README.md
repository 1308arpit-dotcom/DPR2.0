# EPACK DPR 2.0 • Construction Cloud Platform

An enterprise-grade Daily Progress Reporting (DPR), Hindrance Management, and Plant & Machinery Tracking web portal integrated directly with Google Sheets.

## Features

- **Daily Progress Reporting (DPR)**: Live reading from BOQ and Job Card masters; record daily executed quantities and manpower directly into the `'Input '` sheet.
- **Site Hindrance Reporting**: Report site delays, vendor shortages, and client clearances with categorized issue tags synced to the `'Add Hindrance'` sheet.
- **Plant & Machinery Tracking**: Track daily hydra, cranes, and specialized labor deployment into the `'Machinery Input'` sheet.
- **Schedule & Milestone Tracking**: View building phases, target dates, and progress percentages from the `'Schedules'` sheet.
- **Executive Analytics**: Real-time aggregated productivity KPIs, labor person-days, and bottleneck analysis.
- **Critical Updates Queue**: Triage and audit pending site inputs across modules.

## Architecture & Technology Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Styling**: TailwindCSS 4 with glassmorphism and modern enterprise color tokens
- **Icons**: Lucide Icons
- **Database / Backend**: Google Sheets API v4 (JWT Service Account authentication with in-memory caching)

## Getting Started

1. Ensure environment variables are configured in `.env.local`:
   ```bash
   GOOGLE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   GOOGLE_SHEET_ID="your_google_sheet_id"
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.
