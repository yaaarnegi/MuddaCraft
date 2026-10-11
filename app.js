/**
 * MudhaCraft Studio - E-commerce Storefront Application
 * Traditional Indian Craftsmanship for Modern Homes
 */

// Global Store State
let storeState = {
  products: [],
  useCases: [],
  faqs: [],
  shipping: { base: 250, perAdditionalUnit: 150, freeShippingThreshold: 4500, delivery: '4–7 business days' },
  codEnabled: false,
  whatsapp: '+919876543210'
};

// Cart State (Persisted in localStorage)
let cart = JSON.parse(localStorage.getItem('mudhacraft_cart') || '[]');
let activeProduct = null;
let currentModalQty = 1;

// ==========================================================================
// Analytics Event Dispatcher (GA4, Meta Pixel, Google Ads)
// ==========================================================================
function trackEvent(eventName, payload = {}) {
  const timestamp = new Date().toISOString();
  console.log(`📊 [Analytics Event] ${eventName}:`, payload, `@ ${timestamp}`);

  // Google Analytics 4 integration
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, payload);
  }

  // Meta Pixel integration
  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', eventName, payload);
  }

  // Google Ads / DataLayer
  if (window.dataLayer && Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...payload });
  }
}

// ==========================================================================
// Initialization & Store Data Loading
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadStoreData();
  renderProducts();
  renderUseCases();
  renderFaqs();
  updateCartUI();
  setupEventListeners();
  initAnalytics();
});

async function loadStoreData() {
  try {
    const res = await fetch('/api/store');
    if (res.ok) {
      const data = await res.json();
      storeState = data;
      // Merge any local admin overrides if present
      const localOverrides = localStorage.getItem('mudhacraft_admin_store');
      if (localOverrides) {
        try {
          storeState = { ...storeState, ...JSON.parse(localOverrides) };
        } catch (e) {
          console.warn('Could not parse local admin overrides', e);
        }
      }
    }
  } catch (err) {
    console.warn('API store load failed, using fallback bundled state', err);
  }
}

