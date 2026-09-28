import { AudioEngine } from "./src/audio-engine.js";
import { CardPool } from "./src/card-pool.js";
import { loadMessages, normalizeMessage } from "./src/feeds.js";
import { phaseAt, cycleDuration } from "./src/timeline.js";

const scene = document.querySelector("#xr-scene");
const rig = document.querySelector("#rig");
const cameraEl = document.querySelector("#viewer");
const leftController = document.querySelector("#left-controller");
const rightController = document.querySelector("#right-controller");
const cardsRoot = document.querySelector("#news-root");
const swarmRoot = document.querySelector("#data-swarm");
const vrHud = document.querySelector("#vr-hud");
const vrPhase = document.querySelector("#vr-phase");
const startScreen = document.querySelector("#start-screen");
const browserButton = document.querySelector("#browser-button");
const vrButton = document.querySelector("#vr-button");
const hud = document.querySelector("#hud");
const phaseLabel = document.querySelector("#phase-label");
const timer = document.querySelector("#timer");
const messageCount = document.querySelector("#message-count");
const feedStatus = document.querySelector("#feed-status");
const pauseAllButton = document.querySelector("#pause-all");
const desktopHelp = document.querySelector("#desktop-help");
const toastEl = document.querySelector("#toast");
const exitOverlay = document.querySelector("#exit-overlay");
const exitYesButton = document.querySelector("#exit-yes");
const exitNoButton = document.querySelector("#exit-no");

const AFRAME = window.AFRAME;
const THREE = AFRAME.THREE;
const audio = new AudioEngine();
const leftAxis = new THREE.Vector2();
const camPos = new THREE.Vector3();
const forward = new THREE.Vector3();
const move = new THREE.Vector3();
const oldCam = new THREE.Vector3();
const newCam = new THREE.Vector3();
let cards;
let messages = [];
let startedAt = 0;
let running = false;
let phaseIndex = -1;
let currentPhase = null;
let lastSpawn = 0;
let lastSound = 0;
let closedCount = 0;
let paused = false;
let pauseStarted = 0;
let pausedMs = 0;
let snapLatch = false;
let toastTimer;
let initPromise;

const memeMessages = [
  ["GIPHY MEME", "Funny Reaction", "Ablenkung fühlt sich kurz gut an, aber der Feed bleibt offen.", "MEME"],
  ["GIPHY MEME", "Crying Meme", "Noch ein Clip, noch ein Reiz, noch ein kurzer Dopamin-Moment.", "MEME"],
  ["GIPHY MEME", "Dancing Meme", "Alles blinkt und bewegt sich weiter.", "MEME"],
  ["GIPHY MEME", "Fail Moment", "Man klickt weg und sucht sofort die nächste Ablenkung.", "MEME"],
].map(([source, title, excerpt, category]) => normalizeMessage({ source, title, excerpt, category }));

const phoneMessages = [
  ["WhatsApp", "Neue Nachricht", "3 neue Nachrichten in deiner Gruppe.", "WHATSAPP"],
  ["TikTok", "Nur noch ein Video", "Der Feed schlägt sofort das nächste Video vor.", "TIKTOK"],
  ["Instagram", "30 neue Likes", "Dein Beitrag bekommt neue Reaktionen.", "INSTAGRAM"],
  ["Snapchat", "Neuer Snap", "Nur kurz öffnen. Wirklich nur kurz.", "SNAPCHAT"],
  ["Mail", "Neue Mail", "Eine Nachricht wartet schon wieder.", "PUSH"],
].map(([source, title, excerpt, category]) => normalizeMessage({ source, title, excerpt, category }));

const state = { room: "news", complete: false };

browserButton.disabled = false;
vrButton.disabled = false;

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 900);
}

function setRoom(room) {
  state.room = room;
  closedCount = 0;
  phaseIndex = -1;
  currentPhase = null;
  lastSpawn = 0;
  startedAt = performance.now();
  pausedMs = 0;
  pauseStarted = 0;
  paused = false;
  cards?.releaseAll();
  exitOverlay.hidden = true;
  if (room === "news") feedStatus.textContent = "RSS ARCHIV";
  if (room === "meme") feedStatus.textContent = "MEME-RAUM";
  if (room === "phone") feedStatus.textContent = "HANDYRAUM";
}

