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
  canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 700;
  context = canvas.getContext("2d");
  texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.SphereGeometry(30, 96, 48);
  geometry.scale(-1, 1, 1);
  mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false, toneMapped: false }));
  mesh.renderOrder = -1000;
  scene.object3D.add(mesh);
  draw("news");
  window.setInterval(update, 300);
}

function update() {
  const label = `${feedStatus?.textContent || ""}`.toUpperCase();
  let room = "news";
  if (label.includes("MEME")) room = "meme";
  if (label.includes("HANDY") || label.includes("PUSH")) room = "phone";
  if (label.includes("OVERLOAD")) room = "overload";
  if (label.includes("PAUSE")) room = "rest";
  if (room !== currentRoom) draw(room);
  if (mesh) mesh.rotation.y += room === "meme" ? 0.0015 : room === "overload" ? 0.0022 : room === "phone" ? 0.0008 : room === "rest" ? 0.0001 : 0.00035;
}

function radial(x, y, radius, inner, outer) {
  const g = context.createRadialGradient(canvas.width * x, canvas.height * y, 4, canvas.width * x, canvas.height * y, radius);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  context.fillStyle = g;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function rect(x, y, w, h, r) { context.beginPath(); context.roundRect(x, y, w, h, r); context.fill(); context.stroke(); }

function drawNeonRoom({ overload = false } = {}) {
  const w = canvas.width, h = canvas.height;
  const base = context.createRadialGradient(w * 0.5, h * 0.5, 30, w * 0.5, h * 0.5, w * 0.82);
  base.addColorStop(0, overload ? "#5d1aff" : "#6828ff");
  base.addColorStop(0.35, overload ? "#2b0f85" : "#3b0d88");
  base.addColorStop(0.72, overload ? "#10345b" : "#1a114a");
  base.addColorStop(1, overload ? "#061b29" : "#16072d");
  context.fillStyle = base;
  context.fillRect(0, 0, w, h);
  radial(0.08, 0.23, 480, "rgba(255,0,80,.9)", "rgba(255,0,80,0)");
  radial(0.26, 0.78, 500, "rgba(0,221,255,.78)", "rgba(0,221,255,0)");
  radial(0.54, 0.22, 480, "rgba(117,255,64,.72)", "rgba(117,255,64,0)");
  radial(0.78, 0.68, 540, "rgba(255,119,0,.8)", "rgba(255,119,0,0)");
  radial(0.93, 0.31, 460, "rgba(255,0,184,.78)", "rgba(255,0,184,0)");
  const colors = ["#ff0050", "#ff7a00", "#ffe900", "#25ff4f", "#00ddff", "#2f6bff", "#ff00b8", "#ffffff"];
  for (let i = 0; i < (overload ? 260 : 190); i += 1) {
    const x = Math.random() * w, y = Math.random() * h;
    const len = overload ? 150 + Math.random() * 460 : 120 + Math.random() * 330;
    const thick = overload ? 10 + Math.random() * 30 : 8 + Math.random() * 24;
    context.save();
    context.translate(x, y);
    context.rotate(Math.random() * 1.3 - 0.65);
    context.shadowColor = colors[i % colors.length];
    context.shadowBlur = overload ? 36 : 26;
    context.fillStyle = colors[i % colors.length];
    context.beginPath();
    context.roundRect(-len / 2, -thick / 2, len, thick, thick / 2);
    context.fill();
    context.restore();
  }
}

function drawRestRoom() {
  const w = canvas.width, h = canvas.height;
  const base = context.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, "#ffffff"); base.addColorStop(0.55, "#fbfdff"); base.addColorStop(1, "#eef3f7");
  context.fillStyle = base; context.fillRect(0, 0, w, h);
  radial(0.5, 0.48, 620, "rgba(255,255,255,.95)", "rgba(209,228,238,0)");
  context.strokeStyle = "rgba(175,190,205,.14)"; context.lineWidth = 2;
  for (let i = 0; i < 20; i += 1) { const y = 80 + i * 29; context.beginPath(); context.moveTo(0, y); for (let x = 0; x <= w; x += 70) context.lineTo(x, y + Math.sin(x * 0.006 + i) * 10); context.stroke(); }
}

function draw(room) {
  currentRoom = room;
  document.body.dataset.room = room;
  const w = canvas.width, h = canvas.height;
  context.clearRect(0, 0, w, h);
  if (room === "meme") drawNeonRoom();
  else if (room === "overload") { drawNeonRoom({ overload: true }); radial(0.18, 0.18, 420, "rgba(28,95,180,.58)", "rgba(28,95,180,0)"); radial(0.76, 0.28, 420, "rgba(37,211,102,.54)", "rgba(37,211,102,0)"); }
  else if (room === "rest") drawRestRoom();
  else if (room === "phone") {
    const base = context.createRadialGradient(w * 0.5, h * 0.46, 20, w * 0.5, h * 0.5, w * 0.82);
    base.addColorStop(0, "#35d46e"); base.addColorStop(0.34, "#138f45"); base.addColorStop(0.7, "#075a2c"); base.addColorStop(1, "#07381f");
    context.fillStyle = base; context.fillRect(0, 0, w, h);
    radial(0.18, 0.2, 540, "rgba(134,239,172,.75)", "rgba(134,239,172,0)"); radial(0.82, 0.72, 560, "rgba(34,197,94,.62)", "rgba(34,197,94,0)");
    for (let i = 0; i < 170; i += 1) { context.fillStyle = i % 3 === 0 ? "rgba(187,247,208,.35)" : "rgba(255,255,255,.18)"; context.strokeStyle = "rgba(220,252,231,.55)"; context.lineWidth = 2; rect(Math.random() * w, Math.random() * h, 80 + Math.random() * 260, 24 + Math.random() * 48, 18); }
  } else {
    const base = context.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, w * 0.76);
    base.addColorStop(0, "#4b82d9"); base.addColorStop(0.42, "#163f83"); base.addColorStop(0.75, "#071d45"); base.addColorStop(1, "#041126");
    context.fillStyle = base; context.fillRect(0, 0, w, h);
    radial(0.25, 0.35, 460, "rgba(147,197,253,.45)", "rgba(147,197,253,0)"); radial(0.76, 0.62, 520, "rgba(59,130,246,.48)", "rgba(59,130,246,0)");
    context.strokeStyle = "rgba(142,184,255,.22)"; context.lineWidth = 1;
    for (let r = 40; r < 920; r += 78) { context.beginPath(); context.arc(w * 0.5, h * 0.5, r, 0, Math.PI * 2); context.stroke(); }
    for (let i = 0; i < 320; i += 1) { context.fillStyle = "rgba(190,220,255,.44)"; context.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
  }
  texture.needsUpdate = true;
}

if (scene?.hasLoaded) start(); else scene?.addEventListener("loaded", start, { once: true });
window.setTimeout(start, 1200);