// ==========================================================================
// Product Collection Rendering & Filtering
// ==========================================================================
function renderProducts(filter = 'all') {
  const grid = document.getElementById('products-grid');
  if (!grid || !storeState.products) return;

  const products = storeState.products.filter(p => {
    if (filter === 'all') return true;
    return (p.type || '').toLowerCase() === filter.toLowerCase();
  });

  grid.innerHTML = products.map(product => {
    const primaryImg = product.image || (product.images && product.images[0]) || 'assets/mudha-stool.jpg';
    const dim = product.dimensions || {};
    const dimText = dim.diameter ? `${dim.diameter} × ${dim.height}` : 'Dimensions awaiting batch test';

    return `
      <article class="product-card" data-product-id="${product.id}">
        <div class="product-image-wrap" onclick="openProductModal('${product.id}')">
          <img src="${primaryImg}" alt="${product.name}" loading="lazy">
          <span class="product-badge-tag">${product.type || 'Mudha'}</span>
        </div>
        <div class="product-card-body">
          <span class="product-type-meta">Handcrafted in Uttar Pradesh</span>
          <h3 class="product-name" onclick="openProductModal('${product.id}')" style="cursor: pointer;">${product.name}</h3>
          <p class="product-dimensions-snippet">📐 ${dimText}</p>
          <div class="product-price-row">
            <span class="product-price">₹${product.price.toLocaleString('en-IN')}</span>
            <span class="product-price-note">Introductory test price</span>
          </div>
          <span class="product-shipping-badge">📦 Ships Across India • Bulky Surface Freight</span>
          <div class="product-actions-row">
            <button class="btn-view-product" onclick="openProductModal('${product.id}')">
              View Product
            </button>
            <button class="btn-quick-add" onclick="quickAddToCart('${product.id}')" title="Quick Add to Basket" aria-label="Add to cart">
              +
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function filterProducts(category, btnElement) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  renderProducts(category);
}

// ==========================================================================
// Product Detail Modal & "Will it fit?" Visual Scale Guide
// ==========================================================================
function openProductModal(productId) {
  const product = (storeState.products || []).find(p => p.id === productId);
  if (!product) return;

  activeProduct = product;
  currentModalQty = 1;

  // Track ViewProduct Analytics Event
  trackEvent('ViewProduct', {
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.type
  });

  // Populate Modal Fields
  document.getElementById('modal-product-title').textContent = product.name;
  document.getElementById('modal-product-price').textContent = `₹${product.price.toLocaleString('en-IN')}`;
  document.getElementById('modal-product-desc').textContent = product.description || '';
  document.getElementById('modal-qty-display').textContent = '1';

  // Images & Gallery
  const images = (product.images && product.images.length > 0) ? product.images : [product.image || 'assets/mudha-stool.jpg'];
  const mainImg = document.getElementById('modal-main-img');
  mainImg.src = images[0];
  mainImg.alt = product.name;

  const thumbsContainer = document.getElementById('modal-thumbnails');
  thumbsContainer.innerHTML = images.map((img, idx) => `
    <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="switchModalImage('${img}', this)">
      <img src="${img}" alt="Thumbnail ${idx + 1}">
    </div>
  `).join('');

  // Specs
  const dim = product.dimensions || {};
  document.getElementById('spec-dimensions').textContent = dim.diameter ? `${dim.diameter} × ${dim.height} (Seat: ${dim.seatHeight || 'Standard'})` : 'Approx 15" Dia × 15" H (Batch confirmation in progress)';
  document.getElementById('spec-weight').textContent = product.weight || 'Approx 2.2 kg';
  document.getElementById('spec-capacity').textContent = product.weightCapacity || '110–130 kg (Load testing in progress)';
  document.getElementById('spec-material').textContent = product.material || 'Seasoned bamboo & river reeds';
  document.getElementById('spec-assembly').textContent = product.assembly || 'None. 100% pre-assembled';
  document.getElementById('spec-usage').textContent = Array.isArray(product.recommendedUsage) ? product.recommendedUsage.join(', ') : 'Balcony, Terrace, Garden';

  // "Will It Fit?" Scale Diagram Calculations
  const isChair = (product.type || '').toLowerCase() === 'chairs' || product.id.includes('back-support') || product.id.includes('balcony-mudha-set');
  const mudhaHeightPct = isChair ? '65%' : '38%'; // vs 36" railing (100%)
  const mudhaHeightInches = isChair ? '28"' : '15"';
  
  const fitBox = document.getElementById('fit-diagram-bars');
  if (fitBox) {
    fitBox.innerHTML = `
      <div class="fit-scale-bar">
        <div class="fit-bar-body" style="height: ${mudhaHeightPct}; background: #A07238;"></div>
        <span class="fit-bar-label"><strong>Mudha</strong><br>${mudhaHeightInches}</span>
      </div>
      <div class="fit-scale-bar">
        <div class="fit-bar-body" style="height: 45%; background: #C5A065;"></div>
        <span class="fit-bar-label">Coffee Table<br>18"</span>
      </div>
      <div class="fit-scale-bar">
        <div class="fit-bar-body" style="height: 90%; background: #566149;"></div>
        <span class="fit-bar-label">Balcony Railing<br>36"</span>
      </div>
      <div class="fit-scale-bar">
        <div class="fit-bar-body" style="height: 100%; background: #857262;"></div>
        <span class="fit-bar-label">Seated Human<br>~42"</span>
      </div>
    `;
  }
  document.getElementById('fit-footprint').textContent = dim.footprint ? `Footprint: Compact ${dim.footprint} — leaves ample walking room even on narrow 4-foot balconies.` : 'Compact footprint fits comfortably on standard 4ft Indian balconies.';

  // Update Sticky Mobile Bar
  updateStickyBar(product);

  // Open Modal
  document.getElementById('product-modal-backdrop').classList.add('open');
}

function closeProductModal() {
  document.getElementById('product-modal-backdrop').classList.remove('open');
}

function switchModalImage(imgSrc, thumbElem) {
  document.getElementById('modal-main-img').src = imgSrc;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  if (thumbElem) thumbElem.classList.add('active');
}

function updateModalQty(delta) {
  currentModalQty = Math.max(1, currentModalQty + delta);
  document.getElementById('modal-qty-display').textContent = currentModalQty;
}

// Update Mobile Sticky Action Bar
function updateStickyBar(product) {
  const stickyBar = document.getElementById('sticky-mobile-bar');
  if (!stickyBar) return;
  document.getElementById('sticky-product-name').textContent = product.name;
  document.getElementById('sticky-price').textContent = `₹${product.price.toLocaleString('en-IN')}`;
}

// ==========================================================================
// PIN Code Shipping Estimator (Real 6-digit calculation)
// ==========================================================================
async function checkPinCodeDelivery() {
  const pinInput = document.getElementById('pincode-input');
  const resultBox = document.getElementById('pincode-result');
  const pin = (pinInput.value || '').trim();

  if (!/^\d{6}$/.test(pin)) {
    resultBox.innerHTML = '<span style="color: #C62828;">⚠️ Please enter a valid 6-digit Indian PIN code.</span>';
    return;
  }

  resultBox.innerHTML = '<span style="color: var(--text-muted);">Checking carrier serviceability for ' + pin + '...</span>';

  try {
    const res = await fetch(`/api/pincode-check?pincode=${pin}`);
    const data = await res.json();
    if (data.valid) {
      resultBox.innerHTML = `
        <div style="background: rgba(86, 97, 73, 0.1); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(86, 97, 73, 0.2);">
          <strong style="color: #2E7D32;">✓ Delivery Serviceable to ${pin} (${data.zone})</strong><br>
          <span>⏱️ Estimated Delivery: <strong>${data.estimatedDelivery}</strong> via Surface Cargo</span><br>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Bulky freight: ₹${data.shippingRate} for 1st unit (₹150 for each additional)</span>
        </div>
      `;
    } else {
      resultBox.innerHTML = `<span style="color: #C62828;">${data.message || 'Unable to check PIN code.'}</span>`;
    }
  } catch (err) {
    // Fallback heuristic if offline
    resultBox.innerHTML = `
      <div style="background: rgba(86, 97, 73, 0.1); padding: 8px 12px; border-radius: 6px;">
        <strong style="color: #2E7D32;">✓ Estimated Delivery: 4–6 business days</strong><br>
        <span style="font-size: 0.75rem; color: var(--text-muted);">Dispatches directly from Muzaffarnagar, UP.</span>
      </div>
    `;
  }
}

// ==========================================================================
// Cart System & Calculations
// ==========================================================================
function quickAddToCart(productId) {
  const product = (storeState.products || []).find(p => p.id === productId);
  if (!product) return;
  addItemToCart(product, 1);
  showToast(`Added ${product.name} to basket!`);
}

function addCurrentModalToCart() {
  if (!activeProduct) return;
  addItemToCart(activeProduct, currentModalQty);
  closeProductModal();
  showToast(`Added ${currentModalQty} × ${activeProduct.name} to basket!`);
  openCartDrawer();
}

function buyCurrentModalNow() {
  if (!activeProduct) return;
  addItemToCart(activeProduct, currentModalQty);
  closeProductModal();
  openCheckoutModal();
}

function addItemToCart(product, quantity = 1) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || (product.images && product.images[0]) || 'assets/mudha-stool.jpg',
      quantity: quantity
    });
  }

  saveCart();
  updateCartUI();

  // Track AddToCart Analytics Event
  trackEvent('AddToCart', {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: quantity
  });
}

function updateCartItemQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }

  saveCart();
  updateCartUI();
}

function removeCartItem(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
  showToast('Item removed from basket');
}

function saveCart() {
  localStorage.setItem('mudhacraft_cart', JSON.stringify(cart));
}

function calculateCartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  let shipping = 0;
  if (totalUnits > 0) {
    const baseFreight = storeState.shipping?.base || 250;
    const additionalFreight = (totalUnits - 1) * (storeState.shipping?.perAdditionalUnit || 150);
    shipping = baseFreight + additionalFreight;

    // Free shipping threshold check
    if (storeState.shipping?.freeShippingThreshold && subtotal >= storeState.shipping.freeShippingThreshold) {
      shipping = 0;
    }
  }

  const grandTotal = subtotal + shipping;

  return { subtotal, totalUnits, shipping, grandTotal };
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(badge => {
    badge.textContent = totalCount;
  });

  const cartList = document.getElementById('cart-items-list');
  const cartEmpty = document.getElementById('cart-empty-state');
  const cartSummary = document.getElementById('cart-summary-box');

  if (!cartList) return;

  if (cart.length === 0) {
    cartEmpty.style.display = 'block';
    cartList.innerHTML = '';
    if (cartSummary) cartSummary.style.display = 'none';
    return;
  }

  cartEmpty.style.display = 'none';
  if (cartSummary) cartSummary.style.display = 'block';

  cartList.innerHTML = cart.map(item => `
    <div class="cart-item-row">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
        <div class="cart-item-qty">
          <button onclick="updateCartItemQty('${item.id}', -1)" aria-label="Decrease quantity">-</button>
          <span>${item.quantity}</span>
          <button onclick="updateCartItemQty('${item.id}', 1)" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <button class="cart-remove-btn" onclick="removeCartItem('${item.id}')" title="Remove" aria-label="Remove item">
        &times;
      </button>
    </div>
  `).join('');

  const totals = calculateCartTotals();
  document.getElementById('cart-subtotal').textContent = `₹${totals.subtotal.toLocaleString('en-IN')}`;
  document.getElementById('cart-shipping').textContent = totals.shipping === 0 ? 'FREE (Special Offer)' : `₹${totals.shipping.toLocaleString('en-IN')} (Bulky Cargo)`;
  document.getElementById('cart-total').textContent = `₹${totals.grandTotal.toLocaleString('en-IN')}`;
}

function openCartDrawer() {
  document.getElementById('cart-drawer-backdrop').classList.add('open');
}

function closeCartDrawer() {
  document.getElementById('cart-drawer-backdrop').classList.remove('open');
}

// ==========================================================================
// Checkout Flow & Indian Payment Methods
// ==========================================================================
function openCheckoutModal() {
  closeCartDrawer();
  const totals = calculateCartTotals();
  if (totals.totalUnits === 0) {
    showToast('Your basket is empty. Please add a Mudha first.');
    return;
  }

  // Populate checkout summary
  document.getElementById('checkout-items-count').textContent = `${totals.totalUnits} items`;
  document.getElementById('checkout-total-display').textContent = `₹${totals.grandTotal.toLocaleString('en-IN')}`;
  document.getElementById('checkout-step-1').style.display = 'block';
  document.getElementById('checkout-step-2').style.display = 'none';
  document.getElementById('checkout-confirmation').style.display = 'none';

  // Track BeginCheckout Analytics Event
  trackEvent('BeginCheckout', {
    itemsCount: totals.totalUnits,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    total: totals.grandTotal
  });

  document.getElementById('checkout-modal-backdrop').classList.add('open');
}

function closeCheckoutModal() {
  document.getElementById('checkout-modal-backdrop').classList.remove('open');
}

function proceedToPaymentStep(event) {
  if (event) event.preventDefault();

  const name = document.getElementById('checkout-name').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const pin = document.getElementById('checkout-pincode').value.trim();
  const address = document.getElementById('checkout-address').value.trim();
  const city = document.getElementById('checkout-city').value.trim();
  const state = document.getElementById('checkout-state').value.trim();

  if (!name || !phone || !pin || !address || !city || !state) {
    showToast('Please fill all required delivery address fields.');
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit Indian mobile number.');
    return;
  }

  if (!/^\d{6}$/.test(pin)) {
    showToast('Please enter a valid 6-digit Indian PIN code.');
    return;
  }

  document.getElementById('checkout-step-1').style.display = 'none';
  document.getElementById('checkout-step-2').style.display = 'block';
  document.getElementById('step-indicator-1').classList.remove('active');
  document.getElementById('step-indicator-2').classList.add('active');
}

function backToAddressStep() {
  document.getElementById('checkout-step-2').style.display = 'none';
  document.getElementById('checkout-step-1').style.display = 'block';
  document.getElementById('step-indicator-2').classList.remove('active');
  document.getElementById('step-indicator-1').classList.add('active');
}

async function placeOrder() {
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'UPI';
  const totals = calculateCartTotals();

  const customerData = {
    name: document.getElementById('checkout-name').value.trim(),
    phone: document.getElementById('checkout-phone').value.trim(),
    email: document.getElementById('checkout-email').value.trim(),
    pincode: document.getElementById('checkout-pincode').value.trim(),
    address: document.getElementById('checkout-address').value.trim(),
    city: document.getElementById('checkout-city').value.trim(),
    state: document.getElementById('checkout-state').value.trim(),
    landmark: document.getElementById('checkout-landmark').value.trim(),
  };

  const payload = {
    items: cart,
    total: totals.grandTotal,
    paymentMethod,
    shippingAddress: customerData,
    deliveryEstimate: '4–7 business days via Surface Freight'
  };

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      // Clear Cart
      cart = [];
      saveCart();
      updateCartUI();

      // Track Purchase Analytics Event
      trackEvent('Purchase', {
        orderId: data.orderId,
        total: totals.grandTotal,
        itemsCount: totals.totalUnits,
        paymentMethod
      });

      // Display Confirmation Screen
      document.getElementById('checkout-step-2').style.display = 'none';
      document.getElementById('checkout-confirmation').style.display = 'block';
      document.getElementById('confirmed-order-id').textContent = data.orderId;
      document.getElementById('confirmed-order-total').textContent = `₹${totals.grandTotal.toLocaleString('en-IN')}`;
      document.getElementById('confirmed-order-phone').textContent = customerData.phone;

      // WhatsApp Order Link
      const waMsg = encodeURIComponent(`Hello MudhaCraft, I have placed order ${data.orderId} for ₹${totals.grandTotal}. Looking forward to dispatch from Muzaffarnagar!`);
      const waLink = document.getElementById('btn-order-wa');
      if (waLink) {
        waLink.href = `https://wa.me/${storeState.whatsapp.replace(/[^0-9]/g, '')}?text=${waMsg}`;
      }
    }
  } catch (err) {
    showToast('Network error while placing order. Please retry.');
  }
}

