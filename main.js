import { CONFIG } from "./config.js";
import { languageLabels, moments } from "./moments.js";
import { VisualSystem } from "./visualSystem.js";

const canvas = document.querySelector("#visual-canvas");
const stage = document.querySelector("#stage");
const titleEl = document.querySelector("#moment-title");
const kickerEl = document.querySelector("#moment-kicker");
const subtitleEl = document.querySelector("#moment-subtitle");
const numberEl = document.querySelector("#moment-number");
const totalEl = document.querySelector("#moment-total");
const copyLayer = document.querySelector(".copy-layer");
const helpPanel = document.querySelector("#help-panel");
const operatorUi = document.querySelector("#operator-ui");
const qrLayer = document.querySelector("#qr-layer");
const qrMemory = document.querySelector("#qr-memory");
const qrSocial = document.querySelector("#qr-social");
const qrMemoryLink = document.querySelector("#qr-memory-link");
const qrSocialLink = document.querySelector("#qr-social-link");
const qrMemoryLabel = document.querySelector("#qr-memory-label");
const qrSocialLabel = document.querySelector("#qr-social-label");
const assetFrame = document.querySelector("#moment-asset");
const assetImage = document.querySelector("#moment-image");
const languageButtons = [...document.querySelectorAll("[data-language]")];
const helpButton = document.querySelector("#help-button");

let activeIndex = 0;
const compactViewport = window.matchMedia("(max-aspect-ratio: 1 / 1)");
let showHelp = !compactViewport.matches;
let activeLanguage = localStorage.getItem("forum-language") || CONFIG.defaultLanguage;
let transitionTimer = 0;

const visualSystem = new VisualSystem(canvas);

function pad(value) {
  return String(value).padStart(2, "0");
}

function makeQrPattern(element, value, imageUrl = "") {
  if (imageUrl) {
    element.style.backgroundColor = "#f6f1e8";
    element.style.backgroundImage = `url("${imageUrl}")`;
    element.style.backgroundPosition = "center";
    element.style.backgroundSize = "cover";
    element.style.backgroundRepeat = "no-repeat";
    element.title = value;
    return;
  }

  const size = 25;
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  const images = [];
  const positions = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const inFinder =
        (x < 7 && y < 7) ||
        (x >= size - 7 && y < 7) ||
        (x < 7 && y >= size - 7);
      const finderBorder =
        inFinder &&
        (x === 0 ||
          y === 0 ||
          x === 6 ||
          y === 6 ||
          x === size - 7 ||
          y === size - 7 ||
          x === size - 1 ||
          y === size - 1);
      const finderCore =
        inFinder &&
        ((x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
          (x >= size - 5 && x <= size - 3 && y >= 2 && y <= 4) ||
          (x >= 2 && x <= 4 && y >= size - 5 && y <= size - 3));
      const bit = ((hash >> ((x + y * 3) % 23)) ^ (x * 17 + y * 29 + hash)) & 1;
      const on = finderBorder || finderCore || (!inFinder && bit && (x + y) % 3 !== 0);
      if (on) {
        images.push("linear-gradient(#070808, #070808)");
        positions.push(`${x * 4}% ${y * 4}%`);
      }
    }
  }
  element.style.backgroundColor = "#f6f1e8";
  element.style.backgroundImage = images.join(",");
  element.style.backgroundPosition = positions.join(",");
  element.style.backgroundSize = "4% 4%";
  element.style.backgroundRepeat = "no-repeat";
  element.title = value;
}

function copyFor(moment) {
  return moment.copy?.[activeLanguage] || moment.copy?.[CONFIG.defaultLanguage] || moment.copy?.es || moment;
}

function updateLanguageUi() {
  document.documentElement.lang = activeLanguage;
  for (const button of languageButtons) {
    const isActive = button.dataset.language === activeLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.textContent = languageLabels[button.dataset.language] || button.dataset.language.toUpperCase();
  }
  const qrLabels = CONFIG.qr.labels?.[activeLanguage] || CONFIG.qr.labels?.[CONFIG.defaultLanguage] || {};
  qrMemoryLabel.textContent = qrLabels.memory || "Memorias";
  qrSocialLabel.textContent = qrLabels.social || "@centrodeeventosupb";
}

