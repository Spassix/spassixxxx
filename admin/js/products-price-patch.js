// Patch pour la nouvelle interface des prix - à charger après products.js
(function() {
  'use strict';
  
  // Fonction pour ajouter une ligne de prix
  function addPriceRow(container, quantity = "", price = "") {
    if (!container) return;
    
    const row = document.createElement("div");
    row.className = "price-row";
    row.style.cssText = "display:flex;gap:0.5rem;align-items:center;margin-bottom:0.75rem";
    
    // Générer un ID unique pour cette ligne
    const rowId = `price-row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.className = "price-quantity";
    qtyInput.name = `price-quantity-${rowId}`;
    qtyInput.placeholder = "Quantité";
    qtyInput.min = "0";
    qtyInput.step = "0.01";
    qtyInput.value = quantity;
    // Ne pas utiliser required pour éviter les erreurs de validation HTML5
    // La validation sera faite manuellement dans syncHiddenInputs
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
    priceInput.name = `price-value-${rowId}`;
    priceInput.placeholder = "Prix (€)";
    priceInput.min = "0";
    priceInput.step = "0.01";
    priceInput.value = price;
    // Ne pas utiliser required pour éviter les erreurs de validation HTML5
    // La validation sera faite manuellement dans syncHiddenInputs
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
  
  // Fonction de validation des prix
  function validatePriceRows() {
    const container = document.getElementById("productPricesContainer");
    if (!container) return true;
    
    const rows = container.querySelectorAll(".price-row");
    if (rows.length === 0) {
      if (window.AdminUtils && window.AdminUtils.showToast) {
        window.AdminUtils.showToast("Au moins une ligne de prix est requise", "error");
      }
      return false;
    }
    
    let hasValidRow = false;
    rows.forEach(row => {
      const qtyInput = row.querySelector(".price-quantity");
      const priceInput = row.querySelector(".price-value");
      
      if (qtyInput && priceInput) {
        const quantity = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        
        if (quantity > 0 && price > 0) {
          hasValidRow = true;
        } else if (quantity > 0 || price > 0) {
          // Une seule valeur remplie, c'est invalide
          qtyInput.style.borderColor = "#ef4444";
          priceInput.style.borderColor = "#ef4444";
          setTimeout(() => {
            qtyInput.style.borderColor = "";
            priceInput.style.borderColor = "";
          }, 2000);
        }
      }
    });
    
    if (!hasValidRow) {
      if (window.AdminUtils && window.AdminUtils.showToast) {
        window.AdminUtils.showToast("Veuillez remplir au moins une ligne de prix complète (quantité et prix)", "error");
      }
      return false;
    }
    
    return true;
  }

  // Patcher saveProduct pour utiliser directement les données des lignes de prix
  function patchSaveProductToUseQuantities() {
    // Attendre que saveProduct soit disponible
    if (typeof window.saveProduct === 'function') {
      const originalSaveProduct = window.saveProduct;
      window.saveProduct = async function() {
        // Synchroniser les inputs cachés avant la sauvegarde
        syncHiddenInputs();
        
        // Récupérer les données directement depuis les lignes de prix
        const quantities = getPriceRowsData();
        
        // Si on a des quantities depuis les nouvelles lignes, les utiliser directement
        if (quantities.length > 0) {
          // Mettre à jour productPrice avec le premier prix pour compatibilité
          const priceInput = document.getElementById("productPrice");
          if (priceInput && quantities[0]) {
            priceInput.value = quantities[0].price.toString();
          }
          
          // Mettre à jour productGrammages et productCustomPrices pour compatibilité
          // IMPORTANT: Tous les prix doivent être dans customPrices, pas seulement ceux différents de basePrice
          const grammagesInput = document.getElementById("productGrammages");
          const customPricesInput = document.getElementById("productCustomPrices");
          if (grammagesInput && customPricesInput) {
            const grammages = quantities.map(q => q.grammage).join(", ");
            // Mettre TOUS les prix dans customPrices, pas seulement ceux différents
            const customPrices = quantities.map(q => `${q.grammage}:${q.price}`).join(", ");
            grammagesInput.value = grammages;
            customPricesInput.value = customPrices;
          }
        }
        
        // Appeler la fonction originale
        const result = await originalSaveProduct.call(this);
        
        // Après la sauvegarde, s'assurer que les quantities sont bien sauvegardées
        // en interceptant BackendData.saveData si nécessaire
        if (quantities.length > 0) {
          // Attendre un peu pour que la sauvegarde soit terminée
          setTimeout(async () => {
            try {
              const products = await BackendData.loadData("products") || [];
              const editingId = window.editingProductId;
              
              if (editingId) {
                const productIndex = products.findIndex(p => p.id === editingId);
                if (productIndex > -1 && (!products[productIndex].quantities || products[productIndex].quantities.length === 0)) {
                  // Si les quantities ne sont pas là, les ajouter
                  products[productIndex].quantities = quantities;
                  await BackendData.saveData("products", products);
                  if (window.Products && window.Products.loadProducts) {
                    await window.Products.loadProducts();
                  }
                }
              } else if (products.length > 0) {
                // Nouveau produit, vérifier le dernier
                const lastProduct = products[products.length - 1];
                if (lastProduct && (!lastProduct.quantities || lastProduct.quantities.length === 0)) {
                  const createdAt = new Date(lastProduct.createdAt);
                  const now = new Date();
                  if (now - createdAt < 2000) {
                    lastProduct.quantities = quantities;
                    await BackendData.saveData("products", products);
                    if (window.Products && window.Products.loadProducts) {
                      await window.Products.loadProducts();
                    }
                  }
                }
              }
            } catch (e) {
              console.error("Erreur lors de la vérification des quantities:", e);
            }
          }, 300);
        }
        
        return result;
      };
      return true;
    }
    return false;
  }
  
  // Fonction d'initialisation
  function initPricePatch() {
    createHiddenInputs();
    updatePriceMenuVisibility();
    
    // Patcher saveProduct pour utiliser les quantities directement
    if (!patchSaveProductToUseQuantities()) {
      // Si saveProduct n'est pas encore disponible, réessayer après un délai
      setTimeout(() => {
        if (!patchSaveProductToUseQuantities()) {
          // Réessayer encore une fois après un délai plus long
          setTimeout(patchSaveProductToUseQuantities, 500);
        }
      }, 200);
    }
    
    // Intercepter la soumission du formulaire pour valider les prix
    const form = document.getElementById("productForm");
    if (form) {
      form.addEventListener("submit", function(e) {
        // Synchroniser avant validation
        syncHiddenInputs();
        
        // Valider les prix
        if (!validatePriceRows()) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }, true);
    }
    
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

