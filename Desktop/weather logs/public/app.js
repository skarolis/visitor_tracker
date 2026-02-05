const el = (id) => document.getElementById(id);

const state = {
  selectedId: null,
};

let tempChart = null;

function setMsg(text, type) {
  const msg = el("msg");
  msg.textContent = text || "";
  msg.className = "msg" + (type ? ` ${type}` : "");
}

function toQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) usp.set(k, v);
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data && data.error ? data.error : "Request failed";
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

function resetForm() {
  state.selectedId = null;
  el("formTitle").textContent = "New log";
  el("id").value = "";
  el("log_date").valueAsDate = new Date();
  el("location").value = "";
  el("temp_c").value = "";
  el("condition").value = "";
  el("notes").value = "";
  el("deleteBtn").disabled = true;
  setMsg("");
}

function fillForm(row) {
  state.selectedId = row.id;
  el("formTitle").textContent = "Edit log";
  el("id").value = row.id;
  el("log_date").value = row.log_date;
  el("location").value = row.location || "";
  el("temp_c").value = row.temp_c ?? "";
  el("condition").value = row.condition || "";
  el("notes").value = row.notes || "";
  el("deleteBtn").disabled = false;
  setMsg("");
}

function renderList(rows) {
  const list = el("list");
  list.innerHTML = "";

  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "item";
    empty.textContent = "No logs yet.";
    list.appendChild(empty);
    return;
  }

  rows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "item";

    const left = document.createElement("div");
    left.className = "meta";

    const date = document.createElement("div");
    date.className = "date";
    date.textContent = row.log_date;

    const small = document.createElement("div");
    small.className = "small";

    const parts = [];
    if (row.location) parts.push(row.location);
    if (row.temp_c !== null && row.temp_c !== undefined) parts.push(`${row.temp_c}°C`);
    if (row.condition) parts.push(row.condition);

    small.textContent = parts.join(" • ") || "(no details)";

    left.appendChild(date);
    left.appendChild(small);

    const right = document.createElement("div");
    right.className = "row";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", async () => {
      try {
        const full = await api(`/api/logs/${row.id}`);
        fillForm(full);
      } catch (e) {
        setMsg(e.message, "error");
      }
    });

    right.appendChild(editBtn);

    item.appendChild(left);
    item.appendChild(right);

    list.appendChild(item);
  });
}

function ensureChart() {
  if (tempChart) return tempChart;
  const canvas = el("tempChart");
  if (!canvas || !window.Chart) return null;

  tempChart = new window.Chart(canvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Temp (°C)",
          data: [],
          borderWidth: 2,
          borderColor: "rgba(110, 231, 255, 0.9)",
          backgroundColor: "rgba(110, 231, 255, 0.15)",
          pointRadius: 2,
          tension: 0.25,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { mode: "index", intersect: false },
      },
      interaction: { mode: "nearest", intersect: false },
      scales: {
        x: {
          ticks: { color: "rgba(255,255,255,0.7)" },
          grid: { color: "rgba(255,255,255,0.06)" },
        },
        y: {
          ticks: { color: "rgba(255,255,255,0.7)" },
          grid: { color: "rgba(255,255,255,0.06)" },
        },
      },
    },
  });

  return tempChart;
}

function updateChart(rows) {
  const chart = ensureChart();
  if (!chart) return;

  const points = (rows || [])
    .filter((r) => r.temp_c !== null && r.temp_c !== undefined)
    .slice()
    .sort((a, b) => a.log_date.localeCompare(b.log_date));

  chart.data.labels = points.map((p) => p.log_date);
  chart.data.datasets[0].data = points.map((p) => p.temp_c);
  chart.update();

  const hint = el("chartHint");
  if (hint) {
    hint.textContent = points.length
      ? `Showing ${points.length} point(s).`
      : "No temperature data to chart yet.";
  }
}

async function refresh() {
  setMsg("");
  const from = el("from").value;
  const to = el("to").value;

  const rows = await api(`/api/logs${toQuery({ from, to })}`);
  renderList(rows);
  updateChart(rows);
}

async function onSubmit(e) {
  e.preventDefault();
  setMsg("");

  const payload = {
    log_date: el("log_date").value,
    location: el("location").value.trim() || null,
    temp_c: el("temp_c").value === "" ? null : Number(el("temp_c").value),
    condition: el("condition").value.trim() || null,
    notes: el("notes").value.trim() || null,
  };

  try {
    if (state.selectedId) {
      await api(`/api/logs/${state.selectedId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setMsg("Updated.", "ok");
    } else {
      await api("/api/logs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMsg("Saved.", "ok");
    }

    await refresh();
    resetForm();
  } catch (e2) {
    setMsg(e2.message, "error");
  }
}

async function onDelete() {
  if (!state.selectedId) return;
  setMsg("");

  try {
    await api(`/api/logs/${state.selectedId}`, { method: "DELETE" });
    setMsg("Deleted.", "ok");
    await refresh();
    resetForm();
  } catch (e) {
    setMsg(e.message, "error");
  }
}

el("form").addEventListener("submit", onSubmit);
el("deleteBtn").addEventListener("click", onDelete);
el("resetBtn").addEventListener("click", resetForm);
el("refreshBtn").addEventListener("click", () => refresh().catch((e) => setMsg(e.message, "error")));
el("clearFiltersBtn").addEventListener("click", () => {
  el("from").value = "";
  el("to").value = "";
  refresh().catch((e) => setMsg(e.message, "error"));
});
el("newBtn").addEventListener("click", resetForm);

resetForm();
refresh().catch((e) => setMsg(e.message, "error"));
