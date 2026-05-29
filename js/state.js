const COLORS = ['#C9A84C','#5B8FD4','#7DC47A','#D47A7A','#A87AC4','#D4A87A'];

async function updateNavLogo() {
  const first  = await DB.getSetting('shop_name_first')  || 'Barber';
  const second = await DB.getSetting('shop_name_second') || 'Pro';
  document.getElementById('navLogo').innerHTML = first + '<span>' + second + '</span>';
}

updateNavLogo();

let selectedBarberColor = COLORS[0];
let selectedClientBarber = null;
let selectedClientTime = null;
