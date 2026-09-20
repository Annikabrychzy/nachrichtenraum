(() => {
  const style = document.createElement("style");
  style.textContent = `
    .exit-overlay {
      position: fixed !important;
      inset: auto max(18px, env(safe-area-inset-right)) auto auto !important;
      top: max(18px, env(safe-area-inset-top)) !important;
      z-index: 24 !important;
      display: block !important;
      background: transparent !important;
      pointer-events: auto !important;
    }
    .exit-panel {
      width: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
    }
    .exit-panel p,
    .exit-panel #exit-no,
    .exit-panel div button#exit-no {
      display: none !important;
    }
    #exit-yes,
    .exit-simple-button {
      min-width: 0 !important;
      border: 1px solid rgba(142, 184, 255, 0.8) !important;
      border-radius: 0 !important;
      padding: 12px 16px !important;
      color: #ffffff !important;
      background: rgba(18, 60, 140, 0.92) !important;
      box-shadow: 0 0 28px rgba(0, 97, 255, 0.28) !important;
      font-size: 10px !important;
      font-weight: 800 !important;
      letter-spacing: 0.15em !important;
      text-transform: uppercase !important;
      cursor: pointer !important;
    }
  `;
  document.head.appendChild(style);

  function simplifyDesktopExit() {
    const overlay = document.querySelector("#exit-overlay");
    const yes = document.querySelector("#exit-yes");
    const no = document.querySelector("#exit-no");
    if (!overlay || !yes) return;
    yes.textContent = "Raum verlassen";
    yes.classList.add("exit-simple-button");
    if (no) no.hidden = true;
    const p = overlay.querySelector("p");
    if (p) p.style.display = "none";
  }

  function simplifyVrExit() {
    const yes = document.querySelector("#exit-choice-yes") || document.querySelector("#exit-choice-leave");
    const no = document.querySelector("#exit-choice-no");
    const group = yes?.parentElement || no?.parentElement;
    if (!group || !yes) return;

    group.setAttribute("position", "1.1 2.08 -2.25");
    [...group.children].forEach((child) => {
      if (child !== yes) child.setAttribute("visible", "false");
    });

    yes.id = "exit-choice-leave";
    yes.setAttribute("visible", "true");
    yes.setAttribute("position", "0 0 0.018");
    yes.setAttribute("width", "0.92");
    yes.setAttribute("height", "0.24");
    yes.setAttribute("material", "color: #123c8c; shader: flat; transparent: true; opacity: 0.96");
    const text = yes.querySelector("a-text");
    if (text) {
      text.setAttribute("value", "Raum verlassen");
      text.setAttribute("width", "1.12");
      text.setAttribute("color", "#ffffff");
    }

    const phaseLabel = document.querySelector("#phase-label");
    const vrPhase = document.querySelector("#vr-phase");
    if (phaseLabel?.textContent.includes("ENTSCHEIDUNG") || phaseLabel?.textContent.includes("?")) phaseLabel.textContent = "RAUM VERLASSEN";
    if (vrPhase?.getAttribute("value")?.includes("ENTSCHEIDUNG") || vrPhase?.getAttribute("value")?.includes("?")) vrPhase.setAttribute("value", "RAUM VERLASSEN");
  }

  function calmSecondRoom() {
    const root = document.querySelector("#exit-root");
    const group = root?.getObject3D?.("neonTunnel");
    if (!group) return;
    group.traverse((object) => {
      if (object.geometry?.type === "TorusGeometry") object.visible = false;
      if (object.userData) {
        object.userData.spin = (object.userData.spin || 0) * 0.2;
        object.userData.bob = Math.min(object.userData.bob || 0.05, 0.09);
      }
      if (object.material) object.material.opacity = Math.min(object.material.opacity ?? 0.6, 0.62);
    });
    const count = document.querySelector("#message-count");
    const help = document.querySelector("#desktop-help");
    if (document.body.classList.contains("is-exit-tunnel")) {
      if (count) count.textContent = "GIPHY RAUM";
      if (help) help.textContent = "Giphy-Raum: erst ruhig, dann mehr Bewegung, dann Overload.";
    }
  }

  function applyPatch() {
    simplifyDesktopExit();
    simplifyVrExit();
    calmSecondRoom();
  }

  window.addEventListener("DOMContentLoaded", () => {
    applyPatch();
    new MutationObserver(applyPatch).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["visible", "hidden", "class"],
    });
    setInterval(applyPatch, 250);
  });
})();
