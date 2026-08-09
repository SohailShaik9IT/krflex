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

function epochToDateStr(epoch) {
  if (!epoch) return '-';
  const d = new Date(epoch * 1000);
  return d.toISOString().slice(0, 10);
}

function epochToDateTimeStr(epoch) {
  if (!epoch) return '-';
  const d = new Date(epoch * 1000);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

function statusBadge(status) {
  const cls = status === 'In Progress' ? 'status-inprogress'
    : status === 'Completed' ? 'status-completed'
    : 'status-delivered';
  return `<span class="status-badge ${cls}">${status}</span>`;
}
