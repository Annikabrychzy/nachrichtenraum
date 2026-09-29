const categoryColors = {
  POLITIK: "#8eb8ff",
  INNENPOLITIK: "#9db8ff",
  AUSLANDSPOLITIK: "#7aa2ff",
  AUSLAND: "#7aa2ff",
  "WIRTSCHAFT & PREISE": "#7dd3fc",
  WIRTSCHAFT: "#7dd3fc",
  MIETEN: "#93c5fd",
  RENTE: "#bfdbfe",
  "GESUNDHEIT & PSYCHE": "#bae6fd",
  GESUNDHEIT: "#bae6fd",
  "KLIMA & UMWELT": "#a7f3d0",
  KLIMA: "#a7f3d0",
  STUDIUM: "#c7d2fe",
  "KARRIERE & STUDIUM": "#bfdbfe",
  KARRIERE: "#bfdbfe",
  NACHRICHTEN: "#8eb8ff",
  NEWS: "#8eb8ff",
  WHATSAPP: "#25d366",
  PUSH: "#22c55e",
  AUFMERKSAMKEIT: "#25d366",
};

const appIcons = {
  WHATSAPP: { icon: "☎", color: "#25d366", label: "WhatsApp" },
  INSTAGRAM: { icon: "◎", color: "#d946ef", label: "Instagram" },
  TIKTOK: { icon: "♪", color: "#111827", label: "TikTok" },
  YOUTUBE: { icon: "▶", color: "#ef4444", label: "YouTube" },
  SNAPCHAT: { icon: "☻", color: "#facc15", label: "Snapchat" },
  DISCORD: { icon: "☾", color: "#5865f2", label: "Discord" },
  NEWS: { icon: "RSS", color: "#244c86", label: "Politik Archiv" },
  MEME: { icon: "★", color: "#ff00b8", label: "GIPHY Meme" },
};

const memeImageCache = new Map();

function getMemeImage(url, onReady) {
  if (!url) return null;
  if (memeImageCache.has(url)) return memeImageCache.get(url);
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.decoding = "async";
  image.onload = onReady;
  image.onerror = () => { image.failed = true; };
  image.src = url;
  memeImageCache.set(url, image);
  return image;
}

