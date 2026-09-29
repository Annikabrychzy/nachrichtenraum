const exitRoot = document.querySelector("#exit-root");
const yes = document.querySelector("#vr-exit-yes");
const no = document.querySelector("#vr-exit-no");

function mark(el, action) {
  if (!el) return;
  el.classList.add("interactive");
  el.object3D.userData.exitAction = action;
  el.object3D.renderOrder = 9999;
  const mesh = el.getObject3D("mesh");
  if (mesh) {
    mesh.userData.exitAction = action;
    mesh.renderOrder = 9999;
    if (mesh.material) {
      mesh.material.depthTest = false;
      mesh.material.depthWrite = false;
      mesh.material.needsUpdate = true;
    }
  }
}

function liftObject3D(object) {
  if (!object) return;
  object.renderOrder = 9999;
  if (object.material) {
    object.material.depthTest = false;
    object.material.depthWrite = false;
    object.material.needsUpdate = true;
  }
  for (const child of object.children || []) liftObject3D(child);
}

function bind() {
  if (exitRoot) {
    exitRoot.dataset.ready = "true";
    exitRoot.object3D.renderOrder = 9999;
    liftObject3D(exitRoot.object3D);
  }
  mark(yes, "yes");
  mark(no, "no");
}

bind();
window.addEventListener("load", bind);
yes?.addEventListener("object3dset", () => mark(yes, "yes"));
no?.addEventListener("object3dset", () => mark(no, "no"));
setInterval(bind, 500);
