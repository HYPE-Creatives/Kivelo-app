// utils/analyticsDashboard.js
const getAnalyticsDashboard = () => {
  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Kivelo Analytics Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="/socket.io/socket.io.js"></script>

<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif;
    margin: 0;
    padding: 20px;
    background: linear-gradient(135deg, #0a0e27, #1a1d3a, #1e2139);
    color: #e0e7ff;
    min-height: 100vh;
  }
  .container { max-width: 1800px; margin: 0 auto; }
  
  .header {
    text-align: center;
    margin-bottom: 30px;
    animation: slideDown 0.6s ease-out;
  }
  .home-link {
    text-align: left;
    margin-bottom: 16px;
  }
  .home-link a {
    color: #60a5fa;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: color 0.2s;
  }
  .home-link a:hover {
    color: #a78bfa;
  }
  .header h1 {
    margin: 0;
    font-size: 36px;
    font-weight: 700;
    background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .tabs {
    display: flex;
    gap: 12px;
    margin-bottom: 30px;
    flex-wrap: wrap;
  }
  .tab-btn {
    padding: 12px 20px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    font-size: 13px;
  }
  .tab-btn.active {
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    color: #fff;
    border-color: #60a5fa;
  }
  .tab-btn:hover:not(.active) {
    background: rgba(99, 102, 241, 0.2);
  }
  
  .tab-content {
    display: none;
  }
  .tab-content.active {
    display: block;
    animation: fadeIn 0.3s ease-out;
  }
  
  .controls {
    display: flex;
    gap: 12px;
    justify-content: center;
    align-items: center;
    margin-bottom: 30px;
    flex-wrap: wrap;
    padding: 20px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08));
    border-radius: 16px;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }
  .filter-group {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  input, select {
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 247, 0.3);
    background: rgba(30, 33, 57, 0.8);
    color: #e0e7ff;
    font-family: inherit;
    font-size: 13px;
    transition: all 0.2s;
  }
  input:focus, select:focus {
    outline: none;
    border-color: #60a5fa;
    background: rgba(30, 33, 57, 0.95);
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }
  
  .button-group {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  button {
    padding: 10px 18px;
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(96, 165, 250, 0.3);
    white-space: nowrap;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: box-shadow 0.2s;
    flex-shrink: 0;
  }
  button:hover {
    box-shadow: 0 6px 20px rgba(96, 165, 250, 0.4);
  }
  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  button span {
    display: flex;
    align-items: center;
  }
  
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 50%;
    border-top-color: #fff;
    border-right-color: #fff;
    visibility: hidden;
  }
  button.loading .spinner {
    visibility: visible;
    animation: spin 0.8s linear infinite;
  }
  
  .btn-secondary {
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    box-shadow: none;
  }
  .btn-secondary:hover {
    background: rgba(99, 102, 241, 0.3);
  }
  
  .metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 30px;
  }
  .card {
    background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(167, 139, 250, 0.1));
    padding: 24px;
    border-radius: 16px;
    border: 1px solid rgba(96, 165, 250, 0.2);
    text-align: center;
    transition: all 0.3s;
  }
  .card:hover {
    transform: translateY(-8px);
    border-color: rgba(96, 165, 250, 0.4);
    box-shadow: 0 20px 40px rgba(96, 165, 250, 0.15);
  }
  .card h3 {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .card .label {
    margin-top: 10px;
    color: #a5b4fc;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 500;
  }
  
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(520px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  .chart-container {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05));
    padding: 24px;
    border-radius: 16px;
    border: 1px solid rgba(96, 165, 250, 0.15);
    transition: all 0.3s;
  }
  .chart-container:hover {
    border-color: rgba(96, 165, 250, 0.3);
    box-shadow: 0 10px 30px rgba(96, 165, 250, 0.1);
  }
  .chart-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #a5b4fc;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
  .chart-wrapper {
    position: relative;
    height: 300px;
  }
  canvas { width: 100% !important; height: 100% !important; }
  
  .table-card {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05));
    padding: 20px;
    border-radius: 12px;
    border: 1px solid rgba(96, 165, 250, 0.15);
    margin-bottom: 20px;
    overflow-x: auto;
  }
  .table-card h3 {
    margin: 0 0 15px 0;
    font-size: 14px;
    color: #a5b4fc;
    text-transform: uppercase;
    font-weight: 600;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  table th {
    background: rgba(96, 165, 250, 0.1);
    padding: 12px;
    text-align: left;
    color: #60a5fa;
    font-weight: 600;
    border-bottom: 1px solid rgba(96, 165, 250, 0.2);
  }
  table td {
    padding: 12px;
    border-bottom: 1px solid rgba(96, 165, 250, 0.1);
    color: #e0e7ff;
  }
  table tr:hover {
    background: rgba(96, 165, 250, 0.05);
  }
  
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 30px;
  }
  .stat-card {
    background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(167, 139, 250, 0.1));
    padding: 20px;
    border-radius: 12px;
    border: 1px solid rgba(96, 165, 250, 0.2);
    text-align: center;
  }
  .stat-card h3 {
    margin: 0 0 10px 0;
    font-size: 28px;
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .stat-card p {
    margin: 0;
    color: #a5b4fc;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  
  @media (max-width: 768px) {
    .charts-grid { grid-template-columns: 1fr; }
    .header h1 { font-size: 28px; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="home-link">
      <a href="/">← Back to Home</a>
    </div>
    <h1>📊 Analytics Dashboard</h1>
  </div>

  <div class="tabs">
    <button class="tab-btn active" data-tab="api-metrics">API Metrics</button>
    <button class="tab-btn" data-tab="auth-events">Auth Events</button>
    <button class="tab-btn" data-tab="user-stats">User Stats</button>
    <button class="tab-btn" data-tab="security">Security</button>
  </div>

  <!-- API METRICS TAB -->
  <div id="api-metrics" class="tab-content active">
    <div class="controls">
      <div class="filter-group">
        <input id="from" type="date" placeholder="From date"/>
        <input id="to" type="date" placeholder="To date"/>
      </div>
      <div class="filter-group">
        <select id="route"><option value="">All routes</option></select>
        <select id="client">
          <option value="">All clients</option>
          <option value="mobile-app">Mobile App</option>
          <option value="admin-dashboard">Admin Dashboard</option>
          <option value="internal-service">Internal Service</option>
        </select>
      </div>
      <div class="button-group">
        <button id="apply">
          <div class="spinner"></div>
          <span>🔄 Refresh</span>
        </button>
      </div>
    </div>

    <div class="metrics">
      <div class="card">
        <h3 id="total">-</h3>
        <div class="label">Total Requests</div>
      </div>
      <div class="card">
        <h3 id="routesCount">-</h3>
        <div class="label">Unique Routes</div>
      </div>
      <div class="card">
        <h3 id="clientsCount">-</h3>
        <div class="label">Unique Clients</div>
      </div>
      <div class="card">
        <h3 id="avgResponse">-</h3>
        <div class="label">Avg Response (ms)</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-container">
        <div class="chart-title">📈 Requests Over Time</div>
        <div class="chart-wrapper"><canvas id="timeSeriesChart"></canvas></div>
      </div>
      <div class="chart-container">
        <div class="chart-title">🎯 Top Routes</div>
        <div class="chart-wrapper"><canvas id="routesChart"></canvas></div>
      </div>
      <div class="chart-container">
        <div class="chart-title">👥 Client Distribution</div>
        <div class="chart-wrapper"><canvas id="clientsChart"></canvas></div>
      </div>
      <div class="chart-container">
        <div class="chart-title">🔍 Status Codes</div>
        <div class="chart-wrapper"><canvas id="statusChart"></canvas></div>
      </div>
    </div>
  </div>

  <!-- AUTH EVENTS TAB -->
  <div id="auth-events" class="tab-content">
    <div class="stat-grid" id="authStats"></div>
    <div class="table-card">
      <h3>Recent Authentication Events</h3>
      <table>
        <thead><tr><th>Timestamp</th><th>Action</th><th>User</th><th>IP</th></tr></thead>
        <tbody id="authEventsBody"></tbody>
      </table>
    </div>
  </div>

  <!-- USER STATS TAB -->
  <div id="user-stats" class="tab-content">
    <div class="stat-grid" id="userStats"></div>
  </div>

  <!-- SECURITY TAB -->
  <div id="security" class="tab-content">
    <div class="stat-grid" id="securityStats"></div>
    <div class="table-card">
      <h3>⚠️ Suspicious IPs (5+ Failed Logins)</h3>
      <table>
        <thead><tr><th>IP Address</th><th>Failed Attempts</th></tr></thead>
        <tbody id="suspiciousIPsBody"></tbody>
      </table>
    </div>
  </div>
</div>

<script>
(function(){
  const socket = io();
  let charts = { timeSeries: null, routes: null, clients: null, status: null };

  const fromEl = document.getElementById("from");
  const toEl = document.getElementById("to");
  const routeEl = document.getElementById("route");
  const clientEl = document.getElementById("client");
  const applyBtn = document.getElementById("apply");

  const totalEl = document.getElementById("total");
  const routesCountEl = document.getElementById("routesCount");
  const clientsCountEl = document.getElementById("clientsCount");
  const avgResponseEl = document.getElementById("avgResponse");

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      const tabName = e.target.dataset.tab;
      document.getElementById(tabName).classList.add('active');
      e.target.classList.add('active');
      loadTabData(tabName);
    });
  });

  async function fetchRoutes() {
    try {
      const res = await fetch("/api-analytics/v1/routes");
      const json = await res.json();
      const routes = json.routes || [];
      routes.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r;
        opt.textContent = r.length > 50 ? r.substring(0, 47) + "..." : r;
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

  async function loadApiMetrics() {
    try {
      const q = buildQuery();
      const url = "/api-analytics/v1/stats" + (q ? ("?" + q) : "");
      applyBtn.classList.add("loading");
      applyBtn.disabled = true;
      
      const res = await fetch(url);
      if (!res.ok) {
        console.error("Failed to load stats: " + res.status);
        applyBtn.classList.remove("loading");
        applyBtn.disabled = false;
        return;
      }
      
      const json = await res.json();
      totalEl.textContent = json.totalRequests || 0;
      routesCountEl.textContent = json.uniqueRoutes || 0;
      clientsCountEl.textContent = json.uniqueClients || 0;
      avgResponseEl.textContent = Math.round((json.avgResponseTime || 0) * 10) / 10;

      renderTimeSeriesChart(json.chartLabels || [], json.chartData || []);
      renderRoutesChart(json.routeBreakdown || []);
      renderClientsChart(json.clientBreakdown || []);
      renderStatusChart(json.statusBreakdown || []);
      
      requestAnimationFrame(() => {
        applyBtn.classList.remove("loading");
        applyBtn.disabled = false;
      });
    } catch (e) {
      console.error("loadApiMetrics error:", e);
      requestAnimationFrame(() => {
        applyBtn.classList.remove("loading");
        applyBtn.disabled = false;
      });
    }
  }

  async function loadAuthEvents() {
    try {
      const res = await fetch('/api/v1/advanced-analytics/auth/events?days=30&limit=100');
      const json = await res.json();
      if (json.success) {
        const { logins, logouts, passwordChanges, failedLogins, recentEvents } = json.data;
        document.getElementById('authStats').innerHTML = \`
          <div class="stat-card"><h3>\${logins}</h3><p>Logins</p></div>
          <div class="stat-card"><h3>\${logouts}</h3><p>Logouts</p></div>
          <div class="stat-card"><h3>\${passwordChanges}</h3><p>Password Changes</p></div>
          <div class="stat-card"><h3>\${failedLogins}</h3><p>Failed Logins</p></div>
        \`;
        
        const tableBody = document.getElementById('authEventsBody');
        tableBody.innerHTML = (recentEvents || []).slice(0, 20).map(evt => \`
          <tr>
            <td>\${new Date(evt.timestamp).toLocaleString()}</td>
            <td><strong>\${evt.action}</strong></td>
            <td>\${evt.userId || 'N/A'}</td>
            <td>\${evt.ipAddress || 'N/A'}</td>
          </tr>
        \`).join('');
      }
    } catch (e) { console.error("loadAuthEvents error:", e); }
  }

  async function loadUserStats() {
    try {
      const res = await fetch('/api/v1/advanced-analytics/users/stats');
      const json = await res.json();
      if (json.success) {
        const { totalUsers, totalParents, totalChildren, activeToday } = json.data;
        document.getElementById('userStats').innerHTML = \`
          <div class="stat-card"><h3>\${totalUsers}</h3><p>Total Users</p></div>
          <div class="stat-card"><h3>\${totalParents}</h3><p>Parents</p></div>
          <div class="stat-card"><h3>\${totalChildren}</h3><p>Children</p></div>
          <div class="stat-card"><h3>\${activeToday}</h3><p>Active Today</p></div>
        \`;
      }
    } catch (e) { console.error("loadUserStats error:", e); }
  }

  async function loadSecurity() {
    try {
      const res = await fetch('/api/v1/advanced-analytics/security/summary');
      const json = await res.json();
      if (json.success) {
        const { failedLogins, suspiciousIPs } = json.data;
        document.getElementById('securityStats').innerHTML = \`
          <div class="stat-card"><h3>\${failedLogins}</h3><p>Failed Logins (30d)</p></div>
          <div class="stat-card"><h3>\${suspiciousIPs.length}</h3><p>Suspicious IPs</p></div>
        \`;
        
        const tableBody = document.getElementById('suspiciousIPsBody');
        tableBody.innerHTML = (suspiciousIPs || []).map(ip => \`
          <tr>
            <td><strong>\${ip._id}</strong></td>
            <td style="color: #ef4444"><strong>\${ip.count}</strong></td>
          </tr>
        \`).join('');
      }
    } catch (e) { console.error("loadSecurity error:", e); }
  }

  function loadTabData(tabName) {
    if (tabName === 'api-metrics') loadApiMetrics();
    else if (tabName === 'auth-events') loadAuthEvents();
    else if (tabName === 'user-stats') loadUserStats();
    else if (tabName === 'security') loadSecurity();
  }

  // Chart rendering functions
  function renderTimeSeriesChart(labels, data) {
    const ctx = document.getElementById("timeSeriesChart");
    if (charts.timeSeries) charts.timeSeries.destroy();
    if (!labels || labels.length === 0) {
      ctx.parentElement.parentElement.innerHTML = '<div style="text-align:center;padding:80px 20px;color:#64748b">📭 No data</div>';
      return;
    }
    charts.timeSeries = new Chart(ctx, {
      type: "line",
      data: { labels, datasets: [{ label: "Requests", data, borderColor: "#60a5fa", backgroundColor: "rgba(96, 165, 250, 0.08)", tension: 0.4, fill: true, pointRadius: 5, pointBackgroundColor: "#60a5fa", pointBorderColor: "#fff", pointBorderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top', labels: { color: "#a5b4fc", font: { size: 12, weight: '600' }, padding: 15, boxWidth: 12 } } }, scales: { x: { ticks: { color: "rgba(165, 180, 252, 0.6)", font: { size: 11 } }, grid: { color: "rgba(96, 165, 250, 0.05)" } }, y: { ticks: { color: "rgba(165, 180, 252, 0.6)", font: { size: 11 } }, grid: { color: "rgba(96, 165, 250, 0.05)" }, beginAtZero: true } } }
    });
  }

  function renderRoutesChart(routes) {
    const ctx = document.getElementById("routesChart");
    if (charts.routes) charts.routes.destroy();
    if (!routes || routes.length === 0) {
      ctx.parentElement.parentElement.innerHTML = '<div style="text-align:center;padding:80px 20px;color:#64748b">🚫 No data</div>';
      return;
    }
    const topRoutes = routes.slice(0, 8);
    const labels = topRoutes.map(r => (r._id || r.route || "Unknown").substring(0, 35));
    const data = topRoutes.map(r => r.count);
    charts.routes = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: [{ label: "Requests", data, backgroundColor: "rgba(96, 165, 250, 0.7)", borderColor: "#60a5fa", borderWidth: 1, borderRadius: 8 }] },
      options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top', labels: { color: "#a5b4fc", font: { size: 12, weight: '600' }, padding: 15, boxWidth: 12 } } }, scales: { x: { ticks: { color: "rgba(165, 180, 252, 0.6)", font: { size: 11 } }, grid: { color: "rgba(96, 165, 250, 0.05)" } }, y: { ticks: { color: "rgba(165, 180, 252, 0.6)", font: { size: 11 } }, grid: { display: false } } } }
    });
  }

  function renderClientsChart(clients) {
    const ctx = document.getElementById("clientsChart");
    if (charts.clients) charts.clients.destroy();
    if (!clients || clients.length === 0) {
      ctx.parentElement.parentElement.innerHTML = '<div style="text-align:center;padding:80px 20px;color:#64748b">🤷 No data</div>';
      return;
    }
    const labels = clients.map(c => c._id || c.clientType || "Unknown");
    const data = clients.map(c => c.count);
    const colors = ["#60a5fa", "#a78bfa", "#f472b6", "#fb923c", "#10b981", "#06b6d4"];
    charts.clients = new Chart(ctx, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderColor: "rgba(255,255,255,0.1)", borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top', labels: { color: "#a5b4fc", font: { size: 12, weight: '600' }, padding: 15, boxWidth: 12 } } } }
    });
  }

  function renderStatusChart(statuses) {
    const ctx = document.getElementById("statusChart");
    if (charts.status) charts.status.destroy();
    if (!statuses || statuses.length === 0) {
      ctx.parentElement.parentElement.innerHTML = '<div style="text-align:center;padding:80px 20px;color:#64748b">❓ No data</div>';
      return;
    }
    const statusColors = { "200": "#10b981", "201": "#10b981", "204": "#06b6d4", "400": "#f59e0b", "401": "#f97316", "403": "#f97316", "404": "#f97316", "500": "#ef4444" };
    const labels = statuses.map(s => s._id || "Unknown");
    const data = statuses.map(s => s.count);
    const colors = statuses.map(s => statusColors[s._id] || "#6dd5fa");
    charts.status = new Chart(ctx, {
      type: "radar",
      data: { labels, datasets: [{ label: "Count", data, borderColor: "#60a5fa", backgroundColor: "rgba(96, 165, 250, 0.15)", pointBackgroundColor: colors, pointBorderColor: "#fff", pointBorderWidth: 2, pointRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top', labels: { color: "#a5b4fc", font: { size: 12, weight: '600' }, padding: 15, boxWidth: 12 } } }, scales: { r: { ticks: { color: "rgba(165, 180, 252, 0.6)", font: { size: 10 } }, grid: { color: "rgba(96, 165, 250, 0.1)" } } } }
    });
  }

  applyBtn.addEventListener("click", loadApiMetrics);
  fromEl.addEventListener("change", loadApiMetrics);
  toEl.addEventListener("change", loadApiMetrics);
  routeEl.addEventListener("change", loadApiMetrics);
  clientEl.addEventListener("change", loadApiMetrics);
  
  fetchRoutes();
  loadApiMetrics();
})();
</script>
</body>
</html>
`;
};

export default getAnalyticsDashboard;
