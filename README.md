# GarminHRZones

A Dockerized web tool that calculates heart rate training zones based on your personal metrics and provides step-by-step Garmin device configuration instructions.

## Features

- **Three Max HR options**: Standard (220 - age), Tanaka (208 - 0.7 × age), or Manual (enter your known Max HR)
- **Two zone methods**: % of Max HR (simple) and % HRR / Karvonen (accounts for resting HR)
- **5 training zones** with percentage and BPM ranges, displayed as an animated visual spectrum
- **Garmin-ready boundaries**: lower-BPM values formatted for direct entry into your device
- **Garmin setup instructions**: Garmin Connect, on-watch, and sport-specific configuration
- **BMI calculation** for informational context
- **Polished UI**: Dark theme with Syne/Outfit typography, animated Max HR ring, thermal zone color coding, and responsive layout

## Quick Start

```bash
docker compose up --build
```

Open [http://localhost:5050](http://localhost:5050).

## API

### POST `/calculate`

```json
{
  "age": 35,
  "weight_kg": 80,
  "height_cm": 180,
  "resting_hr": 60,
  "formula": "standard",
  "method": "maxhr"
}
```

- `formula`: `"standard"`, `"tanaka"`, or `"manual"`
- `max_hr`: required when `formula` is `"manual"` (100–230 bpm) — use this to override the calculated Max HR with a known value from testing
- `method`: `"maxhr"` or `"karvonen"` (requires `resting_hr`)
- `resting_hr`: optional for maxhr, required for karvonen (20–120 bpm)

**Response:**

```json
{
  "max_hr": 185,
  "bmi": 24.7,
  "formula": "standard",
  "method": "maxhr",
  "zones": [
    { "zone": 1, "name": "Recovery", "pct_low": 50, "pct_high": 60, "bpm_low": 93, "bpm_high": 111 },
    ...
  ]
}
```

### GET `/health`

Returns `{"status": "ok"}` — used by Docker healthcheck.

## Running Without Docker

```bash
pip install -r requirements.txt
python app.py
```

## Tech Stack

- Python / Flask
- Vanilla HTML / CSS / JS
- Docker