// ==========================================================================
// Bulk B2B Inquiry Handling
// ==========================================================================
async function submitBulkInquiry(event) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    name: form.name.value,
    businessName: form.businessName.value,
    phone: form.phone.value,
    email: form.email.value,
    city: form.city.value,
    quantity: form.quantity.value,
    product: form.product.value,
    message: form.message.value
  };

  try {
    const res = await fetch('/api/bulk-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      // Track BulkInquiry Analytics Event
      trackEvent('BulkInquiry', {
        quantity: payload.quantity,
        product: payload.product,
        businessName: payload.businessName
      });

      form.reset();
      showToast('Bulk inquiry received! Our trade desk will contact you within 4 hours.');

      // Offer direct WhatsApp transfer
      const waMsg = encodeURIComponent(`Hello MudhaCraft Trade Desk, I just submitted Bulk Inquiry (${payload.quantity} units for ${payload.businessName || payload.name} in ${payload.city}). Please share your commercial trade pricing.`);
      window.open(`https://wa.me/${storeState.whatsapp.replace(/[^0-9]/g, '')}?text=${waMsg}`, '_blank');
    }
  } catch (err) {
    showToast('Failed to submit bulk inquiry. Please contact us on WhatsApp directly.');
  }
}

// ==========================================================================
// Transit Damage Claim Flow (With Photo Upload)
// ==========================================================================
function openTransitDamageModal() {
  document.getElementById('damage-modal-backdrop').classList.add('open');
}

