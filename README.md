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


## V2.8 Branding + Typography

Adds:
- custom BenFit logo across the app
- logo in the app header
- logo in first-time onboarding
- Manrope for body/UI text
- Space Grotesk for headings, stats, and brand surfaces
- refined tracking, font weights, and hierarchy
- stronger premium fitness-brand visual identity

No Supabase migration is required.


## V2.9 App Navigation + Multi-user Goals

- Replaces the crowded tab bar with a modern primary app navigation.
- Adds a native-style mobile bottom navigation: Home, Nutrition, Train, Progress, Profile.
- Adds a More sheet for secondary tools such as scanner, measurements, photos, PRs, calendar, and settings.
- Each signed-in user now sets their own age, height, starting weight, goal weight, activity level, and goal type.
- Adds an optional calorie/protein target estimator for each user.
- First-time onboarding creates a personal profile and first weight entry.
- Existing Supabase RLS means each account continues to see only its own food logs, weights, measurements, training, photos, and goals.

Run `supabase/v2_9_migration.sql` once before using the new personal-goal fields.


## V3.0 Native Mobile UI

Adds a native-style PWA shell:
- iOS/Android-inspired bottom navigation
- elevated center Training action
- large mobile page titles
- circular calorie, protein and steps rings
- native-style Home dashboard
- Today workout card and weight-trend card
- safe-area support for notches / Dynamic Island
- 16px mobile inputs to prevent iPhone zoom
- install helper for PWA use
- app icons, Apple touch icon, maskable Android icon
- portrait PWA manifest and full-screen standalone launch

No Supabase migration is required for V3.0.


## V3.1 Personalized Calendar + Push Notifications

Each account now has its own:
- calendar events
- timezone
- private calendar subscription token
- recurring workout / school / work / meal-prep / weigh-in events
- event reminders
- web push subscriptions per device

### Database
Run `supabase/v3_1_migration.sql` once.

### Vercel environment variables
Add:
- `SUPABASE_SERVICE_ROLE_KEY` — server-only Supabase service role key
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` — e.g. `mailto:you@example.com`
- `CRON_SECRET` — a long random value

Never put the service-role key or VAPID private key in a `NEXT_PUBLIC_` variable.

### Generate VAPID keys
After `npm install`, run:

```bash
npm run vapid
```

Copy the public and private values into Vercel environment variables.

### iPhone notifications
Web push on iPhone works best when BenFit is installed to the Home Screen. Open the installed BenFit app and tap `Calendar -> Enable notifications`.

### Personal Apple Calendar
Each account has a unique subscription URL at:

`/api/calendar/<private-feed-token>`

Use `Calendar -> Copy Apple subscription`, then add it in Apple Calendar as a subscription calendar. Friends receive different feed tokens and see only their own BenFit events.


## V3.1.1 Vercel Hobby deployment hotfix

Vercel Hobby projects cannot register a cron that runs every 15 minutes.
The V3.1 `vercel.json` used:

`*/15 * * * *`

which causes the deployment to fail on Hobby.

This hotfix removes the Vercel-managed cron so the application deploys normally.

### Scheduled push reminders on Hobby

Keep the `/api/push/cron` route. Trigger it from an external scheduler every 15 minutes.

Request:

`GET https://YOUR-BENFIT-DOMAIN.vercel.app/api/push/cron`

Header:

`Authorization: Bearer YOUR_CRON_SECRET`

The `CRON_SECRET` must match the value configured in Vercel Environment Variables.

If you later upgrade to a Vercel plan that supports sub-daily cron frequency, you can restore a Vercel cron entry.


## V3.2 Personal Schedule

The old hard-coded Ben schedule has been removed from the user experience.

Every account now builds its own schedule from its own `calendar_events` rows:
- work
- school / classes
- workouts
- meal prep
- recovery
- weigh-ins
- custom activities

The Home dashboard's "Your Day" card now reads from the signed-in user's schedule instead of Ben's original static timetable.

The Schedule screen shows the current week and recurring weekly/daily events. All records remain isolated by Supabase RLS, so friends see only their own schedule.

No new Supabase migration is required if V3.1 calendar tables have already been created.


## V3.3 Starting Weight vs Current Weight

BenFit now treats:
- `Starting weight` as the long-term journey baseline.
- `Current weight` as the latest weigh-in.

If a user edits the starting weight and it conflicts with their first weigh-in, BenFit asks whether to:
1. update the baseline only, or
2. update the baseline and the first weigh-in.

A new `Log current weight` action lets users resume after a break without destroying their original baseline or progress history.

No Supabase migration is required.


## V3.4 Decluttered UI

The dashboard has been simplified to reduce visual overload.

Changes:
- primary information stays visible
- secondary analytics moved behind "Show more details"
- compact stats replace multiple large cards
- today's schedule gets one focused card
- progress gets one focused card
- desktop nav is hidden on mobile
- mobile card spacing and progress rings are more compact
- fewer competing sections are shown at once

No Supabase migration is required.


## V3.4.1 Schedule Isolation Fix

Fixes the Schedule screen still exposing Ben's original hard-coded timetable.

The static `plan` and `workout` schedule constants are removed from the user-facing schedule/dashboard behavior.

Schedule rendering now comes only from the signed-in user's `calendar_events` rows. If an account has no personal schedule events, the Schedule screen shows an empty-state message.

No Supabase migration is required.
