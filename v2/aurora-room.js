const scene = document.querySelector("#xr-scene");
const status = document.querySelector("#feed-status");
const AFRAME = window.AFRAME;
let canvas, context, texture, mesh, started = false;

function drawAurora(time) {
  const w = canvas.width, h = canvas.height;
  const sky = context.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#030827");
  sky.addColorStop(0.45, "#072a4a");
  sky.addColorStop(1, "#010411");
  context.fillStyle = sky;
  context.fillRect(0, 0, w, h);

  for (let band = 0; band < 5; band += 1) {
    context.save();
    context.globalCompositeOperation = "screen";
    context.strokeStyle = ["#62ffd1", "#5de5ff", "#a78bfa", "#c4ff78", "#8df8ff"][band];
    context.globalAlpha = 0.22 + band * 0.045;
    context.lineWidth = 30 + band * 10;
    context.shadowColor = context.strokeStyle;
    context.shadowBlur = 40;
    context.beginPath();
    for (let x = -80; x <= w + 80; x += 18) {
      const y = 240 + band * 72 + Math.sin(x * 0.010 + time * 0.00026 + band) * (38 + band * 6)
        + Math.sin(x * 0.024 - time * 0.00017) * 20;
      if (x === -80) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.stroke();
    context.restore();
  }
  context.fillStyle = "rgba(225,255,246,.85)";
  for (let i = 0; i < 130; i += 1) {
    const x = (i * 97) % w;
    const y = (i * 53) % (h * 0.62);
    context.fillRect(x, y, 1.4, 1.4);
  }
  texture.needsUpdate = true;
}

function start() {
  if (started || !AFRAME?.THREE || !scene?.object3D) return;
  started = true;
  const THREE = AFRAME.THREE;
  canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 800;
  context = canvas.getContext("2d");
  texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.SphereGeometry(29.5, 72, 36);
  geometry.scale(-1, 1, 1);
  mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false, toneMapped: false }));
  mesh.visible = false;
  scene.object3D.add(mesh);
  window.setInterval(() => {
    const isRest = /PAUSE/.test(status?.textContent || "");
    mesh.visible = isRest;
    if (isRest) drawAurora(performance.now());
  }, 250);
}
if (scene?.hasLoaded) start(); else scene?.addEventListener("loaded", start, { once: true });
window.setTimeout(start, 1000);
