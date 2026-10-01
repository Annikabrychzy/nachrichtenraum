const left = document.querySelector("#left-controller");
const right = document.querySelector("#right-controller");
const exitRoot = document.querySelector("#exit-root");
const yes = document.querySelector("#vr-exit-yes");
const no = document.querySelector("#vr-exit-no");
const pauseButton = document.querySelector("#pause-all");
const vrPauseButton = document.querySelector("#vr-pause-button");

const style = document.createElement("style");
style.textContent = "#pause-all { display: none !important; }";
document.head.appendChild(style);
pauseButton?.classList.remove("is-visible");
if (vrPauseButton) vrPauseButton.setAttribute("visible", false);

for (const controller of [left, right]) {
  if (!controller) continue;
  controller.setAttribute("raycaster", "objects: .interactive; far: 14; showLine: true; lineColor: #b8fff1; lineOpacity: 0.96");
}

function actionFor(controller) {
  let object = controller?.components?.raycaster?.intersections?.[0]?.object;
  while (object) {
    if (object.el?.id === "vr-exit-yes") return "yes";
    if (object.el?.id === "vr-exit-no") return "no";
    object = object.parent;
  }
  return "";
}

function useExit(action) {
  if (action === "yes") window.nachrichtenraumGoNextRoom?.();
  if (action === "no") window.nachrichtenraumStayInRoom?.();
}

yes?.addEventListener("click", () => useExit("yes"), true);
no?.addEventListener("click", () => useExit("no"), true);

for (const controller of [left, right]) {
  controller?.addEventListener("triggerdown", (event) => {
    if (!exitRoot?.getAttribute("visible")) return;
    const action = actionFor(controller);
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    useExit(action);
  }, true);
}
