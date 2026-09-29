const exitRoot = document.querySelector("#exit-root");
const yes = document.querySelector("#vr-exit-yes");
const no = document.querySelector("#vr-exit-no");

function mark(el, action) {
  if (!el) return;
  el.classList.add("interactive");
  el.object3D.userData.exitAction = action;
  const mesh = el.getObject3D("mesh");
  if (mesh) mesh.userData.exitAction = action;
}

function bind() {
  if (exitRoot) exitRoot.dataset.ready = "true";
  mark(yes, "yes");
  mark(no, "no");
}

bind();
window.addEventListener("load", bind);
yes?.addEventListener("object3dset", () => mark(yes, "yes"));
no?.addEventListener("object3dset", () => mark(no, "no"));
setInterval(bind, 1000);
