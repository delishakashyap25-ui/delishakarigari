// Main theme logic
document.addEventListener('DOMContentLoaded', () => {
  // Sort By functionality
  const sortSelect = document.getElementById('SortBy');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('sort_by', this.value);
      window.location.search = urlParams.toString();
    });
  }

  // Product Page Add to Cart
  const productForm = document.getElementById('AddToCartForm');
  if (productForm) {
    productForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if(typeof window.ShopifyCart !== 'undefined') {
         ShopifyCart.addItem(this);
      }
    });
  }
});
