// ═══════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════
function toast(msg, err) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = err ? '#8B2020' : 'var(--gold)';
  t.style.color = err ? '#FFD0D0' : 'var(--dark)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function maskPhone(el) {
  let v = el.value.replace(/\D/g,'').slice(0,11);
  if (v.length > 6) v = '('+v.slice(0,2)+') '+v.slice(2,7)+'-'+v.slice(7);
  else if (v.length > 2) v = '('+v.slice(0,2)+') '+v.slice(2);
  else if (v.length > 0) v = '('+v;
  el.value = v;
}

function nextId(arr) {
  return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
}

function fmtDate(d) {
  if (!d) return '-';
  const [y,m,dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}

function scrollToBook() {
  document.getElementById('book-section').scrollIntoView({ behavior:'smooth' });
}
function scrollToServices() {
  document.getElementById('services-section').scrollIntoView({ behavior:'smooth' });
}

// ═══════════════════════════════════════
// TIME SLOTS
// ═══════════════════════════════════════
function generateSlots(open, close, interval) {
  const slots = [];
  let [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const closeMin = ch * 60 + cm;
  let cur = oh * 60 + om;
  while (cur + interval <= closeMin) {
    const hh = String(Math.floor(cur/60)).padStart(2,'0');
    const mm = String(cur%60).padStart(2,'0');
    slots.push(hh+':'+mm);
    cur += interval;
  }
  return slots;
}

// getTakenSlots e isDayOpen foram substituídos pela lógica async em loadClientTimes()
