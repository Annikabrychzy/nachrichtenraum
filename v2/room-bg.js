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
  canvas.width = 1024;
  canvas.height = 512;
  context = canvas.getContext("2d");
  texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const geometry = new THREE.SphereGeometry(30, 72, 36);
  geometry.scale(-1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false, toneMapped: false });
  mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1000;
  scene.object3D.add(mesh);
  draw("news");
  window.setInterval(update, 400);
}

function update() {
  const label = `${feedStatus?.textContent || ""}`.toUpperCase();
  let room = "news";
  if (label.includes("MEME")) room = "meme";
  if (label.includes("HANDY") || label.includes("PUSH")) room = "phone";
  if (room !== currentRoom) draw(room);
  if (mesh) mesh.rotation.y += room === "meme" ? 0.0009 : room === "phone" ? 0.00045 : 0.00022;
}

function radial(x, y, radius, inner, outer) {
  const g = context.createRadialGradient(canvas.width * x, canvas.height * y, 4, canvas.width * x, canvas.height * y, radius);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  context.fillStyle = g;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function draw(room) {
  currentRoom = room;
  document.body.dataset.room = room;
  const w = canvas.width;
  const h = canvas.height;
  context.clearRect(0, 0, w, h);

  if (room === "meme") {
    const base = context.createRadialGradient(w * 0.5, h * 0.46, 40, w * 0.5, h * 0.5, w * 0.72);
    base.addColorStop(0, "#2d004a");
    base.addColorStop(0.45, "#080018");
    base.addColorStop(1, "#020008");
    context.fillStyle = base;
    context.fillRect(0, 0, w, h);
    radial(0.16, 0.22, 310, "rgba(255,0,184,.78)", "rgba(255,0,184,0)");
    radial(0.86, 0.25, 340, "rgba(0,221,255,.68)", "rgba(0,221,255,0)");
    radial(0.72, 0.78, 330, "rgba(255,235,0,.62)", "rgba(255,235,0,0)");
    radial(0.34, 0.72, 320, "rgba(117,255,64,.58)", "rgba(117,255,64,0)");
    const colors = ["#ff00b8", "#00ddff", "#ffe900", "#75ff40", "#ff7700", "#8b5cf6"];
    for (let i = 0; i < 130; i += 1) {
      context.strokeStyle = colors[i % colors.length] + "77";
      context.lineWidth = 2 + (i % 6);
      context.beginPath();
      const x = Math.random() * w;
      const y = Math.random() * h;
      context.moveTo(x, y);
      context.lineTo(x + Math.random() * 220 - 110, y + Math.random() * 120 - 60);
      context.stroke();
    }
  } else if (room === "phone") {
    const base = context.createRadialGradient(w * 0.5, h * 0.46, 20, w * 0.5, h * 0.5, w * 0.75);
    base.addColorStop(0, "#103d1f");
    base.addColorStop(0.5, "#020b05");
    base.addColorStop(1, "#000602");
    context.fillStyle = base;
    context.fillRect(0, 0, w, h);
    radial(0.18, 0.2, 330, "rgba(37,211,102,.5)", "rgba(37,211,102,0)");
    radial(0.82, 0.72, 360, "rgba(12,141,61,.44)", "rgba(12,141,61,0)");
    for (let i = 0; i < 88; i += 1) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const ww = 80 + Math.random() * 210;
      const hh = 26 + Math.random() * 46;
      context.fillStyle = i % 3 === 0 ? "rgba(37,211,102,.2)" : "rgba(255,255,255,.11)";
      context.strokeStyle = "rgba(134,239,172,.38)";
      context.lineWidth = 2;
      context.beginPath();
      context.roundRect(x, y, ww, hh, 18);
      context.fill();
      context.stroke();
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
    for (let r = 40; r < 760; r += 72) {
      context.beginPath();
      context.arc(w * 0.5, h * 0.5, r, 0, Math.PI * 2);
      context.stroke();
    }
    for (let i = 0; i < 240; i += 1) {
      context.fillStyle = "rgba(142,184,255,.32)";
      context.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
    }
  }
  texture.needsUpdate = true;
}

if (scene?.hasLoaded) start();
else scene?.addEventListener("loaded", start, { once: true });
window.setTimeout(start, 1200);
