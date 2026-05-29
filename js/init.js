// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginOverlay').style.display === 'flex') doLogin();
});

// Set min date to today
const today = new Date().toISOString().slice(0,10);
document.getElementById('clientDate').min = today;

// Render inicial (async)
async function init() {
  await Promise.all([
    renderClientServices(),
    renderClientBarbers(),
    loadClientServices()
  ]);
}
init();
