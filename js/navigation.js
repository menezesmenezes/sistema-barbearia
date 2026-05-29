// ═══════════════════════════════════════
// NAV / PAGES
// ═══════════════════════════════════════
let adminLoggedIn = false;

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('navClient').classList.toggle('active', page === 'client');
  document.getElementById('navAdmin').classList.toggle('active', page === 'admin');
  if (page === 'client') {
    renderClientServices();
    renderClientBarbers();
    loadClientServices();
  }
  if (page === 'admin') {
    renderAdminDashboard();
  }
}

function requireLogin() {
  if (adminLoggedIn) { showPage('admin'); return; }
  document.getElementById('loginOverlay').style.display = 'flex';
}

function closeLogin() {
  document.getElementById('loginOverlay').style.display = 'none';
}

async function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const pw = await DB.getSetting('admin_password');
  if (u === 'admin' && p === pw) {
    adminLoggedIn = true;
    closeLogin();
    showPage('admin');
  } else {
    toast('Usuário ou senha incorretos', true);
  }
}

function logout() {
  adminLoggedIn = false;
  showPage('client');
}