function closeTransitDamageModal() {
  document.getElementById('damage-modal-backdrop').classList.remove('open');
}

async function submitDamageClaim(event) {
  event.preventDefault();
  const form = event.target;
  const orderId = form.orderId.value.trim();
  const phone = form.phone.value.trim();
  const description = form.description.value.trim();
  const photoInput = form.photos;

  if (photoInput.files.length === 0) {
    showToast('Please upload at least 1 photo showing the damaged area.');
    return;
  }

  const payload = {
    orderId,
    phone,
    description,
    photosCount: photoInput.files.length,
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch('/api/transit-damage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      form.reset();
      closeTransitDamageModal();
      showToast(`Replacement claim ${data.claimId} logged. Brand-new replacement dispatch initiated!`);
    }
  } catch (err) {
    showToast('Error lodging claim. Please WhatsApp our support directly.');
  }
}

// ==========================================================================
// Use Cases Interactive Showcase
// ==========================================================================
function renderUseCases() {
  const useCases = storeState.useCases || [];
  if (useCases.length === 0) return;

  const tabsNav = document.getElementById('use-nav-tabs');
  if (tabsNav) {
    tabsNav.innerHTML = useCases.map((uc, i) => `
      <button class="use-tab-btn ${i === 0 ? 'active' : ''}" onclick="selectUseCase('${uc.id}', this)">
        ${uc.title}
      </button>
    `).join('');
  }

  selectUseCase(useCases[0].id);
}

