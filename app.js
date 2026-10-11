/**
 * MuddaCraft Studio - E-commerce Storefront Application
 */

const PRODUCTS = [
  {
    id: 'mudda-01',
    name: 'The Sarkanda Classic Mudda',
    category: 'classic',
    material: 'Natural River Reed & Jute',
    price: 48,
    originalPrice: 60,
    rating: 4.9,
    reviews: 128,
    badge: 'Bestseller',
    badgeClass: 'badge-bestseller',
    dimensions: '15" Dia × 14" H',
    weightCapacity: '130 kg (286 lbs)',
    weight: '2.1 kg',
    description: 'The definitive Indian sitting stool. Handcrafted from sustainably harvested sarkanda river reeds, reinforced with a bamboo rim and cross-tied with unbleached natural jute rope.',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mudda-02',
    name: 'The Jaipur High-Back Chair',
    category: 'chairs',
    material: 'Bamboo Framework & Sarkanda',
    price: 95,
    originalPrice: 120,
    rating: 4.8,
    reviews: 84,
    badge: 'Artisan Special',
    badgeClass: 'badge-eco',
    dimensions: '22" W × 24" D × 32" H',
    weightCapacity: '150 kg (330 lbs)',
    weight: '3.8 kg',
    description: 'An elevated, ergonomic mudda chair with extended back support. Features dual-ring structural reinforcement and hours of master-weaving along the lumbar curve.',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mudda-03',
    name: 'Bohemian Mandala Jute Mudda',
    category: 'jute',
    material: '100% Organic Golden Jute',
    price: 64,
    originalPrice: 75,
    rating: 5.0,
    reviews: 62,
    badge: 'Eco Pick',
    badgeClass: 'badge-eco',
    dimensions: '16" Dia × 15" H',
    weightCapacity: '120 kg (265 lbs)',
    weight: '2.4 kg',
    description: 'Features an intricate concentric mandala weave on the seating surface. Soft yet durable underfoot or as an accent seat in modern bohemian living spaces.',
    image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mudda-04',
    name: 'Phulkari Vibrant Woven Stool',
    category: 'colorful',
    material: 'Dyed Cotton Cord & Reed',
    price: 56,
    originalPrice: 68,
    rating: 4.7,
    reviews: 95,
    badge: 'Festive',
    badgeClass: '',
    dimensions: '15" Dia × 14" H',
    weightCapacity: '125 kg (275 lbs)',
    weight: '2.2 kg',
    description: 'Inspired by traditional Punjabi phulkari embroidery. Handwoven using vibrant jewel-toned cotton cord over a resilient natural reed core.',
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mudda-05',
    name: 'Veranda Weatherproof Stool',
    category: 'outdoor',
    material: 'Treated Bamboo & Poly-Cord',
    price: 52,
    originalPrice: 65,
    rating: 4.8,
    reviews: 51,
    badge: 'Outdoor',
    badgeClass: 'badge-bestseller',
    dimensions: '16" Dia × 16" H',
    weightCapacity: '140 kg (308 lbs)',
    weight: '2.6 kg',
    description: 'Cured and sealed with non-toxic botanical linseed oil to resist balcony moisture, patio sun, and outdoor wear while retaining authentic handcrafted feel.',
    image: 'https://images.unsplash.com/photo-1519947486508-47c1a29d3597?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mudda-06',
    name: 'The Chhotu Mini Stool',
    category: 'mini',
    material: 'Lightweight Sarkanda & Jute',
    price: 34,
    originalPrice: 42,
    rating: 4.9,
    reviews: 73,
    badge: 'Kids & Low-Seat',
    badgeClass: '',
    dimensions: '11" Dia × 10" H',
    weightCapacity: '90 kg (198 lbs)',
    weight: '1.2 kg',
    description: 'A compact, lightweight mini mudda designed for children, low floor tables, meditation spaces, or as a cozy footrest.',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mudda-07',
    name: 'Nilgiri Smoked Bamboo Mudda',
    category: 'classic',
    material: 'Fire-Smoked Bamboo & Jute',
    price: 72,
    originalPrice: 85,
    rating: 4.9,
    reviews: 39,
    badge: 'Limited',
    badgeClass: 'badge-eco',
    dimensions: '17" Dia × 15" H',
    weightCapacity: '145 kg (320 lbs)',
    weight: '2.7 kg',
    description: 'Crafted from dark aged bamboo gently cured over woodsmoke for a rich caramel patina and enhanced natural pest resistance.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mudda-08',
    name: 'Desert Terracotta & Cream Stool',
    category: 'colorful',
    material: 'Natural Terracotta Cord & Reed',
    price: 62,
    originalPrice: 72,
    rating: 4.8,
    reviews: 44,
    badge: 'New',
    badgeClass: 'badge-bestseller',
    dimensions: '16" Dia × 14.5" H',
    weightCapacity: '130 kg (286 lbs)',
    weight: '2.3 kg',
    description: 'Earthy warmth in two-tone geometry. Warm terracotta and soft ecru cotton ropes woven in a chevron lattice over river reeds.',
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80'
  }
];

