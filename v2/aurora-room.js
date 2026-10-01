// The pause room intentionally leaves the existing white room background visible.
const scene = document.querySelector("#xr-scene");
scene?.addEventListener("loaded", () => {
  // Reserved for future optional ambient sound; silence/room calm stays foreground.
}, { once: true });
