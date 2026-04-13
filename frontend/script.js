const BACKEND_URL = "https://img2pdf-backend-k3zp.onrender.com"; 

const screens = {
  upload:   document.getElementById("screen-upload"),
  preview:  document.getElementById("screen-preview"),
  loading:  document.getElementById("screen-loading"),
  done:     document.getElementById("screen-done"),
  error:    document.getElementById("screen-error"),
};

const fileInput     = document.getElementById("file-input");
const fileInputMore = document.getElementById("file-input-more");
const dropZone      = document.getElementById("drop-zone");
const previewGrid   = document.getElementById("preview-grid");
const fileCount     = document.getElementById("file-count");
const convertBtn    = document.getElementById("convert-btn");
const addMoreBtn    = document.getElementById("add-more-btn");
const resetBtn      = document.getElementById("reset-btn");
const newConvertBtn = document.getElementById("new-convert-btn");
const retryBtn      = document.getElementById("retry-btn");
const loadingBar    = document.getElementById("loading-bar");
const loadingText   = document.getElementById("loading-text");
const downloadLink  = document.getElementById("download-link");
const doneInfo      = document.getElementById("done-info");
const errorMsg      = document.getElementById("error-msg");

let selectedFiles = [];

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

function updateFileCount() {
  const n = selectedFiles.length;
  fileCount.textContent = n === 1 ? "1 fayl seçildi" : `${n} fayl seçildi`;
}

function buildPreview() {
  previewGrid.innerHTML = "";
  selectedFiles.forEach((file, idx) => {
    const url = URL.createObjectURL(file);
    const item = document.createElement("div");
    item.className = "preview-item";
    item.innerHTML = `
      <img src="${url}" alt="${file.name}">
      <span class="item-name">${file.name}</span>
      <button class="item-remove" data-idx="${idx}" title="Sil">✕</button>
    `;
    previewGrid.appendChild(item);
  });

  previewGrid.querySelectorAll(".item-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      selectedFiles.splice(idx, 1);
      if (selectedFiles.length === 0) {
        showScreen("upload");
      } else {
        buildPreview();
        updateFileCount();
      }
    });
  });
}

function addFiles(newFiles) {
  const allowed = ["image/jpeg","image/png","image/webp","image/bmp","image/tiff"];
  const filtered = Array.from(newFiles).filter(f => allowed.includes(f.type));
  selectedFiles = [...selectedFiles, ...filtered];
  if (selectedFiles.length > 0) {
    buildPreview();
    updateFileCount();
    showScreen("preview");
  }
}

fileInput.addEventListener("change", (e) => addFiles(e.target.files));
fileInputMore.addEventListener("change", (e) => addFiles(e.target.files));
addMoreBtn.addEventListener("click", () => fileInputMore.click());

dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") fileInput.click();
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  addFiles(e.dataTransfer.files);
});

resetBtn.addEventListener("click", () => {
  selectedFiles = [];
  fileInput.value = "";
  fileInputMore.value = "";
  previewGrid.innerHTML = "";
  showScreen("upload");
});

newConvertBtn.addEventListener("click", () => {
  selectedFiles = [];
  fileInput.value = "";
  fileInputMore.value = "";
  previewGrid.innerHTML = "";
  if (downloadLink.href.startsWith("blob:")) {
    URL.revokeObjectURL(downloadLink.href);
  }
  showScreen("upload");
});

retryBtn.addEventListener("click", () => {
  if (selectedFiles.length > 0) {
    showScreen("preview");
  } else {
    showScreen("upload");
  }
});

function animateLoadingBar(targetPct, duration) {
  const start = parseFloat(loadingBar.style.width) || 0;
  const diff = targetPct - start;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    loadingBar.style.width = (start + diff * progress) + "%";
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

convertBtn.addEventListener("click", async () => {
  if (selectedFiles.length === 0) return;

  showScreen("loading");
  loadingBar.style.width = "0%";
  loadingText.textContent = "hazırlanır...";

  animateLoadingBar(30, 600);

  const formData = new FormData();
  selectedFiles.forEach(f => formData.append("images", f));

  try {
    loadingText.textContent = "serverə göndərilir...";
    animateLoadingBar(55, 800);

    const res = await fetch(`${BACKEND_URL}/convert`, {
      method: "POST",
      body: formData,
    });

    animateLoadingBar(85, 400);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `server xətası (${res.status})`);
    }

    const blob = await res.blob();
    animateLoadingBar(100, 300);

    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = "converted.pdf";

    const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
    doneInfo.textContent = `${selectedFiles.length} şəkil · ${sizeMB} MB`;

    setTimeout(() => showScreen("done"), 350);

  } catch (err) {
    animateLoadingBar(100, 200);
    setTimeout(() => {
      errorMsg.textContent = err.message;
      showScreen("error");
    }, 300);
  }
});