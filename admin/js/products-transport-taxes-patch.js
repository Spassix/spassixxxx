// Patch pour la gestion des taxes de transport - à charger après products.js
(function() {
  'use strict';
  
  let activeServices = { home: false, postal: false, meet: false };
  let serviceLabels = {
    home: { icon: '🚚', name: 'Livraison' },
    postal: { icon: '📦', name: 'Envoi postal' },
    meet: { icon: '📍', name: 'Meet up' }
  };
  
  // Charger les services actifs depuis cart_services
  async function loadActiveServices() {
    try {
      const services = await BackendData.loadData("cart_services") || {};
      activeServices = {
        home: services.home !== false, // Par défaut true si non défini
        postal: services.postal !== false,
        meet: services.meet !== false
      };
      return activeServices;
    } catch (error) {
      console.error("Erreur lors du chargement des services:", error);
      // Par défaut, tous les services sont actifs
      activeServices = { home: true, postal: true, meet: true };
      return activeServices;
    }
  }
  
  // Créer le tableau des taxes de transport
  function createTransportTaxesTable() {
    const container = document.getElementById("productTransportTaxesContainer");
    if (!container) return;
    
    // Nettoyer le conteneur
    container.innerHTML = "";
    
    // Créer l'en-tête du tableau
    const headerDiv = document.createElement("div");
    headerDiv.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem";
    
    const titleDiv = document.createElement("div");
    titleDiv.style.cssText = "display:flex;align-items:center;gap:0.5rem";
    const icon = document.createElement("span");
    icon.textContent = "💰";
    icon.style.fontSize = "1.2rem";
    const title = document.createElement("h4");
    title.textContent = "Prix par quantité (Meet up / Livraison)";
    title.style.cssText = "margin:0;font-size:1rem;font-weight:600;color:var(--text-primary)";
    titleDiv.appendChild(icon);
    titleDiv.appendChild(title);
    
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn-secondary";
    addBtn.id = "addTransportTaxRowBtn";
    addBtn.innerHTML = '<i class="material-icons" style="font-size:18px;vertical-align:middle">add</i> Ajouter';
    addBtn.style.cssText = "padding:0.5rem 1rem;font-size:0.9rem";
    addBtn.onclick = () => addTransportTaxRow();
    
    headerDiv.appendChild(titleDiv);
    headerDiv.appendChild(addBtn);
    container.appendChild(headerDiv);
    
    // Créer le tableau
    const table = document.createElement("table");
    table.style.cssText = "width:100%;border-collapse:collapse;margin-top:0.5rem";
    
    // En-têtes du tableau
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.style.cssText = "border-bottom:2px solid rgba(255,255,255,0.1)";
    
    // Colonne Quantité
    const thQuantity = document.createElement("th");
    thQuantity.textContent = "Quantité";
    thQuantity.style.cssText = "text-align:left;padding:0.75rem;font-weight:600;color:var(--text-secondary);font-size:0.9rem";
    headerRow.appendChild(thQuantity);
    
    // Colonnes pour chaque service actif
    Object.keys(activeServices).forEach(serviceKey => {
      if (activeServices[serviceKey]) {
        const th = document.createElement("th");
        th.style.cssText = "text-align:center;padding:0.75rem;font-weight:600;color:var(--text-secondary);font-size:0.9rem";
        
        const serviceDiv = document.createElement("div");
        serviceDiv.style.cssText = "display:flex;align-items:center;justify-content:center;gap:0.5rem";
        const iconSpan = document.createElement("span");
        iconSpan.textContent = serviceLabels[serviceKey].icon;
        iconSpan.style.fontSize = "1rem";
        const nameSpan = document.createElement("span");
        nameSpan.textContent = serviceLabels[serviceKey].name;
        serviceDiv.appendChild(iconSpan);
        serviceDiv.appendChild(nameSpan);
        th.appendChild(serviceDiv);
        
        headerRow.appendChild(th);
      }
    });
    
    // Colonne Actions
    const thActions = document.createElement("th");
    thActions.style.cssText = "text-align:center;padding:0.75rem;font-weight:600;color:var(--text-secondary);font-size:0.9rem;width:60px";
    headerRow.appendChild(thActions);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Corps du tableau
    const tbody = document.createElement("tbody");
    tbody.id = "transportTaxesTableBody";
    table.appendChild(tbody);
    
    container.appendChild(table);
    
    // Ajouter une ligne par défaut si vide
    if (tbody.children.length === 0) {
      addTransportTaxRow();
    }
  }
  
  // Ajouter une ligne de taxe de transport
  function addTransportTaxRow(quantity = "", taxes = {}) {
    const tbody = document.getElementById("transportTaxesTableBody");
    if (!tbody) return;
    
    const row = document.createElement("tr");
    row.className = "transport-tax-row";
    row.style.cssText = "border-bottom:1px solid rgba(255,255,255,0.05)";
    
    // Cellule Quantité
    const tdQuantity = document.createElement("td");
    tdQuantity.style.cssText = "padding:0.75rem";
    const qtyInput = document.createElement("input");
    qtyInput.type = "text";
    qtyInput.className = "tax-quantity-input";
    qtyInput.placeholder = "Ex: 5g";
    qtyInput.value = quantity;
    qtyInput.style.cssText = "width:100%;background:rgba(26,26,26,.92);border:2px solid rgba(255,255,255,.08);color:#fff;border-radius:8px;padding:0.5rem 0.75rem;font-size:0.9rem;outline:0";
    qtyInput.addEventListener("focus", function() {
      this.style.borderColor = "#6366f1";
    });
    qtyInput.addEventListener("blur", function() {
      this.style.borderColor = "rgba(255,255,255,.08)";
    });
    tdQuantity.appendChild(qtyInput);
    row.appendChild(tdQuantity);
    
    // Cellules pour chaque service actif
    Object.keys(activeServices).forEach(serviceKey => {
      if (activeServices[serviceKey]) {
        const td = document.createElement("td");
        td.style.cssText = "padding:0.75rem;text-align:center";
        const taxInput = document.createElement("input");
        taxInput.type = "number";
        taxInput.className = `tax-service-input tax-${serviceKey}`;
        taxInput.dataset.service = serviceKey;
        taxInput.placeholder = "0";
        taxInput.min = "0";
        taxInput.step = "0.01";
        taxInput.value = taxes[serviceKey] || "";
        taxInput.style.cssText = "width:100%;max-width:100px;background:rgba(26,26,26,.92);border:2px solid rgba(255,255,255,.08);color:#fff;border-radius:8px;padding:0.5rem 0.75rem;font-size:0.9rem;text-align:center;outline:0;margin:0 auto";
        taxInput.addEventListener("focus", function() {
          this.style.borderColor = "#6366f1";
        });
        taxInput.addEventListener("blur", function() {
          this.style.borderColor = "rgba(255,255,255,.08)";
        });
        td.appendChild(taxInput);
        row.appendChild(td);
      }
    });
    
    // Cellule Actions
    const tdActions = document.createElement("td");
    tdActions.style.cssText = "padding:0.75rem;text-align:center";
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-danger";
    deleteBtn.style.cssText = "padding:0.4rem;min-width:auto;cursor:pointer";
    deleteBtn.innerHTML = '<i class="material-icons" style="font-size:18px">delete</i>';
    deleteBtn.onclick = function() {
      const rows = tbody.querySelectorAll('.transport-tax-row');
      if (rows.length > 1) {
        row.remove();
      } else {
        if (window.AdminUtils && window.AdminUtils.showToast) {
          window.AdminUtils.showToast("Au moins une ligne est requise", "error");
        }
      }
    };
    tdActions.appendChild(deleteBtn);
    row.appendChild(tdActions);
    
    tbody.appendChild(row);
  }
  
  // Récupérer les données des taxes de transport
  function getTransportTaxesData() {
    const tbody = document.getElementById("transportTaxesTableBody");
    if (!tbody) return [];
    
    const rows = tbody.querySelectorAll(".transport-tax-row");
    const taxes = [];
    
    rows.forEach(row => {
      const qtyInput = row.querySelector(".tax-quantity-input");
      if (!qtyInput) return;
      
      const quantity = qtyInput.value.trim();
      if (!quantity) return; // Ignorer les lignes sans quantité
      
      const taxData = {
        quantity: quantity,
        services: {}
      };
      
      // Récupérer les taxes pour chaque service actif
      Object.keys(activeServices).forEach(serviceKey => {
        if (activeServices[serviceKey]) {
          const taxInput = row.querySelector(`.tax-${serviceKey}`);
          if (taxInput) {
            const taxValue = parseFloat(taxInput.value) || 0;
            if (taxValue > 0) {
              taxData.services[serviceKey] = taxValue;
            }
          }
        }
      });
      
      // Ajouter seulement si au moins un service a une taxe
      if (Object.keys(taxData.services).length > 0) {
        taxes.push(taxData);
      }
    });
    
    return taxes;
  }
  
  // Charger les taxes depuis un produit
  function loadTransportTaxesFromProduct(product) {
    const tbody = document.getElementById("transportTaxesTableBody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (product && product.transportTaxes && Array.isArray(product.transportTaxes) && product.transportTaxes.length > 0) {
      product.transportTaxes.forEach(tax => {
        addTransportTaxRow(tax.quantity || "", tax.services || {});
      });
    } else {
      addTransportTaxRow();
    }
  }
  
  // Créer un input caché pour les taxes
  function createHiddenTransportTaxesInput() {
    const form = document.getElementById("productForm");
    if (!form) return;
    
    // Vérifier s'il existe déjà
    if (document.getElementById("productTransportTaxes")) return;
    
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.id = "productTransportTaxes";
    hiddenInput.value = "";
    form.appendChild(hiddenInput);
  }
  
  // Synchroniser l'input caché avec les données
  function syncTransportTaxesInput() {
    const taxes = getTransportTaxesData();
    const hiddenInput = document.getElementById("productTransportTaxes");
    
    if (hiddenInput) {
      hiddenInput.value = JSON.stringify(taxes);
    }
  }
  
  // Initialisation
  async function initTransportTaxes() {
    // Attendre que le formulaire soit disponible
    if (!document.getElementById("productForm")) {
      setTimeout(initTransportTaxes, 100);
      return;
    }
    
    // Créer le conteneur si il n'existe pas
    const form = document.getElementById("productForm");
    const pricesSection = document.getElementById("productPricesContainer");
    if (pricesSection && !document.getElementById("productTransportTaxesContainer")) {
      const taxesSection = document.createElement("div");
      taxesSection.id = "productTransportTaxesContainer";
      taxesSection.className = "form-group";
      taxesSection.style.cssText = "margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.1)";
      
      // Insérer après la section des prix
      const priceParent = pricesSection.closest(".form-group");
      if (priceParent && priceParent.nextSibling) {
        priceParent.parentNode.insertBefore(taxesSection, priceParent.nextSibling);
      } else if (priceParent) {
        priceParent.parentNode.appendChild(taxesSection);
      }
    }
    
    // Charger les services actifs
    await loadActiveServices();
    
    // Créer le tableau
    createTransportTaxesTable();
    
    // Créer l'input caché
    createHiddenTransportTaxesInput();
    
    // Ajouter un listener pour synchroniser lors des changements
    const tbody = document.getElementById("transportTaxesTableBody");
    if (tbody) {
      const observer = new MutationObserver(syncTransportTaxesInput);
      observer.observe(tbody, { childList: true, subtree: true });
      
      // Écouter les changements dans les inputs
      tbody.addEventListener("input", syncTransportTaxesInput);
    }
    
    // Stocker l'ID du produit en cours d'édition
    let currentEditingProductId = null;
    
    // Patcher openProductModal pour stocker l'ID
    const modalTitle = document.getElementById("productModalTitle");
    if (modalTitle) {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const title = modalTitle.textContent || "";
            // Si le titre contient "Modifier", on est en mode édition
            // On va plutôt intercepter editProduct
          }
        });
      });
      observer.observe(modalTitle, { childList: true, characterData: true, subtree: true });
    }
    
    // Intercepter editProduct pour stocker l'ID
    if (window.editProduct) {
      const originalEditProduct = window.editProduct;
      window.editProduct = function(id) {
        currentEditingProductId = id;
        return originalEditProduct.call(this, id);
      };
    }
    
    // Patcher openProductModal pour charger les taxes
    // On utilise un MutationObserver sur le modal
    const modalObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const modal = document.getElementById("productModal");
          if (modal && !modal.classList.contains("hidden")) {
            // Le modal est ouvert, charger les taxes après un court délai
            setTimeout(async () => {
              await loadActiveServices();
              createTransportTaxesTable();
              createHiddenTransportTaxesInput();
              
              // Si on édite un produit, charger ses taxes
              // On va chercher le produit depuis le nom dans le formulaire
              const productName = document.getElementById("productName")?.value;
              if (productName && currentEditingProductId) {
                try {
                  const products = await BackendData.loadData("products") || [];
                  const product = products.find(p => p.id === currentEditingProductId);
                  if (product) {
                    loadTransportTaxesFromProduct(product);
                  }
                } catch (e) {
                  console.error("Erreur lors du chargement des taxes:", e);
                }
              }
              syncTransportTaxesInput();
            }, 400);
          } else {
            // Le modal est fermé, réinitialiser
            currentEditingProductId = null;
          }
        }
      });
    });
    
    const productModal = document.getElementById("productModal");
    if (productModal) {
      modalObserver.observe(productModal, { attributes: true, attributeFilter: ['class'] });
    }
    
    // Intercepter BackendData.saveData pour ajouter les taxes
    const patchBackendSave = () => {
      if (window.BackendData && window.BackendData.saveData) {
        const originalSaveData = window.BackendData.saveData;
        window.BackendData.saveData = async function(key, data) {
          // Si on sauvegarde des produits, ajouter les taxes
          if (key === "products" && Array.isArray(data)) {
            // Synchroniser les taxes avant la sauvegarde
            syncTransportTaxesInput();
            
            // Récupérer les taxes depuis l'input caché
            const hiddenInput = document.getElementById("productTransportTaxes");
            if (hiddenInput) {
              try {
                const taxesValue = hiddenInput.value.trim();
                if (taxesValue) {
                  const taxes = JSON.parse(taxesValue);
                  if (Array.isArray(taxes)) {
                    // Si on est en mode édition, trouver le produit par ID
                    if (currentEditingProductId) {
                      const productIndex = data.findIndex(p => p.id === currentEditingProductId);
                      if (productIndex > -1) {
                        if (taxes.length > 0) {
                          data[productIndex].transportTaxes = taxes;
                        } else {
                          delete data[productIndex].transportTaxes;
                        }
                      }
                    } else {
                      // Sinon, c'est un nouveau produit, l'ajouter au dernier
                      if (data.length > 0 && taxes.length > 0) {
                        const lastProduct = data[data.length - 1];
                        // Vérifier si c'est vraiment un nouveau produit (créé récemment)
                        if (lastProduct && lastProduct.createdAt) {
                          const createdAt = new Date(lastProduct.createdAt);
                          const now = new Date();
                          // Si créé dans les 2 dernières secondes, c'est probablement le nouveau produit
                          if (now - createdAt < 2000) {
                            lastProduct.transportTaxes = taxes;
                          }
                        }
                      }
                    }
                  }
                } else if (currentEditingProductId) {
                  // Si pas de taxes mais en mode édition, supprimer les taxes existantes
                  const productIndex = data.findIndex(p => p.id === currentEditingProductId);
                  if (productIndex > -1) {
                    delete data[productIndex].transportTaxes;
                  }
                }
              } catch (e) {
                console.error("Erreur lors de l'ajout des taxes:", e);
              }
            }
          }
          
          return await originalSaveData.call(this, key, data);
        };
      } else {
        setTimeout(patchBackendSave, 200);
      }
    };
    
    patchBackendSave();
    
    // Intercepter le formulaire pour synchroniser les taxes
    const formEl = document.getElementById("productForm");
    if (formEl) {
      formEl.addEventListener("submit", function(e) {
        syncTransportTaxesInput();
      }, true);
      
      // Également lors des changements dans les inputs de taxes
      formEl.addEventListener("input", function(e) {
        if (e.target.classList.contains("tax-quantity-input") || 
            e.target.classList.contains("tax-service-input")) {
          syncTransportTaxesInput();
        }
      }, true);
    }
  }
  
  
  // Démarrer après le chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initTransportTaxes, 1500);
    });
  } else {
    setTimeout(initTransportTaxes, 1500);
  }
  
  // Exporter les fonctions
  window.addTransportTaxRow = addTransportTaxRow;
  window.getTransportTaxesData = getTransportTaxesData;
  window.loadTransportTaxesFromProduct = loadTransportTaxesFromProduct;
  window.syncTransportTaxesInput = syncTransportTaxesInput;
})();

