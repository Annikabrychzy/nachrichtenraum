import { AudioEngine } from "./src/audio-engine.js?v=rooms-11";
import { CardPool } from "./src/card-pool.js?v=rooms-11";
import { loadMessages, normalizeMessage } from "./src/feeds.js?v=rooms-10";
import { phaseAt, cycleDuration } from "./src/timeline.js?v=rooms-10";

const scene = document.querySelector("#xr-scene");
const rig = document.querySelector("#rig");
const cameraEl = document.querySelector("#viewer");
const leftController = document.querySelector("#left-controller");
const rightController = document.querySelector("#right-controller");
const cardsRoot = document.querySelector("#news-root");
const exitRoot = document.querySelector("#exit-root");
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
const restNote = document.querySelector("#rest-note");

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
let lastCalm = 0;
let closedCount = 0;
let paused = false;
let pauseStarted = 0;
let pausedMs = 0;
let snapLatch = false;
let toastTimer;
let initPromise;

const memeMessages = [
  ["GIPHY Feels", "Everybody Hurts Sometimes", "Ein Feel-Moment als bunte Bildkarte.", "MEME"],
  ["GIPHY Feels", "Are you trying to hurt my feelings?", "Reaction, Drama, Gefühl, sofort der nächste Clip.", "MEME"],
  ["GIPHY Kategorie", "Action Reaction", "Action, Bewegung, Energie und ein neuer Reiz.", "MEME"],
  ["GIPHY Kategorie", "Gaming Fail", "Gaming, Fail, Funny, Excited — direkt noch eins.", "MEME"],
  ["GIPHY Kategorie", "Fashion / Beauty", "Glitzer, Outfit, Beauty, Style und schnelle Bilder.", "MEME"],
  ["GIPHY Kategorie", "Food & Drink", "Food, Drink, Cooking, Eating — kurz schön, dann weiter.", "MEME"],
  ["GIPHY Kategorie", "Happy / Congratulations", "Happy, Congrats, Hug — Dopamin und direkt noch mehr.", "MEME"],
  ["GIPHY Kategorie", "Sad / Crying", "Crying, Sad, Waiting — Gefühl als kurzer Clip.", "MEME"],
  ["GIPHY Kategorie", "Laughing LOL", "Laughing, Rating, Okay — alles blinkt und zieht weiter.", "MEME"],
  ["GIPHY Kategorie", "No / Confused / WTF", "No, Confused, What? Noch ein Clip, noch ein Reiz.", "MEME"],
].map(([source, title, excerpt, category]) => normalizeMessage({ source, title, excerpt, category }));

const phoneMessages = [
  ["WhatsApp", "Neue Nachricht", "3 neue Nachrichten in deiner Gruppe.", "WHATSAPP"],
  ["TikTok", "Nur noch ein Video", "Der Feed schlägt sofort das nächste Video vor.", "TIKTOK"],
  ["Instagram", "30 neue Likes", "Dein Beitrag bekommt neue Reaktionen.", "INSTAGRAM"],
  ["Snapchat", "Neuer Snap", "Nur kurz öffnen. Wirklich nur kurz.", "SNAPCHAT"],
  ["Mail", "Neue Mail", "Eine Nachricht wartet schon wieder.", "PUSH"],
  ["Telefon", "Verpasster Anruf", "Jemand hat versucht, dich zu erreichen.", "PUSH"],
  ["Nachrichten", "Neue SMS", "Eine neue Mitteilung ist eingetroffen.", "WHATSAPP"],
  ["Twitter", "Trend explodiert", "Alle reden gerade darüber.", "TIKTOK"],
  ["Facebook", "Neue Kommentare", "Mehr Reaktionen auf deinen Post.", "INSTAGRAM"],
].map(([source, title, excerpt, category]) => normalizeMessage({ source, title, excerpt, category }));

const rooms = ["news", "meme", "phone", "overload"];
const state = { room: "news" };
browserButton.disabled = false;
vrButton.disabled = false;

