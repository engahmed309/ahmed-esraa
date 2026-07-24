// ===== Wedding date: change here if the time/date needs updating =====
const WEDDING_DATE = new Date('2026-08-05T20:00:00+03:00');

// ===== Gate (opening doors) =====
document.documentElement.classList.add('gate-locked');

const gate = document.getElementById('gate');
const heroReveals = document.querySelectorAll('#hero .reveal');
const GATE_DELAY = 1800; // ms before the doors open automatically

let gateOpened = false;
function openGate() {
  if (gateOpened) return;
  gateOpened = true;
  gate.classList.add('is-open');
  document.documentElement.classList.remove('gate-locked');

  heroReveals.forEach((el, i) => {
    setTimeout(() => el.classList.add('in-view'), 500 + i * 180);
  });

  setTimeout(() => gate.classList.add('is-hidden'), 1300);
}

const gateTimer = setTimeout(openGate, GATE_DELAY);
gate.addEventListener('click', () => { clearTimeout(gateTimer); openGate(); });

// ===== Scroll reveal =====
const revealEls = document.querySelectorAll('.reveal:not(#hero .reveal)');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
revealEls.forEach((el) => observer.observe(el));

// ===== Countdown =====
function updateCountdown() {
  const now = new Date();
  const diff = WEDDING_DATE - now;

  const days = document.getElementById('cd-days');
  const hours = document.getElementById('cd-hours');
  const mins = document.getElementById('cd-mins');
  const secs = document.getElementById('cd-secs');

  if (diff <= 0) {
    days.textContent = hours.textContent = mins.textContent = secs.textContent = '٠';
    return;
  }

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  const toArabicDigits = (n) => n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

  days.textContent = toArabicDigits(d);
  hours.textContent = toArabicDigits(h.toString().padStart(2, '0'));
  mins.textContent = toArabicDigits(m.toString().padStart(2, '0'));
  secs.textContent = toArabicDigits(s.toString().padStart(2, '0'));
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ===== Floating petals =====
const petalsContainer = document.getElementById('petals');
const petalSymbols = ['✿', '❀', '✾', '🌸'];

function spawnPetal() {
  const petal = document.createElement('span');
  petal.className = 'petal';
  petal.textContent = petalSymbols[Math.floor(Math.random() * petalSymbols.length)];
  petal.style.left = Math.random() * 100 + 'vw';
  petal.style.fontSize = 12 + Math.random() * 14 + 'px';
  const duration = 9 + Math.random() * 8;
  petal.style.animationDuration = duration + 's';
  petalsContainer.appendChild(petal);
  setTimeout(() => petal.remove(), duration * 1000);
}

setInterval(spawnPetal, 900);
for (let i = 0; i < 5; i++) setTimeout(spawnPetal, i * 400);

// ===== Flying butterflies =====
const butterflyContainer = document.getElementById('butterflies');
const butterflyPaths = ['path-a', 'path-b', 'path-c'];
const MAX_BUTTERFLIES = 28;
let butterflyCount = 0;

function spawnButterfly() {
  if (butterflyCount >= MAX_BUTTERFLIES) return;
  butterflyCount++;

  const butterfly = document.createElement('span');
  const path = butterflyPaths[Math.floor(Math.random() * butterflyPaths.length)];
  butterfly.className = 'butterfly ' + path;
  butterfly.style.top = 22 + Math.random() * 45 + 'vh';
  butterfly.style.fontSize = 24 + Math.random() * 20 + 'px';

  const duration = 20 + Math.random() * 14;
  butterfly.style.animationDuration = duration + 's';

  const wing = document.createElement('span');
  wing.className = 'wing';
  wing.textContent = '🦋';
  wing.style.animationDuration = 0.28 + Math.random() * 0.2 + 's';
  butterfly.appendChild(wing);

  butterflyContainer.appendChild(butterfly);
  setTimeout(() => {
    butterfly.remove();
    butterflyCount--;
  }, duration * 1000);
}

setInterval(spawnButterfly, 700);
for (let i = 0; i < 16; i++) setTimeout(spawnButterfly, i * 250);

// ===== Background music =====
const bgAudio = document.getElementById('bgAudio');
const musicToggle = document.getElementById('musicToggle');

musicToggle.addEventListener('click', () => {
  if (bgAudio.paused) {
    bgAudio.play().catch(() => {});
    musicToggle.classList.add('is-playing');
  } else {
    bgAudio.pause();
    musicToggle.classList.remove('is-playing');
  }
});

// ===== Guestbook =====
const sbClient = (typeof supabase !== 'undefined' && SUPABASE_URL !== 'PENDING_SETUP')
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const guestForm = document.getElementById('guestForm');
const guestName = document.getElementById('guestName');
const guestMessage = document.getElementById('guestMessage');
const guestStatus = document.getElementById('guestStatus');
const guestSubmitBtn = document.getElementById('guestSubmitBtn');
const guestList = document.getElementById('guestList');

function renderGuestMessages(rows) {
  guestList.innerHTML = '';
  if (!rows || rows.length === 0) {
    guestList.innerHTML = '<p class="guest-empty">كونوا أول من يسيب لنا كلمة 🤍</p>';
    return;
  }
  rows.forEach((row) => {
    const card = document.createElement('div');
    card.className = 'guest-card';
    const msg = document.createElement('p');
    msg.className = 'guest-msg';
    msg.textContent = row.message;
    const name = document.createElement('p');
    name.className = 'guest-name';
    name.textContent = '— ' + row.name;
    card.appendChild(msg);
    card.appendChild(name);
    guestList.appendChild(card);
  });
}

async function loadGuestMessages() {
  if (!sbClient) return;
  const { data, error } = await sbClient
    .from('guestbook_messages')
    .select('name, message, created_at')
    .eq('approved', true)
    .order('created_at', { ascending: false });
  if (!error) renderGuestMessages(data);
}

if (guestForm) {
  if (!sbClient) {
    guestStatus.textContent = 'الخدمة مش متاحة دلوقتي، حاول تاني بعدين.';
    guestStatus.classList.add('is-error');
  }

  guestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!sbClient) return;

    guestSubmitBtn.disabled = true;
    guestStatus.classList.remove('is-error');
    guestStatus.textContent = 'جاري الإرسال...';

    const { error } = await sbClient.from('guestbook_messages').insert({
      name: guestName.value.trim(),
      message: guestMessage.value.trim(),
    });

    if (error) {
      guestStatus.textContent = 'حصل خطأ، حاول تاني.';
      guestStatus.classList.add('is-error');
    } else {
      guestStatus.textContent = 'وصلت كلمتك، هتظهر بعد ما نراجعها. شكرًا ليكم 🤍';
      guestForm.reset();
    }
    guestSubmitBtn.disabled = false;
  });

  loadGuestMessages();
}
