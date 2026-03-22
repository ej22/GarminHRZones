# Handover — GarminHRZones

## What This Is

A single-page web application that calculates heart rate training zones from personal metrics (age, weight, height, resting HR) and shows how to configure them on Garmin devices.

## Architecture

```
app.py              ← Flask app: 3 routes, pure-function calculation logic
templates/index.html ← Single-page UI: form, results, Garmin instructions
static/style.css    ← Dark theme, responsive, zone color coding
static/script.js    ← Form submission via fetch, dynamic results rendering
```

Everything is stateless — no database, no sessions, no auth.

## Key Design Decisions

- **No frontend framework**: The UI is simple enough that vanilla JS keeps complexity low and eliminates build steps.
- **Calculation in the backend**: Keeps the API usable independently of the UI (e.g., for scripts or other integrations).
- **Rounding**: BPM values are rounded to integers because Garmin devices don't accept fractional BPM. Tanaka MaxHR is also rounded before zone calculation.
- **Karvonen validation**: The `/calculate` endpoint returns 400 if `method=karvonen` but `resting_hr` is missing or out of range.
- **Manual Max HR**: Users can bypass formula calculation and enter a known Max HR (e.g., from a lab test or HR monitor). When `formula=manual`, the `max_hr` field is required (100–230 bpm). The UI conditionally shows the input field when "Manual" is selected.

## Zone Definitions

| Zone | Name | % Range |
|------|------|---------|
| 1 | Recovery | 50–60% |
| 2 | Aerobic / Fat Burn | 60–70% |
| 3 | Aerobic Endurance | 70–80% |
| 4 | Anaerobic / Threshold | 80–90% |
| 5 | Maximum | 90–100% |

**% Max HR method**: `BPM = MaxHR × percentage`
**Karvonen method**: `BPM = ((MaxHR - RestingHR) × percentage) + RestingHR`

## Garmin Notes

- Garmin uses **lower-boundary-only** semantics: each zone starts at the value you enter and extends to the next zone's boundary.
- Users must disable **Auto Detect** or custom zones get overwritten.
- **LTHR zones** are a separate Garmin feature not covered here.

## Extending

- **Add a formula**: Add a branch in `calc_max_hr()` in `app.py`, add an option in the HTML `<select>`, update the JS display label and visibility logic in `script.js`.
- **Change zone definitions**: Edit the `ZONES` list at the top of `app.py`.
- **Add zone count options** (e.g., 3 or 7 zones): Would require making `ZONES` dynamic and updating the frontend table rendering.

## Deployment

```bash
docker compose up --build      # builds and starts on port 5050
docker compose up -d           # detached mode
docker compose down            # stop and remove
```

No environment variables or secrets required.