function showToast(text) { toastEl.textContent = text; toastEl.classList.add("is-visible"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 900); }
function roomLabel(room) { return room === "news" ? "POLITIKRAUM" : room === "meme" ? "MEME-RAUM" : room === "phone" ? "HANDYRAUM" : room === "overload" ? "OVERLOAD-RAUM" : "PAUSE"; }
function nextRoom() { return rooms[(rooms.indexOf(state.room) + 1) % rooms.length]; }
function setRoom(room) {
  state.room = room;
  closedCount = 0;
  phaseIndex = -1;
  currentPhase = null;
  lastSpawn = 0;
  lastCalm = 0;
  startedAt = performance.now();
  pausedMs = 0;
  pauseStarted = 0;
  paused = false;
  cards?.releaseAll();
  hideExitPrompt();
  feedStatus.textContent = roomLabel(room);
  document.body.dataset.room = room;
  if (restNote) restNote.hidden = room !== "rest";
  if (room === "rest") {
    phaseLabel.textContent = "PAUSE";
    vrPhase.setAttribute("value", "PAUSE");
    messageCount.textContent = "RUHE";
    timer.textContent = "--:--";
    pauseAllButton.textContent = "PAUSE";
  } else {
    pauseAllButton.textContent = "ALLE ANHALTEN";
  }
}
function currentMessages() {
  if (state.room === "meme") return memeMessages;
  if (state.room === "phone") return phoneMessages;
  if (state.room === "overload") return null;
  return messages;
}
function randomMessage() {
  if (state.room === "overload") {
    const roll = Math.random();
    const list = roll < 0.25 ? messages : roll < 0.63 ? memeMessages : phoneMessages;
    return list[Math.floor(Math.random() * list.length)];
  }
  const list = currentMessages();
  return list[Math.floor(Math.random() * list.length)];
}
function play(slot, pitch = 1) { const now = performance.now(); if (!slot || now - lastSound < 42) return; lastSound = now; slot.entity.object3D.getWorldPosition(camPos); audio.plop((slot.pitch || 1) * pitch, camPos); }
function roomPitch() { return state.room === "news" ? 0.78 : state.room === "meme" ? 1.48 + Math.random() * 0.28 : state.room === "phone" ? 1.58 : 0.82 + Math.random() * 1.05; }
function spawnCard(sound = true) { if (!cards || state.room === "rest" || cards.size >= cards.max) return; cameraEl.object3D.getWorldPosition(camPos); const phase = currentPhase ? { ...currentPhase, motion: state.room === "overload" ? currentPhase.motion + 2.7 : currentPhase.motion } : { motion: 1 }; const slot = cards.acquire(randomMessage(), camPos, performance.now(), phase); if (slot && sound) play(slot, roomPitch()); updateCount(); }
function updateCount() { if (!cards) return; messageCount.textContent = `${cards.size} ${state.room === "meme" ? "MEMES" : state.room === "phone" ? "PUSH" : state.room === "overload" ? "OVERLOAD" : "MELDUNGEN"}`; }
function closeCard(slot) { slot.entity.object3D.getWorldPosition(camPos); audio.close(slot.pitch, camPos); cards.release(slot); closedCount += 1; const extra = state.room === "news" ? 3 + Math.min(7, Math.floor(closedCount / 2)) : state.room === "overload" ? 14 + Math.min(28, Math.floor(closedCount / 2)) : 5 + Math.min(12, Math.floor(closedCount / 2)); cards.makeSpace(extra); for (let i = 0; i < extra; i += 1) setTimeout(() => spawnCard(true), i * 34); showToast(state.room === "news" ? "MEHR POLITIK" : state.room === "meme" ? "MEHR MEMES" : state.room === "phone" ? "MEHR PUSH" : "ALLES KOMMT ZURÜCK"); updateCount(); }
function toggleCard(slot) { slot.paused = !slot.paused; cards.refreshColor(slot); showToast(slot.paused ? "ANGEHALTEN" : "WEITER"); }
function elapsed(now) { return (now - startedAt - pausedMs - (paused ? now - pauseStarted : 0)) / 1000; }
function enterPhase(index, phase) { phaseIndex = index; currentPhase = phase; const label = `${roomLabel(state.room)} · ${phase.label}`; phaseLabel.textContent = label; vrPhase.setAttribute("value", label); lastSpawn = 0; cards.releaseAll(); cardsRoot.object3D.visible = true; const initial = state.room === "overload" ? phase.initial + 40 : phase.initial; for (let i = 0; i < initial; i += 1) setTimeout(() => spawnCard(true), i * 48); }
function hideExitPrompt() { exitOverlay.hidden = true; if (exitRoot) exitRoot.setAttribute("visible", false); }
function showRoomExit() {
  if (!exitOverlay.hidden) return;
  phaseLabel.textContent = "RAUM VERLASSEN";
  vrPhase.setAttribute("value", "RAUM VERLASSEN");
  exitOverlay.hidden = false;
  showVrExitPrompt();
}
function updatePhase(now) { if (state.room === "rest") return null; const e = elapsed(now); const p = phaseAt(e); timer.textContent = `00:${String(Math.min(cycleDuration, Math.floor(e))).padStart(2, "0")}`; if (p.complete) { showRoomExit(); return null; } if (p.index !== phaseIndex) enterPhase(p.index, p.phase); return p; }
function updateLocomotion(delta) { if (!scene.is("vr-mode")) return; const y = Math.abs(leftAxis.y) > 0.14 ? leftAxis.y : 0; if (!y) return; cameraEl.object3D.getWorldDirection(forward); forward.y = 0; forward.normalize(); move.copy(forward).multiplyScalar(-y * delta * 1.35); rig.object3D.position.add(move); }
function snapTurn(direction) { if (!scene.is("vr-mode")) return; cameraEl.object3D.getWorldPosition(oldCam); rig.object3D.rotation.y += THREE.MathUtils.degToRad(direction * -30); rig.object3D.updateMatrixWorld(true); cameraEl.object3D.getWorldPosition(newCam); rig.object3D.position.add(oldCam.sub(newCam)); }
async function toggleAll() { if (!running) return; const now = performance.now(); paused = !paused; if (paused) { pauseStarted = now; await audio.suspend(); } else { pausedMs += now - pauseStarted; await audio.resume(); } pauseAllButton.textContent = paused ? "ALLE FORTSETZEN" : "ALLE ANHALTEN"; }
function press(controller) {
  const hit = controller.components.raycaster?.intersections?.[0];
  if (!hit) return;
  const slot = hit.object?.userData?.slot;
  if (slot) { closeCard(slot); return; }
  const action = hit.object?.userData?.exitAction;
  if (action === "yes") goNextRoom();
  if (action === "no") stayInRoom();
}
function goNextRoom() { hideExitPrompt(); if (state.room === "overload") setRoom("rest"); else setRoom(nextRoom()); }
function stayInRoom() { hideExitPrompt(); setRoom(state.room); }
function makeVrExitButton(text, x, color, action) {
  const button = document.createElement("a-plane");
  button.classList.add("interactive");
  button.setAttribute("position", `${x} -0.045 0.012`);
  button.setAttribute("width", "0.25");
  button.setAttribute("height", "0.1");
  button.setAttribute("material", `color: ${color}; shader: flat; opacity: 0.96; depthTest: false`);
  button.addEventListener("loaded", () => { button.getObject3D("mesh").userData.exitAction = action; });
  const label = document.createElement("a-text");
  label.setAttribute("value", text);
  label.setAttribute("position", "0 0 0.008");
  label.setAttribute("align", "center");
  label.setAttribute("baseline", "center");
  label.setAttribute("width", "0.82");
  label.setAttribute("color", "#ffffff");
  label.setAttribute("material", "depthTest: false");
  button.appendChild(label);
  button.addEventListener("click", () => action === "yes" ? goNextRoom() : stayInRoom());
  return button;
}
function buildVrExitPrompt() {
  if (!exitRoot || exitRoot.dataset.ready) return;
  exitRoot.dataset.ready = "true";
  exitRoot.setAttribute("position", "-0.62 0.29 -1.22");
  const panel = document.createElement("a-plane");
  panel.setAttribute("width", "0.72");
  panel.setAttribute("height", "0.25");
  panel.setAttribute("material", "color: #061226; shader: flat; transparent: true; opacity: 0.94; depthTest: false");
  const text = document.createElement("a-text");
  text.setAttribute("value", "Möchten Sie diesen Raum verlassen?");
  text.setAttribute("position", "0 0.065 0.014");
  text.setAttribute("width", "0.82");
  text.setAttribute("align", "center");
  text.setAttribute("baseline", "center");
  text.setAttribute("color", "#dce8ff");
  text.setAttribute("material", "depthTest: false");
  panel.appendChild(text);
  panel.appendChild(makeVrExitButton("JA", -0.15, "#16a34a", "yes"));
  panel.appendChild(makeVrExitButton("NEIN", 0.15, "#111827", "no"));
  exitRoot.appendChild(panel);
}
function showVrExitPrompt() { buildVrExitPrompt(); if (exitRoot) exitRoot.setAttribute("visible", true); }
async function init() { const loaded = await loadMessages(); messages = loaded.messages; feedStatus.textContent = loaded.rssCount ? `${loaded.rssCount} RSS-MELDUNGEN` : "RSS-FALLBACK"; cards = new CardPool({ THREE, root: cardsRoot, max: 320, onToggle: toggleCard, onClose: closeCard }); cardsRoot.object3D.visible = false; buildVrExitPrompt(); browserButton.disabled = false; vrButton.disabled = !navigator.xr; }
function ensureInit() { if (!initPromise) initPromise = init(); return initPromise; }
async function start({ enterVR = false } = {}) { await ensureInit(); await audio.start(); startScreen.classList.add("is-hidden"); hud.classList.add("is-visible"); pauseAllButton.classList.add("is-visible"); desktopHelp.classList.add("is-visible"); running = true; setRoom("news"); if (enterVR) { try { await scene.enterVR(); } catch { showToast("VR START ABGEBROCHEN"); } } }