function selectUseCase(id, btnElem) {
  const useCase = (storeState.useCases || []).find(uc => uc.id === id);
  if (!useCase) return;

  if (btnElem) {
    document.querySelectorAll('.use-tab-btn').forEach(b => b.classList.remove('active'));
    btnElem.classList.add('active');
  }

  document.getElementById('use-panel-title').textContent = useCase.title;
  document.getElementById('use-panel-tagline').textContent = useCase.tagline;
  document.getElementById('use-panel-desc').textContent = useCase.description;
  const imgElem = document.getElementById('use-panel-img');
  if (imgElem) {
    imgElem.src = useCase.image;
    imgElem.alt = useCase.title;
  }
}

// ==========================================================================
// FAQs Accordion Rendering
// ==========================================================================
function renderFaqs() {
  const container = document.getElementById('faq-accordion');
  if (!container || !storeState.faqs) return;

  container.innerHTML = storeState.faqs.map((faq, index) => `
    <div class="faq-item" id="faq-item-${index}">
      <button class="faq-question-btn" onclick="toggleFaq(${index})">
        <span>${faq.q}</span>
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-answer">
        <p>${faq.a}</p>
      </div>
    </div>
  `).join('');
}

function toggleFaq(index) {
  const item = document.getElementById(`faq-item-${index}`);
  if (!item) return;
  const isActive = item.classList.contains('active');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
  if (!isActive) item.classList.add('active');
}

