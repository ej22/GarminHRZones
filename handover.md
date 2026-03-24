# Handover — GarminHRZones

## What This Is

A single-page web application that calculates heart rate training zones from personal metrics (age, weight, height, resting HR) and shows how to configure them on Garmin devices.

## Architecture

```
app.py              ← Flask app: 3 routes, pure-function calculation logic
templates/index.html ← Single-page UI: form, results, Garmin instructions
static/style.css    ← Dark athletic theme (Barlow Condensed + Barlow fonts), thermal zone colors, 4 responsive breakpoints
static/script.js    ← Form handling, animated Max HR ring, zone spectrum/cards/table rendering, reduced-motion support
```

Everything is stateless — no database, no sessions, no auth.

## Key Design Decisions

- **No frontend framework**: The UI is simple enough that vanilla JS keeps complexity low and eliminates build steps.
- **Calculation in the backend**: Keeps the API usable independently of the UI (e.g., for scripts or other integrations).
- **Rounding**: BPM values are rounded to integers because Garmin devices don't accept fractional BPM. Tanaka MaxHR is also rounded before zone calculation.
- **Karvonen validation**: The `/calculate` endpoint returns 400 if `method=karvonen` but `resting_hr` is missing or out of range.
- **Manual Max HR**: Users can bypass formula calculation and enter a known Max HR (e.g., from a lab test or HR monitor). When `formula=manual`, the `max_hr` field is required (100–230 bpm). The UI conditionally shows the input field when "Manual" is selected.
- **Generic placeholders**: Input placeholders use generic values (age 30, weight 75kg, height 175cm, etc.) rather than real user data.

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

## Frontend

- **Fonts**: Barlow Condensed (display headings, uppercase athletic style) + Barlow (body/UI) via Google Fonts
- **Zone colors**: Thermal spectrum — cyan (Z1), emerald (Z2), gold (Z3), orange (Z4), red (Z5) — defined as CSS variables `--zone-1` through `--zone-5`
- **Animations**: SVG ring stroke animates proportionally to Max HR, zone spectrum bars grow with staggered timing, table rows fade in with delays, Max HR number counts up. All animations respect `prefers-reduced-motion`.
- **Layout**: Sticky glassmorphic header, numbered sections (01/02/03), collapsible instruction cards, 960px max-width container
- **Responsive**: 4 breakpoints (768px tablet, 600px mobile, 400px small phone). Form grid collapses 4→2→1 columns. Zone results switch from table (desktop) to card layout (mobile). Boundary chips reflow to 3-col on smallest screens.
- **Accessibility**: `inputmode` attributes for mobile keyboards, `aria-label`/`aria-live` on key elements, `.sr-only` fieldset legends, visible focus rings, `role="alert"` on errors, 44px minimum touch targets
- **Loading state**: Calculate button shows spinner during API call, disables interaction

## Extending

- **Add a formula**: Add a branch in `calc_max_hr()` in `app.py`, add an option in the HTML `<select>`, update the JS display label and visibility logic in `script.js`.
- **Change zone definitions**: Edit the `ZONES` list at the top of `app.py`.
- **Change zone colors**: Update `--zone-1` through `--zone-5` CSS variables and the matching `.boundary-chip.z*` and `.zone-bar[data-z]` rules.
- **Add zone count options** (e.g., 3 or 7 zones): Would require making `ZONES` dynamic and updating the frontend table/spectrum rendering.

## Deployment

```bash
docker compose up --build      # builds and starts on port 5050
docker compose up -d           # detached mode
docker compose down            # stop and remove
```

No environment variables or secrets required.
