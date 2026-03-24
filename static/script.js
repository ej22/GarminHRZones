const form = document.getElementById("hr-form");
const errorMsg = document.getElementById("error-msg");
const results = document.getElementById("results");
const methodSelect = document.getElementById("method");
const restingInput = document.getElementById("resting-hr");
const formulaSelect = document.getElementById("formula");
const manualHrGroup = document.getElementById("manual-hr-group");
const manualHrInput = document.getElementById("manual-hr");
const btnCalc = document.getElementById("btn-calc");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

methodSelect.addEventListener("change", () => {
    const opt = document.getElementById("rhr-optional");
    if (methodSelect.value === "karvonen") {
        restingInput.required = true;
        if (opt) opt.textContent = "(required)";
    } else {
        restingInput.required = false;
        if (opt) opt.textContent = "(optional)";
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

const ZONE_COLORS = ["#22d3ee", "#34d399", "#fbbf24", "#f97316", "#ef4444"];

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.classList.add("hidden");
    results.classList.add("hidden");
    btnCalc.classList.add("loading");

    const payload = {
        age: parseFloat(document.getElementById("age").value),
        weight_kg: parseFloat(document.getElementById("weight").value),
        height_cm: parseFloat(document.getElementById("height").value),
        formula: formulaSelect.value,
        method: methodSelect.value,
    };

    const rhr = restingInput.value;
    if (rhr) payload.resting_hr = parseFloat(rhr);

    const mhr = manualHrInput.value;
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
            btnCalc.classList.remove("loading");
            return;
        }

        renderResults(data);
        btnCalc.classList.remove("loading");
        results.classList.remove("hidden");
        results.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
        errorMsg.textContent = "Network error — is the server running?";
        errorMsg.classList.remove("hidden");
        btnCalc.classList.remove("loading");
    }
});

function renderResults(data) {
    // Max HR ring animation
    const hrRing = document.getElementById("hr-ring");
    const pct = Math.min(data.max_hr / 220, 1);
    const circumference = 2 * Math.PI * 52;
    hrRing.style.strokeDasharray = circumference;
    hrRing.style.strokeDashoffset = circumference;

    if (prefersReducedMotion) {
        hrRing.style.transition = "none";
        hrRing.style.strokeDashoffset = circumference * (1 - pct);
    } else {
        requestAnimationFrame(() => {
            hrRing.style.strokeDashoffset = circumference * (1 - pct);
        });
    }

    // Animate max HR number
    if (prefersReducedMotion) {
        document.getElementById("max-hr-value").textContent = data.max_hr;
    } else {
        animateValue("max-hr-value", 0, data.max_hr, 700);
    }

    document.getElementById("bmi-value").textContent = data.bmi;
    document.getElementById("formula-value").textContent =
        data.formula === "manual" ? "Manual" : data.formula === "tanaka" ? "Tanaka" : "Standard";
    document.getElementById("method-value").textContent =
        data.method === "karvonen" ? "Karvonen" : "% Max HR";

    renderSpectrum(data.zones);
    renderTable(data.zones);
    renderCards(data.zones);
    renderBoundaries(data.zones);
}

function renderSpectrum(zones) {
    const spectrum = document.getElementById("zone-spectrum");
    spectrum.innerHTML = "";
    const totalSpan = zones[zones.length - 1].bpm_high - zones[0].bpm_low;

    zones.forEach((z) => {
        const bar = document.createElement("div");
        bar.className = "zone-bar";
        bar.setAttribute("data-z", z.zone);
        const span = z.bpm_high - z.bpm_low;

        if (prefersReducedMotion) {
            bar.style.flexGrow = String(span / totalSpan);
        } else {
            bar.style.flexGrow = "0";
        }

        bar.innerHTML = `<span class="zone-bar-label">Z${z.zone}</span><span class="zone-bar-bpm">${z.bpm_low}\u2013${z.bpm_high}</span>`;
        spectrum.appendChild(bar);

        if (!prefersReducedMotion) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    bar.style.flexGrow = String(span / totalSpan);
                }, 40 + z.zone * 60);
            });
        }
    });
}

function renderTable(zones) {
    const tbody = document.getElementById("zone-body");
    tbody.innerHTML = "";

    zones.forEach((z) => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-zone", z.zone);
        tr.innerHTML =
            `<td><div class="zone-dot"></div></td>` +
            `<td>Zone ${z.zone} <span class="zone-name">${z.name}</span></td>` +
            `<td>${z.pct_low}\u2013${z.pct_high}%</td>` +
            `<td>${z.bpm_low}\u2013${z.bpm_high} <span class="zone-pct">bpm</span></td>`;
        tbody.appendChild(tr);
    });
}

function renderCards(zones) {
    const container = document.getElementById("zone-cards");
    container.innerHTML = "";

    zones.forEach((z) => {
        const card = document.createElement("div");
        card.className = "zone-card";
        card.setAttribute("data-zone", z.zone);
        card.innerHTML = `
            <div class="zone-card-left">
                <div class="zone-card-title">Zone ${z.zone}</div>
                <div class="zone-card-name">${z.name}</div>
            </div>
            <div class="zone-card-right">
                <div class="zone-card-bpm">${z.bpm_low}\u2013${z.bpm_high}</div>
                <div class="zone-card-pct">${z.pct_low}\u2013${z.pct_high}%</div>
            </div>`;
        container.appendChild(card);
    });
}

function renderBoundaries(zones) {
    const boundaries = document.getElementById("garmin-boundaries");
    boundaries.innerHTML = "";

    zones.forEach((z) => {
        const chip = document.createElement("div");
        chip.className = `boundary-chip z${z.zone}`;
        chip.innerHTML = `<span class="chip-zone">Z${z.zone}</span><span class="chip-bpm">${z.bpm_low}</span>`;
        boundaries.appendChild(chip);
    });
}

function animateValue(id, start, end, duration) {
    const el = document.getElementById(id);
    const range = end - start;
    const startTime = performance.now();

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + range * eased);
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}
