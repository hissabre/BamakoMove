# Bamako Move — relocation planner

A phone-first planner for the move from Langley, BC to Bamako (departure Dec 31, 2026; children fly Dec 20).
Plain HTML/CSS/JavaScript — no build step, no server, works offline once opened.

## Put it on GitHub Pages (about 5 minutes)

1. On github.com, create a new repository (e.g. `relocation`). Public or private with Pages enabled.
2. Click **Add file → Upload files** and drag in **everything in this folder**, including the `icons` folder.
   The files must sit at the top level of the repo (index.html next to README.md), not inside another folder.
3. Commit.
4. Go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
5. After a minute your app is at `https://<your-username>.github.io/relocation/`.

All paths are relative, so it works under any repository name.

## Install on your phone

- **iPhone:** open the link in Safari → Share → **Add to Home Screen**.
- **Android:** open in Chrome → menu → **Install app** / **Add to Home screen**.

Installing matters on iPhone: Safari can clear website storage for sites you don't visit for a while; home-screen apps are kept.

## Your data

- Everything is saved in the browser on that device (localStorage). Nothing is sent anywhere.
- Phone and computer do **not** sync. Use **Settings → Download backup** on one device and **Restore from backup** on the other.
- Back up weekly. The Today screen nudges you after 7 days without a backup.
- Uploading a new version of the app never touches your saved tasks.

## Updating the app

1. Upload the changed files to the repo (replace the old ones).
2. In `sw.js`, change `VERSION` (e.g. `bamako-move-1.0.1`) so phones fetch the new files.
   The service worker is network-first anyway, so an open app picks up new files on the next load when online.

## Adding preloaded tasks later (without overwriting your changes)

Open `seed.js`, add new rows at the end of `SEED_TASKS` with **new ids**, and increase `SEED_VERSION` by 1.
On next open the app adds only rows it has never seen. Tasks you edited, completed or deleted stay as they are.

## How scheduling works

- **Custody:** set in Settings (alternating weeks + handoff day, then tap any day to override). Applies until Dec 20.
- **Child-free weekdays** take heavy work (default limit 5h). **Kids' weekdays** only take light tasks (≤30 min, or marked "OK on a kids' week day", limit 1h). **Kids' weekends** are kept free. Child-free weekends are available (4h).
- **Dec 25–30** = final cleaning/handover; **Dec 31** = departure (only travel/hotel items).
- **Overdue tasks** stay visible in red. Tap *Reschedule* on one, or *Reschedule unfinished* to see proposed dates for all of them (respecting custody, limits, priority, prerequisites and Dec 31). Nothing moves until you tap Apply. Every move is kept in the task's history with its original due date.
- **Move readiness** on the Progress tab is based only on 9 milestones (vehicle, phone port, tax meeting, shipping, notice, internet, donations, travel docs + hotel, keys) — not on how many small tasks are done.

## Files

| File | Purpose |
|---|---|
| index.html | Page shell |
| app.js | All app logic |
| seed.js | Preloaded plan, milestones, sale items |
| styles.css | Design |
| sw.js | Offline support (network-first) |
| manifest.webmanifest, icons/ | Install as an app |
