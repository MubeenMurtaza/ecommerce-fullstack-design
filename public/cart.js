/* cart.js - render cart from localStorage and provide qty/remove/checkout
   This expects your cart page contains:
   - a .cart-container element (left column)
   - a .summary-card element (right column) which will be updated
*/
(function () {
  'use strict';

  const CART_KEY = 'ecom_cart_v1';

  function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  }
  function setCart(c) {
    localStorage.setItem(CART_KEY, JSON.stringify(c));
  }
  function fmt(n) { return Number(n || 0).toFixed(2); }

  function renderCartItems() {
    const cont = document.querySelector('.cart-container');
    if (!cont) return;
    // clear existing static example items
    cont.innerHTML = '';

    const cart = getCart();
    if (!cart || cart.length === 0) {
      cont.innerHTML = '<div style="padding:24px;text-align:center;color:#666">Your cart is empty</div>';
      renderSummary();
      return;
    }

    cart.forEach((it, idx) => {
      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-start cart-item';
      row.style.marginBottom = '12px';
      row.innerHTML = `
        <div class="d-flex gap-3">
          <img src="${it.img || 'assests/img_1.png'}" alt="Product" style="width:96px;height:96px;object-fit:cover;border-radius:6px"/>
          <div>
            <div class="item-title" style="font-weight:600">${it.title}</div>
            <div class="item-meta" style="color:#666;font-size:13px">Unit price: $${fmt(it.price)}</div>
            <div class="buttons-row mt-2">
              <button class="btn btn-outline-danger btn-sm btn-remove" data-idx="${idx}">Remove</button>
              <button class="btn btn-outline-primary btn-sm btn-save" data-idx="${idx}">Save for later</button>
            </div>
          </div>
        </div>
        <div class="text-end">
          <div style="font-weight:600;margin-bottom:8px">$${fmt(it.price * (it.qty || 1))}</div>
          <div>
            <select class="qty-select form-select form-select-sm" data-idx="${idx}" style="width:100px">
              <option value="1">Qty: 1</option>
              <option value="2">Qty: 2</option>
              <option value="3">Qty: 3</option>
              <option value="4">Qty: 4</option>
              <option value="5">Qty: 5</option>
            </select>
          </div>
        </div>
      `;
      cont.appendChild(row);
    });

    // set selected qtys & bind events
    qsa('.qty-select').forEach(s => {
      const idx = Number(s.dataset.idx);
      const cart = getCart();
      s.value = String(cart[idx].qty || 1);
      s.addEventListener('change', (ev) => {
        const i = Number(ev.target.dataset.idx);
        const c = getCart();
        c[i].qty = Number(ev.target.value);
        setCart(c);
        renderCartItems();
        renderSummary();
      });
    });

    qsa('.btn-remove').forEach(b => b.addEventListener('click', (ev) => {
      const idx = Number(ev.currentTarget.dataset.idx);
      const c = getCart();
      c.splice(idx, 1);
      setCart(c);
      renderCartItems();
      renderSummary();
    }));

    qsa('.btn-save').forEach(b => b.addEventListener('click', (ev) => {
      const idx = Number(ev.currentTarget.dataset.idx);
      const c = getCart();
      const item = c.splice(idx, 1)[0];
      setCart(c);
      renderCartItems();
      renderSummary();
      alert(item.title + ' saved for later (demo)');
    }));
  }

  function renderSummary() {
    const summary = document.querySelector('.summary-card');
    if (!summary) return;
    const cart = getCart();
    const subtotal = cart.reduce((s, it) => s + (it.price * (it.qty || 1)), 0);
    const shipping = subtotal > 100 ? 0 : 9.99;
    const tax = subtotal * 0.06;
    const total = subtotal + shipping + tax;

    summary.innerHTML = `
      <div style="padding:12px">
        <div class="d-flex justify-content-between"><span>Subtotal:</span><span class="value">$${fmt(subtotal)}</span></div>
        <div class="d-flex justify-content-between mt-2"><span>Shipping:</span><span>$${fmt(shipping)}</span></div>
        <div class="d-flex justify-content-between mt-2"><span>Tax:</span><span>$${fmt(tax)}</span></div>
        <hr style="margin:10px 0"/>
        <div class="d-flex justify-content-between fw-semibold"><span>Total</span><span>$${fmt(total)}</span></div>
        <div style="margin-top:12px"><button id="checkout-now" class="btn btn-success w-100">Proceed to checkout</button></div>
      </div>
    `;
    const btn = document.getElementById('checkout-now');
    if (btn) {
      btn.addEventListener('click', () => {
        const user = JSON.parse(localStorage.getItem('ecom_current_user_v1') || 'null');
        const cart = getCart();
        if (!user) return alert('Please log in before checkout.');
        if (!cart || cart.length === 0) return alert('Cart is empty.');
        alert('Checkout simulated. Thank you for your order — demo only.');
        // clear cart after checkout simulation
        setCart([]);
        renderCartItems();
        renderSummary();
      });
    }
  }

  /* small helpers to query elements */
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  document.addEventListener('DOMContentLoaded', function () {
    renderCartItems();
    renderSummary();
  });

})();