function currentMessages() {
  if (state.room === "meme") return memeMessages;
  if (state.room === "phone") return phoneMessages;
  return messages;
}

function randomMessage() {
  const list = currentMessages();
  return list[Math.floor(Math.random() * list.length)];
}

function play(slot, pitch = 1) {
  const now = performance.now();
  if (!slot || now - lastSound < 65) return;
  lastSound = now;
  slot.entity.object3D.getWorldPosition(camPos);
  audio.plop((slot.pitch || 1) * pitch, camPos);
}

function spawnCard(sound = true) {
  if (!cards || cards.size >= cards.max) return;
  cameraEl.object3D.getWorldPosition(camPos);
  const slot = cards.acquire(randomMessage(), camPos, performance.now(), currentPhase || { motion: 1 });
  if (slot && sound) play(slot, state.room === "meme" ? 1.28 : state.room === "phone" ? 1.55 : 0.78);
  updateCount();
}

function updateCount() {
  if (!cards) return;
  messageCount.textContent = `${cards.size} ${state.room === "meme" ? "MEMES" : state.room === "phone" ? "PUSH" : "NEWS"}`;
}

function closeCard(slot) {
  slot.entity.object3D.getWorldPosition(camPos);
  audio.close(slot.pitch, camPos);
  cards.release(slot);
  closedCount += 1;
  const extra = state.room === "news" ? 1 + Math.min(5, Math.floor(closedCount / 2)) : 2 + Math.min(8, Math.floor(closedCount / 2));
  cards.makeSpace(extra);
  for (let i = 0; i < extra; i += 1) spawnCard(true);
  showToast(state.room === "news" ? "MEHR NEWS" : state.room === "meme" ? "MEHR MEMES" : "MEHR PUSH");
  updateCount();
}

function toggleCard(slot) {
  slot.paused = !slot.paused;
  cards.refreshColor(slot);
  showToast(slot.paused ? "ANGEHALTEN" : "WEITER");
}

function elapsed(now) {
  return (now - startedAt - pausedMs - (paused ? now - pauseStarted : 0)) / 1000;
}

function enterPhase(index, phase) {
  phaseIndex = index;
  currentPhase = phase;
  phaseLabel.textContent = phase.label;
  vrPhase.setAttribute("value", phase.label);
  lastSpawn = 0;
  cards.releaseAll();
  if (phase.type === "pause") {
    cardsRoot.object3D.visible = false;
    swarmRoot.object3D.visible = false;
    return;
  }
  cardsRoot.object3D.visible = true;
  swarmRoot.object3D.visible = true;
  for (let i = 0; i < phase.initial; i += 1) setTimeout(() => spawnCard(true), i * 75);
}

function showRoomExit() {
  if (!exitOverlay.hidden) return;
  cards.releaseAll();
  phaseLabel.textContent = "RAUM VERLASSEN";
  vrPhase.setAttribute("value", "RAUM VERLASSEN");
  exitOverlay.hidden = scene.is("vr-mode");
  if (scene.is("vr-mode")) {
    if (state.room === "news") setRoom("meme");
    else if (state.room === "meme") setRoom("phone");
    else setRoom("news");
  }
}

function updatePhase(now) {
  const e = elapsed(now);
  const p = phaseAt(e);
  timer.textContent = `00:${String(Math.min(cycleDuration, Math.floor(e))).padStart(2, "0")}`;
  if (p.complete) {
    showRoomExit();
    return null;
  }
  if (p.index !== phaseIndex) enterPhase(p.index, p.phase);
  return p;
}

function updateLocomotion(delta) {
  if (!scene.is("vr-mode")) return;
  const y = Math.abs(leftAxis.y) > 0.14 ? leftAxis.y : 0;
  if (!y) return;
  cameraEl.object3D.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  move.copy(forward).multiplyScalar(-y * delta * 1.35);
  rig.object3D.position.add(move);
}

function snapTurn(direction) {
  if (!scene.is("vr-mode")) return;
  cameraEl.object3D.getWorldPosition(oldCam);
  rig.object3D.rotation.y += THREE.MathUtils.degToRad(direction * -30);
  rig.object3D.updateMatrixWorld(true);
  cameraEl.object3D.getWorldPosition(newCam);
  rig.object3D.position.add(oldCam.sub(newCam));
}

