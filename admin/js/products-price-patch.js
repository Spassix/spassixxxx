// Patch pour la nouvelle interface des prix - à charger après products.js
(function() {
  'use strict';
  
  // Fonction pour ajouter une ligne de prix
  function addPriceRow(container, quantity = "", price = "") {
    if (!container) return;
    
    const row = document.createElement("div");
    row.className = "price-row";
    row.style.cssText = "display:flex;gap:0.5rem;align-items:center;margin-bottom:0.75rem";
    
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.className = "price-quantity";
    qtyInput.placeholder = "Quantité";
    qtyInput.min = "0";
    qtyInput.step = "0.01";
    qtyInput.value = quantity;
    qtyInput.required = true;
    Object.assign(qtyInput.style, {
      flex: "1",
      background: "rgba(26,26,26,.92)",
      border: "2px solid rgba(255,255,255,.08)",
      color: "#fff",
      borderRadius: "12px",
      padding: ".875rem 1.25rem",
      fontFamily: "inherit",
      fontSize: "16px",
      outline: "0"
    });
    
    const separator = document.createElement("span");
    separator.textContent = ":";
    separator.style.color = "var(--text-muted)";
    
    const priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.className = "price-value";
    priceInput.placeholder = "Prix (€)";
    priceInput.min = "0";
    priceInput.step = "0.01";
    priceInput.value = price;
    priceInput.required = true;
    Object.assign(priceInput.style, {
      flex: "1",
      background: "rgba(26,26,26,.92)",
      border: "2px solid rgba(255,255,255,.08)",
      color: "#fff",
      borderRadius: "12px",
      padding: ".875rem 1.25rem",
      fontFamily: "inherit",
      fontSize: "16px",
      outline: "0"
    });
    
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-danger remove-price-row";
    deleteBtn.style.cssText = "padding:0.5rem;min-width:auto;cursor:pointer";
    deleteBtn.innerHTML = '<i class="material-icons" style="font-size:18px">delete</i>';
    deleteBtn.onclick = function() { 
      const rows = container.querySelectorAll('.price-row');
      if (rows.length > 1) {
        row.remove();
        syncHiddenInputs();
      } else {
        if (window.AdminUtils && window.AdminUtils.showToast) {
          window.AdminUtils.showToast("Au moins une ligne de prix est requise", "error");
        }
      }
    };
    
    // Ajouter des listeners pour synchroniser avec les inputs cachés
    qtyInput.addEventListener("input", syncHiddenInputs);
    priceInput.addEventListener("input", syncHiddenInputs);
    
    row.appendChild(qtyInput);
    row.appendChild(separator);
    row.appendChild(priceInput);
    row.appendChild(deleteBtn);
    
    container.appendChild(row);
    syncHiddenInputs();
  }
  
  // Créer des inputs cachés pour la compatibilité avec saveProduct
  function createHiddenInputs() {
    const form = document.getElementById("productForm");
    if (!form) return;
    
    // Vérifier s'ils existent déjà
    if (document.getElementById("productPrice")) return;
    
    const priceInput = document.createElement("input");
    priceInput.type = "hidden";
    priceInput.id = "productPrice";
    priceInput.value = "0";
    form.appendChild(priceInput);
    
    const grammagesInput = document.createElement("input");
    grammagesInput.type = "hidden";
    grammagesInput.id = "productGrammages";
    grammagesInput.value = "";
    form.appendChild(grammagesInput);
    
    const customPricesInput = document.createElement("input");
    customPricesInput.type = "hidden";
    customPricesInput.id = "productCustomPrices";
    customPricesInput.value = "";
    form.appendChild(customPricesInput);
  }
  
  // Synchroniser les inputs cachés avec les nouvelles lignes de prix
  function syncHiddenInputs() {
    const quantities = getPriceRowsData();
    const unitSelect = document.getElementById("productUnit");
    const unit = unitSelect ? unitSelect.value : "g";
    
    const priceInput = document.getElementById("productPrice");
    const grammagesInput = document.getElementById("productGrammages");
    const customPricesInput = document.getElementById("productCustomPrices");
    
    if (!priceInput || !grammagesInput || !customPricesInput) {
      createHiddenInputs();
      return;
    }
    
    if (quantities.length === 0) {
      priceInput.value = "0";
      grammagesInput.value = "";
      customPricesInput.value = "";
      return;
    }
    
    // Calculer le prix de base (premier prix)
    const basePrice = quantities[0].price;
    priceInput.value = basePrice.toString();
    
    // Créer les grammages et prix personnalisés
    const grammages = quantities.map(q => q.grammage);
    grammagesInput.value = grammages.join(", ");
    
    // Créer les prix personnalisés (format: grammage:prix)
    const customPrices = quantities
      .map(q => `${q.grammage}:${q.price}`)
      .join(", ");
    customPricesInput.value = customPrices;
  }
  
  // Fonction pour charger les prix depuis un produit
  function loadPriceRowsFromProduct(product) {
    const container = document.getElementById("productPricesContainer");
    if (!container) return;
    
    container.innerHTML = "";
    createHiddenInputs();
    
    if (product && product.quantities && Array.isArray(product.quantities) && product.quantities.length > 0) {
      product.quantities.forEach(q => {
        addPriceRow(container, q.grammage || q.quantity || "", q.price || "");
      });
    } else if (product && product.price) {
      addPriceRow(container, "1", product.price);
    } else {
      addPriceRow(container);
    }
    
    syncHiddenInputs();
  }
  
  // Fonction pour récupérer les données des prix
  function getPriceRowsData() {
    const container = document.getElementById("productPricesContainer");
    if (!container) return [];
    
    const rows = container.querySelectorAll(".price-row");
    const quantities = [];
    
    rows.forEach(row => {
      const qtyInput = row.querySelector(".price-quantity");
      const priceInput = row.querySelector(".price-value");
      
      if (qtyInput && priceInput) {
        const quantity = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        
        if (quantity > 0 && price >= 0) {
          quantities.push({
            grammage: quantity,
            quantity: quantity,
            price: price
          });
        }
      }
    });
    
    return quantities;
  }
  
  // Vérifier la configuration et afficher/masquer le menu Prix
  async function updatePriceMenuVisibility() {
    try {
      const config = await BackendData.loadData("config");
      const priceMenuEnabled = config.priceMenuEnabled !== false; // Par défaut true
      
      const priceFormGroup = document.querySelector('label[for="productPrice"]')?.closest('.form-group') || 
                             document.getElementById("productPricesContainer")?.closest('.form-group');
      
      if (priceFormGroup) {
        priceFormGroup.style.display = priceMenuEnabled ? "" : "none";
      }
      
      const container = document.getElementById("productPricesContainer");
      const addBtn = document.getElementById("addPriceRowBtn");
      
      if (container) {
        container.style.display = priceMenuEnabled ? "" : "none";
      }
      
      if (addBtn) {
        addBtn.style.display = priceMenuEnabled ? "" : "none";
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de la config:", error);
    }
  }
  
  // Fonction d'initialisation
  function initPricePatch() {
    createHiddenInputs();
    updatePriceMenuVisibility();
    
    // Bouton pour ajouter une ligne de prix
    const addBtn = document.getElementById("addPriceRowBtn");
    if (addBtn) {
      addBtn.onclick = function() {
        const container = document.getElementById("productPricesContainer");
        if (container) {
          addPriceRow(container);
        }
      };
    }
    
    // Observer les changements d'unité
    const unitSelect = document.getElementById("productUnit");
    if (unitSelect) {
      unitSelect.addEventListener("change", syncHiddenInputs);
    }
    
    // Patcher openProductModal pour charger les prix
    if (window.openProductModal) {
      const originalOpen = window.openProductModal;
      window.openProductModal = function(product) {
        originalOpen.call(this, product);
        
        setTimeout(() => {
          if (product) {
            loadPriceRowsFromProduct(product);
            const unitSelect = document.getElementById("productUnit");
            if (unitSelect && product.unit) {
              unitSelect.value = product.unit;
            }
          } else {
            const container = document.getElementById("productPricesContainer");
            if (container) {
              container.innerHTML = "";
              addPriceRow(container);
            }
          }
          syncHiddenInputs();
        }, 200);
      };
    }
    
    // Observer l'ouverture du modal
    const modal = document.getElementById("productModal");
    if (modal) {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (!modal.classList.contains("hidden")) {
              setTimeout(() => {
                updatePriceMenuVisibility();
                createHiddenInputs();
                const container = document.getElementById("productPricesContainer");
                if (container && container.children.length === 0) {
                  addPriceRow(container);
                }
                syncHiddenInputs();
              }, 100);
            }
          }
        });
      });
      observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
    
    // Écouter les changements de configuration
    window.addEventListener("adminDataUpdated", function(e) {
      if (e.detail && e.detail.key === "config") {
        updatePriceMenuVisibility();
      }
    });
  }
  
  // Attendre que le DOM et products.js soient chargés
  function waitForProductsJS() {
    if (document.getElementById("productForm")) {
      initPricePatch();
    } else {
      setTimeout(waitForProductsJS, 100);
    }
  }
  
  // Démarrer après le chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(waitForProductsJS, 1000);
    });
  } else {
    setTimeout(waitForProductsJS, 1000);
  }
  
  // Exporter les fonctions
  window.addPriceRow = addPriceRow;
  window.loadPriceRowsFromProduct = loadPriceRowsFromProduct;
  window.getPriceRowsData = getPriceRowsData;
  window.syncHiddenInputs = syncHiddenInputs;
})();

