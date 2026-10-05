document.addEventListener('DOMContentLoaded', () => {
  const WISHLIST_KEY = 'delisha_wishlist';

  // Initialize wishlist from localStorage
  let wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];

  const headerIcon = document.getElementById('HeaderWishlistIcon');
  const headerCount = document.getElementById('WishlistCount');
  const drawer = document.getElementById('WishlistDrawer');
  const overlay = document.getElementById('WishlistOverlay');
  const closeBtn = document.getElementById('WishlistClose');
  const itemsContainer = document.getElementById('WishlistItems');

  // Update count on load
  updateWishlistCount();
  updateWishlistButtonsState();

  // Toggle drawer
  if (headerIcon) {
    headerIcon.addEventListener('click', (e) => {
      e.preventDefault();
      openWishlist();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeWishlist);
  }

  if (overlay) {
    overlay.addEventListener('click', closeWishlist);
  }

  function openWishlist() {
    if (!drawer) return;
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('overflow-hidden');
    renderWishlistItems();
  }

  function closeWishlist() {
    if (!drawer) return;
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('overflow-hidden');
  }

  function updateWishlistCount() {
    if (headerCount) {
      headerCount.textContent = wishlist.length;
    }
  }

  // Export function to toggle wishlist from anywhere
  window.toggleWishlist = function (handle) {
    if (!handle) return;
    const index = wishlist.indexOf(handle);
    if (index > -1) {
      // Remove
      wishlist.splice(index, 1);
    } else {
      // Add
      wishlist.push(handle);
    }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    updateWishlistCount();
    updateWishlistButtonsState();
  };
  window.toggleWishlistItem = window.toggleWishlist;

  // Export function to remove directly
  window.removeFromWishlist = function (handle) {
    const index = wishlist.indexOf(handle);
    if (index > -1) {
      wishlist.splice(index, 1);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
      updateWishlistCount();
      updateWishlistButtonsState();
      renderWishlistItems(); // Re-render if drawer is open
    }
  };

  function updateWishlistButtonsState() {
    const buttons = document.querySelectorAll('.wishlist-btn, .dk-product-card__wishlist-btn');
    buttons.forEach(btn => {
      const handle = btn.getAttribute('data-product-handle');
      if (!handle) return;

      if (wishlist.includes(handle)) {
        btn.classList.add('active');
        // Fill heart
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', 'currentColor');
      } else {
        btn.classList.remove('active');
        // Empty heart
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', 'none');
      }
    });
  }

  function renderWishlistItems() {
    if (!itemsContainer) return;

    const emptyState = itemsContainer.querySelector('.wishlist-empty');
    const loadingState = itemsContainer.querySelector('.wishlist-loading');

    // Clear previous items except empty/loading states
    Array.from(itemsContainer.children).forEach(child => {
      if (!child.classList.contains('wishlist-empty') && !child.classList.contains('wishlist-loading')) {
        child.remove();
      }
    });

    if (wishlist.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (loadingState) loadingState.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (loadingState) loadingState.style.display = 'block';

    let promises = wishlist.map(handle => {
      return fetch('/products/' + handle + '.js')
        .then(res => res.json())
        .catch(() => null);
    });

    Promise.all(promises).then(products => {
      if (loadingState) loadingState.style.display = 'none';

      products.forEach(product => {
        if (!product) return; // Skip if error

        let moneyFormat = 'Rs. {{amount}}';
        if (window.theme && window.theme.moneyFormat) {
          moneyFormat = window.theme.moneyFormat;
        }
        const formattedPrice = moneyFormat.replace('{{amount}}', (product.price / 100).toFixed(2));

        const itemHtml = `
                    <div class="wishlist-item" data-handle="${product.handle}">
                        <a href="${product.url}">
                            <img src="${product.featured_image}" alt="${product.title}" class="wishlist-item-img">
                        </a>
                        <div class="wishlist-item-details">
                            <a href="${product.url}" class="wishlist-item-title">${product.title}</a>
                            <div class="wishlist-item-price">${formattedPrice}</div>
                            <div class="wishlist-item-actions">
                                <button class="wishlist-remove" onclick="removeFromWishlist('${product.handle}')">Remove</button>
                                <button class="wishlist-add-to-cart" onclick="addWishlistItemToCart(${product.variants[0].id})">Add to Cart</button>
                            </div>
                        </div>
                    </div>
                `;
        itemsContainer.insertAdjacentHTML('beforeend', itemHtml);
      });
    });
  }

  window.addWishlistItemToCart = function (variantId) {
    if (typeof ShopifyCart !== 'undefined') {
      // Use existing cart drawer logic if available
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] })
      })
        .then(res => res.json())
        .then(data => {
          closeWishlist();
          if (typeof ShopifyCart.fetchCart === 'function') {
            ShopifyCart.fetchCart().then(() => {
              if (typeof ShopifyCart.openDrawer === 'function') {
                ShopifyCart.openDrawer();
              }
            });
          } else if (typeof ShopifyCart.openDrawer === 'function') {
            ShopifyCart.openDrawer();
          } else {
            window.location.reload();
          }
        })
        .catch(err => console.error(err));
    } else {
      // Fallback
      window.location.href = '/cart/add?id=' + variantId;
    }
  }

  // Initial binding for buttons rendered by server
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const handle = this.getAttribute('data-product-handle');
      if (handle) toggleWishlist(handle);
    });
  });
});