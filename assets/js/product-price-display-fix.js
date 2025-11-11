// Patch pour corriger l'affichage des prix sur les cartes produits
(function() {
  'use strict';

  // Fonction pour obtenir le prix formaté d'un produit
  function getFormattedProductPrice(product) {
    if (!product) return "0.00€";

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

    const transportTaxes = product.transportTaxes || [];
    const priceQuantityMenuEnabled = config?.priceQuantityMenuEnabled !== false;

    // Si le menu prix par quantité est désactivé ou qu'il n'y a pas de taxes, afficher le prix de base
    if (!priceQuantityMenuEnabled || !transportTaxes || transportTaxes.length === 0) {
      if (product.quantities && product.quantities.length > 0) {
        const minPrice = Math.min(...product.quantities.map(q => q.price || 0));
        const maxPrice = Math.max(...product.quantities.map(q => q.price || 0));
        if (minPrice === maxPrice) {
          return `${minPrice.toFixed(2)}€`;
        }
        return `${minPrice.toFixed(2)}€ / ${maxPrice.toFixed(2)}€`;
      }
      return `${(product.price || 0).toFixed(2)}€`;
    }

    // Si on a des prix par service configurés, utiliser la fonction de formatage
    if (window.formatProductPrice) {
      // Prendre la première quantité par défaut (ou utiliser le prix de base si pas de quantités)
      const firstQuantity = product.quantities && product.quantities.length > 0 
        ? product.quantities[0] 
        : { grammage: 1, price: product.price || 0, unit: product.unit || "g" };
      
      // Utiliser le prix de base (même si 0) et les transportTaxes pour calculer les prix par service
      const basePrice = firstQuantity.price || product.price || 0;
      
      return window.formatProductPrice(
        basePrice,
        transportTaxes,
        firstQuantity.grammage || 1,
        config,
        firstQuantity.unit || product.unit || "g",
        null // Pas de service sélectionné sur la carte produit
      );
    }

    // Fallback : afficher le prix de base
    return `${(product.price || 0).toFixed(2)}€`;
  }

  // Patcher renderProducts si elle existe
  const originalRenderProducts = window.renderProducts;
  if (originalRenderProducts) {
    window.renderProducts = function(products) {
      // Appeler la fonction originale
      originalRenderProducts(products);
      
      // Corriger les prix affichés
      setTimeout(() => {
        const productCards = document.querySelectorAll('.product-card, [data-product-id]');
        productCards.forEach(card => {
          const priceElement = card.querySelector('.product-price, .price, [class*="price"]');
          if (priceElement) {
            // Essayer de trouver l'ID du produit
            const productId = card.dataset.productId || card.dataset.id;
            if (productId) {
              try {
                const productsStr = localStorage.getItem("site_products");
                if (productsStr) {
                  const allProducts = JSON.parse(productsStr);
                  const product = allProducts.find(p => String(p.id) === String(productId));
                  if (product) {
                    priceElement.textContent = getFormattedProductPrice(product);
                  }
                }
              } catch (e) {
                console.error("Erreur correction prix:", e);
              }
            }
          }
        });
      }, 100);
    };
  }

  // Observer les changements dans la grille de produits
  const productsGrid = document.getElementById("productsGrid");
  if (productsGrid) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          setTimeout(() => {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // Element node
                const priceElement = node.querySelector && node.querySelector('.product-price, .price, [class*="price"]');
                if (priceElement) {
                  const productId = node.dataset && (node.dataset.productId || node.dataset.id);
                  if (productId) {
                    try {
                      const productsStr = localStorage.getItem("site_products");
                      if (productsStr) {
                        const allProducts = JSON.parse(productsStr);
                        const product = allProducts.find(p => String(p.id) === String(productId));
                        if (product) {
                          priceElement.textContent = getFormattedProductPrice(product);
                        }
                      }
                    } catch (e) {
                      console.error("Erreur correction prix:", e);
                    }
                  }
                }
              }
            });
          }, 50);
        }
      });
    });

    observer.observe(productsGrid, { childList: true, subtree: true });
  }

  // Écouter les mises à jour des produits
  window.addEventListener("adminDataUpdated", function(e) {
    if (e.detail && e.detail.key === "products") {
      setTimeout(() => {
        const productCards = document.querySelectorAll('.product-card, [data-product-id]');
        productCards.forEach(card => {
          const priceElement = card.querySelector('.product-price, .price, [class*="price"]');
          if (priceElement) {
            const productId = card.dataset.productId || card.dataset.id;
            if (productId) {
              try {
                const productsStr = localStorage.getItem("site_products");
                if (productsStr) {
                  const allProducts = JSON.parse(productsStr);
                  const product = allProducts.find(p => String(p.id) === String(productId));
                  if (product) {
                    priceElement.textContent = getFormattedProductPrice(product);
                  }
                }
              } catch (e) {
                console.error("Erreur correction prix:", e);
              }
            }
          }
        });
      }, 200);
    }
  });

  console.log("✅ Patch d'affichage des prix initialisé");
})();