function setAsset(moment) {
  const configuredAsset = CONFIG.assets.byMoment?.[moment.id];
  const asset = configuredAsset === false ? null : configuredAsset || moment.asset;
  if (asset?.type === "image" && asset.src) {
    const isBackground = asset.placement === "background";
    assetImage.src = asset.src;
    assetImage.alt = asset.alt || "";
    assetFrame.classList.add("is-visible");
    assetFrame.classList.toggle("is-background", isBackground);
    stage.classList.toggle("has-background-asset", isBackground);
    copyLayer.classList.toggle("has-asset", !isBackground);
    copyLayer.classList.toggle("has-background-asset", isBackground);
    return;
  }

  assetFrame.classList.remove("is-visible");
  assetFrame.classList.remove("is-background");
  stage.classList.remove("has-background-asset");
  copyLayer.classList.remove("has-asset");
  copyLayer.classList.remove("has-background-asset");
  window.setTimeout(() => {
    if (!assetFrame.classList.contains("is-visible")) {
      assetImage.removeAttribute("src");
      assetImage.alt = "";
    }
  }, 620);
}

function setMoment(index) {
  activeIndex = Math.max(0, Math.min(moments.length - 1, index));
  const moment = moments[activeIndex];
  const copy = copyFor(moment);
  window.clearTimeout(transitionTimer);
  stage.classList.toggle("is-title-moment", activeIndex === 0);
  stage.classList.toggle("is-closing-moment", activeIndex === moments.length - 1);
  copyLayer.classList.toggle("is-qr", moment.state === "qr");
  qrLayer.classList.toggle("is-visible", moment.state === "qr");
  copyLayer.classList.add("is-changing");
  transitionTimer = window.setTimeout(() => {
    kickerEl.textContent = copy.kicker || CONFIG.brandLine;
    titleEl.textContent = copy.title;
    subtitleEl.textContent = copy.subtitle || "";
    copyLayer.classList.toggle("is-long", copy.title.length > 74);
    copyLayer.classList.toggle("is-very-long", copy.title.length > 104);
    numberEl.textContent = pad(activeIndex + 1);
    copyLayer.classList.remove("is-changing");
  }, 180);
  setAsset(moment);
  visualSystem.setMoment(moment);
}

function nextMoment() {
  setMoment(activeIndex + 1);
}

function previousMoment() {
  setMoment(activeIndex - 1);
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await stage.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
}

function toggleHelp() {
  showHelp = !showHelp;
  updateHelpUi();
}

function updateHelpUi() {
  helpPanel.classList.toggle("is-hidden", !showHelp);
  helpButton.setAttribute("aria-pressed", String(showHelp));
  helpButton.setAttribute("aria-label", showHelp ? "Ocultar ayuda" : "Mostrar ayuda");
}

function tick() {
  visualSystem.render();
  requestAnimationFrame(tick);
}

document.querySelector("#next-button").addEventListener("click", nextMoment);
document.querySelector("#prev-button").addEventListener("click", previousMoment);
document.querySelector("#fullscreen-button").addEventListener("click", toggleFullscreen);
helpButton.addEventListener("click", toggleHelp);

for (const button of languageButtons) {
  button.addEventListener("click", () => {
    activeLanguage = button.dataset.language;
    localStorage.setItem("forum-language", activeLanguage);
    updateLanguageUi();
    setMoment(activeIndex);
  });
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "arrowright" || key === " ") {
    event.preventDefault();
    nextMoment();
  }
  if (key === "arrowleft") {
    event.preventDefault();
    previousMoment();
  }
  if (key === "f") {
    event.preventDefault();
    toggleFullscreen();
  }
  if (key === "h") {
    event.preventDefault();
    toggleHelp();
  }
  if (key === "r") {
    event.preventDefault();
    setMoment(0);
  }
});

let touchStartX = 0;
stage.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
});

stage.addEventListener("touchend", (event) => {
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) < 42) return;
  if (delta < 0) nextMoment();
  else previousMoment();
});

totalEl.textContent = String(moments.length);
qrMemoryLink.href = CONFIG.qr.memoryUrl;
qrSocialLink.href = CONFIG.qr.socialUrl;
makeQrPattern(qrMemory, CONFIG.qr.memoryUrl, CONFIG.qr.memoryImage);
makeQrPattern(qrSocial, CONFIG.qr.socialUrl, CONFIG.qr.socialImage);
updateLanguageUi();
updateHelpUi();
setMoment(0);
tick();
