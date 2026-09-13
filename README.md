# BenFit Journey Cloud V2

This version is designed for use on multiple phones/devices.

## Included

- Supabase email/password accounts
- Cloud-synced calorie and protein logs
- Cloud-synced weigh-ins
- Food photo upload with server-side AI calorie/protein estimate
- Barcode scanning with camera where the browser supports BarcodeDetector
- Manual UPC/EAN lookup fallback
- Open Food Facts product lookup
- Your school/work schedule
- Your 5-day training plan
- Apple Calendar `.ics` export
- Recurring calendar events
- PWA manifest + service worker for Add to Home Screen

## 1. Create Supabase project

Create a Supabase project.

Open Supabase SQL Editor and run:

`supabase/schema.sql`

Then copy the Project URL and anon/public key.

## 2. Environment variables

Copy `.env.example` to `.env.local`.

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

Never put the OpenAI key in a NEXT_PUBLIC variable.

## 3. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## 4. Deploy

Recommended: Vercel.

Push this folder to GitHub, import it in Vercel, add the same environment variables, and deploy.

After deployment, the same account/data will work on iPhone, Android, tablet and computer.

## 5. iPhone / PWA

In Safari:

Share -> Add to Home Screen

This gives BenFit an app-like launcher.

## 6. Apple Calendar

Open the Calendar tab and download `benfit-calendar.ics`.

On iPhone, open the file and add the events to Calendar.

For a one-way subscription, use:

`webcal://YOUR-DOMAIN.com/api/calendar`

This calendar endpoint currently contains your recurring gym, meal-prep, recovery, and weekly check-in events.

## 7. Food photo estimates

The photo endpoint uses a server-side vision call and returns estimated:

- meal name
- calories
- protein
- notes about foods/portions

Photo-based nutrition is inherently approximate. Confirm the estimate before logging.

## 8. Barcode scanning

Camera scanning uses the browser's `BarcodeDetector` API where supported.

If unavailable, type the UPC/EAN number manually.

The product lookup uses Open Food Facts. Nutrition can be per serving or per 100 g depending on the product's database entry, so confirm the package serving size before saving.

## Important health note

This app is a tracking/planning tool, not a medical device. Calorie estimates—especially from photos—can be wrong. Use trends over time rather than trying to make every daily number perfect.
