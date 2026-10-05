const ShopifyCart = {
  openDrawer() {
    document.getElementById('CartDrawer').classList.add('active');
    document.getElementById('CartOverlay').classList.add('active');
  },
  
  closeDrawer() {
    document.getElementById('CartDrawer').classList.remove('active');
    document.getElementById('CartOverlay').classList.remove('active');
  },

  formatMoney(cents, format = null) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    let value = '';
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    const formatString = format || window.theme?.moneyFormat || 'Rs. {{amount}}';
    
    const match = formatString.match(placeholderRegex);
    if (!match) {
      return 'Rs. ' + (cents / 100.0).toFixed(2);
    }

    function formatWithDelimiters(number, precision = 2, thousands = ',', decimal = '.') {
      if (isNaN(number) || number == null) return 0;
      number = (number / 100.0).toFixed(precision);
      const parts = number.split('.');
      const dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      const cents = parts[1] ? decimal + parts[1] : '';
      return dollars + cents;
    }

    const placeholder = match[1];
    switch (placeholder) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, ',', '.');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, ',', '.');
        break;
      case 'amount_with_space_separator':
        value = formatWithDelimiters(cents, 2, ' ', '.');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ', '.');
        break;
      case 'amount_with_apostrophe_separator':
        value = formatWithDelimiters(cents, 2, "'", '.');
        break;
      default:
        value = formatWithDelimiters(cents, 2);
        break;
    }
    return formatString.replace(placeholderRegex, value);
  },

  async fetchCart() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      this.renderCart(cart);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  },

  async addItem(formElement) {
    const formData = new FormData(formElement);
    const btn = formElement.querySelector('button[type="button"]') || formElement.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Adding...';
    btn.disabled = true;

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        await this.fetchCart();
        this.openDrawer();
      }
    } catch (err) {
      console.error('Error adding item:', err);
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  },

  async changeItem(key, quantity) {
    const itemElement = document.querySelector(`.cart-item[data-key="${key}"]`);
    let originalQuantity = null;
    let inputField = null;
    
    if (itemElement) {
      inputField = itemElement.querySelector('.cart-item-qty input');
      if (inputField) {
        originalQuantity = parseInt(inputField.value);
        inputField.value = quantity;
      }
      itemElement.classList.add('cart-item--loading');
    }

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: key,
          quantity: parseInt(quantity)
        })
      });
      
      if (response.ok) {
        const cart = await response.json();
        this.renderCart(cart);
      } else {
        if (inputField && originalQuantity !== null) {
          inputField.value = originalQuantity;
        }
        const errorText = await response.text();
        console.error('Failed to update cart:', response.status, errorText);
      }
    } catch (err) {
      if (inputField && originalQuantity !== null) {
        inputField.value = originalQuantity;
      }
      console.error('Error updating cart:', err);
    } finally {
      if (itemElement) {
        itemElement.classList.remove('cart-item--loading');
      }
    }
  },

  async removeItem(key) {
    const itemElement = document.querySelector(`.cart-item[data-key="${key}"]`);
    if (itemElement) {
      itemElement.classList.add('cart-item--loading');
      itemElement.style.opacity = '0.3';
    }
    this.changeItem(key, 0);
  },

  renderCart(cart) {
    const cartItemsContainer = document.getElementById('CartItems');
    const subtotalEl = document.getElementById('CartSubtotal');
    if (subtotalEl) {
      subtotalEl.innerText = this.formatMoney(cart.total_price);
    }
    
    // Update cart counter in header (exclude wishlist counters)
    const cartCounts = document.querySelectorAll('.cart-count:not(.wishlist-count)');
    cartCounts.forEach(el => {
      if (el.id !== 'WishlistCount') {
        el.innerText = cart.item_count;
      }
    });

    // Free Shipping Progress calculation (Rs. 499 threshold = 49900 paise)
    const shippingBar = document.getElementById('CartShippingBar');
    const shippingMsg = document.getElementById('CartShippingMsg');
    const shippingFill = document.getElementById('CartShippingFill');
    const threshold = 49900;

    if (shippingBar && shippingMsg && shippingFill) {
      if (cart.items.length === 0) {
        shippingBar.style.display = 'none';
      } else {
        shippingBar.style.display = 'block';
        if (cart.total_price >= threshold) {
          shippingMsg.innerHTML = '✨ <strong>Congratulations!</strong> You have unlocked <strong>FREE SHIPPING</strong>!';
          shippingFill.style.width = '100%';
          shippingFill.classList.add('unlocked');
        } else {
          const remaining = threshold - cart.total_price;
          const pct = Math.min(100, Math.max(0, (cart.total_price / threshold) * 100));
          shippingMsg.innerHTML = `Add <strong>${this.formatMoney(remaining)}</strong> more to unlock <strong>FREE SHIPPING</strong>`;
          shippingFill.style.width = pct + '%';
          shippingFill.classList.remove('unlocked');
        }
      }
    }

    if (cart.items.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="empty-cart-message">
          <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 19px; font-weight: 600; color: #211A18; margin: 0 0 8px;">Your festive cart is empty</p>
          <p style="font-size: 13px; color: #75656A; line-height: 1.6; margin: 0 0 24px;">Discover handcrafted pieces made to celebrate your celebrations and loved ones.</p>
          <a href="/collections/all" class="btn btn-checkout" style="display:inline-flex; width:auto; padding:0 26px; min-height:44px; text-decoration:none; margin:0 auto; align-items:center;">EXPLORE CREATIONS</a>
        </div>
      `;
      return;
    }

    let html = '';
    cart.items.forEach(item => {
      const image = item.image ? item.image : '/assets/placeholder-image.jpg';
      const variantTitle = item.variant_title ? item.variant_title : '';
      const productTitle = item.product_title || item.title || 'Product';
      
      html += `
        <div class="cart-item" data-key="${item.key}">
          <img src="${image}" alt="${productTitle}" class="cart-item-image">
          <div class="cart-item-details">
            <div class="cart-item-title-row">
              <a href="${item.url}" class="cart-item-title">${productTitle}</a>
              <button type="button" class="cart-item-remove" onclick="ShopifyCart.removeItem('${item.key}')" aria-label="Remove item">&times;</button>
            </div>
            ${variantTitle ? `<div class="cart-item-variant">${variantTitle}</div>` : ''}
            <div class="cart-item-bottom">
              <div class="cart-item-qty">
                <button type="button" onclick="ShopifyCart.changeItem('${item.key}', ${item.quantity - 1})" aria-label="Decrease quantity">-</button>
                <input type="text" value="${item.quantity}" readonly aria-label="Quantity">
                <button type="button" onclick="ShopifyCart.changeItem('${item.key}', ${item.quantity + 1})" aria-label="Increase quantity">+</button>
              </div>
              <div class="cart-item-price">${this.formatMoney(item.line_price)}</div>
            </div>
          </div>
        </div>
      `;
    });
    
    cartItemsContainer.innerHTML = html;
  }
};

window.ShopifyCart = ShopifyCart;

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('CartOverlay');
  const closeBtn = document.getElementById('CartClose');
  const cartIcon = document.getElementById('HeaderCartIcon');
  
  if (overlay) overlay.addEventListener('click', () => ShopifyCart.closeDrawer());
  if (closeBtn) closeBtn.addEventListener('click', () => ShopifyCart.closeDrawer());

  // Cart icon opens drawer instead of navigating
  if (cartIcon) {
    cartIcon.addEventListener('click', (e) => {
      e.preventDefault();
      ShopifyCart.fetchCart().then(() => ShopifyCart.openDrawer());
    });
  }

  // Initialize cart drawer
  ShopifyCart.fetchCart();
});