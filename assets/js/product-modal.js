(() => {
  function closeProductModal() {
    const modal = document.getElementById("productModal");
    if (modal) {
      modal.classList.remove("open");
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    }
  }

  // Fonction pour obtenir les prix par service
  function getPricesByService(basePrice, transportTaxes, quantity, unit = "g") {
    if (!transportTaxes || !Array.isArray(transportTaxes) || transportTaxes.length === 0) {
      return { home: basePrice, postal: basePrice, meet: basePrice };
    }

    // Normaliser la quantité pour la recherche (peut être "5g", "5", 5, etc.)
    const quantityNum = typeof quantity === 'string' ? parseFloat(quantity.replace(/[^\d.]/g, '')) : quantity;
    const quantityStr = `${quantityNum}${unit}`;
    const quantityNumStr = String(quantityNum);
    
    // Chercher la taxe correspondante (peut être "5g", "5", etc.)
    const taxEntry = transportTaxes.find(t => {
      if (!t.quantity) return false;
      const tQty = String(t.quantity).trim();
      return tQty === quantityStr || tQty === quantityNumStr || 
             parseFloat(tQty.replace(/[^\d.]/g, '')) === quantityNum;
    });
    
    if (!taxEntry || !taxEntry.services) {
      return { home: basePrice, postal: basePrice, meet: basePrice };
    }

    return {
      home: basePrice + (parseFloat(taxEntry.services.home) || 0),
      postal: basePrice + (parseFloat(taxEntry.services.postal) || 0),
      meet: basePrice + (parseFloat(taxEntry.services.meet) || 0)
    };
  }

  // Fonction pour obtenir le prix selon le service sélectionné
  function getPriceBySelectedService(basePrice, transportTaxes, quantity, selectedService, unit = "g") {
    const prices = getPricesByService(basePrice, transportTaxes, quantity, unit);
    
    // Si un service est sélectionné, retourner le prix correspondant
    if (selectedService) {
      if (selectedService === "home") return prices.home;
      if (selectedService === "postal") return prices.postal;
      if (selectedService === "meet") return prices.meet;
    }
    
    // Sinon, retourner le prix de base
    return basePrice;
  }

  // Fonction pour formater le prix selon la config
  function formatPrice(price, transportTaxes, quantity, config, unit = "g", selectedService = null) {
    const priceQuantityMenuEnabled = config?.priceQuantityMenuEnabled !== false;
    
    if (!priceQuantityMenuEnabled || !transportTaxes || transportTaxes.length === 0) {
      return `${price.toFixed(2)}€`;
    }

    const prices = getPricesByService(price, transportTaxes, quantity, unit);
    
    // Si un service est sélectionné, afficher uniquement ce prix
    if (selectedService) {
      const servicePrice = getPriceBySelectedService(price, transportTaxes, quantity, selectedService, unit);
      return `${servicePrice.toFixed(2)}€`;
    }
    
    // Sinon, afficher tous les prix disponibles
    const priceList = [];
    if (prices.home !== price || prices.postal !== price || prices.meet !== price) {
      if (prices.home !== price) priceList.push(`🚚 ${prices.home.toFixed(0)}€`);
      if (prices.postal !== price) priceList.push(`📦 ${prices.postal.toFixed(0)}€`);
      if (prices.meet !== price) priceList.push(`📍 ${prices.meet.toFixed(0)}€`);
    }
    
    if (priceList.length > 0) {
      return priceList.join(" / ");
    }
    
    return `${price.toFixed(2)}€`;
  }

  window.showProductModal = function(product) {
    if (!product) return;

    // Charger la config
    let config = {};
    try {
      const configStr = localStorage.getItem("site_config");
      if (configStr) {
        config = JSON.parse(configStr);
      }
    } catch (e) {
      console.error("Erreur lecture config:", e);
    }

    const modal = document.getElementById("productModal");
    const title = document.getElementById("pmTitle");
    const tags = document.getElementById("pmTags");
    const info = document.getElementById("pmInfo");
    const qtyContainer = document.getElementById("pmQty");
    const selection = document.getElementById("pmSelection");
    const priceLabel = document.getElementById("pmPrice");
    const priceBar = document.querySelector(".pm-pricebar");
    const media = document.querySelector(".pm-media");
    const video = document.getElementById("pmVideo");
    const addButton = document.getElementById("pmAdd");
    const closeButton = document.getElementById("pmClose");

    if (!modal) return;

    if (title) {
      title.textContent = product.name || "Produit";
    }

    if (tags) {
      const chips = [];
      if (product.category) chips.push(`<span class="pm-chip">${product.category}</span>`);
      if (product.farm) chips.push(`<span class="pm-chip">${product.farm}</span>`);
      if (product.featured) chips.push('<span class="pm-chip featured">⭐ En vedette</span>');
      tags.innerHTML = chips.join("");
    }

    if (info) {
      const infoText = (product.description && product.description.trim()) || (product.info && product.info.trim()) || "";
      info.style.display = infoText ? "block" : "none";
      if (infoText) {
        if (window.parseMarkdownItalic) {
          info.innerHTML = window.parseMarkdownItalic(infoText);
        } else {
          info.textContent = infoText;
        }
      }
    }

    const normalizeUnit = (value) => (value && value.replace(/^\d+/, "").trim()) || "g";
    const defaultUnit = normalizeUnit(product.unit || "g");
    const customPrices = {};

    if (product.customPrices) {
      product.customPrices.split(",").forEach(entry => {
        const trimmed = entry.trim();
        if (!trimmed.includes(":")) return;
        const parts = trimmed.split(":");
        if (parts.length !== 2) return;
        const grammagePart = parts[0].trim();
        const pricePart = parts[1].trim();
        if (grammagePart && pricePart && !isNaN(parseFloat(grammagePart)) && !isNaN(parseFloat(pricePart))) {
          customPrices[parseFloat(grammagePart)] = parseFloat(pricePart);
        }
      });
    }

    if (product.quantities && Array.isArray(product.quantities) && product.quantities.length > 0) {
      product.quantities = product.quantities.map(item => {
        const price = customPrices[item.grammage] !== undefined 
          ? customPrices[item.grammage] 
          : (product.price || 0) * item.grammage;
        return {
          ...item,
          unit: normalizeUnit(item.unit || defaultUnit),
          price: price
        };
      });
    } else if (product.grammages || product.customPrices) {
      let grammages = [];
      if (product.grammages) {
        grammages = product.grammages.split(",")
          .map(value => value.trim())
          .filter(value => value && !isNaN(parseFloat(value)))
          .map(value => parseFloat(value));
      }
      if (grammages.length > 0) {
        product.quantities = grammages.map(grammage => {
          const price = customPrices[grammage] !== undefined 
            ? customPrices[grammage] 
            : (product.price || 0) * grammage;
          return {
            grammage: grammage,
            unit: defaultUnit,
            price: price
          };
        });
        Object.keys(customPrices).forEach(key => {
          const parsed = parseFloat(key);
          if (!grammages.includes(parsed) && !isNaN(parsed)) {
            product.quantities.push({
              grammage: parsed,
              unit: defaultUnit,
              price: customPrices[parsed]
            });
          }
        });
        product.quantities.sort((a, b) => a.grammage - b.grammage);
      }
    }

    let selectedQuantity = null;
    let selectedPrice = product.price || 0;
    const transportTaxes = product.transportTaxes || [];

    if (product.quantities && product.quantities.length > 0) {
      if (qtyContainer) {
        qtyContainer.innerHTML = `
          <div class="pm-qty-select">
            <div class="qty-options">
              ${product.quantities.map(item => {
                const itemUnit = normalizeUnit(item.unit || "g");
                // Obtenir le service sélectionné depuis le panier
                let selectedService = null;
                try {
                  // Chercher dans le DOM le service sélectionné
                  const activeServiceCard = document.querySelector(".service-card.active, .service-card.selected");
                  if (activeServiceCard) {
                    const serviceType = activeServiceCard.dataset.service || activeServiceCard.getAttribute("data-service");
                    if (serviceType) selectedService = serviceType;
                  }
                  // Sinon, chercher dans localStorage
                  if (!selectedService) {
                    const cartServicesStr = localStorage.getItem("site_cart_services");
                    if (cartServicesStr) {
                      const cartServices = JSON.parse(cartServicesStr);
                      // Vérifier quel service est actif (on prend le premier actif par défaut)
                      if (cartServices.home) selectedService = "home";
                      else if (cartServices.postal) selectedService = "postal";
                      else if (cartServices.meet) selectedService = "meet";
                    }
                  }
                } catch (e) {
                  console.error("Erreur lecture services:", e);
                }
                const priceText = formatPrice(item.price, transportTaxes, item.grammage, config, itemUnit, selectedService);
                return `
                  <button class="qty-btn" data-grammage="${item.grammage}" data-price="${item.price}" data-unit="${itemUnit}">
                    <span class="qty-grammage">${item.grammage}${itemUnit}</span>
                    <span class="qty-price-label">${priceText}</span>
                  </button>
                `;
              }).join("")}
            </div>
          </div>
        `;

        selectedQuantity = product.quantities[0];
        selectedPrice = selectedQuantity.price;

        qtyContainer.querySelectorAll(".qty-btn").forEach(button => {
          button.addEventListener("click", () => {
            qtyContainer.querySelectorAll(".qty-btn").forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            const grammage = button.dataset.grammage;
            const price = parseFloat(button.dataset.price);
            const unit = button.dataset.unit || defaultUnit;
            selectedQuantity = { grammage: grammage, price: price, unit: unit };
            selectedPrice = price;
            if (selection) {
              selection.textContent = `${grammage}${unit}`;
            }
            if (priceLabel) {
              // Obtenir le service sélectionné depuis le panier
              let selectedService = null;
              try {
                // Chercher dans le DOM le service sélectionné
                const activeServiceCard = document.querySelector(".service-card.active, .service-card.selected");
                if (activeServiceCard) {
                  const serviceType = activeServiceCard.dataset.service || activeServiceCard.getAttribute("data-service");
                  if (serviceType) selectedService = serviceType;
                }
                // Sinon, chercher dans localStorage
                if (!selectedService) {
                  const cartServicesStr = localStorage.getItem("site_cart_services");
                  if (cartServicesStr) {
                    const cartServices = JSON.parse(cartServicesStr);
                    if (cartServices.home) selectedService = "home";
                    else if (cartServices.postal) selectedService = "postal";
                    else if (cartServices.meet) selectedService = "meet";
                  }
                }
              } catch (e) {
                console.error("Erreur lecture services:", e);
              }
              const priceText = formatPrice(price, transportTaxes, grammage, config, unit, selectedService);
              priceLabel.textContent = priceText;
            }
          });
        });

        const defaultButton = qtyContainer.querySelector(".qty-btn");
        if (defaultButton) {
          defaultButton.classList.add("active");
          if (selection && selectedQuantity) {
            selection.textContent = `${selectedQuantity.grammage}${selectedQuantity.unit || defaultUnit}`;
          }
        }
      }
    } else {
      if (qtyContainer) {
        qtyContainer.innerHTML = "";
      }
    }

    if (product.quantities && product.quantities.length !== 0) {
      if (priceBar) {
        priceBar.style.display = "flex";
      }
    } else {
      if (selection) {
        selection.textContent = "";
      }
      if (priceBar) {
        priceBar.style.display = "none";
      }
    }

    if (priceLabel) {
      const selectedUnit = selectedQuantity?.unit || defaultUnit;
      // Obtenir le service sélectionné depuis le panier
      let selectedService = null;
      try {
        const cartServicesStr = localStorage.getItem("site_cart_services");
        if (cartServicesStr) {
          const cartServices = JSON.parse(cartServicesStr);
          if (cartServices.home) selectedService = "home";
          else if (cartServices.postal) selectedService = "postal";
          else if (cartServices.meet) selectedService = "meet";
        }
      } catch (e) {
        console.error("Erreur lecture services:", e);
      }
      const priceText = formatPrice(selectedPrice, transportTaxes, selectedQuantity?.grammage || 1, config, selectedUnit, selectedService);
      priceLabel.textContent = priceText;
    }

    const image = document.getElementById("pmImage");
    if (media && video && image) {
      const videoSrc = product.video || "";
      const photoSrc = product.photo || product.image || product.media || "";
      if (videoSrc) {
        video.style.display = "block";
        video.src = videoSrc;
        image.style.display = "none";
      } else if (photoSrc) {
        video.style.display = "none";
        image.src = photoSrc;
        image.alt = product.name || "";
        image.style.display = "block";
      } else {
        video.style.display = "none";
        image.style.display = "none";
      }
    }

    if (addButton) {
      addButton.onclick = null;
      addButton.replaceWith(addButton.cloneNode(true));
      let lock = false;
      const newAddButton = document.getElementById("pmAdd");
      if (newAddButton) {
        newAddButton.onclick = () => {
          if (lock) return;
          lock = true;
          setTimeout(() => lock = false, 300);

          const category = product.category || "Sans catégorie";
          if (window.cart) {
            const baseName = product.name || category;
            const imageUrl = product.photo || product.image || product.media || "";
            const variantLabel = selectedQuantity && selectedQuantity.grammage 
              ? `${selectedQuantity.grammage}${selectedQuantity.unit || defaultUnit}` 
              : "";
            const productKey = [product.id || baseName, variantLabel].filter(Boolean).join("::") || baseName;

            let existingItem = window.cart.find(item => item.productKey === productKey);
            if (!existingItem) {
              existingItem = window.cart.find(item => 
                !item.productKey || 
                item.category !== category || 
                (item.variant && item.variant !== variantLabel)
              );
            }

            if (existingItem) {
              const unitPrice = existingItem.unitPrice || selectedPrice;
              existingItem.qty = (existingItem.qty || 1) + 1;
              existingItem.unitPrice = unitPrice;
              existingItem.price = unitPrice * existingItem.qty;
              existingItem.name = existingItem.name || baseName;
              existingItem.title = existingItem.name;
              existingItem.image = existingItem.image || imageUrl;
              existingItem.variant = existingItem.variant || variantLabel;
              existingItem.category = existingItem.category || category;
              existingItem.unit = existingItem.unit || selectedQuantity?.unit || defaultUnit;
            } else {
              window.cart.push({
                productKey: productKey,
                productId: product.id || null,
                category: category,
                name: baseName,
                title: baseName,
                unitPrice: selectedPrice,
                qty: 1,
                price: selectedPrice,
                image: imageUrl,
                variant: variantLabel,
                grammage: selectedQuantity?.grammage || null,
                unit: selectedQuantity?.unit || defaultUnit
              });
            }

            window.dispatchEvent(new CustomEvent("cartUpdated"));
            if (window.refreshCartUI) {
              window.refreshCartUI();
            }
          }

          closeProductModal();
          if (window.openCart) {
            window.openCart();
          }
        };
      }
    }

    if (closeButton) {
      closeButton.onclick = closeProductModal;
    }

    modal.onclick = (event) => {
      if (event.target === modal) {
        closeProductModal();
      }
    };

    modal.classList.add("open");
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";
  };

  window.closeProductModal = closeProductModal;
})();