async function toggleAll() {
  if (!running) return;
  const now = performance.now();
  paused = !paused;
  if (paused) {
    pauseStarted = now;
    await audio.suspend();
  } else {
    pausedMs += now - pauseStarted;
    await audio.resume();
  }
  pauseAllButton.textContent = paused ? "ALLE FORTSETZEN" : "ALLE ANHALTEN";
}

function press(controller) {
  const hit = controller.components.raycaster?.intersections?.[0];
  if (!hit) return;
  const slot = hit.object?.userData?.slot;
  if (slot) closeCard(slot);
}

async function init() {
  const loaded = await loadMessages();
  messages = loaded.messages;
  feedStatus.textContent = loaded.rssCount ? `${loaded.rssCount} RSS-MELDUNGEN` : "RSS-FALLBACK";
  cards = new CardPool({ THREE, root: cardsRoot, max: 220, onToggle: toggleCard, onClose: closeCard });
  cardsRoot.object3D.visible = false;
  browserButton.disabled = false;
  vrButton.disabled = !navigator.xr;
}

function ensureInit() {
  if (!initPromise) initPromise = init();
  return initPromise;
}

async function start({ enterVR = false } = {}) {
  await ensureInit();
  await audio.start();
  startScreen.classList.add("is-hidden");
  hud.classList.add("is-visible");
  pauseAllButton.classList.add("is-visible");
  desktopHelp.classList.add("is-visible");
  running = true;
  setRoom("news");
  if (enterVR) {
    try { await scene.enterVR(); } catch { showToast("VR START ABGEBROCHEN"); }
  }
}

browserButton.addEventListener("click", () => start());
vrButton.addEventListener("click", () => start({ enterVR: true }));
pauseAllButton.addEventListener("click", toggleAll);
exitNoButton.addEventListener("click", () => { exitOverlay.hidden = true; setRoom(state.room); });
exitYesButton.addEventListener("click", () => {
  exitOverlay.hidden = true;
  if (state.room === "news") setRoom("meme");
  else if (state.room === "meme") setRoom("phone");
  else setRoom("news");
});
leftController.addEventListener("thumbstickmoved", (event) => {
  const x = event.detail.x || 0;
  leftAxis.set(0, event.detail.y || 0);
  if (Math.abs(x) > 0.68 && !snapLatch) { snapLatch = true; snapTurn(Math.sign(x)); }
  if (Math.abs(x) < 0.24) snapLatch = false;
});
rightController.addEventListener("thumbstickmoved", (event) => {
  const x = event.detail.x || 0;
  if (Math.abs(x) > 0.68 && !snapLatch) { snapLatch = true; snapTurn(Math.sign(x)); }
  if (Math.abs(x) < 0.24) snapLatch = false;
});
leftController.addEventListener("triggerdown", () => press(leftController));
rightController.addEventListener("triggerdown", () => press(rightController));
leftController.addEventListener("thumbstickdown", () => press(leftController));
rightController.addEventListener("thumbstickdown", () => press(rightController));
scene.addEventListener("enter-vr", () => { vrHud.setAttribute("visible", true); if (!running) void start(); });
scene.addEventListener("exit-vr", () => { vrHud.setAttribute("visible", false); });

AFRAME.registerComponent("nachrichtenraum-loop", {
  tick(_time, deltaMs) {
    const now = performance.now();
    const delta = Math.min(deltaMs / 1000, 0.05);
    if (!running || !cards || paused) return;
    updateLocomotion(delta);
    const p = updatePhase(now);
    if (!p || p.phase.type === "pause") return;
    const rate = THREE.MathUtils.lerp(p.phase.startRate, p.phase.endRate, p.progress);
    const target = Math.round(THREE.MathUtils.lerp(p.phase.initial, p.phase.target, p.progress));
    if (now - lastSpawn > rate && cards.size < target) {
      lastSpawn = now;
      for (let i = 0; i < p.phase.batch && cards.size < target; i += 1) spawnCard(true);
    }
    cameraEl.object3D.getWorldPosition(camPos);
    cards.update(delta, p.phase.intensity, now, camPos);
  },
});
scene.setAttribute("nachrichtenraum-loop", "");
setTimeout(() => void ensureInit(), 300);