browserButton.addEventListener("click", () => start());
vrButton.addEventListener("click", () => start({ enterVR: true }));
pauseAllButton.addEventListener("click", toggleAll);
exitNoButton.addEventListener("click", stayInRoom);
exitYesButton.addEventListener("click", goNextRoom);
leftController.addEventListener("thumbstickmoved", (event) => { const x = event.detail.x || 0; leftAxis.set(0, event.detail.y || 0); if (Math.abs(x) > 0.68 && !snapLatch) { snapLatch = true; snapTurn(Math.sign(x)); } if (Math.abs(x) < 0.24) snapLatch = false; });
rightController.addEventListener("thumbstickmoved", (event) => { const x = event.detail.x || 0; if (Math.abs(x) > 0.68 && !snapLatch) { snapLatch = true; snapTurn(Math.sign(x)); } if (Math.abs(x) < 0.24) snapLatch = false; });
leftController.addEventListener("triggerdown", () => press(leftController));
rightController.addEventListener("triggerdown", () => press(rightController));
leftController.addEventListener("thumbstickdown", () => press(leftController));
rightController.addEventListener("thumbstickdown", () => press(rightController));
scene.addEventListener("enter-vr", () => { vrHud.setAttribute("visible", true); if (!running) void start(); if (!exitOverlay.hidden) showVrExitPrompt(); });
scene.addEventListener("exit-vr", () => { vrHud.setAttribute("visible", false); });

