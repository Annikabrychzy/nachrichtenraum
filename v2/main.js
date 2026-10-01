import { AudioEngine } from "./src/audio-engine.js?v=rooms-13";
import { CardPool } from "./src/card-pool.js?v=rooms-13";
import { loadMessages, normalizeMessage } from "./src/feeds.js?v=rooms-12";
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
let cards, messages = [], startedAt = 0, running = false, phaseIndex = -1, currentPhase = null, lastSpawn = 0, lastSound = 0, lastCalm = 0, closedCount = 0, paused = false, pauseStarted = 0, pausedMs = 0, snapLatch = false, toastTimer, initPromise;

const memeMessages = [
  ["GIPHY Feels", "Feels Deep", "Ein Feel-Moment als bunte Giphy-Bildkarte.", "MEME", "https://media.giphy.com/media/ISOckXUybVfQ4/giphy.gif"], ["GIPHY Feels", "Confused Feelings", "Reaction, Drama, Gefühl, sofort der nächste Clip.", "MEME", "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif"], ["GIPHY Fail", "Fail Moment", "Ein Fail-Clip zieht vorbei und wird direkt ersetzt.", "MEME", "https://media.giphy.com/media/TJawtKM6OCKkvwCIqX/giphy.gif"], ["GIPHY Fail", "Nope Fail", "Noch ein Fail, noch ein kurzer Reiz.", "MEME", "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif"], ["GIPHY Judge Judy", "Judge Judy Reaction", "Bewerten, reagieren, weiter scrollen.", "MEME", "https://media.giphy.com/media/3o6Zt4HU9uwXmXSAuI/giphy.gif"], ["GIPHY Crying", "Crying Reaction", "Crying, Sad, Waiting — Gefühl als kurzer Clip.", "MEME", "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif"], ["GIPHY Crying", "Big Cry", "Dramatischer Feel-Clip, direkt der nächste.", "MEME", "https://media.giphy.com/media/l378giAZgxPw3eO52/giphy.gif"], ["GIPHY Laughing", "Laughing LOL", "Laughing, Rating, Okay — alles blinkt und zieht weiter.", "MEME", "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif"], ["GIPHY Happy", "Happy Congratulations", "Happy, Congrats, Hug — Dopamin und direkt noch mehr.", "MEME", "https://media.giphy.com/media/ely3apij36BJhoZ234/giphy.gif"], ["GIPHY Gaming", "Gaming Fail", "Gaming, Fail, Funny, Excited — direkt noch eins.", "MEME", "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif"], ["GIPHY Fashion", "Hair Flip", "Fashion, Beauty, Hairflip und schnelle Bilder.", "MEME", "https://media.giphy.com/media/l0MYryZTmQgvHI5TG/giphy.gif"], ["GIPHY WTF", "What the fuck?", "No, Confused, What? Noch ein Clip, noch ein Reiz.", "MEME", "https://media.giphy.com/media/6nWhy3ulBL7GSCvKw6/giphy.gif"], ["GIPHY Reaction", "Eye Roll", "Kurz schauen, reagieren, weiter ablenken.", "MEME", "https://media.giphy.com/media/3o6ZtcIrZzaqpfqrBu/giphy.gif"], ["GIPHY Meme", "Care-O-Meter", "Meme-Kachel wie auf Giphy, bunt und laut.", "MEME", "https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif"],
].map(([source, title, excerpt, category, image]) => normalizeMessage({ source, title, excerpt, category, image }));
const phoneMessages = [["WhatsApp", "Neue Nachricht", "3 neue Nachrichten in deiner Gruppe.", "WHATSAPP"], ["TikTok", "Nur noch ein Video", "Der Feed schlägt sofort das nächste Video vor.", "TIKTOK"], ["Instagram", "30 neue Likes", "Dein Beitrag bekommt neue Reaktionen.", "INSTAGRAM"], ["Snapchat", "Neuer Snap", "Nur kurz öffnen. Wirklich nur kurz.", "SNAPCHAT"], ["Mail", "Neue Mail", "Eine Nachricht wartet schon wieder.", "PUSH"], ["Telefon", "Verpasster Anruf", "Jemand hat versucht, dich zu erreichen.", "PUSH"], ["Nachrichten", "Neue SMS", "Eine neue Mitteilung ist eingetroffen.", "WHATSAPP"], ["Twitter", "Trend explodiert", "Alle reden gerade darüber.", "TIKTOK"], ["Facebook", "Neue Kommentare", "Mehr Reaktionen auf deinen Post.", "INSTAGRAM"]].map(([source, title, excerpt, category]) => normalizeMessage({ source, title, excerpt, category }));
const rooms = ["news", "meme", "phone", "overload"];
const state = { room: "news" };
browserButton.disabled = false; vrButton.disabled = false;
function showToast(text) { toastEl.textContent = text; toastEl.classList.add("is-visible"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 900); }
function roomLabel(room) { return room === "news" ? "POLITIKRAUM" : room === "meme" ? "MEME-RAUM" : room === "phone" ? "HANDYRAUM" : room === "overload" ? "OVERLOAD-RAUM" : "PAUSE"; }
function nextRoom() { return rooms[(rooms.indexOf(state.room) + 1) % rooms.length]; }
function setRoom(room) { state.room = room; closedCount = 0; phaseIndex = -1; currentPhase = null; lastSpawn = 0; lastCalm = 0; startedAt = performance.now(); pausedMs = 0; pauseStarted = 0; paused = false; cards?.releaseAll(); hideExitPrompt(); feedStatus.textContent = roomLabel(room); document.body.dataset.room = room; if (restNote) restNote.hidden = room !== "rest"; if (room === "rest") { phaseLabel.textContent = "PAUSE"; vrPhase.setAttribute("value", "PAUSE"); messageCount.textContent = "RUHE"; timer.textContent = "--:--"; pauseAllButton.textContent = "PAUSE"; window.setTimeout(() => { if (state.room === "rest") showRoomExit(); }, 7000); } else pauseAllButton.textContent = "ALLE ANHALTEN"; }
function currentMessages() { if (state.room === "meme") return memeMessages; if (state.room === "phone") return phoneMessages; if (state.room === "overload") return null; return messages; }
function randomMessage() { if (state.room === "overload") { const roll = Math.random(); const list = roll < 0.18 ? messages : roll < 0.65 ? memeMessages : phoneMessages; return list[Math.floor(Math.random() * list.length)]; } const list = currentMessages(); return list[Math.floor(Math.random() * list.length)]; }
function play(slot, pitch = 1) { const now = performance.now(); if (!slot || now - lastSound < 42) return; lastSound = now; slot.entity.object3D.getWorldPosition(camPos); audio.plop((slot.pitch || 1) * pitch, camPos); }
function roomPitch() { return state.room === "news" ? 0.78 : state.room === "meme" ? 1.48 + Math.random() * 0.28 : state.room === "phone" ? 1.58 : 0.82 + Math.random() * 1.05; }
function spawnCard(sound = true) { if (!cards || state.room === "rest" || cards.size >= cards.max) return; cameraEl.object3D.getWorldPosition(camPos); const phase = currentPhase ? { ...currentPhase, motion: state.room === "overload" ? currentPhase.motion + 2.7 : currentPhase.motion } : { motion: 1 }; const slot = cards.acquire(randomMessage(), camPos, performance.now(), phase); if (slot && sound) play(slot, roomPitch()); updateCount(); }
function updateCount() { if (!cards) return; messageCount.textContent = `${cards.size} ${state.room === "meme" ? "GIPHY" : state.room === "phone" ? "PUSH" : state.room === "overload" ? "OVERLOAD" : "MELDUNGEN"}`; }
function closeCard(slot) { slot.entity.object3D.getWorldPosition(camPos); audio.close(slot.pitch, camPos); cards.release(slot); closedCount += 1; const extra = state.room === "news" ? 3 + Math.min(7, Math.floor(closedCount / 2)) : state.room === "overload" ? 14 + Math.min(28, Math.floor(closedCount / 2)) : 7 + Math.min(14, Math.floor(closedCount / 2)); cards.makeSpace(extra); for (let i = 0; i < extra; i += 1) setTimeout(() => spawnCard(true), i * 34); showToast(state.room === "news" ? "MEHR POLITIK" : state.room === "meme" ? "MEHR GIPHY" : state.room === "phone" ? "MEHR PUSH" : "ALLES KOMMT ZURÜCK"); updateCount(); }
function toggleCard(slot) { slot.paused = !slot.paused; cards.refreshColor(slot); showToast(slot.paused ? "ANGEHALTEN" : "WEITER"); }
function elapsed(now) { return (now - startedAt - pausedMs - (paused ? now - pauseStarted : 0)) / 1000; }
function enterPhase(index, phase) { phaseIndex = index; currentPhase = phase; const label = `${roomLabel(state.room)} · ${phase.label}`; phaseLabel.textContent = label; vrPhase.setAttribute("value", label); lastSpawn = 0; cards.releaseAll(); cardsRoot.object3D.visible = true; const initial = state.room === "overload" ? phase.initial + 40 : state.room === "meme" ? phase.initial + 8 : phase.initial; for (let i = 0; i < initial; i += 1) setTimeout(() => spawnCard(true), i * 42); }
function hideExitPrompt() { exitOverlay.hidden = true; if (exitRoot) exitRoot.setAttribute("visible", false); }
function showRoomExit() { const rest = state.room === "rest"; const question = rest ? "ZUM ANFANG ZURÜCK?" : "MÖCHTEN SIE DIESEN RAUM VERLASSEN?"; const yesLabel = rest ? "ZUM START" : "JA"; const noLabel = rest ? "HIER BLEIBEN" : "NEIN"; document.querySelector("#vr-exit-question")?.setAttribute("value", question); document.querySelector("#vr-exit-yes-label")?.setAttribute("value", yesLabel); document.querySelector("#vr-exit-no-label")?.setAttribute("value", noLabel); const browserQuestion = exitOverlay?.querySelector("p"); if (browserQuestion) browserQuestion.textContent = question; if (exitYesButton) exitYesButton.textContent = yesLabel; if (exitNoButton) exitNoButton.textContent = noLabel; phaseLabel.textContent = rest ? "PAUSE" : "WEITER"; vrPhase.setAttribute("value", rest ? "PAUSE" : "WEITER"); exitOverlay.hidden = false; showVrExitPrompt(); }
function updatePhase(now) { if (state.room === "rest") return null; const e = elapsed(now); const p = phaseAt(e); timer.textContent = `00:${String(Math.min(cycleDuration, Math.floor(e))).padStart(2, "0")}`; if (p.complete) { if (state.room === "overload") { setRoom("rest"); return null; } showRoomExit(); return null; } if (p.index !== phaseIndex) enterPhase(p.index, p.phase); return p; }
function updateLocomotion(delta) { if (!scene.is("vr-mode")) return; const y = Math.abs(leftAxis.y) > 0.14 ? leftAxis.y : 0; if (!y) return; cameraEl.object3D.getWorldDirection(forward); forward.y = 0; forward.normalize(); move.copy(forward).multiplyScalar(-y * delta * 1.35); rig.object3D.position.add(move); }
function snapTurn(direction) { if (!scene.is("vr-mode")) return; cameraEl.object3D.getWorldPosition(oldCam); rig.object3D.rotation.y += THREE.MathUtils.degToRad(direction * -30); rig.object3D.updateMatrixWorld(true); cameraEl.object3D.getWorldPosition(newCam); rig.object3D.position.add(oldCam.sub(newCam)); }
async function toggleAll() { if (!running) return; const now = performance.now(); paused = !paused; if (paused) { pauseStarted = now; await audio.suspend(); } else { pausedMs += now - pauseStarted; await audio.resume(); } pauseAllButton.textContent = paused ? "ALLE FORTSETZEN" : "ALLE ANHALTEN"; }
function exitActionFromObject(object) { let current = object; while (current) { if (current.userData?.exitAction) return current.userData.exitAction; current = current.parent; } return ""; }
function exitOpen() { return exitOverlay && !exitOverlay.hidden; }
function press(controller) { const hit = controller.components.raycaster?.intersections?.[0]; if (exitOpen()) { const action = exitActionFromObject(hit?.object); if (action === "no") stayInRoom(); else goNextRoom(); return; } if (!hit) return; const slot = hit.object?.userData?.slot; if (slot) { closeCard(slot); return; } const action = exitActionFromObject(hit.object); if (action === "yes") goNextRoom(); if (action === "no") stayInRoom(); }
function goNextRoom() { hideExitPrompt(); if (state.room === "rest") { running = false; cards?.releaseAll(); cardsRoot.object3D.visible = false; hud.classList.remove("is-visible"); desktopHelp.classList.remove("is-visible"); startScreen.classList.remove("is-hidden"); return; } if (state.room === "overload") setRoom("rest"); else setRoom(nextRoom()); }
function stayInRoom() { hideExitPrompt(); setRoom(state.room); }
window.nachrichtenraumGoNextRoom = goNextRoom;
window.nachrichtenraumStayInRoom = stayInRoom;
window.nachrichtenraumCloseCardFromHit = (intersection, controller) => { const slot = intersection?.object?.userData?.slot; if (slot?.active) closeCard(slot); };
function buildVrExitPrompt() { if (!exitRoot) return; exitRoot.dataset.ready = "true"; }
function showVrExitPrompt() { buildVrExitPrompt(); if (exitRoot) exitRoot.setAttribute("visible", true); }
async function init() { const loaded = await loadMessages(); messages = loaded.messages; feedStatus.textContent = loaded.rssCount ? `${loaded.rssCount} RSS-MELDUNGEN` : "RSS-FALLBACK"; cards = new CardPool({ THREE, root: cardsRoot, max: 340, onToggle: toggleCard, onClose: closeCard }); cardsRoot.object3D.visible = false; buildVrExitPrompt(); browserButton.disabled = false; vrButton.disabled = !navigator.xr; }
function ensureInit() { if (!initPromise) initPromise = init(); return initPromise; }
async function start({ enterVR = false } = {}) { await ensureInit(); await audio.start(); startScreen.classList.add("is-hidden"); hud.classList.add("is-visible"); pauseAllButton.classList.add("is-visible"); desktopHelp.classList.add("is-visible"); running = true; setRoom("news"); if (enterVR) { try { await scene.enterVR(); } catch { showToast("VR START ABGEBROCHEN"); } } }
browserButton.addEventListener("click", () => start()); vrButton.addEventListener("click", () => start({ enterVR: true })); pauseAllButton.addEventListener("click", toggleAll); exitNoButton.addEventListener("click", stayInRoom); exitYesButton.addEventListener("click", goNextRoom);
leftController.addEventListener("thumbstickmoved", (event) => { const x = event.detail.x || 0; leftAxis.set(0, event.detail.y || 0); if (Math.abs(x) > 0.68 && !snapLatch) { snapLatch = true; snapTurn(Math.sign(x)); } if (Math.abs(x) < 0.24) snapLatch = false; });
rightController.addEventListener("thumbstickmoved", (event) => { const x = event.detail.x || 0; if (Math.abs(x) > 0.68 && !snapLatch) { snapLatch = true; snapTurn(Math.sign(x)); } if (Math.abs(x) < 0.24) snapLatch = false; });
leftController.addEventListener("triggerdown", () => press(leftController)); rightController.addEventListener("triggerdown", () => press(rightController)); leftController.addEventListener("thumbstickdown", () => press(leftController)); rightController.addEventListener("thumbstickdown", () => press(rightController));
scene.addEventListener("enter-vr", () => { vrHud.setAttribute("visible", true); if (!running) void start(); if (exitOpen()) showVrExitPrompt(); }); scene.addEventListener("exit-vr", () => { vrHud.setAttribute("visible", false); });
AFRAME.registerComponent("nachrichtenraum-loop", { tick(_time, deltaMs) { const now = performance.now(); const delta = Math.min(deltaMs / 1000, 0.05); if (!running || !cards || paused) return; updateLocomotion(delta); if (state.room === "rest") { if (now - lastCalm > 5200) { lastCalm = now; audio.calm(); } return; } const p = updatePhase(now); if (exitOpen()) { cameraEl.object3D.getWorldPosition(camPos); cards.update(delta, (currentPhase?.intensity || 1.6) + (state.room === "overload" ? 4.2 : 0), now, camPos); return; } if (!p) return; const rate = THREE.MathUtils.lerp(p.phase.startRate, p.phase.endRate, p.progress); const extraTarget = state.room === "overload" ? 160 : state.room === "meme" ? 40 : 0; const target = Math.round(THREE.MathUtils.lerp(p.phase.initial, p.phase.target + extraTarget, p.progress)); if (now - lastSpawn > rate && cards.size < target) { lastSpawn = now; for (let i = 0; i < p.phase.batch && cards.size < target; i += 1) spawnCard(true); } cameraEl.object3D.getWorldPosition(camPos); cards.update(delta, p.phase.intensity + (state.room === "overload" ? 4.2 : 0), now, camPos); } });
scene.setAttribute("nachrichtenraum-loop", ""); setTimeout(() => void ensureInit(), 300);