// ==========================================================================
// Policy Modals (Shipping, Returns, Privacy, Terms, Contact)
// ==========================================================================
function openPolicyModal(policyType) {
  const titles = {
    shipping: 'Shipping & Delivery Policy',
    returns: 'Returns & 100% Transit Damage Replacement Policy',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    contact: 'Contact Us & Maker Workshop Hub'
  };

  const contents = {
    shipping: `
      <h4>Surface Freight Logistics for Bulky Furniture</h4>
      <p>Because traditional bamboo Mudhas are bulky, structural seating items, they cannot be shipped via small air courier flyers. We partner with specialized national surface freight carriers who handle furniture transit with care.</p>
      <ul>
        <li><strong>Dispatch Hub:</strong> Direct from Muzaffarnagar maker cluster, Uttar Pradesh.</li>
        <li><strong>Transit Timeline:</strong> 4–7 business days for Delhi NCR, West, and Central India; 6–10 business days for South, East, and regional postal PIN codes.</li>
        <li><strong>Tracking:</strong> Complete real-time airway bill tracking is provided directly to your mobile number via WhatsApp upon carrier pickup.</li>
        <li><strong>Shipping Fee Economics:</strong> ₹250 base freight for the first unit, and ₹150 for each additional unit. Free shipping automatically applies on orders above ₹4,500.</li>
      </ul>
    `,
    returns: `
      <h4>100% Free Transit Replacement Guarantee</h4>
      <p>Traditional bamboo craft is resilient, but road transit can occasionally cause surface scrapes or breakage. We stand behind every piece that leaves our workshop.</p>
      <ul>
        <li><strong>Transit Damage Policy:</strong> If your Mudha arrives with transit damage, simply take 2–3 clear photographs of the damage and outer packaging within 48 hours of delivery.</li>
        <li><strong>Zero Return Hassle:</strong> You do NOT have to worry about repacking or shipping bulky furniture back to Uttar Pradesh. Upon reviewing your photos, we dispatch a brand-new replacement immediately at zero cost.</li>
      </ul>
      <button class="btn-primary" style="margin-top: 16px;" onclick="closePolicyModal(); openTransitDamageModal();">
        Submit Damage Photos for Replacement
      </button>
    `,
    privacy: `
      <h4>Customer Data Privacy</h4>
      <p>We respect your privacy and handle your information with strict confidentiality. We only collect the necessary customer details (Name, Delivery Address, Mobile Number, Email) needed to fulfill and track your order.</p>
      <p>We never sell or distribute your contact details to third-party marketing brokers. Payment processing is tokenized through PCI-DSS certified Indian payment gateways.</p>
    `,
    terms: `
      <h4>Terms of Service</h4>
      <p>MudhaCraft operates as an artisanal direct-sourcing brand. Natural variations in bamboo reed tint, cane weave tension, and slight measurement variances of ±1 inch are inherent characteristics of authentic Indian handcraft.</p>
      <p>All prices listed on the site are in Indian National Rupees (INR) and inclusive of applicable GST.</p>
    `,
    contact: `
      <h4>Get in Touch with MudhaCraft</h4>
      <p>Have questions about dimensions, balcony placement, custom sets, or café orders? We are here to help.</p>
      <div style="background: var(--bg-primary); padding: 16px; border-radius: 8px; margin-top: 12px;">
        <p><strong>WhatsApp Support:</strong> ${storeState.whatsapp || '+91 98765 43210'}</p>
        <p><strong>Email:</strong> ${storeState.email || 'namaste@mudhacraft.in'}</p>
        <p><strong>Maker Sourcing Cluster:</strong> Muzaffarnagar Industrial Hub, Uttar Pradesh 251001, India</p>
        <p><strong>Operating Hours:</strong> Monday – Saturday, 9:00 AM – 7:00 PM IST</p>
      </div>
    `
  };

  document.getElementById('policy-modal-title').textContent = titles[policyType] || 'Policy';
  document.getElementById('policy-modal-body').innerHTML = contents[policyType] || '<p>Content awaiting update.</p>';
  document.getElementById('policy-modal-backdrop').classList.add('open');
}

