const scene = document.querySelector("#xr-scene");
const feedStatus = document.querySelector("#feed-status");
const AFRAME = window.AFRAME;
let THREE, mesh, texture, canvas, context;
let currentRoom = "";
let started = false;

function start() {
  if (started || !AFRAME?.THREE || !scene?.object3D) return;
  started = true;
  THREE = AFRAME.THREE;
  canvas = document.createElement("canvas"); canvas.width = 1400; canvas.height = 700;
  context = canvas.getContext("2d");
  texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.SphereGeometry(30, 96, 48); geometry.scale(-1, 1, 1);
  mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false, toneMapped: false }));
  mesh.renderOrder = -1000; scene.object3D.add(mesh); draw("news"); window.setInterval(update, 300);
}

function update() {
  const label = `${feedStatus?.textContent || ""}`.toUpperCase();
  let room = "news";
  if (label.includes("MEME")) room = "meme";
  if (label.includes("HANDY") || label.includes("PUSH")) room = "phone";
  if (label.includes("OVERLOAD")) room = "overload";
  if (label.includes("PAUSE")) room = "rest";
  if (room !== currentRoom) draw(room);
  if (mesh) mesh.rotation.y += room === "meme" ? 0.00165 : room === "overload" ? 0.0022 : room === "phone" ? 0.0008 : room === "rest" ? 0.0001 : 0.00035;
}

function radial(x, y, radius, inner, outer) { const g = context.createRadialGradient(canvas.width * x, canvas.height * y, 4, canvas.width * x, canvas.height * y, radius); g.addColorStop(0, inner); g.addColorStop(1, outer); context.fillStyle = g; context.fillRect(0, 0, canvas.width, canvas.height); }
function rect(x, y, w, h, r) { context.beginPath(); context.roundRect(x, y, w, h, r); context.fill(); context.stroke(); }

function drawNeonRoom({ overload = false } = {}) {
  const w = canvas.width, h = canvas.height;
  const base = context.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.52, w * 0.86);
  base.addColorStop(0, overload ? "#5b1aff" : "#3520a5");
  base.addColorStop(0.34, overload ? "#2a0f82" : "#12186b");
  base.addColorStop(0.68, overload ? "#10345b" : "#101d56");
  base.addColorStop(1, overload ? "#061b29" : "#10092a");
  context.fillStyle = base; context.fillRect(0, 0, w, h);
  radial(0.18, 0.22, 520, "rgba(0,230,255,.62)", "rgba(0,230,255,0)");
  radial(0.78, 0.28, 500, "rgba(255,0,184,.72)", "rgba(255,0,184,0)");
  radial(0.5, 0.78, 560, "rgba(117,255,64,.62)", "rgba(117,255,64,0)");
  const colors = ["#00f5ff", "#2f6bff", "#b35cff", "#25ff4f", "#ff00b8", "#ffe900", "#ff7a00", "#ffffff"];

  for (let i = 0; i < (overload ? 210 : 150); i += 1) {
    const x = Math.random() * w, y = 40 + Math.random() * h * 0.55;
    const len = overload ? 120 + Math.random() * 420 : 90 + Math.random() * 260;
    const thick = overload ? 8 + Math.random() * 26 : 7 + Math.random() * 18;
    context.save(); context.translate(x, y); context.rotate(Math.random() * 1.1 - 0.55); context.shadowColor = colors[i % colors.length]; context.shadowBlur = overload ? 34 : 24; context.fillStyle = colors[i % colors.length]; context.beginPath(); context.roundRect(-len / 2, -thick / 2, len, thick, thick / 2); context.fill(); context.restore();
  }

  const floorY = h * 0.56;
  const vanishX = w * 0.5;
  for (let row = 0; row < 12; row += 1) {
    const yy = floorY + row * row * 2.15 + row * 13;
    const tileH = 16 + row * 5.8;
    for (let col = -10; col <= 10; col += 1) {
      const perspective = 1 + row * 0.22;
      const tileW = 34 + row * 11;
      const x = vanishX + col * tileW * perspective * 0.48 - tileW / 2;
      if (x < -120 || x > w + 120 || yy > h + 40) continue;
      context.save(); context.translate(x, yy); context.rotate((col * 0.012)); context.shadowColor = colors[(row + col + 30) % colors.length]; context.shadowBlur = 18; context.fillStyle = colors[(row * 3 + col + 40) % colors.length] + (overload ? "d8" : "c4"); context.strokeStyle = "rgba(255,255,255,.28)"; context.lineWidth = 1; context.beginPath(); context.roundRect(0, 0, tileW, tileH, 8); context.fill(); context.stroke(); context.restore();
    }
  }
}

