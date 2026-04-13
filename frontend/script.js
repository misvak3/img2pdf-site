const BACKEND_URL = "https://your-app.onrender.com"; // ← Render URL-ni bura yaz

const fileInput = document.getElementById("file-input");
const convertBtn = document.getElementById("convert-btn");
const status = document.getElementById("status");
const preview = document.getElementById("preview");

let selectedFiles = [];

fileInput.addEventListener("change", (e) => {
  selectedFiles = Array.from(e.target.files);
  convertBtn.disabled = selectedFiles.length === 0;
  preview.innerHTML = selectedFiles
    .map(f => `<img src="${URL.createObjectURL(f)}" alt="${f.name}">`)
    .join("");
});

convertBtn.addEventListener("click", async () => {
  if (!selectedFiles.length) return;

  status.textContent = "Çevrilir...";
  convertBtn.disabled = true;

  const formData = new FormData();
  selectedFiles.forEach(f => formData.append("images", f));

  try {
    const res = await fetch(`${BACKEND_URL}/convert`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Server xətası");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.pdf";
    a.click();
    status.textContent = "✓ PDF hazırdır!";
  } catch (err) {
    status.textContent = "Xəta: " + err.message;
  } finally {
    convertBtn.disabled = false;
  }
});