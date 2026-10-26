/**
 * MuddaCraft Studio - E-commerce Storefront Application
 * Traditional Indian Craftsmanship for Modern Homes
 * Supplier: A to Z Mudda House, Muzaffarnagar, Uttar Pradesh
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
let cart = JSON.parse(localStorage.getItem('muddacraft_cart') || localStorage.getItem('mudhacraft_cart') || '[]');
let activeProduct = null;
let currentModalQty = 1;

// ==========================================================================
// Analytics Event Dispatcher (GA4, Meta Pixel, Google Ads)
// ==========================================================================
function trackEvent(eventName, payload = {}) {
  const timestamp = new Date().toISOString();
  console.log(`📊 [Analytics Event] ${eventName}:`, payload, `@ ${timestamp}`);

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, payload);
  }
  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', eventName, payload);
  }
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
      return;
    }
  } catch (err) {
    // try static fallback below
  }

  try {
    const res = await fetch('data/store.json');
    if (res.ok) {
      const data = await res.json();
      storeState = data;
    }
  } catch (err) {
    console.warn('API store load failed, using fallback bundled state', err);
  }
}

// ==========================================================================
// Product Collection Rendering & Filtering (7 Categories)
// ==========================================================================
// State for card cushion toggles
const cardCushionStates = {};

function toggleCardCushion(productId, checked) {
  cardCushionStates[productId] = checked;
  const product = (storeState.products || []).find(p => p.id === productId);
  if (!product) return;
  
  const basePrice = product.price || 0;
  const extra = product.cushionCost || 0;
  const finalPrice = basePrice + (checked ? extra : 0);

  const priceElem = document.getElementById(`card-price-${productId}`);
  if (priceElem) {
    priceElem.textContent = `₹${finalPrice.toLocaleString('en-IN')}`;
  }

  const noteElem = document.getElementById(`card-note-${productId}`);
  if (noteElem) {
    if (checked && extra > 0) {
      noteElem.innerHTML = `<span style="color: var(--bamboo-base); font-weight: 700;">✓ Includes Cushions (+₹${extra.toLocaleString('en-IN')})</span>`;
    } else {
      noteElem.textContent = product.cushionNote || '';
    }
  }

  const linkElem = document.getElementById(`card-link-${productId}`);
  if (linkElem) {
    linkElem.href = `product.html?id=${productId}${checked ? '&cushion=1' : ''}`;
  }
}

function renderProducts(filter = 'All Products') {
  const grid = document.getElementById('products-grid');
  if (!grid || !storeState.products) return;

  const products = storeState.products.filter(p => {
    if (!filter || filter === 'all' || filter === 'All Products') return true;
    return (p.filterCategory || p.category || '').toLowerCase() === filter.toLowerCase();
  });

  // Sort by order if present
  products.sort((a, b) => (a.order || 99) - (b.order || 99));

  grid.innerHTML = products.map(product => {
    const primaryImg = product.image || (product.images && product.images[0]) || 'assets/products/placeholder-cane.svg';
    const hasConfirmedPrice = product.price !== null && product.price !== undefined && product.priceConfirmed;
    const isToggled = !!cardCushionStates[product.id];
    const displayPrice = product.price ? (product.price + (isToggled ? (product.cushionCost || 0) : 0)) : null;
    const priceHtml = hasConfirmedPrice
      ? `<span class="product-price" id="card-price-${product.id}">₹${displayPrice.toLocaleString('en-IN')}</span>`
      : `<span class="product-price" style="font-size: 1.15rem; color: var(--mudda-terracotta);">Price on Request</span>`;
    
    // Wireframe 02: One concise sentence describing material, use, or key benefit
    const shortBenefit = product.description 
      ? product.description.split('.')[0] + '.' 
      : 'Handwoven with natural riverbank reeds and seasoned bamboo.';

    const kickerText = product.filterCategory || product.category || 'Handcrafted Mudda';

    return `
      <article class="product-card" data-product-id="${product.id}">
        <div class="product-image-wrap" onclick="window.location.href='product.html?id=${product.id}'">
          <img src="${primaryImg}" alt="${product.name}" loading="lazy">
          <span class="product-badge-tag">${kickerText}</span>
          ${hasConfirmedPrice ? `
            <button type="button" class="card-quick-add-btn" onclick="event.stopPropagation(); quickAddToCart('${product.id}')" title="Quick Add to Basket" aria-label="Add to cart">
              +
            </button>
          ` : ''}
        </div>
        <div class="product-card-body">
          <div class="product-card-meta-top">
            <span class="product-card-kicker">MUZAFFARNAGAR CRAFT</span>
            <h3 class="product-name">
              <a href="product.html?id=${product.id}">${product.name}</a>
            </h3>
          </div>

          <div class="product-price-row">
            <div class="product-price-wrapper">
              ${priceHtml}
              <span class="product-card-freight-note">Free Shipping > ₹4,500</span>
            </div>
          </div>

          <p class="product-card-desc">${shortBenefit}</p>

          <div class="product-card-tags">
            <span class="product-tag-pill">🌿 River Cane & Bamboo</span>
            <span class="product-tag-pill">📦 Zero Assembly</span>
            ${product.cushionCost ? `<span class="product-tag-pill">🛋️ Cushion Option (+₹${product.cushionCost})</span>` : ''}
          </div>

          <div class="product-card-action-wrap">
            <a href="product.html?id=${product.id}" id="card-link-${product.id}" class="btn-card-primary">
              <span>Explore Piece & Options</span>
              <span class="btn-card-arrow">→</span>
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function filterProducts(category, btnElement) {
  document.querySelectorAll('.collection-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  renderProducts(category);
}

// Helper: Open WhatsApp with exact product context
function openProductWhatsApp(productName, price) {
  const priceInfo = price ? ` (₹${Number(price).toLocaleString('en-IN')})` : '';
  const msg = `Hello MuddaCraft, I'm interested in ordering ${productName}${priceInfo} sourced from Muzaffarnagar. Could you please share delivery details?`;
  trackEvent('WhatsAppClick', { source: 'ProductCard', product: productName });
  const num = (storeState.whatsapp || '+919876543210').replace(/[^0-9]/g, '');
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
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
        <div style="background: rgba(86, 97, 73, 0.1); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(86, 97, 73, 0.2); margin-top: 6px;">
          <strong style="color: #2E7D32;">✓ Serviceable to ${pin} (${data.zone})</strong><br>
          <span>⏱️ Estimated Delivery: <strong>${data.estimatedDelivery}</strong> via Surface Cargo</span><br>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Dispatches directly from A to Z Mudda House, Muzaffarnagar.</span>
        </div>
      `;
    } else {
      resultBox.innerHTML = `<span style="color: #C62828;">${data.message || 'Unable to check PIN code.'}</span>`;
    }
  } catch (err) {
    resultBox.innerHTML = `
      <div style="background: rgba(86, 97, 73, 0.1); padding: 8px 12px; border-radius: 6px; margin-top: 6px;">
        <strong style="color: #2E7D32;">✓ Estimated Delivery: 4–6 business days</strong><br>
        <span style="font-size: 0.75rem; color: var(--text-muted);">Dispatches directly from Muzaffarnagar, UP.</span>
      </div>
    `;
  }
}

// ==========================================================================
// Cart System & Calculations (Preserves Existing Functionality)
// ==========================================================================
function quickAddToCart(productId) {
  const product = (storeState.products || []).find(p => p.id === productId);
  if (!product) return;
  if (!product.price || !product.priceConfirmed) {
    openProductWhatsApp(product.name, product.price);
    return;
  }
  const isCushion = !!cardCushionStates[productId];
  const finalPrice = product.price + (isCushion ? (product.cushionCost || 0) : 0);
  const configuredItem = {
    ...product,
    id: isCushion ? `${product.id}-with-cushion` : product.id,
    name: isCushion ? `${product.name} (With Cushions)` : product.name,
    price: finalPrice
  };
  addItemToCart(configuredItem, 1);
  showToast(`Added ${configuredItem.name} to basket!`);
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
      image: product.image || (product.images && product.images[0]) || 'assets/products/placeholder-cane.svg',
      quantity: quantity
    });
  }

  saveCart();
  updateCartUI();

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
  localStorage.setItem('muddacraft_cart', JSON.stringify(cart));
}

function calculateCartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  let shipping = 0;
  if (totalUnits > 0) {
    const baseFreight = storeState.shipping?.base || 250;
    const additionalFreight = (totalUnits - 1) * (storeState.shipping?.perAdditionalUnit || 150);
    shipping = baseFreight + additionalFreight;

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
  if (document.getElementById('cart-subtotal')) document.getElementById('cart-subtotal').textContent = `₹${totals.subtotal.toLocaleString('en-IN')}`;
  if (document.getElementById('cart-shipping')) document.getElementById('cart-shipping').textContent = totals.shipping === 0 ? 'FREE (Special Offer)' : `₹${totals.shipping.toLocaleString('en-IN')} (Bulky Cargo)`;
  if (document.getElementById('cart-total')) document.getElementById('cart-total').textContent = `₹${totals.grandTotal.toLocaleString('en-IN')}`;
}

function openCartDrawer() {
  updateCartUI();
  const drawer = document.getElementById('cart-drawer-backdrop');
  if (drawer) drawer.classList.add('open');
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer-backdrop');
  if (drawer) drawer.classList.remove('open');
}

function toggleMobileNav(forceState) {
  const backdrop = document.getElementById('mobile-nav-backdrop');
  if (!backdrop) return;
  if (typeof forceState === 'boolean') {
    if (forceState) backdrop.classList.add('open');
    else backdrop.classList.remove('open');
  } else {
    backdrop.classList.toggle('open');
  }
}
window.toggleMobileNav = toggleMobileNav;


// ==========================================================================
// Checkout Flow
// ==========================================================================
function openCheckoutModal() {
  closeCartDrawer();
  const totals = calculateCartTotals();
  if (totals.totalUnits === 0) {
    showToast('Your basket is empty. Please add a product first.');
    return;
  }

  const checkoutModal = document.getElementById('checkout-modal-backdrop');
  if (!checkoutModal) return;

  const itemsCountElem = document.getElementById('checkout-items-count');
  if (itemsCountElem) itemsCountElem.textContent = `${totals.totalUnits} items`;

  const totalDisplayElem = document.getElementById('checkout-total-display');
  if (totalDisplayElem) totalDisplayElem.textContent = `₹${totals.grandTotal.toLocaleString('en-IN')}`;

  const step1 = document.getElementById('checkout-step-1');
  if (step1) step1.style.display = 'block';

  const step2 = document.getElementById('checkout-step-2');
  if (step2) step2.style.display = 'none';

  const confirmation = document.getElementById('checkout-confirmation');
  if (confirmation) confirmation.style.display = 'none';

  const payBtn = document.getElementById('btn-place-order');
  if (payBtn) {
    payBtn.innerHTML = `Pay ₹${totals.grandTotal.toLocaleString('en-IN')} with Razorpay 🔒`;
    payBtn.disabled = false;
  }

  trackEvent('BeginCheckout', {
    itemsCount: totals.totalUnits,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    total: totals.grandTotal
  });

  checkoutModal.classList.add('open');
}

function closeCheckoutModal() {
  const checkoutModal = document.getElementById('checkout-modal-backdrop');
  if (checkoutModal) checkoutModal.classList.remove('open');
}

function proceedToPaymentStep(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('checkout-name').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const pin = document.getElementById('checkout-pincode').value.trim();
  const address = document.getElementById('checkout-address').value.trim();

  if (!name || !phone || !pin || !address) {
    showToast('Please fill all required delivery address fields.');
    return;
  }

  const totals = calculateCartTotals();
  const payBtn = document.getElementById('btn-place-order');
  if (payBtn) {
    payBtn.innerHTML = `Pay ₹${totals.grandTotal.toLocaleString('en-IN')} with Razorpay 🔒`;
    payBtn.disabled = false;
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

// ==========================================================================
// Razorpay Standard Web Checkout Integration
// ==========================================================================
async function payWithRazorpay(simulate = false) {
  const totals = calculateCartTotals();
  if (totals.totalUnits === 0 || totals.grandTotal <= 0) {
    showToast('Your basket is empty. Please add a product first.');
    return;
  }

  const customerData = {
    name: document.getElementById('checkout-name')?.value.trim() || '',
    phone: document.getElementById('checkout-phone')?.value.trim() || '',
    email: document.getElementById('checkout-email')?.value.trim() || '',
    pincode: document.getElementById('checkout-pincode')?.value.trim() || '',
    address: document.getElementById('checkout-address')?.value.trim() || '',
    city: document.getElementById('checkout-city')?.value.trim() || '',
    state: document.getElementById('checkout-state')?.value.trim() || '',
  };

  if (!customerData.name || !customerData.phone || !customerData.pincode || !customerData.address) {
    showToast('Please fill in all required delivery address fields.');
    backToAddressStep();
    return;
  }

  const payBtn = document.getElementById('btn-place-order');
  const originalBtnHtml = `Pay ₹${totals.grandTotal.toLocaleString('en-IN')} with Razorpay 🔒`;

  if (payBtn) {
    payBtn.disabled = true;
    payBtn.innerHTML = '<span>⏳ Preparing Secure Checkout...</span>';
  }

  const resetPayButton = () => {
    if (payBtn) {
      payBtn.disabled = false;
      payBtn.innerHTML = originalBtnHtml;
    }
  };

  try {
    // Step 1: Backend - Create Order on Razorpay
    const amountInPaise = Math.round(totals.grandTotal * 100);
    if (amountInPaise < 100) {
      throw new Error('Order amount must be at least ₹1.00 (100 paise)');
    }

    const orderRes = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: 'rcpt_' + Date.now().toString().slice(-8),
        simulate: !!simulate,
        notes: {
          customer_name: customerData.name,
          customer_phone: customerData.phone,
          pincode: customerData.pincode,
          items_count: totals.totalUnits
        }
      })
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData.order_id) {
      const errObj = new Error(orderData.error || 'Failed to initialize Razorpay order');
      errObj.isAuthError = !!orderData.isAuthError;
      throw errObj;
    }

    // Handle simulated test payment (if simulation requested)
    if (orderData.simulated) {
      showToast('⚡ Running Razorpay Sandbox Simulation...');
      if (payBtn) payBtn.innerHTML = '<span>⏳ Processing Simulated Payment...</span>';

      setTimeout(async () => {
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: orderData.order_id,
              razorpay_payment_id: `pay_sim_${Date.now().toString().slice(-8)}`,
              razorpay_signature: 'simulated_test_signature',
              customerData,
              items: cart,
              total: totals.grandTotal,
              simulated: true
            })
          });

          const verifyData = await verifyRes.json();

          if (verifyRes.ok && verifyData.success) {
            cart = [];
            saveCart();
            updateCartUI();

            document.getElementById('checkout-step-2').style.display = 'none';
            document.getElementById('checkout-confirmation').style.display = 'block';
            document.getElementById('confirmed-order-id').textContent = verifyData.orderId;
            document.getElementById('confirmed-order-total').textContent = `₹${totals.grandTotal.toLocaleString('en-IN')}`;
            document.getElementById('confirmed-order-phone').textContent = customerData.phone;

            const paymentIdDisplay = document.getElementById('confirmed-payment-id');
            if (paymentIdDisplay) paymentIdDisplay.textContent = verifyData.razorpay_payment_id + ' (Demo)';

            const waMsg = encodeURIComponent(
              `Hello MuddaCraft, I have completed payment (${verifyData.razorpay_payment_id}) for order ${verifyData.orderId} (₹${totals.grandTotal}). Looking forward to dispatch from Muzaffarnagar!`
            );
            const waLink = document.getElementById('btn-order-wa');
            if (waLink) {
              waLink.href = `https://wa.me/${storeState.whatsapp.replace(/[^0-9]/g, '')}?text=${waMsg}`;
            }

            showToast('✅ Test order placed & verified successfully!');
          }
        } catch (simErr) {
          showToast('Simulation error. Please retry.');
          resetPayButton();
        }
      }, 800);
      return;
    }

    // Verify Razorpay SDK is present
    if (typeof Razorpay === 'undefined') {
      throw new Error('Razorpay Checkout SDK is not available. Please verify network connectivity.');
    }

    // Step 2: Frontend - Open Razorpay Modal
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'MuddaCraft Studio',
      description: `Bulky Surface Delivery (${totals.totalUnits} items) • Muzaffarnagar Hub`,
      image: '/assets/products/placeholder-cane.svg',
      order_id: orderData.order_id,
      prefill: {
        name: customerData.name,
        email: customerData.email,
        contact: customerData.phone
      },
      notes: {
        shipping_pincode: customerData.pincode,
        shipping_city: customerData.city,
        shipping_state: customerData.state
      },
      theme: {
        color: '#A07238' // MuddaCraft signature bamboo-base tone
      },
      modal: {
        ondismiss: function () {
          showToast('Payment window cancelled. You can retry whenever ready.');
          resetPayButton();
        }
      },
      handler: async function (paymentResponse) {
        // Step 3: Backend - Verify Payment Signature
        try {
          if (payBtn) {
            payBtn.innerHTML = '<span>🔒 Verifying Payment Signature...</span>';
          }

          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              customerData,
              items: cart,
              total: totals.grandTotal
            })
          });

          const verifyData = await verifyRes.json();

          if (verifyRes.ok && verifyData.success) {
            const confirmedOrderId = verifyData.orderId || ('MUDDA-' + Math.floor(100000 + Math.random() * 900000));

            // Clear basket upon verified payment
            cart = [];
            saveCart();
            updateCartUI();

            trackEvent('Purchase', {
              orderId: confirmedOrderId,
              paymentId: paymentResponse.razorpay_payment_id,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              total: totals.grandTotal,
              itemsCount: totals.totalUnits,
              paymentMethod: 'Razorpay'
            });

            // Transition to Step 3 Confirmation Screen
            document.getElementById('checkout-step-2').style.display = 'none';
            document.getElementById('checkout-confirmation').style.display = 'block';
            document.getElementById('confirmed-order-id').textContent = confirmedOrderId;
            document.getElementById('confirmed-order-total').textContent = `₹${totals.grandTotal.toLocaleString('en-IN')}`;
            document.getElementById('confirmed-order-phone').textContent = customerData.phone;

            const paymentIdDisplay = document.getElementById('confirmed-payment-id');
            if (paymentIdDisplay) {
              paymentIdDisplay.textContent = paymentResponse.razorpay_payment_id;
            }

            const waMsg = encodeURIComponent(
              `Hello MuddaCraft, I have completed payment (${paymentResponse.razorpay_payment_id}) for order ${confirmedOrderId} (₹${totals.grandTotal}). Looking forward to dispatch from Muzaffarnagar!`
            );
            const waLink = document.getElementById('btn-order-wa');
            if (waLink) {
              waLink.href = `https://wa.me/${storeState.whatsapp.replace(/[^0-9]/g, '')}?text=${waMsg}`;
            }

            showToast('Payment successful! Your order has been placed.');
          } else {
            showToast('Payment verification failed: ' + (verifyData.error || 'Signature mismatch. Payment not verified.'));
            resetPayButton();
          }
        } catch (verifyErr) {
          console.error('Signature verification call failed:', verifyErr);
          showToast('Payment verification failed due to network error. Please contact support.');
          resetPayButton();
        }
      }
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', function (failureResponse) {
      console.error('Razorpay payment failed:', failureResponse.error);
      const desc = failureResponse.error?.description || failureResponse.error?.reason || 'Transaction could not be completed';
      showToast(`Payment Failed: ${desc}`);
      resetPayButton();
    });

    rzp.open();
  } catch (err) {
    console.error('Razorpay checkout error:', err);
    showToast(err.message || 'Error initializing secure payment. Please retry.');
    resetPayButton();
  }
}

// Backward-compatible alias
const placeOrder = payWithRazorpay;

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
      trackEvent('BulkInquiry', {
        quantity: payload.quantity,
        product: payload.product,
        businessName: payload.businessName
      });

      form.reset();
      showToast('Bulk inquiry received! Our trade desk will contact you within 4 hours.');

      const waMsg = encodeURIComponent(`Hello MuddaCraft Trade Desk, I just submitted Bulk Inquiry (${payload.quantity} units for ${payload.businessName || payload.name} in ${payload.city}). Please share your commercial trade pricing.`);
      window.open(`https://wa.me/${storeState.whatsapp.replace(/[^0-9]/g, '')}?text=${waMsg}`, '_blank');
    }
  } catch (err) {
    showToast('Failed to submit bulk inquiry. Please contact us on WhatsApp directly.');
  }
}

// ==========================================================================
// Transit Damage Claim Flow
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

  const titleEl = document.getElementById('use-panel-title');
  if (titleEl) titleEl.textContent = useCase.title;
  const tagEl = document.getElementById('use-panel-tagline');
  if (tagEl) tagEl.textContent = useCase.tagline;
  const descEl = document.getElementById('use-panel-desc');
  if (descEl) descEl.textContent = useCase.description;
  const imgElem = document.getElementById('use-panel-img');
  if (imgElem) {
    imgElem.src = useCase.image;
    imgElem.alt = useCase.title;
  }

  const ctaBtn = document.getElementById('category-landing-cta');
  if (ctaBtn) {
    ctaBtn.onclick = (e) => {
      e.preventDefault();
      let targetCat = 'All Products';
      if (id === 'balcony') targetCat = 'Balcony Sets';
      else if (id === 'terrace') targetCat = 'Classic Muddas';
      else if (id === 'garden') targetCat = 'Cane Chairs';
      else if (id === 'cafe') targetCat = 'Sofa Sets';
      else if (id === 'resort') targetCat = 'Daybeds';
      
      const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
      const matchingBtn = filterBtns.find(b => b.textContent.trim().toLowerCase().includes(targetCat.toLowerCase())) || filterBtns[0];
      filterProducts(targetCat, matchingBtn);
      const collEl = document.getElementById('collection');
      if (collEl) collEl.scrollIntoView({ behavior: 'smooth' });
    };
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
// Policy Modals
// ==========================================================================
function openPolicyModal(policyType) {
  const titles = {
    shipping: 'Shipping & Delivery Policy',
    returns: 'Returns & 100% Transit Damage Replacement Policy',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    contact: 'Contact Us & Workshop Hub'
  };

  const contents = {
    shipping: `
      <h4>Surface Freight Logistics for Bulky Furniture</h4>
      <p>Because traditional bamboo Muddas and cane sets are bulky, structural seating items, they cannot be shipped via small air courier flyers. We partner with specialized national surface freight carriers who handle furniture transit with care.</p>
      <ul>
        <li><strong>Dispatch Hub:</strong> Direct from A to Z Mudda House, Muzaffarnagar, Uttar Pradesh.</li>
        <li><strong>Transit Timeline:</strong> 4–7 business days for Delhi NCR, West, and Central India; 6–10 business days for South, East, and regional postal PIN codes.</li>
        <li><strong>Tracking:</strong> Complete real-time airway bill tracking is provided directly to your mobile number via WhatsApp upon carrier pickup.</li>
        <li><strong>Shipping Fee Economics:</strong> ₹250 base freight for the first unit, and ₹150 for each additional unit. Free shipping automatically applies on orders above ₹4,500.</li>
      </ul>
    `,
    returns: `
      <h4>100% Free Transit Replacement Guarantee</h4>
      <p>Traditional cane craft is resilient, but road transit can occasionally cause surface scrapes or breakage. We stand behind every piece that leaves our workshop.</p>
      <ul>
        <li><strong>Transit Damage Policy:</strong> If your Mudda arrives with transit damage, simply take 2–3 clear photographs of the damage and outer packaging within 48 hours of delivery.</li>
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
      <p>MuddaCraft operates as an artisanal direct-sourcing brand in partnership with A to Z Mudda House, Muzaffarnagar. Natural variations in bamboo reed tint, cane weave tension, and slight measurement variances are inherent characteristics of authentic Indian handcraft.</p>
    `,
    contact: `
      <h4>Get in Touch with MuddaCraft</h4>
      <p>Have questions about dimensions, balcony placement, custom sets, or café orders? We are here to help.</p>
      <div style="background: var(--bg-primary); padding: 16px; border-radius: 8px; margin-top: 12px;">
        <p><strong>WhatsApp Support:</strong> ${storeState.whatsapp || '+91 98765 43210'}</p>
        <p><strong>Email:</strong> ${storeState.email || 'namaste@muddacraft.in'}</p>
        <p><strong>Supplier Workshop Hub:</strong> A to Z Mudda House, Muzaffarnagar, Uttar Pradesh 251001, India</p>
        <p><strong>Operating Hours:</strong> Monday – Saturday, 9:00 AM – 7:00 PM IST</p>
      </div>
    `
  };

  const titleEl = document.getElementById('policy-modal-title');
  if (titleEl) titleEl.textContent = titles[policyType] || 'Policy';
  const bodyEl = document.getElementById('policy-modal-body');
  if (bodyEl) bodyEl.innerHTML = contents[policyType] || '<p>Content awaiting update.</p>';
  const backdrop = document.getElementById('policy-modal-backdrop');
  if (backdrop) backdrop.classList.add('open');
}

function closePolicyModal() {
  const backdrop = document.getElementById('policy-modal-backdrop');
  if (backdrop) backdrop.classList.remove('open');
}

// ==========================================================================
// Maker Story Modal (Wireframe 08)
// ==========================================================================
function openStoryModal() {
  const modal = document.getElementById('story-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeStoryModal() {
  const modal = document.getElementById('story-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ==========================================================================
// Product Management System (CMS) - Uploads, CRUD, Reorder
// ==========================================================================
function openAdminModal() {
  const backdrop = document.getElementById('admin-modal-backdrop');
  if (backdrop) backdrop.classList.add('open');
  switchAdminTab('products');
}

function closeAdminModal() {
  const backdrop = document.getElementById('admin-modal-backdrop');
  if (backdrop) backdrop.classList.remove('open');
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`admin-tab-${tabName}`);
  if (activeBtn) activeBtn.classList.add('active');

  const prodSection = document.getElementById('admin-section-products');
  const addSection = document.getElementById('admin-section-add');
  const shipSection = document.getElementById('admin-section-shipping');

  if (prodSection) prodSection.style.display = tabName === 'products' ? 'block' : 'none';
  if (addSection) addSection.style.display = tabName === 'add' ? 'block' : 'none';
  if (shipSection) shipSection.style.display = tabName === 'shipping' ? 'block' : 'none';

  if (tabName === 'products') populateAdminProductsList();
  if (tabName === 'shipping') populateAdminShippingForm();
}

function populateAdminProductsList() {
  const container = document.getElementById('admin-products-list');
  if (!container || !storeState.products) return;

  const prods = [...storeState.products].sort((a, b) => (a.order || 99) - (b.order || 99));

  container.innerHTML = prods.map((p, index) => `
    <div class="admin-product-row" style="display: flex; gap: 14px; align-items: center; border: 1px solid var(--border-light); padding: 12px; border-radius: 8px; margin-bottom: 12px; background: #FFF;">
      <img src="${p.image}" alt="${p.name}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 6px; background: var(--bg-secondary); flex-shrink: 0;">
      
      <div style="flex-grow: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong style="font-size: 0.9375rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</strong>
          <span style="font-size: 0.6875rem; background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px;">${p.category}</span>
        </div>
        <div style="display: flex; gap: 14px; margin-top: 6px; font-size: 0.8125rem; color: var(--text-muted);">
          <span>Price: <strong>${p.price ? '₹' + p.price : 'Price on Request'}</strong></span>
          <span>Status: <strong style="color: ${p.stock === 'available' ? '#2E7D32' : '#C62828'};">${p.stock}</strong></span>
        </div>
      </div>

      <div style="display: flex; gap: 6px; flex-shrink: 0;">
        <button type="button" onclick="moveProductOrder('${p.id}', -1)" title="Move Up" style="padding: 6px 8px; border: 1px solid #DDD; border-radius: 4px; font-size: 0.75rem;">⬆️</button>
        <button type="button" onclick="moveProductOrder('${p.id}', 1)" title="Move Down" style="padding: 6px 8px; border: 1px solid #DDD; border-radius: 4px; font-size: 0.75rem;">⬇️</button>
        <button type="button" onclick="openEditProductModal('${p.id}')" title="Edit Product" style="padding: 6px 10px; background: var(--bamboo-base); color: #FFF; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Edit</button>
        <button type="button" onclick="deleteProduct('${p.id}')" title="Delete" style="padding: 6px 8px; background: #DC3545; color: #FFF; border-radius: 4px; font-size: 0.75rem;">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function moveProductOrder(productId, direction) {
  const prods = [...storeState.products].sort((a, b) => (a.order || 99) - (b.order || 99));
  const idx = prods.findIndex(p => p.id === productId);
  if (idx === -1) return;
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= prods.length) return;

  const temp = prods[idx];
  prods[idx] = prods[targetIdx];
  prods[targetIdx] = temp;

  const orderedIds = prods.map(p => p.id);
  try {
    const res = await fetch('/api/admin/products/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds })
    });
    const data = await res.json();
    if (data.success) {
      storeState.products = data.products;
      populateAdminProductsList();
      renderProducts();
      showToast('Product order updated!');
    }
  } catch (err) {
    showToast('Failed to update product order');
  }
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to remove this product from the catalogue?')) return;

  try {
    const res = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId })
    });
    const data = await res.json();
    if (data.success) {
      storeState.products = storeState.products.filter(p => p.id !== productId);
      populateAdminProductsList();
      renderProducts();
      showToast('Product removed');
    }
  } catch (err) {
    showToast('Failed to delete product');
  }
}

// Upload helper for adding or editing product photo
async function uploadProductPhotoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            base64Data: reader.result
          })
        });
        const data = await res.json();
        if (data.success) {
          resolve(data.url);
        } else {
          reject(new Error(data.error || 'Upload failed'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Add New Product Form Submission
async function submitAddNewProduct(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving & Uploading...';

  try {
    let imageUrl = 'assets/products/placeholder-cane.svg';
    const fileInput = document.getElementById('new-prod-photo');
    if (fileInput.files.length > 0) {
      imageUrl = await uploadProductPhotoFile(fileInput.files[0]);
    }

    const priceVal = form.price.value.trim();
    const payload = {
      name: form.name.value.trim(),
      category: form.category.value,
      filterCategory: form.category.value,
      price: priceVal ? parseInt(priceVal, 10) : null,
      priceConfirmed: !!priceVal,
      description: form.description.value.trim(),
      supplier: 'A to Z Mudda House, Muzaffarnagar, Uttar Pradesh',
      image: imageUrl,
      images: [imageUrl],
      stock: form.stock.value || 'available',
      specifications: form.specifications.value.trim() || 'Specifications Coming Soon'
    };

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      storeState.products.push(data.product);
      form.reset();
      showToast(`Product "${data.product.name}" added to catalogue!`);
      switchAdminTab('products');
      renderProducts();
    }
  } catch (err) {
    showToast('Failed to add product: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Product to Catalogue';
  }
}

// Edit Product Modal Handling
function openEditProductModal(productId) {
  const prod = storeState.products.find(p => p.id === productId);
  if (!prod) return;

  document.getElementById('edit-prod-id').value = prod.id;
  document.getElementById('edit-prod-name').value = prod.name;
  document.getElementById('edit-prod-category').value = prod.category;
  document.getElementById('edit-prod-price').value = prod.price || '';
  document.getElementById('edit-prod-stock').value = prod.stock || 'available';
  document.getElementById('edit-prod-desc').value = prod.description || '';
  document.getElementById('edit-prod-specs').value = prod.specifications || '';
  document.getElementById('edit-prod-current-img').src = prod.image;

  document.getElementById('edit-product-modal').classList.add('open');
}

function closeEditProductModal() {
  document.getElementById('edit-product-modal').classList.remove('open');
}

async function submitEditProduct(e) {
  e.preventDefault();
  const form = e.target;
  const prodId = document.getElementById('edit-prod-id').value;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    let imageUrl = null;
    const fileInput = document.getElementById('edit-prod-photo');
    if (fileInput.files.length > 0) {
      imageUrl = await uploadProductPhotoFile(fileInput.files[0]);
    }

    const priceVal = document.getElementById('edit-prod-price').value.trim();
    const updatePayload = {
      id: prodId,
      name: document.getElementById('edit-prod-name').value.trim(),
      category: document.getElementById('edit-prod-category').value,
      filterCategory: document.getElementById('edit-prod-category').value,
      price: priceVal ? parseInt(priceVal, 10) : null,
      stock: document.getElementById('edit-prod-stock').value,
      description: document.getElementById('edit-prod-desc').value.trim(),
      specifications: document.getElementById('edit-prod-specs').value.trim()
    };
    if (imageUrl) {
      updatePayload.image = imageUrl;
      updatePayload.images = [imageUrl];
    }

    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
    const data = await res.json();

    if (data.success) {
      const idx = storeState.products.findIndex(p => p.id === prodId);
      if (idx !== -1) storeState.products[idx] = data.product;
      closeEditProductModal();
      populateAdminProductsList();
      renderProducts();
      showToast('Product updated successfully!');
    }
  } catch (err) {
    showToast('Failed to update product: ' + err.message);
  } finally {
    submitBtn.disabled = false;
  }
}

function populateAdminShippingForm() {
  document.getElementById('admin-shipping-base').value = storeState.shipping?.base || 250;
  document.getElementById('admin-shipping-add').value = storeState.shipping?.perAdditionalUnit || 150;
  document.getElementById('admin-cod-toggle').checked = !!storeState.codEnabled;
}

async function saveAdminShipping() {
  const baseShip = parseInt(document.getElementById('admin-shipping-base').value, 10) || 250;
  const addShip = parseInt(document.getElementById('admin-shipping-add').value, 10) || 150;
  const codVal = document.getElementById('admin-cod-toggle').checked;

  storeState.shipping.base = baseShip;
  storeState.shipping.perAdditionalUnit = addShip;
  storeState.codEnabled = codVal;

  try {
    await fetch('/api/admin/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeState)
    });
    showToast('Shipping settings saved!');
  } catch (err) {
    showToast('Error updating settings');
  }
}

// ==========================================================================
// WhatsApp Direct Support & Analytics Helpers
// ==========================================================================
function openWhatsAppChat(customMessage = '') {
  trackEvent('WhatsAppClick', { source: customMessage ? 'ProductContext' : 'FloatingButton' });
  const text = customMessage || 'Hello MuddaCraft, I am interested in your traditional bamboo Muddas from A to Z Mudda House, Muzaffarnagar.';
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
  console.log('✅ MuddaCraft Analytics engine initialized (GA4, Meta Pixel, Ads hooks active)');
}

function setupEventListeners() {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      openAdminModal();
    }
  });
}