function drawRestRoom() { const w = canvas.width, h = canvas.height; const base = context.createLinearGradient(0, 0, 0, h); base.addColorStop(0, "#ffffff"); base.addColorStop(0.55, "#fbfdff"); base.addColorStop(1, "#eef3f7"); context.fillStyle = base; context.fillRect(0, 0, w, h); radial(0.5, 0.48, 620, "rgba(255,255,255,.95)", "rgba(209,228,238,0)"); context.strokeStyle = "rgba(175,190,205,.14)"; context.lineWidth = 2; for (let i = 0; i < 20; i += 1) { const y = 80 + i * 29; context.beginPath(); context.moveTo(0, y); for (let x = 0; x <= w; x += 70) context.lineTo(x, y + Math.sin(x * 0.006 + i) * 10); context.stroke(); } }

function draw(room) {
  currentRoom = room; document.body.dataset.room = room; const w = canvas.width, h = canvas.height; context.clearRect(0, 0, w, h);
  if (room === "meme") drawNeonRoom();
  else if (room === "overload") { drawNeonRoom({ overload: true }); radial(0.18, 0.18, 420, "rgba(28,95,180,.58)", "rgba(28,95,180,0)"); radial(0.76, 0.28, 420, "rgba(37,211,102,.54)", "rgba(37,211,102,0)"); }
  else if (room === "rest") drawRestRoom();
  else if (room === "phone") {
    const base = context.createRadialGradient(w * 0.5, h * 0.46, 20, w * 0.5, h * 0.5, w * 0.82); base.addColorStop(0, "#35d46e"); base.addColorStop(0.34, "#138f45"); base.addColorStop(0.7, "#075a2c"); base.addColorStop(1, "#07381f"); context.fillStyle = base; context.fillRect(0, 0, w, h); radial(0.18, 0.2, 540, "rgba(134,239,172,.75)", "rgba(134,239,172,0)"); radial(0.82, 0.72, 560, "rgba(34,197,94,.62)", "rgba(34,197,94,0)"); for (let i = 0; i < 170; i += 1) { context.fillStyle = i % 3 === 0 ? "rgba(187,247,208,.35)" : "rgba(255,255,255,.18)"; context.strokeStyle = "rgba(220,252,231,.55)"; context.lineWidth = 2; rect(Math.random() * w, Math.random() * h, 80 + Math.random() * 260, 24 + Math.random() * 48, 18); }
  } else {
    const base = context.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, w * 0.78); base.addColorStop(0, "#4b82d9"); base.addColorStop(0.38, "#123d86"); base.addColorStop(0.7, "#061c47"); base.addColorStop(1, "#020818"); context.fillStyle = base; context.fillRect(0, 0, w, h); radial(0.25, 0.35, 460, "rgba(147,197,253,.46)", "rgba(147,197,253,0)"); radial(0.76, 0.62, 520, "rgba(59,130,246,.5)", "rgba(59,130,246,0)"); context.strokeStyle = "rgba(142,184,255,.22)"; context.lineWidth = 1; for (let r = 40; r < 920; r += 78) { context.beginPath(); context.arc(w * 0.5, h * 0.5, r, 0, Math.PI * 2); context.stroke(); } for (let i = 0; i < 380; i += 1) { context.fillStyle = "rgba(190,220,255,.46)"; context.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
  }
  texture.needsUpdate = true;
}

if (scene?.hasLoaded) start(); else scene?.addEventListener("loaded", start, { once: true });
window.setTimeout(start, 1200);
