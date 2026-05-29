// ═══════════════════════════════════════
// CLIENT PAGE
// ═══════════════════════════════════════
async function renderClientServices() {
  const svcs = await DB.select('services', { order: 'name', asc: true });
  document.getElementById('servicesGrid').innerHTML = svcs.map(s => `
    <div class="service-card">
      <div class="service-name">${s.name}</div>
      <div class="service-price">R$ ${parseFloat(s.price).toFixed(2)}</div>
      <div class="service-duration">${s.duration} min</div>
    </div>`).join('') || '<p style="color:#5A4E46;padding:1.5rem;">Nenhum serviço cadastrado.</p>';
}

async function renderClientBarbers() {
  const barbers = await DB.select('barbers', { order: 'name', asc: true });
  document.getElementById('barbersClientGrid').innerHTML = barbers.map(b => `
    <div class="barber-card" id="bc_${b.id}" onclick="selectClientBarber(${b.id})">
      <div class="barber-avatar" style="background:${b.color};">${b.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
      <div class="barber-name">${b.name}</div>
      <div class="barber-spec">${b.spec}</div>
    </div>`).join('') || '<p style="color:#5A4E46;">Nenhum barbeiro disponível.</p>';
}

function selectClientBarber(id) {
  selectedClientBarber = id;
  document.querySelectorAll('.barber-card').forEach(c => c.classList.remove('selected'));
  const el = document.getElementById('bc_'+id);
  if (el) el.classList.add('selected');
  loadClientTimes();
}

async function loadClientServices() {
  const svcs = await DB.select('services', { order: 'name', asc: true });
  const sel = document.getElementById('clientService');
  sel.innerHTML = '<option value="">— escolha um serviço —</option>' +
    svcs.map(s => `<option value="${s.id}">${s.icon||''} ${s.name} — R$ ${parseFloat(s.price).toFixed(2)}</option>`).join('');
}

async function loadClientTimes() {
  const date = document.getElementById('clientDate').value;
  const grid = document.getElementById('clientTimeGrid');
  selectedClientTime = null;

  if (!date) { grid.innerHTML = '<p style="color:#5A4E46;font-size:0.9rem;">Selecione uma data</p>'; return; }
  if (!selectedClientBarber) { grid.innerHTML = '<p style="color:#5A4E46;font-size:0.9rem;">Selecione um barbeiro primeiro</p>'; return; }

  grid.innerHTML = '<p style="color:#5A4E46;font-size:0.9rem;">Carregando horários…</p>';

  const schedDays     = JSON.parse(await DB.getSetting('schedule_days') || '[false,true,true,true,true,true,true]');
  const schedOpen     = await DB.getSetting('schedule_open')     || '09:00';
  const schedClose    = await DB.getSetting('schedule_close')    || '19:00';
  const schedInterval = parseInt(await DB.getSetting('schedule_interval') || '30');

  const dow = new Date(date + 'T12:00:00').getDay();
  if (!schedDays[dow]) {
    grid.innerHTML = '<p style="color:#9B3A3A;font-size:0.9rem;">Barbearia fechada neste dia</p>';
    return;
  }

  const dayBlocks = await DB.select('blocks', { eq: { date } });
  if (dayBlocks.some(b => !b.time)) {
    grid.innerHTML = '<p style="color:#9B3A3A;font-size:0.9rem;">Data bloqueada</p>';
    return;
  }

  const slots = generateSlots(schedOpen, schedClose, schedInterval);
  const takenAppts = await DB.select('appointments', { eq: { barber_id: selectedClientBarber, date } });
  const takenTimes = new Set([
    ...takenAppts.filter(a => a.status !== 'cancelado').map(a => String(a.time).slice(0,5)),
    ...dayBlocks.filter(b => b.time).map(b => String(b.time).slice(0,5))
  ]);

  if (!slots.length) { grid.innerHTML = '<p style="color:#5A4E46;font-size:0.9rem;">Sem horários configurados</p>'; return; }

  grid.innerHTML = slots.map(s => {
    const t = takenTimes.has(s);
    return `<div class="time-slot${t?' taken':''}" onclick="${t?'':'selectTime(\''+s+'\')'}">
      ${s}${t?' <span style="font-size:0.65rem;display:block;color:#6B5B4E;">ocupado</span>':''}
    </div>`;
  }).join('');
}

function selectTime(t) {
  selectedClientTime = t;
  document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
}

async function submitBooking() {
  const name  = document.getElementById('clientName').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const date  = document.getElementById('clientDate').value;
  const svcId = parseInt(document.getElementById('clientService').value);
  const note  = document.getElementById('clientNote').value.trim();

  if (!name)  { toast('Informe seu nome', true); return; }
  if (!phone || phone.length < 14) { toast('Informe um telefone válido', true); return; }
  if (!selectedClientBarber) { toast('Escolha um barbeiro', true); return; }
  if (!svcId) { toast('Selecione um serviço', true); return; }
  if (!date)  { toast('Selecione uma data', true); return; }
  if (!selectedClientTime)   { toast('Selecione um horário', true); return; }

  // Busca nome do barbeiro e serviço
  const [barbers, services] = await Promise.all([
    DB.select('barbers',  { eq: { id: selectedClientBarber } }),
    DB.select('services', { eq: { id: svcId } })
  ]);
  const barber  = barbers[0];
  const service = services[0];

  try {
    await DB.insert('appointments', {
      client_name:   name,
      client_phone:  phone,
      barber_id:     selectedClientBarber,
      barber_name:   barber?.name  || '—',
      service_id:    svcId,
      service_name:  service?.name || '—',
      service_price: service?.price || 0,
      date,
      time: selectedClientTime,
      note,
      status: 'pendente'
    });

    document.getElementById('bookingForm').style.display = 'none';
    document.getElementById('successBox').classList.add('show');
    document.getElementById('successText').textContent =
      `${name}, seu agendamento para ${service?.name} com ${barber?.name} está confirmado para ${fmtDate(date)} às ${selectedClientTime}. Aguardamos você!`;
  } catch(err) {
    toast('Erro ao agendar. Tente novamente.', true);
    console.error(err);
  }
}

function resetBooking() {
  document.getElementById('bookingForm').style.display = 'block';
  document.getElementById('successBox').classList.remove('show');
  document.getElementById('clientName').value = '';
  document.getElementById('clientPhone').value = '';
  document.getElementById('clientDate').value = '';
  document.getElementById('clientNote').value = '';
  document.getElementById('clientService').value = '';
  selectedClientBarber = null;
  selectedClientTime = null;
  document.querySelectorAll('.barber-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('clientTimeGrid').innerHTML = '<p style="color:#5A4E46;font-size:0.9rem;">Selecione uma data</p>';
}
