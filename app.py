from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

ZONES = [
    {"zone": 1, "name": "Recovery", "low": 0.50, "high": 0.60},
    {"zone": 2, "name": "Aerobic / Fat Burn", "low": 0.60, "high": 0.70},
    {"zone": 3, "name": "Aerobic Endurance", "low": 0.70, "high": 0.80},
    {"zone": 4, "name": "Anaerobic / Threshold", "low": 0.80, "high": 0.90},
    {"zone": 5, "name": "Maximum", "low": 0.90, "high": 1.00},
]


def calc_max_hr(age, formula):
    if formula == "tanaka":
        return round(208 - (0.7 * age))
    return 220 - age


def calc_bmi(weight_kg, height_cm):
    height_m = height_cm / 100
    return round(weight_kg / (height_m ** 2), 1)


def calc_zones(max_hr, method, resting_hr=None):
    zones = []
    for z in ZONES:
        if method == "karvonen":
            hrr = max_hr - resting_hr
            bpm_low = round((hrr * z["low"]) + resting_hr)
            bpm_high = round((hrr * z["high"]) + resting_hr)
        else:
            bpm_low = round(max_hr * z["low"])
            bpm_high = round(max_hr * z["high"])
        zones.append({
            "zone": z["zone"],
            "name": z["name"],
            "pct_low": int(z["low"] * 100),
            "pct_high": int(z["high"] * 100),
            "bpm_low": bpm_low,
            "bpm_high": bpm_high,
        })
    return zones


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/calculate", methods=["POST"])
def calculate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    age = data.get("age")
    weight_kg = data.get("weight_kg")
    height_cm = data.get("height_cm")
    resting_hr = data.get("resting_hr")
    manual_max_hr = data.get("max_hr")
    formula = data.get("formula", "standard")
    method = data.get("method", "maxhr")

    if not age or not isinstance(age, (int, float)) or age < 1 or age > 120:
        return jsonify({"error": "Age must be a number between 1 and 120"}), 400
    if not weight_kg or not isinstance(weight_kg, (int, float)) or weight_kg <= 0:
        return jsonify({"error": "Weight must be a positive number"}), 400
    if not height_cm or not isinstance(height_cm, (int, float)) or height_cm <= 0:
        return jsonify({"error": "Height must be a positive number"}), 400
    if formula not in ("standard", "tanaka", "manual"):
        return jsonify({"error": "Formula must be 'standard', 'tanaka', or 'manual'"}), 400
    if formula == "manual":
        if not manual_max_hr or not isinstance(manual_max_hr, (int, float)) or manual_max_hr < 100 or manual_max_hr > 230:
            return jsonify({"error": "Manual Max HR must be a number between 100 and 230"}), 400
    if method not in ("maxhr", "karvonen"):
        return jsonify({"error": "Method must be 'maxhr' or 'karvonen'"}), 400
    if method == "karvonen":
        if not resting_hr or not isinstance(resting_hr, (int, float)) or resting_hr < 20 or resting_hr > 120:
            return jsonify({"error": "Resting HR is required for Karvonen method (20-120 bpm)"}), 400

    age = int(age)
    if formula == "manual":
        max_hr = int(manual_max_hr)
    else:
        max_hr = calc_max_hr(age, formula)
    bmi = calc_bmi(weight_kg, height_cm)
    zones = calc_zones(max_hr, method, resting_hr)

    return jsonify({
        "max_hr": max_hr,
        "bmi": bmi,
        "formula": formula,
        "method": method,
        "zones": zones,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)
