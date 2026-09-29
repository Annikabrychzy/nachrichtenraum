const scene = document.querySelector("#xr-scene");
const feedStatus = document.querySelector("#feed-status");

const AFRAME = window.AFRAME;
let THREE;
let mesh;
let texture;
let canvas;
let context;
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
  texture.needsUpdate = true;
  const geometry = new THREE.SphereGeometry(30, 96, 48);
  geometry.scale(-1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false, toneMapped: false });
  mesh = new THREE.Mesh(geometry, material);
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
  if (mesh) {
    const speed = room === "meme" ? 0.00145 : room === "overload" ? 0.0021 : room === "phone" ? 0.00075 : room === "rest" ? 0.00012 : 0.00032;
    mesh.rotation.y += speed;
  }
}

function radial(x, y, radius, inner, outer) {
  const g = context.createRadialGradient(canvas.width * x, canvas.height * y, 4, canvas.width * x, canvas.height * y, radius);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  context.fillStyle = g;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function roundedRect(x, y, w, h, r) {
  context.beginPath();
  context.roundRect(x, y, w, h, r);
  context.fill();
  context.stroke();
}

function drawNeonRoom({ overload = false } = {}) {
  const w = canvas.width;
  const h = canvas.height;
  const base = context.createRadialGradient(w * 0.5, h * 0.48, 20, w * 0.5, h * 0.5, w * 0.72);
  base.addColorStop(0, overload ? "#25011f" : "#260052");
  base.addColorStop(0.42, overload ? "#08000d" : "#120022");
  base.addColorStop(1, "#010007");
  context.fillStyle = base;
  context.fillRect(0, 0, w, h);

  radial(0.08, 0.23, 430, "rgba(255,0,80,.82)", "rgba(255,0,80,0)");
  radial(0.26, 0.78, 460, "rgba(0,221,255,.68)", "rgba(0,221,255,0)");
  radial(0.54, 0.22, 430, "rgba(117,255,64,.62)", "rgba(117,255,64,0)");
  radial(0.78, 0.68, 500, "rgba(255,119,0,.72)", "rgba(255,119,0,0)");
  radial(0.93, 0.31, 430, "rgba(139,92,246,.78)", "rgba(139,92,246,0)");

  const colors = ["#ff0050", "#ff7a00", "#ffe900", "#25ff4f", "#00ddff", "#2f6bff", "#ff00b8", "#ffffff"];
  for (let i = 0; i < (overload ? 220 : 165); i += 1) {
    const zone = i % 8;
    const x = ((zone / 8) * w + Math.random() * 180 - 70 + w) % w;
    const y = Math.random() * h;
    const len = overload ? 130 + Math.random() * 430 : 100 + Math.random() * 310;
    const thick = overload ? 8 + Math.random() * 28 : 7 + Math.random() * 22;
    const angle = (Math.random() * 0.9 - 0.45) + (zone % 2 ? 0.2 : -0.2);
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.shadowColor = colors[i % colors.length];
    context.shadowBlur = overload ? 32 : 24;
    context.fillStyle = colors[i % colors.length];
    context.strokeStyle = "rgba(255,255,255,.22)";
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(-len / 2, -thick / 2, len, thick, thick / 2);
    context.fill();
    context.stroke();
    context.restore();
  }
  for (let i = 0; i < (overload ? 92 : 62); i += 1) {
    const size = overload ? 46 + Math.random() * 130 : 38 + Math.random() * 112;
    context.fillStyle = colors[(i + 3) % colors.length] + (overload ? "52" : "40");
    context.strokeStyle = colors[i % colors.length] + (overload ? "77" : "55");
    context.lineWidth = 2;
    roundedRect(Math.random() * w, Math.random() * h, size, size * (0.45 + Math.random() * 0.9), 24);
  }
  const calm = context.createRadialGradient(w * 0.5, h * 0.5, 30, w * 0.5, h * 0.5, 260);
  calm.addColorStop(0, overload ? "rgba(0,0,0,.20)" : "rgba(0,0,0,.28)");
  calm.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = calm;
  context.fillRect(0, 0, w, h);
}

function drawRestRoom() {
  const w = canvas.width;
  const h = canvas.height;
  const base = context.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, "#ffffff");
  base.addColorStop(0.55, "#f9fbff");
  base.addColorStop(1, "#eef3f7");
  context.fillStyle = base;
  context.fillRect(0, 0, w, h);
  radial(0.5, 0.48, 620, "rgba(255,255,255,.95)", "rgba(209,228,238,0)");
  context.strokeStyle = "rgba(175,190,205,.16)";
  context.lineWidth = 2;
  for (let i = 0; i < 20; i += 1) {
    const y = 80 + i * 29;
    context.beginPath();
    context.moveTo(0, y + Math.sin(i) * 12);
    for (let x = 0; x <= w; x += 70) context.lineTo(x, y + Math.sin(x * 0.006 + i) * 10);
    context.stroke();
  }
}

