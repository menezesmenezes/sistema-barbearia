// ═══════════════════════════════════════
// ADMIN SECTIONS
// ═══════════════════════════════════════
function showAdminSection(name, btn) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  if (btn) btn.classList.add('active');

  if (name === 'dashboard') renderAdminDashboard();
  if (name === 'appointments') renderAppointmentsTable();
  if (name === 'barbers') renderBarbersAdmin();
  if (name === 'services') renderServicesAdmin();
  if (name === 'schedule') renderScheduleAdmin();
  if (name === 'settings') renderSettingsAdmin();
}

// ── DASHBOARD ──
async function renderAdminDashboard() {
  const today = new Date().toISOString().slice(0,10);
  const [allAppts, todayAppts] = await Promise.all([
    DB.select('appointments'),
    DB.select('appointments', { eq: { date: today } })
  ]);
  const revenue = todayAppts.filter(a=>a.status==='concluido').reduce((s,a)=>s+parseFloat(a.service_price||0),0);
  const pending = allAppts.filter(a=>a.status==='pendente').length;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="stat-value">${todayAppts.length}</div><div class="stat-label">Hoje</div></div>
    <div class="stat-card"><div class="stat-value">${allAppts.length}</div><div class="stat-label">Total</div></div>
    <div class="stat-card"><div class="stat-value">${pending}</div><div class="stat-label">Pendentes</div></div>
    <div class="stat-card"><div class="stat-value">R$ ${revenue.toFixed(2)}</div><div class="stat-label">Faturado Hoje</div></div>
  `;

  const recent = [...allAppts].sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).slice(0,8);
  document.getElementById('dashboardTableBody').innerHTML = recent.map(a => `
    <tr>
      <td><strong style="color:#F0EAE0;">${a.client_name}</strong></td>
      <td>${a.client_phone}</td>
      <td>${a.barber_name}</td>
      <td>${a.service_name}</td>
      <td>${fmtDate(String(a.date))}</td>
      <td>${String(a.time).slice(0,5)}</td>
      <td>${statusBadge(a.status)}</td>
    </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:#5A4E46;padding:2rem;">Nenhum agendamento</td></tr>';
}

function statusBadge(s) {
  const map = { pendente:'badge-gold', confirmado:'badge-green', concluido:'badge-gray', cancelado:'badge-red' };
  return `<span class="badge ${map[s]||'badge-gray'}">${s}</span>`;
}