function closePolicyModal() {
  document.getElementById('policy-modal-backdrop').classList.remove('open');
}

// ==========================================================================
// Admin / Owner Control Panel (Client + Server Sync)
// ==========================================================================
function openAdminModal() {
  document.getElementById('admin-modal-backdrop').classList.add('open');
  populateAdminForm();
}

function closeAdminModal() {
  document.getElementById('admin-modal-backdrop').classList.remove('open');
}

function populateAdminForm() {
  const container = document.getElementById('admin-products-list');
  if (!container || !storeState.products) return;

  container.innerHTML = storeState.products.map(p => `
    <div style="border: 1px solid var(--border-light); padding: 12px; border-radius: 8px; margin-bottom: 10px; background: #FFF;">
      <strong>${p.name}</strong> (${p.id})
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;">
        <div>
          <label style="font-size: 0.75rem;">Price (₹)</label>
          <input type="number" id="admin-price-${p.id}" value="${p.price}" style="width: 100%; border: 1px solid #CCC; padding: 6px; border-radius: 4px;">
        </div>
        <div>
          <label style="font-size: 0.75rem;">Stock Status</label>
          <select id="admin-stock-${p.id}" style="width: 100%; border: 1px solid #CCC; padding: 6px; border-radius: 4px;">
            <option value="available" ${p.stock === 'available' ? 'selected' : ''}>In Stock</option>
            <option value="enquiry" ${p.stock === 'enquiry' ? 'selected' : ''}>Enquiry Only</option>
            <option value="soldout" ${p.stock === 'soldout' ? 'selected' : ''}>Sold Out</option>
          </select>
        </div>
      </div>
    </div>
  `).join('');

  document.getElementById('admin-shipping-base').value = storeState.shipping?.base || 250;
  document.getElementById('admin-shipping-add').value = storeState.shipping?.perAdditionalUnit || 150;
  document.getElementById('admin-cod-toggle').checked = !!storeState.codEnabled;
}