AFRAME.registerComponent("nachrichtenraum-loop", { tick(_time, deltaMs) { const now = performance.now(); const delta = Math.min(deltaMs / 1000, 0.05); if (!running || !cards || paused) return; updateLocomotion(delta); if (state.room === "rest") { if (now - lastCalm > 5200) { lastCalm = now; audio.calm(); } return; } const p = updatePhase(now); if (!exitOverlay.hidden) { cameraEl.object3D.getWorldPosition(camPos); cards.update(delta, (currentPhase?.intensity || 1.6) + (state.room === "overload" ? 4.2 : 0), now, camPos); return; } if (!p) return; const rate = THREE.MathUtils.lerp(p.phase.startRate, p.phase.endRate, p.progress); const extraTarget = state.room === "overload" ? 160 : 0; const target = Math.round(THREE.MathUtils.lerp(p.phase.initial, p.phase.target + extraTarget, p.progress)); if (now - lastSpawn > rate && cards.size < target) { lastSpawn = now; for (let i = 0; i < p.phase.batch && cards.size < target; i += 1) spawnCard(true); } cameraEl.object3D.getWorldPosition(camPos); cards.update(delta, p.phase.intensity + (state.room === "overload" ? 4.2 : 0), now, camPos); } });
scene.setAttribute("nachrichtenraum-loop", "");
setTimeout(() => void ensureInit(), 300);