// ── APPOINTMENTS TABLE ──
async function renderAppointmentsTable() {
  const q  = (document.getElementById('searchAppt')?.value||'').trim();
  const st = document.getElementById('filterStatus')?.value||'';

  let opts = { order: 'date', asc: false };
  if (st) opts.eq = { status: st };

  let appts = await DB.select('appointments', opts);

  if (q) {
    const ql = q.toLowerCase();
    appts = appts.filter(a =>
      a.client_name.toLowerCase().includes(ql) || a.client_phone.includes(q)
    );
  }

  document.getElementById('apptTableBody').innerHTML = appts.map(a => `
    <tr>
      <td><strong style="color:#F0EAE0;">${a.client_name}</strong>${a.note?`<br><span style="color:#5A4E46;font-size:0.78rem;">${a.note}</span>`:''}</td>
      <td>${a.client_phone}</td>
      <td>${a.barber_name}</td>
      <td>${a.service_name}<br><span style="color:var(--gold);font-size:0.8rem;">R$ ${parseFloat(a.service_price).toFixed(2)}</span></td>
      <td>${fmtDate(String(a.date))} ${String(a.time).slice(0,5)}</td>
      <td>
        <select onchange="changeStatus(${a.id},this.value)" style="font-size:0.8rem;padding:0.3rem 0.5rem;">
          ${['pendente','confirmado','concluido','cancelado'].map(s=>`<option value="${s}"${a.status===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn-danger" onclick="deleteAppt(${a.id})">Excluir</button></td>
    </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:#5A4E46;padding:2rem;">Nenhum agendamento encontrado</td></tr>';
}

async function changeStatus(id, status) {
  try {
    await DB.update('appointments', { status }, { id });
    toast('Status atualizado');
  } catch(e) { toast('Erro ao atualizar', true); }
}

async function deleteAppt(id) {
  if (!confirm('Excluir este agendamento?')) return;
  await DB.delete('appointments', { id });
  renderAppointmentsTable();
  toast('Agendamento removido');
}

// ── BARBERS ──
async function renderBarbersAdmin() {
  const barbers = await DB.select('barbers', { order: 'name', asc: true });
  document.getElementById('barberColorPicker').innerHTML = COLORS.map((c,i) =>
    `<div class="color-dot${c===selectedBarberColor?' selected':''}" style="background:${c};" onclick="selectBarberColor('${c}')"></div>`
  ).join('');
  document.getElementById('barbersTableBody').innerHTML = barbers.map(b => `
    <tr>
      <td><div class="barber-avatar" style="background:${b.color};width:40px;height:40px;font-size:1rem;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;">${b.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div></td>
      <td><strong style="color:#F0EAE0;">${b.name}</strong></td>
      <td>${b.spec}</td>
      <td>${b.phone||'—'}</td>
      <td><button class="btn-danger" onclick="deleteBarber(${b.id})">Remover</button></td>
    </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:#5A4E46;padding:2rem;">Nenhum barbeiro</td></tr>';
}

function selectBarberColor(c) {
  selectedBarberColor = c;
  document.querySelectorAll('.color-dot').forEach(d => {
    d.classList.toggle('selected', d.style.background === c || d.style.backgroundColor === c);
  });
}

async function addBarber() {
  const name  = document.getElementById('newBarberName').value.trim();
  const spec  = document.getElementById('newBarberSpec').value.trim();
  const phone = document.getElementById('newBarberPhone').value.trim();
  if (!name) { toast('Informe o nome do barbeiro', true); return; }
  await DB.insert('barbers', { name, spec: spec||'Barbeiro', phone, color: selectedBarberColor });
  document.getElementById('newBarberName').value = '';
  document.getElementById('newBarberSpec').value = '';
  document.getElementById('newBarberPhone').value = '';
  renderBarbersAdmin();
  toast('Barbeiro adicionado');
}

async function deleteBarber(id) {
  if (!confirm('Remover este barbeiro?')) return;
  await DB.delete('barbers', { id });
  renderBarbersAdmin();
  toast('Barbeiro removido');
}

// ── SERVICES ──
async function renderServicesAdmin() {
  const svcs = await DB.select('services', { order: 'name', asc: true });
  document.getElementById('servicesTableBody').innerHTML = svcs.map(s => `
    <tr>
      <td><strong style="color:#F0EAE0;">${s.name}</strong></td>
      <td style="color:var(--gold);font-weight:600;">R$ ${parseFloat(s.price).toFixed(2)}</td>
      <td>${s.duration} min</td>
      <td><button class="btn-danger" onclick="deleteService(${s.id})">Remover</button></td>
    </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:#5A4E46;padding:2rem;">Nenhum serviço</td></tr>';
}

async function addService() {
  const name     = document.getElementById('newSvcName').value.trim();
  const price    = parseFloat(document.getElementById('newSvcPrice').value);
  const duration = parseInt(document.getElementById('newSvcDuration').value);
  const icon     = document.getElementById('newSvcIcon').value.trim() || '';
  if (!name || isNaN(price) || isNaN(duration)) { toast('Preencha todos os campos', true); return; }
  await DB.insert('services', { name, price, duration, icon });
  document.getElementById('newSvcName').value = '';
  document.getElementById('newSvcPrice').value = '';
  document.getElementById('newSvcDuration').value = '';
  document.getElementById('newSvcIcon').value = '';
  renderServicesAdmin();
  toast('Serviço adicionado');
}

async function deleteService(id) {
  if (!confirm('Remover este serviço?')) return;
  await DB.delete('services', { id });
  renderServicesAdmin();
  toast('Serviço removido');
}

// ── SCHEDULE ──
const DAYS_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

async function renderScheduleAdmin() {
  const days     = JSON.parse(await DB.getSetting('schedule_days')  || '[false,true,true,true,true,true,true]');
  const open     = await DB.getSetting('schedule_open')   || '09:00';
  const close    = await DB.getSetting('schedule_close')  || '19:00';
  const interval = await DB.getSetting('schedule_interval') || '30';
  document.getElementById('daysGrid').innerHTML = DAYS_LABELS.map((d, i) =>
    `<div class="day-toggle${days[i]?' on':''}" onclick="toggleDay(${i})" id="day_${i}">${d}</div>`
  ).join('');
  document.getElementById('openTime').value    = open;
  document.getElementById('closeTime').value   = close;
  document.getElementById('slotInterval').value = interval;
  renderBlocks();
}

function toggleDay(i) {
  const el = document.getElementById('day_' + i);
  el.classList.toggle('on');
}

async function saveSchedule() {
  const days = DAYS_LABELS.map((_, i) => document.getElementById('day_'+i).classList.contains('on'));
  await DB.setSetting('schedule_days', JSON.stringify(days));
  toast('Dias salvos');
}

async function saveHours() {
  const open     = document.getElementById('openTime').value;
  const close    = document.getElementById('closeTime').value;
  const interval = String(parseInt(document.getElementById('slotInterval').value) || 30);
  await Promise.all([
    DB.setSetting('schedule_open',     open),
    DB.setSetting('schedule_close',    close),
    DB.setSetting('schedule_interval', interval)
  ]);
  toast('Horários salvos');
}

async function addBlock() {
  const date = document.getElementById('blockDate').value;
  const time = document.getElementById('blockTime').value || null;
  if (!date) { toast('Informe a data', true); return; }
  await DB.insert('blocks', { date, time });
  document.getElementById('blockDate').value = '';
  document.getElementById('blockTime').value = '';
  renderBlocks();
  toast('Horário bloqueado');
}

async function renderBlocks() {
  const blocks = await DB.select('blocks', { order: 'date', asc: true });
  const el = document.getElementById('blocksList');
  if (!blocks.length) { el.innerHTML = '<p style="color:#5A4E46;font-size:0.875rem;">Nenhum bloqueio cadastrado</p>'; return; }
  el.innerHTML = blocks.map(b => `
    <div style="display:flex;align-items:center;gap:1rem;padding:0.6rem 0;border-bottom:1px solid var(--light-border);">
      <span style="color:#C0B5A8;font-size:0.9rem;">${fmtDate(String(b.date))} ${b.time ? '— '+String(b.time).slice(0,5) : '(dia todo)'}</span>
      <button class="btn-danger" onclick="removeBlock(${b.id})">Remover</button>
    </div>`).join('');
}

async function removeBlock(id) {
  await DB.delete('blocks', { id });
  renderBlocks();
  toast('Bloqueio removido');
}

// ── SETTINGS ──
async function renderSettingsAdmin() {
  const first  = await DB.getSetting('shop_name_first')  || 'Barber';
  const second = await DB.getSetting('shop_name_second') || 'Pro';
  document.getElementById('shopNameFirst').value = first;
  document.getElementById('shopNameSecond').value = second;
  document.getElementById('previewFirst').textContent = first;
  document.getElementById('previewSecond').textContent = second;
  document.getElementById('shopNameFirst').oninput = updatePreview;
  document.getElementById('shopNameSecond').oninput = updatePreview;
}

function updatePreview() {
  document.getElementById('previewFirst').textContent = document.getElementById('shopNameFirst').value || 'Barber';
  document.getElementById('previewSecond').textContent = document.getElementById('shopNameSecond').value || 'Pro';
}

async function saveShopName() {
  const first  = document.getElementById('shopNameFirst').value.trim();
  const second = document.getElementById('shopNameSecond').value.trim();
  if (!first && !second) { toast('Informe ao menos uma parte do nome', true); return; }
  await Promise.all([
    DB.setSetting('shop_name_first',  first  || ''),
    DB.setSetting('shop_name_second', second || '')
  ]);
  updateNavLogo();
  toast('Nome da barbearia atualizado');
}