async function saveAdminChanges() {
  (storeState.products || []).forEach(p => {
    const priceInput = document.getElementById(`admin-price-${p.id}`);
    const stockSelect = document.getElementById(`admin-stock-${p.id}`);
    if (priceInput) p.price = parseInt(priceInput.value, 10) || p.price;
    if (stockSelect) p.stock = stockSelect.value;
  });

  const baseShip = parseInt(document.getElementById('admin-shipping-base').value, 10) || 250;
  const addShip = parseInt(document.getElementById('admin-shipping-add').value, 10) || 150;
  const codVal = document.getElementById('admin-cod-toggle').checked;

  storeState.shipping.base = baseShip;
  storeState.shipping.perAdditionalUnit = addShip;
  storeState.codEnabled = codVal;

  // Persist locally
  localStorage.setItem('mudhacraft_admin_store', JSON.stringify(storeState));

  // Try pushing to server
  try {
    await fetch('/api/admin/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeState)
    });
  } catch (err) {
    console.warn('Could not sync to server filesystem, local storage saved');
  }

  closeAdminModal();
  renderProducts();
  updateCartUI();
  showToast('Store settings updated successfully!');
}

// ==========================================================================
// WhatsApp Direct Support & Analytics Helpers
// ==========================================================================
function openWhatsAppChat(customMessage = '') {
  trackEvent('WhatsAppClick', { source: customMessage ? 'ProductContext' : 'FloatingButton' });
  const text = customMessage || 'Hello MudhaCraft, I am interested in your traditional bamboo Mudhas from Uttar Pradesh.';
  const url = `https://wa.me/${storeState.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function initAnalytics() {
  console.log('✅ MudhaCraft Analytics engine initialized (GA4, Meta Pixel, Ads hooks active)');
}

function setupEventListeners() {
  // Shortcut for admin panel (Ctrl + Shift + A)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      openAdminModal();
    }
  });
}