function drawCover(context, image, x, y, w, h) {
  const ratio = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const iw = image.naturalWidth * ratio;
  const ih = image.naturalHeight * ratio;
  context.drawImage(image, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

function wrapText(context, value, maxWidth, maxLines) {
  const words = value.split(/\s+/);
  const lines = [];
  let line = "";
  while (words.length && lines.length < maxLines) {
    const word = words.shift();
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (words.length && lines.length) {
    let finalLine = lines.at(-1);
    while (context.measureText(`${finalLine}…`).width > maxWidth && finalLine.length > 4) finalLine = finalLine.slice(0, -1);
    lines[lines.length - 1] = `${finalLine.trim()}…`;
  }
  return lines;
}

function pulse(cursorEl, strength = 0.35, duration = 55) {
  const gamepad = cursorEl?.components?.["tracked-controls"]?.controller?.gamepad || cursorEl?.components?.["meta-touch-controls"]?.controller?.gamepad;
  const actuator = gamepad?.hapticActuators?.[0] || gamepad?.vibrationActuator;
  if (actuator?.pulse) actuator.pulse(strength, duration).catch(() => {});
  else if (actuator?.playEffect) actuator.playEffect("dual-rumble", { duration, strongMagnitude: strength, weakMagnitude: strength });
}

function memeEmoji(message) {
  const text = `${message.title} ${message.excerpt}`.toLowerCase();
  if (text.includes("cry") || text.includes("sad")) return "😭";
  if (text.includes("laugh") || text.includes("lol") || text.includes("funny")) return "😂";
  if (text.includes("fail") || text.includes("wtf") || text.includes("confused")) return "😳";
  if (text.includes("happy") || text.includes("congrat")) return "🥳";
  if (text.includes("food") || text.includes("drink")) return "🍕";
  if (text.includes("fashion") || text.includes("beauty")) return "💅";
  if (text.includes("gaming")) return "🎮";
  if (text.includes("action")) return "🏃";
  return "😵‍💫";
}

export function isCloseHit(uv) { return Boolean(uv); }

export class CardPool {
  constructor({ THREE, root, max = 72, onToggle, onClose }) { this.THREE = THREE; this.root = root; this.max = max; this.onToggle = onToggle; this.onClose = onClose; this.slots = []; this.active = new Set(); this.geometry = new THREE.PlaneGeometry(1.46, 0.73); }
  createSlot() {
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 256;
    const context = canvas.getContext("2d", { alpha: false });
    const texture = new this.THREE.CanvasTexture(canvas); texture.colorSpace = this.THREE.SRGBColorSpace; texture.minFilter = this.THREE.LinearFilter; texture.magFilter = this.THREE.LinearFilter; texture.generateMipmaps = false;
    const material = new this.THREE.MeshBasicMaterial({ map: texture, side: this.THREE.FrontSide, toneMapped: false });
    const mesh = new this.THREE.Mesh(this.geometry, material);
    const entity = document.createElement("a-entity"); entity.classList.add("news-card"); entity.setObject3D("mesh", mesh); entity.object3D.visible = false; this.root.appendChild(entity);
    const slot = { entity, mesh, material, texture, canvas, context, active: false, paused: false, hoveredBy: new Set(), velocity: new this.THREE.Vector3(), pitch: 1, wave: 0, bornAt: 0, pressedAt: 0, motionKind: "float", message: null, raycast: mesh.raycast };
    mesh.userData.slot = slot;
    entity.addEventListener("click", (event) => this.handleClick(slot, event));
    entity.addEventListener("raycaster-intersected", (event) => { slot.hoveredBy.add(event.detail.el); this.refreshColor(slot); slot.entity.object3D.scale.setScalar((slot.baseScale || 1) * 1.055); });
    entity.addEventListener("raycaster-intersected-cleared", (event) => { slot.hoveredBy.delete(event.detail.el); if (!slot.hoveredBy.size) slot.entity.object3D.scale.setScalar(slot.baseScale || 1); this.refreshColor(slot); });
    this.slots.push(slot); return slot;
  }
  handleClick(slot, event) { if (!slot.active) return; event.stopPropagation(); const now = performance.now(); if (now - slot.pressedAt < 180) return; slot.pressedAt = now; pulse(event.detail?.cursorEl, 0.65, 65); this.onClose(slot); }
  draw(slot, message) {
    const { context } = slot;
    const source = String(message.source || "NEWS").toUpperCase();
    const category = String(message.category || "NEWS").toUpperCase();
    const isMeme = category === "MEME" || source.includes("GIPHY");
    if (isMeme) {
      const stripes = ["#ff00b8", "#00ddff", "#ffe900", "#75ff40", "#ff7700", "#8b5cf6"];
      const gradient = context.createLinearGradient(0, 0, 512, 256); stripes.forEach((color, index) => gradient.addColorStop(index / (stripes.length - 1), color));
      context.fillStyle = gradient; context.fillRect(0, 0, 512, 256);
      context.fillStyle = "rgba(255,255,255,0.16)";
      for (let i = 0; i < 26; i += 1) { context.beginPath(); context.arc(20 + Math.random() * 472, 18 + Math.random() * 220, 10 + Math.random() * 34, 0, Math.PI * 2); context.fill(); }
      context.fillStyle = "rgba(8, 0, 22, 0.68)"; context.beginPath(); context.roundRect(20, 18, 472, 220, 30); context.fill(); context.strokeStyle = stripes[Math.floor(Math.random() * stripes.length)]; context.lineWidth = 8; context.stroke();
      const posterX = 38, posterY = 48, posterW = 180, posterH = 160;
      const img = getMemeImage(message.image, () => { if (slot.active && slot.message === message) this.draw(slot, message); });
      context.save(); context.beginPath(); context.roundRect(posterX, posterY, posterW, posterH, 24); context.clip();
      if (img && img.complete && img.naturalWidth && !img.failed) drawCover(context, img, posterX, posterY, posterW, posterH);
      else { const poster = context.createLinearGradient(posterX, posterY, posterX + posterW, posterY + posterH); poster.addColorStop(0, "#fff7ff"); poster.addColorStop(0.5, stripes[Math.floor(Math.random() * stripes.length)]); poster.addColorStop(1, "#120022"); context.fillStyle = poster; context.fillRect(posterX, posterY, posterW, posterH); context.font = "900 76px Arial"; context.textAlign = "center"; context.textBaseline = "middle"; context.fillStyle = "#ffffff"; context.fillText(memeEmoji(message), posterX + posterW / 2, posterY + posterH / 2); }
      context.restore(); context.strokeStyle = "rgba(255,255,255,.86)"; context.lineWidth = 5; context.beginPath(); context.roundRect(posterX, posterY, posterW, posterH, 24); context.stroke(); context.textAlign = "left"; context.textBaseline = "alphabetic";
      context.fillStyle = "#fff7ff"; context.font = "900 15px Arial"; context.fillText("GIPHY · VIDEO", 238, 55);
      context.fillStyle = "#ffe900"; context.font = "900 32px Arial"; wrapText(context, message.title, 220, 3).forEach((line, index) => context.fillText(line, 238, 98 + index * 34));
      context.fillStyle = "#ffffff"; context.font = "700 15px Arial"; wrapText(context, message.excerpt, 225, 3).forEach((line, index) => context.fillText(line, 238, 198 + index * 18));
      context.fillStyle = "rgba(0, 0, 0, 0.54)"; context.beginPath(); context.roundRect(436, 31, 40, 40, 13); context.fill(); context.strokeStyle = "#ffffff"; context.lineWidth = 4; context.beginPath(); context.moveTo(448, 43); context.lineTo(464, 59); context.moveTo(464, 43); context.lineTo(448, 59); context.stroke(); slot.texture.needsUpdate = true; return;
    }
    const appKey = Object.keys(appIcons).find((key) => source.includes(key) || category.includes(key)) || "NEWS";
    const app = appIcons[appKey]; const accent = app.color || categoryColors[message.category] || categoryColors.NEWS; const isPhone = ["WHATSAPP", "INSTAGRAM", "TIKTOK", "SNAPCHAT", "PUSH"].some((key) => source.includes(key) || category.includes(key));
    context.clearRect(0, 0, 512, 256); context.fillStyle = isPhone ? "#f0fdf4" : "#061226"; context.fillRect(0, 0, 512, 256); context.shadowColor = isPhone ? "rgba(37, 211, 102, 0.28)" : "rgba(49, 105, 255, 0.32)"; context.shadowBlur = 20; context.shadowOffsetY = 8; context.fillStyle = isPhone ? "#ffffff" : "rgba(5, 13, 31, 0.94)"; context.beginPath(); context.roundRect(18, 18, 476, 220, isPhone ? 34 : 0); context.fill(); context.shadowColor = "transparent"; context.strokeStyle = isPhone ? accent : "rgba(149,188,255,.72)"; context.lineWidth = isPhone ? 4 : 2; context.stroke(); context.fillStyle = accent; context.beginPath(); context.roundRect(34, 34, 50, 50, 14); context.fill(); context.fillStyle = "#ffffff"; context.font = appKey === "NEWS" ? "900 14px Arial" : "700 27px Arial"; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(app.icon, 59, 60); context.textAlign = "left"; context.textBaseline = "alphabetic"; context.fillStyle = isPhone ? "#0f172a" : "#8eb8ff"; context.font = "700 15px Arial"; context.fillText(isPhone ? app.label : String(message.source || "Politik Archiv"), 98, 55); context.fillStyle = isPhone ? "#64748b" : "#9db8ff"; context.font = "600 13px Arial"; context.fillText(isPhone ? "jetzt · wichtige Mitteilung" : "alte Beispielmeldung · Politik Archiv", 98, 76); context.fillStyle = isPhone ? "#ecfdf5" : "rgba(255,255,255,.12)"; context.beginPath(); context.roundRect(436, 31, 40, 40, 13); context.fill(); context.strokeStyle = isPhone ? "#16a34a" : "#ffffff"; context.lineWidth = 4; context.beginPath(); context.moveTo(448, 43); context.lineTo(464, 59); context.moveTo(464, 43); context.lineTo(448, 59); context.stroke(); context.fillStyle = isPhone ? "#07120b" : "#eef5ff"; context.font = "800 25px Arial"; const titleLines = wrapText(context, message.title, 404, 3); titleLines.forEach((line, index) => context.fillText(line, 34, 116 + index * 29)); context.fillStyle = isPhone ? "#166534" : "#c3d0e6"; context.font = "400 16px Arial"; const excerptLines = wrapText(context, message.excerpt, 420, 2); const excerptY = 130 + titleLines.length * 29; excerptLines.forEach((line, index) => context.fillText(line, 34, excerptY + index * 21)); slot.texture.needsUpdate = true;
  }
  randomPosition(cameraPosition) { const radius = this.THREE.MathUtils.lerp(2.25, 5.9, Math.pow(Math.random(), 0.74)); const theta = Math.random() * Math.PI * 2; const vertical = this.THREE.MathUtils.lerp(-0.72, 0.78, Math.random()); const planar = Math.sqrt(1 - vertical * vertical); return new this.THREE.Vector3(cameraPosition.x + Math.cos(theta) * planar * radius, cameraPosition.y + vertical * radius * 0.52, cameraPosition.z + Math.sin(theta) * planar * radius); }
  acquire(message, cameraPosition, now = performance.now(), phase = {}) { let slot = this.slots.find((candidate) => !candidate.active); if (!slot && this.slots.length < this.max) slot = this.createSlot(); if (!slot) return null; slot.active = true; slot.paused = false; slot.message = message; slot.pitch = this.THREE.MathUtils.randFloat(0.84, 1.18); slot.wave = Math.random() * Math.PI * 2; const motion = phase.motion || 0.6; const flyChance = motion > 5 ? 0.92 : motion > 3 ? 0.78 : motion > 1.5 ? 0.46 : 0.18; slot.motionKind = Math.random() < flyChance ? "flyby" : (Math.random() < 0.72 ? "wave" : "still"); slot.bornAt = now; slot.hoveredBy.clear(); this.draw(slot, message); const position = this.randomPosition(cameraPosition); slot.entity.object3D.position.copy(position); slot.entity.object3D.lookAt(cameraPosition); slot.entity.object3D.rotateZ(this.THREE.MathUtils.randFloatSpread(0.12)); slot.baseScale = this.THREE.MathUtils.randFloat(0.92, 1.08); slot.entity.object3D.scale.setScalar(slot.baseScale * 0.12); const radial = position.clone().sub(cameraPosition).normalize(); if (slot.motionKind === "flyby") { slot.velocity.copy(radial).multiplyScalar(-this.THREE.MathUtils.randFloat(0.22, 0.52)); slot.velocity.x += this.THREE.MathUtils.randFloatSpread(0.18); slot.velocity.y += this.THREE.MathUtils.randFloatSpread(0.16); slot.velocity.z += this.THREE.MathUtils.randFloatSpread(0.18); } else if (slot.motionKind === "wave") { slot.velocity.set(-radial.z, this.THREE.MathUtils.randFloatSpread(0.38), radial.x).normalize().multiplyScalar(this.THREE.MathUtils.randFloat(0.07, 0.19)); } else { slot.velocity.set(-radial.z, this.THREE.MathUtils.randFloatSpread(0.1), radial.x).normalize().multiplyScalar(this.THREE.MathUtils.randFloat(0.006, 0.024)); } slot.entity.object3D.visible = true; slot.mesh.raycast = slot.raycast; slot.entity.classList.add("interactive"); this.active.add(slot); this.refreshColor(slot); return slot; }
  release(slot) { if (!slot?.active) return; slot.active = false; slot.paused = false; slot.hoveredBy.clear(); slot.entity.object3D.visible = false; slot.entity.object3D.scale.setScalar(1); slot.mesh.raycast = () => {}; slot.entity.classList.remove("interactive"); this.active.delete(slot); }
  releaseAll() { for (const slot of [...this.active]) this.release(slot); }
  makeSpace(count) { while (this.size > this.max - count) { const slot = [...this.active].find((candidate) => !candidate.paused && !candidate.hoveredBy.size) || [...this.active][0]; if (!slot) break; this.release(slot); } }
  toggle(slot) { if (!slot?.active) return false; slot.paused = !slot.paused; this.refreshColor(slot); return slot.paused; }
  refreshColor(slot) { if (!slot.active) return; if (slot.hoveredBy.size) slot.material.color.set(0xd7eaff); else if (slot.paused) slot.material.color.set(0x86efac); else slot.material.color.set(0xffffff); }
  update(delta, intensity, now, cameraPosition) { let index = 0; for (const slot of this.active) { if (!slot.paused && !slot.hoveredBy.size) { const age = (now - slot.bornAt) / 1000; const pop = Math.min(1, age / 0.34); const easeOutBack = 1 + 1.7 * Math.pow(pop - 1, 3) + 0.7 * Math.pow(pop - 1, 2); slot.entity.object3D.scale.setScalar((slot.baseScale || 1) * Math.max(0.12, easeOutBack)); if (slot.motionKind !== "still") slot.entity.object3D.position.addScaledVector(slot.velocity, delta * intensity); const waveStrength = slot.motionKind === "still" ? 0.00045 : slot.motionKind === "flyby" ? 0.0062 : 0.0032; slot.entity.object3D.position.y += Math.sin(age * (1.2 + intensity * 0.22) + slot.wave) * waveStrength * intensity; if (index % 3 === Math.floor(now / 160) % 3) { slot.entity.object3D.lookAt(cameraPosition); slot.entity.object3D.rotateZ(Math.sin(slot.wave + age * 0.5) * 0.03 * intensity); } const distance = slot.entity.object3D.position.distanceTo(cameraPosition); if (distance > 8.2 || distance < 0.78) { slot.entity.object3D.position.copy(this.randomPosition(cameraPosition)); slot.entity.object3D.lookAt(cameraPosition); } } else if (slot.hoveredBy.size) { slot.entity.object3D.lookAt(cameraPosition); } index += 1; } }
  get size() { return this.active.size; }
  get pausedCount() { let count = 0; for (const slot of this.active) if (slot.paused) count += 1; return count; }
}
