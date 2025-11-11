// Patch pour mettre à jour les prix du panier selon le service sélectionné
(function() {
  'use strict';

  // Fonction pour obtenir les prix par service (copie de product-modal.js)
  function getPricesByService(basePrice, transportTaxes, quantity, unit = "g") {
    if (!transportTaxes || !Array.isArray(transportTaxes) || transportTaxes.length === 0) {
      return { home: basePrice, postal: basePrice, meet: basePrice };
    }

    const quantityNum = typeof quantity === 'string' ? parseFloat(quantity.replace(/[^\d.]/g, '')) : quantity;
    const quantityStr = `${quantityNum}${unit}`;
    const quantityNumStr = String(quantityNum);
    
    const priceEntry = transportTaxes.find(t => {
      if (!t.quantity) return false;
      const tQty = String(t.quantity).trim();
      return tQty === quantityStr || tQty === quantityNumStr || 
             parseFloat(tQty.replace(/[^\d.]/g, '')) === quantityNum;
    });
    
    if (!priceEntry || !priceEntry.services) {
      return { home: basePrice, postal: basePrice, meet: basePrice };
    }

    // Les valeurs dans services sont des PRIX FINAUX, pas des taxes
    return {
      home: parseFloat(priceEntry.services.home) || basePrice,
      postal: parseFloat(priceEntry.services.postal) || basePrice,
      meet: parseFloat(priceEntry.services.meet) || basePrice
    };
  }

  // Fonction pour obtenir le prix selon le service sélectionné
  function getPriceBySelectedService(basePrice, transportTaxes, quantity, selectedService, unit = "g") {
    const prices = getPricesByService(basePrice, transportTaxes, quantity, unit);
    
    if (selectedService) {
      if (selectedService === "home") return prices.home;
      if (selectedService === "postal") return prices.postal;
      if (selectedService === "meet") return prices.meet;
    }
    
    return basePrice;
  }

  // Fonction pour mettre à jour les prix du panier selon le service sélectionné
  function updateCartPricesByService(selectedService) {
    if (!window.cart || !Array.isArray(window.cart)) return;

    window.cart.forEach(item => {
      // Si l'item a des transportTaxes et un basePrice, recalculer le prix
      if (item.transportTaxes && item.basePrice !== undefined) {
        const finalPrice = getPriceBySelectedService(
          item.basePrice,
          item.transportTaxes,
          item.grammage || 1,
          selectedService,
          item.unit || "g"
        );
        
        item.unitPrice = finalPrice;
        item.price = finalPrice * (item.qty || 1);
        item.selectedService = selectedService;
      }
    });

    // Rafraîchir l'UI du panier
    if (window.refreshCartUI) {
      window.refreshCartUI();
    }
  }

  // Observer la sélection de service dans le panier
  function initServiceSelectionObserver() {
    const serviceCards = document.querySelectorAll(".service-card");
    
    serviceCards.forEach(card => {
      // Vérifier si le listener existe déjà
      if (card._priceUpdateListener) return;
      
      // Ajouter un listener pour mettre à jour les prix
      card._priceUpdateListener = function() {
        // Obtenir le service sélectionné
        const selectedService = this.dataset.service || this.getAttribute("data-service");
        
        if (selectedService) {
          // Mettre à jour les prix du panier après un court délai pour laisser le temps au système existant de mettre à jour
          setTimeout(() => {
            updateCartPricesByService(selectedService);
          }, 100);
        }
      };
      
      card.addEventListener("click", card._priceUpdateListener);
    });
  }

  // Observer les changements dans le panier
  const cartPanel = document.querySelector('[data-panel="service"]');
  if (cartPanel) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          setTimeout(initServiceSelectionObserver, 100);
        }
      });
    });

    observer.observe(cartPanel, { childList: true, subtree: true, attributes: true });
  }

  // Initialiser au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initServiceSelectionObserver, 500);
    });
  } else {
    setTimeout(initServiceSelectionObserver, 500);
  }

  // Écouter les événements de mise à jour du panier
  window.addEventListener("cartUpdated", function() {
    setTimeout(initServiceSelectionObserver, 200);
  });

  console.log("✅ Patch de mise à jour des prix selon le service initialisé");
})();

