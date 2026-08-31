const headlines = [
  ['POLITIK · LIVE', 'Koalition ringt weiter um den neuen Haushalt', 'Im Zentrum der Gespräche stehen Investitionen, soziale Sicherung und die Frage, wer welche Belastungen tragen soll.'],
  ['TAGESSCHAU', 'Parlament stimmt über neues Gesetzespaket ab', 'Die Debatte zieht sich durch den Nachmittag. Mehrere Fraktionen kündigen Änderungen an.'],
  ['EUROPA', 'EU-Gipfel: Neue Beschlüsse in der Nacht erwartet', 'Staats- und Regierungschefs verhandeln weiter. Ein gemeinsames Ergebnis gilt als offen.'],
  ['PUSH · EIL', 'Neue Zahlen sorgen für Diskussion im Bundestag', 'Opposition und Regierung bewerten die Lage gegensätzlich.'],
  ['INLAND', 'Kommunen fordern schnelle finanzielle Entlastung', 'Viele Städte und Gemeinden sehen ihre Handlungsspielräume schwinden.'],
  ['WELT', 'Internationale Partner beraten über gemeinsame Linie', 'Die Gespräche sollen am Abend fortgesetzt werden.'],
  ['ANALYSE', 'Was die heutige Entscheidung konkret bedeutet', 'Die Folgen reichen über die aktuelle Legislaturperiode hinaus.'],
  ['TICKER', 'Weitere Meldung eingegangen', 'Das System aktualisiert sich. Noch bevor diese Meldung verarbeitet ist, folgt die nächste.']
];

const space = document.querySelector('#news-space');
const counter = document.querySelector('#counter');
const phaseLabel = document.querySelector('#phase-label');
const dialog = document.querySelector('#news-dialog');
let total = 0, pointerX = 0, pointerY = 0, touchStart;

function phase() {
  const seconds = (Date.now() - performance.timeOrigin) / 1000;
  if (seconds < 30) return { label: 'MORGEN · erste Meldungen', interval: 2600 };
  if (seconds < 65) return { label: 'MITTAG · der Strom verdichtet sich', interval: 900 };
  return { label: 'ABEND · Überflutung', interval: 310 };
}

function showNews(item) {
  document.querySelector('#dialog-source').textContent = item[0];
  document.querySelector('#dialog-title').textContent = item[1];
  document.querySelector('#dialog-text').textContent = item[2];
  dialog.showModal();
}

function addCard() {
  const item = headlines[Math.floor(Math.random() * headlines.length)];
  const card = document.createElement('button');
  card.className = 'news-card';
  card.innerHTML = `<p class="source">${item[0]}</p><h2>${item[1]}</h2>`;
  const x = 7 + Math.random() * 86, y = 17 + Math.random() * 67;
  card.style.left = `${x}%`; card.style.top = `${y}%`;
  card.style.transform += ` rotate(${(Math.random() - .5) * 5}deg)`;
  card.addEventListener('click', () => showNews(item));
  space.append(card);
  const light = document.createElement('i');
  light.className = 'flash'; light.style.left = `${x}%`; light.style.top = `${y}%`;
  space.append(light); setTimeout(() => light.remove(), 700);
  total++; counter.textContent = total;
  if (space.querySelectorAll('.news-card').length > 95) space.querySelector('.news-card').remove();
}

function pulse() { const current = phase(); phaseLabel.textContent = current.label; addCard(); setTimeout(pulse, current.interval); }
for (let i = 0; i < 8; i++) setTimeout(addCard, i * 280);
setTimeout(pulse, 2300);

function look(x, y) { pointerX = (x / innerWidth - .5) * 16; pointerY = (y / innerHeight - .5) * 10; space.style.transform = `rotateY(${pointerX}deg) rotateX(${-pointerY}deg) scale(1.04)`; }
experience.addEventListener('mousemove', e => look(e.clientX, e.clientY));
experience.addEventListener('touchstart', e => touchStart = e.touches[0]);
experience.addEventListener('touchmove', e => { if (touchStart) look(e.touches[0].clientX, e.touches[0].clientY); });
document.querySelector('#close-dialog').addEventListener('click', () => { dialog.close(); addCard(); addCard(); });
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

