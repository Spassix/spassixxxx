async function initLoading() {
  await loadLoading();
  setupLoadingUI();
}

async function loadLoading() {
  const loading = await BackendData.loadData("loadingscreen");
  document.getElementById("loadingEnabled").checked = loading.enabled || false;
  document.getElementById("loadingText").value = loading.text || "Chargement Du Menu..";
  document.getElementById("loadingTitle").value = loading.title || "LA NATION DU LAIT";
  document.getElementById("loadingBrand").value = loading.brand || "LANATIONDULAIT";
  document.getElementById("loadingDuration").value = loading.duration || 3000;
  document.getElementById("loadingBgColor").value = loading.bgColor || "#0a0e1b";
  document.getElementById("loadingTextColor").value = loading.textColor || "#f1f5f9";
  document.getElementById("loadingAccentColor").value = loading.accentColor || "#6366f1";
  document.getElementById("loadingAnimation").value = loading.animation || "spinner";
  if (loading.background) updateLoadingBgPreview(loading.background);
}

function setupLoadingUI() {
  const saveBtn = document.getElementById("saveLoadingBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const loading = {
        enabled: document.getElementById("loadingEnabled").checked,
        text: document.getElementById("loadingText").value.trim(),
        title: document.getElementById("loadingTitle").value.trim(),
        brand: document.getElementById("loadingBrand").value.trim(),
        duration: parseInt(document.getElementById("loadingDuration").value) || 3000,
        bgColor: document.getElementById("loadingBgColor").value,
        textColor: document.getElementById("loadingTextColor").value,
        accentColor: document.getElementById("loadingAccentColor").value,
        animation: document.getElementById("loadingAnimation").value,
        background: document.getElementById("loadingBgUrl")?.value || ""
      };
      await BackendData.saveData("loadingscreen", loading);
      AdminUtils.showToast("Écran de chargement sauvegardé", "success");
    });
  }
  setupLoadingMediaUpload();
}

function setupLoadingMediaUpload() {
  const bgUpload = document.getElementById("loadingBgUploadBtn");
  const bgFile = document.getElementById("loadingBgFile");
  const bgUrlBtn = document.getElementById("loadingBgUrlBtn");
  const removeBg = document.getElementById("removeLoadingBgBtn");
  const bgUrlInput = document.getElementById("loadingBgUrl");
  const bgPreview = document.getElementById("loadingBgPreview");

  if (bgUpload && bgFile) {
    bgUpload.replaceWith(bgUpload.cloneNode(true));
    const newBgUpload = document.getElementById("loadingBgUploadBtn");
    if (newBgUpload) {
      newBgUpload.addEventListener("click", () => bgFile.click());
      bgFile.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          if (bgPreview) {
            bgPreview.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">Chargement...</div>';
          }
          const fileSize = file.size;
          const sizeMB = (fileSize / 1048576).toFixed(2);
          const hasBackend = backendAPI.baseUrl && backendAPI.baseUrl.trim() !== "";
          let mediaUrl;
          if (hasBackend) {
            console.log("📤 Upload vers Vercel Blob...");
            const uploadResult = await backendAPI.uploadFile(file, "loading");
            if (!uploadResult.success || !uploadResult.url) {
              throw new Error("Échec de l'upload");
            }
            mediaUrl = uploadResult.url;
            console.log(`✅ Upload réussi: ${mediaUrl}`);
            AdminUtils.showToast(`✅ Fichier uploadé vers le cloud (${sizeMB}MB)`, "success");
          } else {
            if (fileSize > 2097152) {
              const message = `⚠️ Fichier trop volumineux (${sizeMB}MB). Les fichiers de plus de 2MB nécessitent un backend configuré avec Vercel Blob.`;
              AdminUtils.showToast(message, "error");
              if (bgPreview) {
                bgPreview.innerHTML = `
                  <div style="padding: 2rem; text-align: center; color: #ff6b6b;">
                    <p style="font-weight: bold; margin-bottom: 1rem;">❌ Fichier trop volumineux pour localStorage</p>
                    <p style="font-size: 0.9rem; margin-bottom: 1rem;">Taille: ${sizeMB}MB (limite: 2MB)</p>
                    <p style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-top: 1rem;">💡 Configurez le backend dans les paramètres.</p>
                  </div>
                `;
              }
              e.target.value = "";
              return;
            }
            console.log("📦 Conversion en DataURL pour localStorage...");
            mediaUrl = await AdminUtils.readFileAsDataURL(file);
          }
          if (bgUrlInput) bgUrlInput.value = mediaUrl;
          updateLoadingBgPreview(mediaUrl);
          if (!hasBackend) AdminUtils.showToast("Média ajouté avec succès", "success");
        } catch (error) {
          console.error("Erreur upload:", error);
          AdminUtils.showToast("Erreur lors de l'upload", "error");
          if (bgPreview) bgPreview.innerHTML = "";
        }
      });
    }
  }

  if (bgUrlBtn) {
    bgUrlBtn.replaceWith(bgUrlBtn.cloneNode(true));
    const newBgUrlBtn = document.getElementById("loadingBgUrlBtn");
    if (newBgUrlBtn) {
      newBgUrlBtn.addEventListener("click", () => {
        const url = bgUrlInput?.value.trim() || "";
        if (url) {
          if (AdminUtils.isValidUrl(url) || url.startsWith("data:")) {
            updateLoadingBgPreview(url);
            AdminUtils.showToast("URL validée", "success");
          } else {
            AdminUtils.showToast("URL invalide", "error");
          }
        }
      });
    }
  }

  if (removeBg) {
    removeBg.replaceWith(removeBg.cloneNode(true));
    const newRemoveBg = document.getElementById("removeLoadingBgBtn");
    if (newRemoveBg) {
      newRemoveBg.addEventListener("click", () => {
        if (bgUrlInput) bgUrlInput.value = "";
        updateLoadingBgPreview("");
        AdminUtils.showToast("Média retiré", "success");
      });
    }
  }

}

function updateLoadingBgPreview(url) {
  const preview = document.getElementById("loadingBgPreview");
  if (preview) {
    if (url) {
      const isVideo = /\.(mp4|mov|webm|ogg|m4v)$/i.test(url);
      preview.innerHTML = isVideo
        ? `<video src="${AdminUtils.escapeHtml(url)}" controls style="max-width: 100%; max-height: 200px;"></video>`
        : `<img src="${AdminUtils.escapeHtml(url)}" style="max-width: 100%; max-height: 200px; object-fit: cover;">`;
    } else {
      preview.innerHTML = "";
    }
  }
}


window.Loading = {
  initLoading: initLoading
};
