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

Camera scanning uses `html5-qrcode`, which works across modern iPhone Safari, Android Chrome, and desktop browsers. If camera access is blocked, type the UPC/EAN number manually.

The product lookup uses Open Food Facts. Nutrition can be per serving or per 100 g depending on the product's database entry, so confirm the package serving size before saving.

## Important health note

This app is a tracking/planning tool, not a medical device. Calorie estimates—especially from photos—can be wrong. Use trends over time rather than trying to make every daily number perfect.


## V2.1 iPhone scanner fix

This release replaces the native BarcodeDetector dependency with html5-qrcode and adds iPhone safe-area/mobile layout fixes.

## V2.2 Meal AI upgrade

- Meal photos are analyzed into separate food items.
- Each item includes estimated portion, calories, protein, and confidence.
- Users can edit names, portions, calories, and protein before saving.
- Totals recalculate live.
- Saving creates separate daily food-log entries for each item.

To enable meal-photo analysis on Vercel, add `OPENAI_API_KEY` to the project environment variables and redeploy.


## V2.3 Progress upgrade

New features:
- 7-day average weight on the dashboard
- weekly weight trend
- waist/chest/arm/thigh measurements
- progress photo uploads
- strength PR tracker

### Required Supabase migration

After deploying V2.3, run the new V2.3 SQL section from `supabase/schema.sql` in the Supabase SQL Editor.
It creates:
- `measurements`
- `workout_prs`
- `progress_photos`
- `progress-photos` Storage bucket
- RLS policies for all of the above


## V2.4 Daily Engine

Adds:
- workout set logging
- automatic PR detection using estimated 1RM improvement
- daily water/sleep/steps/recovery logging
- adherence score
- strong-day streak
- calories/protein remaining
- simple meal suggestions based on remaining macros
- next weight milestone
- weight and waist trend charts
- weekly check-ins

### Database step

Run `supabase/v2_4_migration.sql` once in Supabase SQL Editor before using the new tabs.


## V2.5 Polish + Automation

Adds:
- mobile weekly summary hero
- favorite foods
- reusable meal templates
- workout history
- reminder schedule synced through Supabase
- browser notification permission/test
- clearer weekly summary guidance

### Reminder note
Web notifications, especially background scheduling on iPhone PWAs, are not universally reliable without a dedicated push notification service. BenFit stores the reminder schedule and can request browser notification permission, while Apple Calendar remains the reliable recurring-reminder path on iPhone.

### Database step
Run `supabase/v2_5_migration.sql` once in Supabase SQL Editor.


## V2.6 Full UI Theme Upgrade

Adds a full-app color system with 4 appearance themes:

- Emerald Night (default)
- Royal Purple
- Sunset
- Frost Light

The selected theme changes:
- backgrounds
- cards
- tabs
- buttons
- progress bars
- charts
- inputs
- notices
- meal cards
- workout history
- reminders
- all mobile UI surfaces

Theme preference is stored locally in the browser and can be changed from Settings -> App appearance.

No Supabase migration is required for V2.6.


## V2.7 Personalized Experience

Adds:
- first-time onboarding
- username
- display name
- avatar selection
- profile bio
- personalized greeting
- profile chip in the app header
- new Profile page
- quick-action dashboard
- journey progress bar
- redesigned premium dashboard layout
- profile stats for streaks, PRs, and weight change

### Database step
Run `supabase/v2_7_migration.sql` once in Supabase SQL Editor.
