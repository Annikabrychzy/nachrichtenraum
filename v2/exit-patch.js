(() => {
  const style = document.createElement("style");
  style.textContent = `
    .exit-overlay {
      align-items: start !important;
      justify-items: end !important;
      place-items: start end !important;
      background: transparent !important;
    }
    .exit-panel {
      width: min(310px, calc(100vw - 28px)) !important;
      margin: 18px !important;
      padding: 16px 16px 15px !important;
      border-radius: 18px !important;
    }
    .exit-panel p {
      margin: 0 0 12px !important;
      font-size: clamp(1rem, 2.4vw, 1.25rem) !important;
    }
    .exit-panel button {
      min-width: 82px !important;
      padding: 10px 16px !important;
    }
  `;
  document.head.appendChild(style);

  function tuneExitQuestion() {
    const yes = document.querySelector("#exit-choice-yes");
    const no = document.querySelector("#exit-choice-no");
    const group = yes?.parentElement || no?.parentElement;
    if (!group) return;
    group.setAttribute("position", "1.18 2.08 -2.25");
    const children = [...group.children];
    const back = children.find((el) => el.tagName?.toLowerCase() === "a-plane" && !el.id);
    if (back) {
      back.setAttribute("width", "1.35");
      back.setAttribute("height", "0.72");
    }
    const texts = children.filter((el) => el.tagName?.toLowerCase() === "a-text");
    if (texts[0]) {
      texts[0].setAttribute("value", "Raum verlassen?");
      texts[0].setAttribute("position", "0 0.18 0.02");
      texts[0].setAttribute("width", "1.35");
    }
    if (texts[1]) {
      texts[1].setAttribute("value", "Ja: neuer Raum · Nein: weiter");
      texts[1].setAttribute("position", "0 0.02 0.022");
      texts[1].setAttribute("width", "1.05");
    }
    if (yes) {
      yes.setAttribute("position", "-0.26 -0.22 0.018");
      yes.setAttribute("width", "0.42");
      yes.setAttribute("height", "0.18");
      yes.querySelector("a-text")?.setAttribute("width", "1.05");
    }
    if (no) {
      no.setAttribute("position", "0.26 -0.22 0.018");
      no.setAttribute("width", "0.42");
      no.setAttribute("height", "0.18");
      no.querySelector("a-text")?.setAttribute("width", "1.05");
    }
    const phaseLabel = document.querySelector("#phase-label");
    const vrPhase = document.querySelector("#vr-phase");
    if (phaseLabel?.textContent.includes("ENTSCHEIDUNG")) phaseLabel.textContent = "RAUM VERLASSEN?";
    if (vrPhase?.getAttribute("value")?.includes("ENTSCHEIDUNG")) vrPhase.setAttribute("value", "RAUM VERLASSEN?");
  }

  function tuneColorRoom() {
    const root = document.querySelector("#exit-root");
    const group = root?.getObject3D?.("neonTunnel");
    if (!group) return;
    group.traverse((object) => {
      const type = object.geometry?.type || "";
      if (type === "TorusGeometry") {
        object.visible = false;
        return;
      }
      if (object.userData) {
        object.userData.spin = (object.userData.spin || 0) * 0.18;
        object.userData.bob = Math.min(object.userData.bob || 0.04, 0.08);
      }
      if (object.material) object.material.opacity = Math.min(object.material.opacity ?? 0.6, 0.62);
    });
    const count = document.querySelector("#message-count");
    const help = document.querySelector("#desktop-help");
    if (document.body.classList.contains("is-exit-tunnel")) {
      if (count) count.textContent = "BUNTER RAUM";
      if (help) help.textContent = "Neuer Raum: ruhige Farben bewegen sich um dich herum. Oben rechts: Raum verlassen.";
    }
  }

  const observer = new MutationObserver(() => {
    tuneExitQuestion();
    tuneColorRoom();
  });

  window.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["visible", "hidden", "class"] });
    setInterval(() => {
      tuneExitQuestion();
      tuneColorRoom();
    }, 500);
  });
})();
