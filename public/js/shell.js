function requireLogin() {
  if (!KRFlexAPI.isLoggedIn()) {
    window.location.href = '/index.html';
    throw new Error('Not logged in');
  }
}

function requireAdminPage() {
  requireLogin();
  if (!KRFlexAPI.isAdmin()) {
    document.getElementById('app').innerHTML =
      '<div class="app-shell"><div class="main-content"><h1>Access denied</h1><p>This screen is for Admins only.</p><a href="/me.html">Go to Me (HR)</a></div></div>';
    throw new Error('Not admin');
  }
}

function renderSidebar(activePage) {
  const isAdmin = KRFlexAPI.isAdmin();
  const links = isAdmin
    ? [
        ['dashboard.html', '📊 Dashboard'],
        ['material-stock.html', '🧵 Material Stock'],
        ['customers.html', '👥 Customers'],
        ['orders.html', '📦 Orders'],
        ['activity-logs.html', '📝 Activity & Logs'],
        ['me.html', '🙍 Me (HR)'],
      ]
    : [['me.html', '🙍 Me (HR)']];

  const navHtml = links
    .map(([href, label]) => `<a href="/${href}" class="${activePage === href ? 'active' : ''}">${label}</a>`)
    .join('');

  return `
    <div class="sidebar">
      <div>
        <h2>🖨️ KRFLEX</h2>
        <span class="role-tag">${KRFlexAPI.fullName() || ''} · ${KRFlexAPI.role() || ''}</span>
        <nav>${navHtml}</nav>
      </div>
      <button class="logout-btn" onclick="KRFlexAPI.logout()">Logout</button>
    </div>
  `;
}

function showToast(message, isError = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function pad2(n) { return String(n).padStart(2, '0'); }

function epochToDate(epoch) {
  if (epoch == null || epoch === '') return null;
  const d = new Date(Number(epoch) * 1000);
  return Number.isNaN(d.getTime()) ? null : d;
}

function epochToDateStr(epoch) {
  const d = epochToDate(epoch);
  if (!d) return '-';
  // Local calendar date (not UTC)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function epochToDateTimeStr(epoch) {
  const d = epochToDate(epoch);
  if (!d) return '-';
  // Local date + time (not UTC)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function statusBadge(status) {
  const cls = status === 'In Progress' ? 'status-inprogress'
    : status === 'Completed' ? 'status-completed'
    : 'status-delivered';
  return `<span class="status-badge ${cls}">${status}</span>`;
}
