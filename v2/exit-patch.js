(function () {
  var style = document.createElement("style");
  style.textContent = "\n" +
    ".exit-overlay{position:fixed!important;inset:auto max(18px,env(safe-area-inset-right)) auto auto!important;top:max(18px,env(safe-area-inset-top))!important;z-index:24!important;display:block!important;background:transparent!important;pointer-events:auto!important;}\n" +
    ".exit-panel{width:auto!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;}\n" +
    ".exit-panel p,.exit-panel #exit-no{display:none!important;}\n" +
    "#exit-yes,.exit-simple-button{min-width:0!important;border:1px solid rgba(142,184,255,.8)!important;border-radius:0!important;padding:12px 16px!important;color:#fff!important;background:rgba(18,60,140,.92)!important;box-shadow:0 0 28px rgba(0,97,255,.28)!important;font-size:10px!important;font-weight:800!important;letter-spacing:.15em!important;text-transform:uppercase!important;cursor:pointer!important;}\n";
  document.head.appendChild(style);

  function safeRun(fn) {
    try { fn(); } catch (error) { console.warn("Nachrichtenraum Patch", error); }
  }

  function simplifyDesktopExit() {
    var overlay = document.querySelector("#exit-overlay");
    var yes = document.querySelector("#exit-yes");
    var no = document.querySelector("#exit-no");
    if (!overlay || !yes) return;
    yes.textContent = "Raum verlassen";
    yes.classList.add("exit-simple-button");
    if (no) no.hidden = true;
    var p = overlay.querySelector("p");
    if (p) p.style.display = "none";
  }

  function simplifyVrExit() {
    var yes = document.querySelector("#exit-choice-yes") || document.querySelector("#exit-choice-leave");
    var no = document.querySelector("#exit-choice-no");
    var group = yes ? yes.parentElement : (no ? no.parentElement : null);
    if (!group || !yes) return;

    group.setAttribute("position", "1.1 2.08 -2.25");
    Array.prototype.forEach.call(group.children, function (child) {
      if (child !== yes) child.setAttribute("visible", "false");
    });

    yes.id = "exit-choice-leave";
    yes.setAttribute("visible", "true");
    yes.setAttribute("position", "0 0 0.018");
    yes.setAttribute("width", "0.92");
    yes.setAttribute("height", "0.24");
    yes.setAttribute("material", "color: #123c8c; shader: flat; transparent: true; opacity: 0.96");
    var text = yes.querySelector("a-text");
    if (text) {
      text.setAttribute("value", "Raum verlassen");
      text.setAttribute("width", "1.12");
      text.setAttribute("color", "#ffffff");
    }
  }

  function applyPatch() {
    safeRun(simplifyDesktopExit);
    safeRun(simplifyVrExit);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", applyPatch, { once: true });
  } else {
    applyPatch();
  }

  window.addEventListener("click", function () { window.setTimeout(applyPatch, 50); }, true);
  window.addEventListener("loaded", function () { window.setTimeout(applyPatch, 50); }, true);
})();
