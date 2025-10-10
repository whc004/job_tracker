# Analytics & Job Tracker – Change Map

This file points you to every section that was updated so you can review or copy the code by hand if needed. It also confirms where to find the complete, ready-to-copy component sources.

## Where to grab the full files
- `docs/review/Analytics.js` – mirror of `client/src/components/Analytics.js`
- `docs/review/JobTracker.js` – mirror of `client/src/components/JobTracker.js`

Copy either snapshot over the matching file in `client/src/components/` if you want to test locally without pulling from Git.

## Key updates inside `Analytics.js`
1. **Scope toggle (lines ~40-95)** – lets you switch between dashboard-filtered data and all jobs.
2. **Chart controls (lines ~100-150)** – choose chart type and axes.
3. **Dynamic chart rendering (lines ~150-250)** – bar, pie, and line chart renderers with empty-state guardrails.
4. **Summary stats panel (lines ~250-310)** – shows totals, max, average, and record counts.
5. **Utility helpers & styles (lines ~320 onward)** – includes SVG pie/line chart helpers and the shared styling map.

## Key updates inside `JobTracker.js`
1. **Collection awareness (top + filtering block ~35-130, 280-330)** – prioritises saved collections, adds filter toggles, and ensures favourites float to the top by default.
2. **No-response modal (state + handlers ~40-120, modal JSX ~470-580)** – settings appear in a popup with a 21-day default, persisted per user.
3. **Job editing (handlers ~160-260, modal ~580-940)** – edit every field without closing the drawer; uses shared parsing for skill keywords.
4. **Skill parsing helper (top + usage throughout)** – normalises skills regardless of API format for consistent chips and search.
5. **Login screen copy (conditional render ~330-410)** – greets the user without showing the “Job Tracker” name.

> Tip: Use your editor’s “Go to line” feature with the line hints above to jump right to each change.