function draw(room) {
  currentRoom = room;
  document.body.dataset.room = room;
  const w = canvas.width;
  const h = canvas.height;
  context.clearRect(0, 0, w, h);

  if (room === "meme") {
    drawNeonRoom();
  } else if (room === "overload") {
    drawNeonRoom({ overload: true });
    radial(0.18, 0.18, 380, "rgba(28,55,104,.45)", "rgba(28,55,104,0)");
    radial(0.76, 0.28, 360, "rgba(37,211,102,.34)", "rgba(37,211,102,0)");
  } else if (room === "rest") {
    drawRestRoom();
  } else if (room === "phone") {
    const base = context.createRadialGradient(w * 0.5, h * 0.46, 20, w * 0.5, h * 0.5, w * 0.78);
    base.addColorStop(0, "#1aa14a");
    base.addColorStop(0.36, "#0c421f");
    base.addColorStop(0.68, "#031207");
    base.addColorStop(1, "#000602");
    context.fillStyle = base;
    context.fillRect(0, 0, w, h);
    radial(0.18, 0.2, 500, "rgba(37,211,102,.72)", "rgba(37,211,102,0)");
    radial(0.82, 0.72, 520, "rgba(134,239,172,.48)", "rgba(134,239,172,0)");
    radial(0.5, 0.52, 420, "rgba(255,255,255,.12)", "rgba(255,255,255,0)");
    for (let i = 0; i < 150; i += 1) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const ww = 80 + Math.random() * 260;
      const hh = 24 + Math.random() * 48;
      context.fillStyle = i % 3 === 0 ? "rgba(37,211,102,.28)" : "rgba(255,255,255,.16)";
      context.strokeStyle = "rgba(187,247,208,.48)";
      context.lineWidth = 2;
      roundedRect(x, y, ww, hh, 18);
    }
  } else {
    const base = context.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, w * 0.7);
    base.addColorStop(0, "#2c5da9");
    base.addColorStop(0.42, "#09214a");
    base.addColorStop(0.72, "#020916");
    base.addColorStop(1, "#000108");
    context.fillStyle = base;
    context.fillRect(0, 0, w, h);
    radial(0.25, 0.35, 420, "rgba(96,165,250,.38)", "rgba(96,165,250,0)");
    radial(0.76, 0.62, 480, "rgba(30,64,175,.42)", "rgba(30,64,175,0)");
    context.strokeStyle = "rgba(142,184,255,.2)";
    context.lineWidth = 1;
    for (let r = 40; r < 920; r += 78) {
      context.beginPath();
      context.arc(w * 0.5, h * 0.5, r, 0, Math.PI * 2);
      context.stroke();
    }
    for (let i = 0; i < 320; i += 1) {
      context.fillStyle = "rgba(142,184,255,.38)";
      context.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
  }
  texture.needsUpdate = true;
}

if (scene?.hasLoaded) start();
else scene?.addEventListener("loaded", start, { once: true });
window.setTimeout(start, 1200);