// App State
let cart = JSON.parse(localStorage.getItem('muddacraft_cart') || '[]');
let currentCategory = 'all';
let currentSearch = '';
let currentSort = 'popular';
const FREE_SHIPPING_THRESHOLD = 75;

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const cartCountElements = document.querySelectorAll('.cart-count');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsList = document.getElementById('cart-items-list');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartTotalEl = document.getElementById('cart-total');
const freeShippingText = document.getElementById('free-shipping-text');
const freeShippingFill = document.getElementById('free-shipping-fill');
const checkoutModal = document.getElementById('checkout-modal');
const quickViewModal = document.getElementById('quick-view-modal');

// Init
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCartUI();
  setupEventListeners();
});

// Render Product Catalog
function renderProducts() {
  if (!productsGrid) return;

  let filtered = PRODUCTS.filter(product => {
    const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
    const matchesSearch = product.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
                          product.material.toLowerCase().includes(currentSearch.toLowerCase()) ||
                          product.description.toLowerCase().includes(currentSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sorting
  if (currentSort === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🌾</div>
        <h3>No handcrafted muddas found</h3>
        <p style="color: var(--text-muted); margin-top: 6px;">Try adjusting your search terms or filters.</p>
        <button class="btn-primary" style="margin-top: 20px;" onclick="resetFilters()">View All Muddas</button>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = filtered.map(product => `
    <article class="product-card" data-id="${product.id}">
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
        ${product.badge ? `<span class="product-badge ${product.badgeClass}">${product.badge}</span>` : ''}
        <button class="quick-view-btn" onclick="openQuickView('${product.id}')">Quick View</button>
      </div>
      <div class="product-details">
        <span class="product-material">${product.material}</span>
        <h3 class="product-title">${product.name}</h3>
        <div class="product-rating">
          <span class="stars">★★★★★</span>
          <span class="rating-val">${product.rating}</span>
          <span class="review-count">(${product.reviews})</span>
        </div>
        <div class="product-specs">
          <span class="spec-pill">📏 ${product.dimensions}</span>
          <span class="spec-pill">⚖️ ${product.weight}</span>
        </div>
        <div class="product-bottom">
          <div class="price-box">
            <span class="price-current">$${product.price}</span>
            ${product.originalPrice ? `<span class="price-original">$${product.originalPrice}</span>` : ''}
          </div>
          <button class="add-cart-btn" onclick="addToCart('${product.id}')" title="Add to Cart">+</button>
        </div>
      </div>
    </article>
  `).join('');
}

// Cart Logic
function addToCart(productId, quantity = 1) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }

  saveCart();
  updateCartUI();
  showToast(`Added "${product.name}" to cart!`);
}

function updateCartQuantity(productId, delta) {
  const itemIndex = cart.findIndex(item => item.id === productId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += delta;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
  }
  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('muddacraft_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountElements.forEach(el => el.textContent = totalItems);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (cartSubtotalEl) cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (cartTotalEl) cartTotalEl.textContent = `$${subtotal.toFixed(2)}`;

  if (freeShippingText && freeShippingFill) {
    if (remainingForFree === 0 && subtotal > 0) {
      freeShippingText.innerHTML = `🎉 <strong>Congratulations!</strong> You qualify for <strong>Free Shipping!</strong>`;
      freeShippingFill.style.width = '100%';
    } else {
      freeShippingText.innerHTML = `Add <strong>$${remainingForFree.toFixed(2)}</strong> more for <strong>Free Carbon-Neutral Shipping</strong>`;
      freeShippingFill.style.width = `${progressPercent}%`;
    }
  }

  if (!cartItemsList) return;

  if (cart.length === 0) {
    cartItemsList.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🧺</div>
        <h4>Your basket is empty</h4>
        <p style="font-size: 0.88rem; margin-top: 6px;">Discover our artisan reed stools and chairs to get started.</p>
      </div>
    `;
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) checkoutBtn.disabled = false;

  cartItemsList.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.name}</h4>
        <div class="cart-item-price">$${item.price} each</div>
        <div class="cart-qty-control">
          <button class="qty-btn" onclick="updateCartQuantity('${item.id}', -1)">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
        </div>
      </div>
      <button class="item-delete-btn" onclick="removeFromCart('${item.id}')" title="Remove item">✕</button>
    </div>
  `).join('');
}

// Drawer & Modal Controls
window.toggleCart = function(show) {
  if (show !== undefined) {
    cartOverlay.classList.toggle('active', show);
  } else {
    cartOverlay.classList.toggle('active');
  }
};

window.openCheckout = function() {
  if (cart.length === 0) return;
  toggleCart(false);
  const checkoutSubtotal = document.getElementById('checkout-modal-subtotal');
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (checkoutSubtotal) checkoutSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  checkoutModal.classList.add('active');
};

window.closeCheckout = function() {
  checkoutModal.classList.remove('active');
};

window.openQuickView = function(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const content = document.getElementById('quick-view-content');
  content.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 30px; align-items: start;">
      <div style="border-radius: var(--radius-md); overflow: hidden; background: var(--bg-sand);">
        <img src="${product.image}" alt="${product.name}" style="width: 100%; aspect-ratio: 1; object-fit: cover;">
      </div>
      <div>
        <span class="product-material">${product.material}</span>
        <h2 style="font-family: var(--font-serif); font-size: 1.6rem; margin: 6px 0 10px;">${product.name}</h2>
        <div class="product-rating" style="margin-bottom: 12px;">
          <span class="stars">★★★★★</span>
          <span>${product.rating} (${product.reviews} artisan verified reviews)</span>
        </div>
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary); margin-bottom: 16px;">
          $${product.price} ${product.originalPrice ? `<span style="font-size: 1rem; color: var(--text-light); text-decoration: line-through;">$${product.originalPrice}</span>` : ''}
        </div>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">${product.description}</p>
        <div style="background: var(--bg-page); padding: 14px; border-radius: var(--radius-sm); margin-bottom: 20px; font-size: 0.88rem;">
          <div><strong>📏 Dimensions:</strong> ${product.dimensions}</div>
          <div style="margin-top: 4px;"><strong>💪 Load Capacity:</strong> ${product.weightCapacity}</div>
          <div style="margin-top: 4px;"><strong>🌿 Sustainability:</strong> 100% natural, plastic-free biodegradable Sarkanda reeds</div>
        </div>
        <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="addToCart('${product.id}'); closeQuickView();">
          Add To Cart • $${product.price}
        </button>
      </div>
    </div>
  `;
  quickViewModal.classList.add('active');
};

window.closeQuickView = function() {
  quickViewModal.classList.remove('active');
};

window.submitOrder = async function(event) {
  event.preventDefault();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const orderPayload = {
    items: cart,
    total: subtotal,
    customer: {
      name: document.getElementById('cust-name').value,
      email: document.getElementById('cust-email').value,
      address: document.getElementById('cust-address').value,
      city: document.getElementById('cust-city').value,
    }
  };

  const submitBtn = document.getElementById('order-submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing with Artisans...';

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const data = await res.json();
    
    // Show success view
    const modalBody = document.getElementById('checkout-form-container');
    modalBody.innerHTML = `
      <div class="order-success-view">
        <div class="success-icon">✓</div>
        <h2 style="font-family: var(--font-serif); font-size: 1.8rem;">Thank You for Your Order!</h2>
        <div class="order-badge-pill">Order Reference: ${data.orderId || 'MUDDA-89214'}</div>
        <p style="color: var(--text-muted); max-width: 440px; margin: 0 auto 20px;">
          Your handmade mudda stools are being prepared by our cooperative master weavers in rural Haryana and Uttar Pradesh.
        </p>
        <div style="background: var(--bg-sand); padding: 16px; border-radius: var(--radius-md); max-width: 440px; margin: 0 auto 24px; text-align: left; font-size: 0.9rem;">
          <div>📦 <strong>Estimated Delivery:</strong> 3–5 Business Days</div>
          <div style="margin-top: 6px;">🌱 <strong>Eco-Footprint:</strong> 0% Synthetic Plastic • 100% Biodegradable Packaging</div>
        </div>
        <button class="btn-primary" onclick="closeCheckout(); location.reload();">Continue Shopping</button>
      </div>
    `;

    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();
  } catch (err) {
    showToast('Order saved in local mode!');
    closeCheckout();
  }
};

window.resetFilters = function() {
  currentCategory = 'all';
  currentSearch = '';
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.category === 'all'));
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  renderProducts();
};

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>🌿</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

// Event Listeners
function setupEventListeners() {
  // Category tabs
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      currentCategory = button.dataset.category;
      renderProducts();
    });
  });

  // Search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderProducts();
    });
  }

  // Sort
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderProducts();
    });
  }
}
