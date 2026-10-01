const status = document.querySelector("#feed-status");
const warning = document.querySelector(".tw-warning");
const vrWarning = document.querySelector("#vr-tw");
setInterval(() => {
  const resting = /PAUSE/.test(status?.textContent || "");
  if (warning) warning.style.display = resting ? "none" : "";
  if (vrWarning) vrWarning.setAttribute("visible", !resting);
}, 250);
