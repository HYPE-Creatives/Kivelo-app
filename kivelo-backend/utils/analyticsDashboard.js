// utils/analyticsDashboard.js
const getAnalyticsDashboard = () => {
  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Kivelo Analytics</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="/socket.io/socket.io.js"></script>

<style>
  body{font-family:Inter,system-ui; margin:0; padding:20px; background:linear-gradient(135deg,#0f0f29,#1b1b3a,#24243e); color:#fff}
  .container{max-width:1200px;margin:0 auto}
  .header{text-align:center;margin-bottom:20px}
  .filters{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:18px}
  input,select{padding:8px;border-radius:8px;border:none}
  .cards{display:flex;gap:12px;flex-wrap:wrap;justify-content:space-between}
  .card{flex:1;min-width:180px;background:rgba(255,255,255,0.06);padding:16px;border-radius:12px;text-align:center}
  .chart-container{background:rgba(255,255,255,0.04);padding:16px;border-radius:12px;margin-top:18px}
  canvas{width:100%;height:320px}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>Kivelo Analytics (Real-time)</h1><p style="opacity:0.8">Live metrics — updates via WebSocket</p></div>

  <div class="filters">
    <input id="from" type="date"/>
    <input id="to" type="date"/>
    <select id="route"><option value="">All routes</option></select>
    <select id="client"><option value="">All clients</option><option value="mobile-app">mobile-app</option><option value="admin-dashboard">admin-dashboard</option><option value="internal-service">internal-service</option></select>
    <button id="apply">Apply</button>
  </div>

  <div class="cards">
    <div class="card"><h3 id="total">0</h3><div>Total Requests</div></div>
    <div class="card"><h3 id="routesCount">0</h3><div>Unique Routes</div></div>
    <div class="card"><h3 id="clientsCount">0</h3><div>Unique Clients</div></div>
  </div>

  <div class="chart-container">
    <canvas id="mainChart"></canvas>
  </div>
</div>

<script>
(function(){
  const socket = io();

  const fromEl = document.getElementById("from");
  const toEl = document.getElementById("to");
  const routeEl = document.getElementById("route");
  const clientEl = document.getElementById("client");
  const applyBtn = document.getElementById("apply");

  const totalEl = document.getElementById("total");
  const routesCountEl = document.getElementById("routesCount");
  const clientsCountEl = document.getElementById("clientsCount");

  let chart;
  let chartLabels = [];
  let chartData = [];

  async function fetchRoutes() {
    try {
      const res = await fetch("/api-analytics/v1/routes");
      const json = await res.json();
      const routes = json.routes || [];
      // populate dropdown
      routes.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r;
        opt.textContent = r;
        routeEl.appendChild(opt);
      });
    } catch (e) { console.warn("routes fetch failed", e); }
  }

  function buildQuery() {
    const params = new URLSearchParams();
    if (fromEl.value) params.append("from", fromEl.value);
    if (toEl.value) params.append("to", toEl.value);
    if (routeEl.value) params.append("route", routeEl.value);
    if (clientEl.value) params.append("client", clientEl.value);
    return params.toString();
  }

  async function loadStats() {
    try {
      const q = buildQuery();
      const res = await fetch("/api-analytics/v1/stats" + (q ? ("?"+q) : ""));
      const json = await res.json();

      totalEl.textContent = json.totalRequests || 0;
      routesCountEl.textContent = json.uniqueRoutes || 0;
      clientsCountEl.textContent = json.uniqueClients || 0;

      chartLabels = json.chartLabels || [];
      chartData = json.chartData || [];

      renderChart(chartLabels, chartData);
    } catch (e) {
      console.error("loadStats error", e);
    }
  }

  function renderChart(labels, data) {
    const ctx = document.getElementById("mainChart");
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "line",
      data: { labels, datasets: [{ label: "Requests", data, borderColor: "#6dd5fa", tension:0.25, fill:false }]},
      options: { responsive:true, plugins:{legend:{display:false}}, scales:{ x:{ ticks:{color:"#fff"} }, y:{ ticks:{color:"#fff"}}}}
    });
  }

  // Real-time updates: increment latest label or push new label, then update chart & cards
  socket.on("analytics:update", (payload) => {
    try {
      // payload.timestamp in ISO format => date day key
      const day = new Date(payload.timestamp).toISOString().slice(0,10);
      const i = chartLabels.indexOf(day);
      if (i === -1) {
        // new day label (prepend or push depending on sorting); we push
        chartLabels.push(day);
        chartData.push(1);
      } else {
        chartData[i] = (chartData[i] || 0) + 1;
      }
      // update totals
      totalEl.textContent = (parseInt(totalEl.textContent||"0",10) + 1).toString();
      // redraw chart
      renderChart(chartLabels, chartData);
    } catch (e) {
      console.warn("socket update error", e);
    }
  });

  applyBtn.addEventListener("click", loadStats);

  // init
  fetchRoutes();
  loadStats();

})();
</script>

</body>
</html>
`;
};

export default getAnalyticsDashboard;
