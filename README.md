# BenFit V2.7.2 Hotfix

Fixes:
- `ReferenceError: avatar is not defined`
- missing computed journey/avatar values on personalized dashboard
- restores Profile tab in navigation
- service worker no longer tries to cache `chrome-extension://` requests
- bumps cache version and removes stale BenFit caches on activation

Replace:
- `app/page.js`
- `public/sw.js`

No Supabase migration is required.
