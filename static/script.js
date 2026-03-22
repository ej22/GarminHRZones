const form = document.getElementById("hr-form");
const errorMsg = document.getElementById("error-msg");
const results = document.getElementById("results");
const methodSelect = document.getElementById("method");
const restingInput = document.getElementById("resting-hr");
const formulaSelect = document.getElementById("formula");
const manualHrGroup = document.getElementById("manual-hr-group");
const manualHrInput = document.getElementById("manual-hr");

methodSelect.addEventListener("change", () => {
    if (methodSelect.value === "karvonen") {
        restingInput.required = true;
        restingInput.parentElement.querySelector(".optional").textContent = "(required)";
    } else {
        restingInput.required = false;
        restingInput.parentElement.querySelector(".optional").textContent = "(optional)";
    }
});

formulaSelect.addEventListener("change", () => {
    if (formulaSelect.value === "manual") {
        manualHrGroup.classList.remove("hidden");
        manualHrInput.required = true;
    } else {
        manualHrGroup.classList.add("hidden");
        manualHrInput.required = false;
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.classList.add("hidden");
    results.classList.add("hidden");

    const payload = {
        age: parseFloat(document.getElementById("age").value),
        weight_kg: parseFloat(document.getElementById("weight").value),
        height_cm: parseFloat(document.getElementById("height").value),
        formula: document.getElementById("formula").value,
        method: document.getElementById("method").value,
    };

    const rhr = document.getElementById("resting-hr").value;
    if (rhr) payload.resting_hr = parseFloat(rhr);

    const mhr = document.getElementById("manual-hr").value;
    if (mhr) payload.max_hr = parseFloat(mhr);

    try {
        const res = await fetch("/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            errorMsg.textContent = data.error || "Calculation failed";
            errorMsg.classList.remove("hidden");
            return;
        }

        document.getElementById("max-hr-value").textContent = data.max_hr;
        document.getElementById("bmi-value").textContent = data.bmi;
        document.getElementById("formula-value").textContent =
            data.formula === "manual" ? "Manual" : data.formula === "tanaka" ? "Tanaka" : "Standard";
        document.getElementById("method-value").textContent =
            data.method === "karvonen" ? "Karvonen" : "% Max HR";

        const tbody = document.getElementById("zone-body");
        tbody.innerHTML = "";
        const boundaries = document.getElementById("garmin-boundaries");
        boundaries.innerHTML = "";

        data.zones.forEach((z) => {
            const tr = document.createElement("tr");
            tr.setAttribute("data-zone", z.zone);
            tr.innerHTML =
                `<td>Zone ${z.zone}</td>` +
                `<td>${z.name}</td>` +
                `<td>${z.pct_low}% – ${z.pct_high}%</td>` +
                `<td>${z.bpm_low} – ${z.bpm_high} bpm</td>`;
            tbody.appendChild(tr);

            const chip = document.createElement("span");
            chip.className = `boundary-chip z${z.zone}`;
            chip.textContent = `Z${z.zone}: ${z.bpm_low} bpm`;
            boundaries.appendChild(chip);
        });

        results.classList.remove("hidden");
        results.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
        errorMsg.textContent = "Network error — is the server running?";
        errorMsg.classList.remove("hidden");
    }
});
