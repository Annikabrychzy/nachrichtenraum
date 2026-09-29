function exitPromptVisible() {
  const root = document.querySelector("#exit-root");
  if (!root) return false;
  const visible = root.getAttribute("visible");
  return visible === true || visible === "true";
}

function exitActionFromObject(object) {
  let current = object;
  while (current) {
    if (current.userData?.exitAction) return current.userData.exitAction;
    const id = current.el?.id || "";
    if (id === "vr-exit-yes" || id === "exit-choice-yes") return "yes";
    if (id === "vr-exit-no" || id === "exit-choice-no") return "no";
    current = current.parent;
  }
  return "";
}

function clickExitButton(action) {
  const button = document.querySelector(action === "no" ? "#exit-no" : "#exit-yes");
  button?.click();
}

function handleVrExitTrigger(event) {
  if (!exitPromptVisible()) return;
  const controller = event.currentTarget;
  const hit = controller.components?.raycaster?.intersections?.[0];
  const action = exitActionFromObject(hit?.object) || "yes";
  event.preventDefault?.();
  event.stopImmediatePropagation?.();
  clickExitButton(action === "no" ? "no" : "yes");
}

function bindVrExitPatch() {
  for (const selector of ["#left-controller", "#right-controller"]) {
    const controller = document.querySelector(selector);
    if (!controller || controller.dataset.exitPatchReady) continue;
    controller.dataset.exitPatchReady = "true";
    controller.addEventListener("triggerdown", handleVrExitTrigger, true);
    controller.addEventListener("thumbstickdown", handleVrExitTrigger, true);
  }
}

bindVrExitPatch();
window.addEventListener("load", bindVrExitPatch);
setInterval(bindVrExitPatch, 800);
