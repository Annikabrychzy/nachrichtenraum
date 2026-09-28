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
  if (room !== currentRoom) draw(room);
  if (mesh) {
    const speed = room === "meme" ? 0.0012 : room === "overload" ? 0.0018 : room === "phone" ? 0.00045 : 0.0002;
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
  base.addColorStop(0, overload ? "#240016" : "#18002e");
  base.addColorStop(0.42, overload ? "#090010" : "#080018");
  base.addColorStop(1, "#010007");
  context.fillStyle = base;
  context.fillRect(0, 0, w, h);

  radial(0.08, 0.23, 360, "rgba(255,0,80,.68)", "rgba(255,0,80,0)");
  radial(0.26, 0.78, 400, "rgba(0,221,255,.52)", "rgba(0,221,255,0)");
  radial(0.54, 0.22, 360, "rgba(117,255,64,.48)", "rgba(117,255,64,0)");
  radial(0.78, 0.68, 430, "rgba(255,119,0,.56)", "rgba(255,119,0,0)");
  radial(0.93, 0.31, 360, "rgba(139,92,246,.62)", "rgba(139,92,246,0)");

  const colors = ["#ff0050", "#ff7a00", "#ffe900", "#25ff4f", "#00ddff", "#2f6bff", "#ff00b8"];

  // Broad neon panels: distributed around the 360 texture, not all pointing to one center.
  for (let i = 0; i < (overload ? 180 : 125); i += 1) {
    const zone = i % 7;
    const x = ((zone / 7) * w + Math.random() * 150 - 60 + w) % w;
    const y = Math.random() * h;
    const len = overload ? 120 + Math.random() * 360 : 90 + Math.random() * 260;
    const thick = overload ? 7 + Math.random() * 24 : 6 + Math.random() * 18;
    const angle = (Math.random() * 0.75 - 0.375) + (zone % 2 ? 0.15 : -0.15);
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.shadowColor = colors[i % colors.length];
    context.shadowBlur = overload ? 24 : 18;
    context.fillStyle = colors[i % colors.length];
    context.strokeStyle = "rgba(255,255,255,.16)";
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(-len / 2, -thick / 2, len, thick, thick / 2);
    context.fill();
    context.stroke();
    context.restore();
  }

  // Soft bokeh blocks so it feels like a room with depth.
  for (let i = 0; i < (overload ? 70 : 46); i += 1) {
    const size = overload ? 42 + Math.random() * 110 : 34 + Math.random() * 92;
    context.fillStyle = colors[(i + 3) % colors.length] + (overload ? "42" : "30");
    context.strokeStyle = colors[i % colors.length] + (overload ? "66" : "44");
    context.lineWidth = 2;
    roundedRect(Math.random() * w, Math.random() * h, size, size * (0.45 + Math.random() * 0.9), 24);
  }

  // Dark center haze prevents the image from feeling like a tunnel rushing into the face.
  const calm = context.createRadialGradient(w * 0.5, h * 0.5, 30, w * 0.5, h * 0.5, 260);
  calm.addColorStop(0, overload ? "rgba(0,0,0,.30)" : "rgba(0,0,0,.42)");
  calm.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = calm;
  context.fillRect(0, 0, w, h);
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
  } else if (room === "phone") {
    const base = context.createRadialGradient(w * 0.5, h * 0.46, 20, w * 0.5, h * 0.5, w * 0.75);
    base.addColorStop(0, "#103d1f");
    base.addColorStop(0.5, "#020b05");
    base.addColorStop(1, "#000602");
    context.fillStyle = base;
    context.fillRect(0, 0, w, h);
    radial(0.18, 0.2, 430, "rgba(37,211,102,.5)", "rgba(37,211,102,0)");
    radial(0.82, 0.72, 460, "rgba(12,141,61,.44)", "rgba(12,141,61,0)");
    for (let i = 0; i < 110; i += 1) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const ww = 80 + Math.random() * 240;
      const hh = 26 + Math.random() * 46;
      context.fillStyle = i % 3 === 0 ? "rgba(37,211,102,.2)" : "rgba(255,255,255,.11)";
      context.strokeStyle = "rgba(134,239,172,.38)";
      context.lineWidth = 2;
      roundedRect(x, y, ww, hh, 18);
    }
  } else {
    const base = context.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, w * 0.68);
    base.addColorStop(0, "#1c3768");
    base.addColorStop(0.48, "#061226");
    base.addColorStop(1, "#000108");
    context.fillStyle = base;
    context.fillRect(0, 0, w, h);
    context.strokeStyle = "rgba(142,184,255,.17)";
    context.lineWidth = 1;
    for (let r = 40; r < 920; r += 78) {
      context.beginPath();
      context.arc(w * 0.5, h * 0.5, r, 0, Math.PI * 2);
      context.stroke();
    }
    for (let i = 0; i < 260; i += 1) {
      context.fillStyle = "rgba(142,184,255,.32)";
      context.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
    }
  }
  texture.needsUpdate = true;
}

if (scene?.hasLoaded) start();
else scene?.addEventListener("loaded", start, { once: true });
window.setTimeout(start, 1200);
