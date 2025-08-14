
(function () {
  "use strict";

  /* -------------------- Utilities -------------------- */
  const qs = (s, ctx = document) => (ctx || document).querySelector(s);
  const qsa = (s, ctx = document) =>
    Array.from((ctx || document).querySelectorAll(s));
  const create = (tag, attrs = {}, html = "") => {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    if (html) e.innerHTML = html;
    return e;
  };
  const fmtPrice = (n) => Number(n || 0).toFixed(2);
  const parsePrice = (txt) => {
    if (!txt) return NaN;
    const m = String(txt).match(/[\d,.]+/);
    if (!m) return NaN;
    return parseFloat(m[0].replace(/,/g, ""));
  };

  /* -------------------- Storage wrapper -------------------- */
  const DB = {
    usersKey: "ecom_users_v1",
    currentUserKey: "ecom_current_user_v1",
    cartKey: "ecom_cart_v1",
    viewProductKey: "ecom_view_product_v1",
    shipKey: "ecom_ship_v1",
    langKey: "ecom_lang_v1",
    searchKey: "ecom_search_q_v1",
    subscribeKey: "ecom_subscribed_v1",

    getUsers() {
      return JSON.parse(localStorage.getItem(this.usersKey) || "[]");
    },
    saveUsers(u) {
      localStorage.setItem(this.usersKey, JSON.stringify(u));
    },

    getCurrent() {
      return JSON.parse(localStorage.getItem(this.currentUserKey) || "null");
    },
    setCurrent(u) {
      localStorage.setItem(this.currentUserKey, JSON.stringify(u));
    },

    getCart() {
      return JSON.parse(localStorage.getItem(this.cartKey) || "[]");
    },
    setCart(c) {
      localStorage.setItem(this.cartKey, JSON.stringify(c));
    },

    getViewProduct() {
      return JSON.parse(localStorage.getItem(this.viewProductKey) || "null");
    },
    setViewProduct(p) {
      localStorage.setItem(this.viewProductKey, JSON.stringify(p));
    },

    getShip() {
      return JSON.parse(localStorage.getItem(this.shipKey) || "null");
    },
    setShip(s) {
      localStorage.setItem(this.shipKey, JSON.stringify(s));
    },

    getLang() {
      return localStorage.getItem(this.langKey) || null;
    },
    setLang(v) {
      localStorage.setItem(this.langKey, v);
    },

    getSearch() {
      return localStorage.getItem(this.searchKey) || "";
    },
    setSearch(v) {
      localStorage.setItem(this.searchKey, v);
    },

    getSubscribed() {
      return JSON.parse(localStorage.getItem(this.subscribeKey) || "null");
    },
    setSubscribed(v) {
      localStorage.setItem(this.subscribeKey, JSON.stringify(v));
    },
  };

  /* -------------------- Toast helper -------------------- */
  function showToast(msg) {
    let t = document.getElementById("ecom-toast");
    if (!t) {
      t = create("div", { id: "ecom-toast" });
      Object.assign(t.style, {
        position: "fixed",
        right: "18px",
        bottom: "18px",
        padding: "10px 14px",
        borderRadius: "8px",
        background: "rgba(0,0,0,0.85)",
        color: "#fff",
        zIndex: 2000,
        opacity: 0,
        transition: "opacity .25s",
      });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = 1;
    clearTimeout(t._hideT);
    t._hideT = setTimeout(() => (t.style.opacity = 0), 1800);
  }

  /* -------------------- Header: Ship-to and Language -------------------- */
  function initShipAndLang() {
    const langEl = qs("#lang");
    const shipEl = qs("#Ship");

    // language options displayed on click cycle
    const langOptions = [
      "English, USD",
      "English, GBP",
      "中文, CNY",
      "اردو, PKR",
    ];

    // restore lang
    const savedLang = DB.getLang();
    if (savedLang && langEl) {
      langEl.innerHTML = savedLang + ' <i class="fa-solid fa-caret-down"></i>';
    } else if (langEl) {
      if (!langEl.querySelector("i"))
        langEl.innerHTML =
          langEl.textContent.trim() + ' <i class="fa-solid fa-caret-down"></i>';
    }

    if (langEl) {
      langEl.style.cursor = "pointer";
      langEl.addEventListener("click", () => {
        let cur = langEl.textContent.trim();
        let idx = langOptions.indexOf(cur);
        idx = (idx + 1) % langOptions.length;
        langEl.innerHTML =
          langOptions[idx] + ' <i class="fa-solid fa-caret-down"></i>';
        DB.setLang(langOptions[idx]);
        showToast("Language / currency: " + langOptions[idx]);
      });
    }

    // Ship-to dropdown
    if (!shipEl) return;
    shipEl.style.cursor = "pointer";
    const countries = [
      {
        code: "US",
        name: "United States",
        flag: "assests/USA.jpg",
        currency: "USD",
      },
      {
        code: "GB",
        name: "United Kingdom",
        flag: "assests/UK_flag.png",
        currency: "GBP",
      },
      { code: "CN", name: "China", flag: "assests/China.png", currency: "CNY" },
      {
        code: "PK",
        name: "Pakistan",
        flag: "assests/Pak.png",
        currency: "PKR",
      },
    ];

    // build dropdown element (once)
    let dropdown = qs("#ecom-ship-dropdown");
    if (!dropdown) {
      dropdown = create("div", { id: "ecom-ship-dropdown" });
      Object.assign(dropdown.style, {
        position: "absolute",
        display: "none",
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.08)",
        padding: "6px",
        borderRadius: "6px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        zIndex: 1500,
      });
      dropdown.innerHTML = countries
        .map(
          (c) =>
            `<div class="ecom-ship-opt" data-code="${c.code}" style="display:flex;align-items:center;gap:10px;padding:8px;cursor:pointer">
           <img src="${c.flag}" style="width:30px;height:20px;object-fit:cover"/><div><div style="font-weight:600">${c.name}</div><div style="font-size:12px;color:#666">${c.currency}</div></div>
         </div>`
        )
        .join("");
      document.body.appendChild(dropdown);
    }

    // toggle dropdown display
    shipEl.addEventListener("click", (ev) => {
      const r = shipEl.getBoundingClientRect();
      dropdown.style.left = Math.max(6, r.left) + "px";
      dropdown.style.top = r.bottom + window.scrollY + 6 + "px";
      dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
    });

    // handle selection from dropdown
    dropdown.addEventListener("click", (ev) => {
      const opt = ev.target.closest(".ecom-ship-opt");
      if (!opt) return;
      const code = opt.dataset.code;
      const chosen = countries.find((c) => c.code === code);
      if (chosen) {
        shipEl.innerHTML = `Ship to <img src="${chosen.flag}" style="width:18px;height:12px;margin-left:6px"> <i class="fa-solid fa-caret-down"></i>`;
        DB.setShip(chosen);
        showToast("Ship to: " + chosen.name);
      }
      dropdown.style.display = "none";
    });

    // click outside to close
    document.addEventListener("click", (ev) => {
      if (!dropdown.contains(ev.target) && !shipEl.contains(ev.target))
        dropdown.style.display = "none";
    });

    // restore previous
    const prev = DB.getShip();
    if (prev && prev.flag && shipEl) {
      shipEl.innerHTML = `Ship to <img src="${prev.flag}" style="width:18px;height:12px;margin-left:6px"> <i class="fa-solid fa-caret-down"></i>`;
    }
  }

  /* -------------------- Auth: Register / Login -------------------- */
  function createAuthModal() {
    if (qs("#ecom-auth-modal")) return qs("#ecom-auth-modal");
    const modal = create("div", { id: "ecom-auth-modal" });
    Object.assign(modal.style, {
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.45)",
      zIndex: 2200,
    });
    modal.innerHTML = `
      <div class="auth-card" style="width:360px;background:#fff;padding:16px;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.12)">
        <h4 id="ecom-auth-title" style="margin:0 0 8px 0">Register</h4>
        <div id="ecom-auth-msg" style="color:#666;margin-bottom:12px">Create an account to save orders</div>
        <input id="ecom-auth-name" placeholder="Name" class="form-control" style="margin-bottom:8px;padding:8px;border-radius:4px;border:1px solid #ddd" />
        <input id="ecom-auth-email" placeholder="Username (email or name)" class="form-control" style="margin-bottom:8px;padding:8px;border-radius:4px;border:1px solid #ddd" />
        <input id="ecom-auth-pass" type="password" placeholder="Password" class="form-control" style="margin-bottom:12px;padding:8px;border-radius:4px;border:1px solid #ddd" />
        <div style="display:flex;gap:8px;justify-content:space-between">
          <button id="ecom-auth-submit" class="btn btn-primary">Create account</button>
          <button id="ecom-auth-switch" class="btn btn-link">Have an account? Log in</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // switch between register/login
    qs("#ecom-auth-switch", modal).addEventListener("click", () => {
      const title = qs("#ecom-auth-title", modal);
      const submit = qs("#ecom-auth-submit", modal);
      const nameInput = qs("#ecom-auth-name", modal);
      const msg = qs("#ecom-auth-msg", modal);
      if (title.textContent.includes("Register")) {
        title.textContent = "Log in";
        submit.textContent = "Log in";
        nameInput.style.display = "none";
        msg.textContent = "Welcome back — log in to continue.";
      } else {
        title.textContent = "Register";
        submit.textContent = "Create account";
        nameInput.style.display = "block";
        msg.textContent = "Create an account to save orders";
      }
    });

    // submit handler
    qs("#ecom-auth-submit", modal).addEventListener("click", () => {
      const title = qs("#ecom-auth-title", modal).textContent;
      const name = qs("#ecom-auth-name", modal).value.trim();
      const user = qs("#ecom-auth-email", modal).value.trim();
      const pass = qs("#ecom-auth-pass", modal).value;
      if (title.includes("Register")) {
        if (!user || !pass || !name) return alert("Please complete all fields");
        const users = DB.getUsers();
        if (users.find((u) => u.user === user))
          return alert("User already exists");
        users.push({ user, pass, name });
        DB.saveUsers(users);
        DB.setCurrent({ user, name });
        modal.remove();
        showToast("Registered and logged in as " + name.split(" ")[0]);
        updateLoginCardUI();
      } else {
        if (!user || !pass) return alert("Please enter credentials");
        const users = DB.getUsers();
        const found = users.find((u) => u.user === user && u.pass === pass);
        if (!found) return alert("Invalid credentials");
        DB.setCurrent({ user: found.user, name: found.name });
        modal.remove();
        showToast("Welcome back, " + found.name.split(" ")[0]);
        updateLoginCardUI();
      }
    });

    // clicking backdrop closes
    modal.addEventListener("click", (ev) => {
      if (ev.target === modal) modal.remove();
    });

    return modal;
  }

  function openAuth(mode = "register") {
    const modal = createAuthModal();
    const title = qs("#ecom-auth-title", modal);
    const submit = qs("#ecom-auth-submit", modal);
    const nameInput = qs("#ecom-auth-name", modal);
    const msg = qs("#ecom-auth-msg", modal);
    if (mode === "login") {
      title.textContent = "Log in";
      submit.textContent = "Log in";
      nameInput.style.display = "none";
      msg.textContent = "Welcome back — log in to continue.";
    } else {
      title.textContent = "Register";
      submit.textContent = "Create account";
      nameInput.style.display = "block";
      msg.textContent = "Create an account to save orders";
    }
    modal.style.display = "flex";
  }

  function updateLoginCardUI() {
    const card = qs(".login-card");
    if (!card) return;
    const cur = DB.getCurrent();
    if (cur) {
      card.innerHTML = `<p><strong>Hi, ${
        cur.name.split(" ")[0] || cur.user
      }</strong><br>Welcome back</p>
                        <button class="btn btn-outline-secondary btn-sm" id="ecom-logout">Log out</button>`;
      const out = qs("#ecom-logout", card);
      out &&
        out.addEventListener("click", () => {
          DB.setCurrent(null);
          localStorage.removeItem(DB.currentUserKey);
          showToast("Logged out");
          updateLoginCardUI();
        });
    } else {
      card.innerHTML = `<p><strong>Hi, user</strong><br>let's get stated</p>
                        <button class="btn btn-primary" id="ecom-join">Join now</button>
                        <button class="btn btn-outline-primary" id="ecom-login">Log in</button>`;
      const join = qs("#ecom-join", card);
      const login = qs("#ecom-login", card);
      join && join.addEventListener("click", () => openAuth("register"));
      login && login.addEventListener("click", () => openAuth("login"));
    }
  }

  /* -------------------- Cart badge and helpers -------------------- */
  function ensureCartBadge() {
    let cartAnchor =
      Array.from(document.querySelectorAll('a[href="cart.html"]')).find(
        (a) => /cart/i.test(a.textContent) || /my cart/i.test(a.textContent)
      ) || document.querySelector('a[href="cart.html"]');
    if (!cartAnchor) return;
    let badge = cartAnchor.querySelector(".ecom-cart-badge");
    if (!badge) {
      badge = create("span", { class: "ecom-cart-badge" }, "");
      Object.assign(badge.style, {
        display: "inline-block",
        minWidth: "20px",
        padding: "2px 6px",
        marginLeft: "6px",
        fontSize: "12px",
        background: "#ff4d4f",
        color: "#fff",
        borderRadius: "12px",
        textAlign: "center",
      });
      cartAnchor.appendChild(badge);
    }
    const count = DB.getCart().reduce((s, it) => s + (it.qty || 1), 0);
    badge.textContent = String(count);
  }

  function addToCart(item) {
    const cart = DB.getCart();
    const found = cart.find((c) => c.id === item.id);
    if (found) found.qty = (found.qty || 1) + (item.qty || 1);
    else cart.push(Object.assign({ qty: 1 }, item));
    DB.setCart(cart);
    ensureCartBadge();
    showToast((item.title || "Item") + " added to cart");
  }

  function updateCartItemQty(id, qty) {
    const cart = DB.getCart();
    const found = cart.find((c) => c.id === id);
    if (!found) return;
    found.qty = Math.max(1, parseInt(qty, 10) || 1);
    DB.setCart(cart);
    ensureCartBadge();
    renderCartIfPresent();
  }

  function removeCartItem(id) {
    const cart = DB.getCart().filter((c) => c.id !== id);
    DB.setCart(cart);
    ensureCartBadge();
    renderCartIfPresent();
  }

  /* -------------------- Product tile bindings -------------------- */
  function bindProductTiles() {
    const tiles = qsa(".product-card, .deals-item");
    tiles.forEach((tile, idx) => {
      if (tile.querySelector(".ecom-add-btn")) return;

      if (getComputedStyle(tile).position === "static")
        tile.style.position = "relative";

      let title = "";
      let img = "";
      let price = NaN;

      const titleEl =
        tile.querySelector("h6") ||
        tile.querySelector(".deals-name") ||
        tile.querySelector("h5") ||
        tile.querySelector("h3");
      if (titleEl) title = titleEl.textContent.trim();

      const imgEl = tile.querySelector("img");
      if (imgEl) img = imgEl.getAttribute("src");

      const pEl =
        tile.querySelector("h5.text-danger") ||
        tile.querySelector(".price") ||
        tile.querySelector(".deals-price");
      if (pEl) price = parsePrice(pEl.textContent || pEl.innerText);

      if (!price || Number.isNaN(price)) {
        const small = tile.querySelector("small, .text-muted");
        if (small) price = parsePrice(small.textContent);
      }
      if (!price || Number.isNaN(price)) price = 19.99 + (idx % 10);

      const id =
        tile.dataset.id ||
        (img ? img : title ? title.slice(0, 36) : "p_" + idx);

      const btn = create(
        "button",
        { type: "button", class: "ecom-add-btn btn btn-sm btn-primary" },
        "Add"
      );
      Object.assign(btn.style, {
        position: "absolute",
        right: "8px",
        bottom: "8px",
        zIndex: 6,
        padding: "6px 8px",
        cursor: "pointer",
      });
      tile.appendChild(btn);

      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        addToCart({ id, title: title || "Product", price: Number(price), img });
      });

      tile.addEventListener("click", (ev) => {
        if (ev.target.closest(".ecom-add-btn")) return;
        const product = {
          id,
          title: title || "Product",
          price: Number(price),
          img,
        };
        DB.setViewProduct(product);
        window.location.href = "pDetail.html";
      });
    });
  }

  /* -------------------- Product detail population -------------------- */
  function populateProductDetailFromView() {
    const mainImg = qs("#mainImage");
    if (!mainImg) return;
    const view = DB.getViewProduct();
    if (!view) return;
    if (view.img) mainImg.src = view.img;
    const titleEl = qs(".product-title") || qs("h1") || qs("h3");
    if (titleEl && view.title) titleEl.textContent = view.title;
    const desc = qs("#description");
    if (desc && view.desc) desc.textContent = view.desc;
    const priceEl = qs(".price.text-danger") || qs(".price");
    if (priceEl) priceEl.textContent = "$" + fmtPrice(view.price);

    const priceBox =
      qs(".price-box") ||
      qs(".product-price") ||
      qs(".price-boxes") ||
      (priceEl && priceEl.parentElement);
    if (priceBox && !qs(".ecom-detail-add")) {
      const add = create(
        "button",
        { class: "ecom-detail-add btn btn-primary" },
        "Add to cart"
      );
      add.style.marginTop = "10px";
      priceBox.appendChild(add);
      add.addEventListener("click", () => {
        addToCart({
          id: view.id,
          title: view.title || "Product",
          price: view.price || 0,
          img: view.img || "",
        });
      });
    }
  }

  /* -------------------- Search handling (search -> listview) -------------------- */
  function initSearch() {
    const searchInput = qs(".search-sec input");
    const searchBtn = qs(".search-sec .btn1");
    if (searchInput) {
      // If we're on listview.html, apply the saved search
      const saved = DB.getSearch();
      if (saved && /listview/i.test(location.href)) {
        // attempt to apply filter to product tiles (if listview has .product-card)
        const val = saved.toLowerCase();
        qsa(".product-card").forEach((card) => {
          const t = (
            card.querySelector("h6")?.textContent ||
            card.querySelector("h5")?.textContent ||
            ""
          ).toLowerCase();
          card.style.display = t.includes(val) ? "" : "none";
        });
        // clear saved search so it doesn't persist unexpectedly
        DB.setSearch("");
      }

      // press Enter to search -> go to listview and store query
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const q = searchInput.value.trim();
          DB.setSearch(q);
          // if already on listview, just filter
          if (/listview/i.test(location.href)) {
            qsa(".product-card").forEach((card) => {
              const t = (
                card.querySelector("h6")?.textContent ||
                card.querySelector("h5")?.textContent ||
                ""
              ).toLowerCase();
              card.style.display = t.includes(q.toLowerCase()) ? "" : "none";
            });
          } else {
            // navigate to listview page
            window.location.href = "listview.html";
          }
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        const val = (searchInput && searchInput.value.trim()) || "";
        DB.setSearch(val);
        if (/listview/i.test(location.href)) {
          qsa(".product-card").forEach((card) => {
            const t = (
              card.querySelector("h6")?.textContent ||
              card.querySelector("h5")?.textContent ||
              ""
            ).toLowerCase();
            card.style.display = t.includes(val.toLowerCase()) ? "" : "none";
          });
        } else {
          window.location.href = "listview.html";
        }
      });
    }
  }

  /* -------------------- Subscribe form handling -------------------- */
  function initSubscribe() {
    const form = qs(".subscribe-form");
    if (!form) return;
    const emailInput = form.querySelector('input[type="email"]');
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const email = emailInput && emailInput.value && emailInput.value.trim();
      if (!email || !/@/.test(email)) {
        showToast("Enter a valid email");
        return;
      }
      DB.setSubscribed({ email, at: Date.now() });
      showToast("Subscribed — thanks!");
      try {
        form.reset();
      } catch (e) {}
    });

    // If user previously subscribed, optionally show small message
    const prev = DB.getSubscribed();
    if (prev && emailInput) emailInput.value = prev.email || "";
  }

  /* -------------------- Deals countdown -------------------- */
  function startDealsCountdown(targetDate) {
    const leftBoxes = qsa(".deals-left .deals-timer-box");
    if (!leftBoxes || leftBoxes.length < 4) return;
    function tick() {
      const now = Date.now();
      let d = Math.max(0, targetDate - now);
      const days = Math.floor(d / (1000 * 60 * 60 * 24));
      d -= days * (1000 * 60 * 60 * 24);
      const hours = Math.floor(d / (1000 * 60 * 60));
      d -= hours * (1000 * 60 * 60);
      const mins = Math.floor(d / (1000 * 60));
      d -= mins * (1000 * 60);
      const secs = Math.floor(d / 1000);
      leftBoxes[0].childNodes[0].nodeValue = String(days).padStart(2, "0");
      leftBoxes[1].childNodes[0].nodeValue = String(hours).padStart(2, "0");
      leftBoxes[2].childNodes[0].nodeValue = String(mins).padStart(2, "0");
      leftBoxes[3].childNodes[0].nodeValue = String(secs).padStart(2, "0");
      if (targetDate - now <= 0) {
        clearInterval(leftBoxes._iv);
      }
    }
    tick();
    leftBoxes._iv = setInterval(tick, 1000);
  }

  /* -------------------- Cart page rendering (if present) -------------------- */
  function renderCartIfPresent() {
    // Support a range of possible cart container ids/classes
    const container =
      qs("#ecom-cart-list") ||
      qs("#cart-list") ||
      qs(".cart-items") ||
      qs("#cartItems") ||
      qs(".cart-list");
    if (!container) return;
    const cart = DB.getCart();
    container.innerHTML = "";
    if (!cart || !cart.length) {
      container.appendChild(create("div", {}, "<p>Your cart is empty</p>"));
      const totalsEl = qs("#ecom-cart-totals");
      if (totalsEl)
        totalsEl.innerHTML = '<div class="text-muted">Total: $0.00</div>';
      return;
    }

    const table = create("table", { class: "table" });
    const thead = create(
      "thead",
      {},
      "<tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr>"
    );
    const tbody = create("tbody");
    table.appendChild(thead);
    table.appendChild(tbody);

    let total = 0;
    cart.forEach((item) => {
      const row = create("tr");
      const imgCell = create("td");
      const name = create(
        "div",
        {},
        `<strong>${item.title || item.name || "Item"}</strong>`
      );
      if (item.img) {
        const img = create("img");
        img.src = item.img;
        img.style.width = "64px";
        img.style.height = "64px";
        img.style.objectFit = "contain";
        img.style.marginRight = "8px";
        imgCell.appendChild(img);
        imgCell.appendChild(name);
      } else {
        imgCell.appendChild(name);
      }
      const priceCell = create("td", {}, "$" + fmtPrice(item.price || 0));
      const qtyCell = create("td");
      const qtyInput = create("input", {
        type: "number",
        min: "1",
        value: String(item.qty || 1),
        class: "form-control",
      });
      qtyInput.style.width = "80px";
      qtyInput.addEventListener("change", () =>
        updateCartItemQty(item.id, qtyInput.value)
      );
      qtyCell.appendChild(qtyInput);
      const subtotal = (item.price || 0) * (item.qty || 1);
      total += subtotal;
      const subCell = create("td", {}, "$" + fmtPrice(subtotal));
      const removeCell = create("td");
      const removeBtn = create(
        "button",
        { class: "btn btn-sm btn-outline-danger" },
        "Remove"
      );
      removeBtn.addEventListener("click", () => removeCartItem(item.id));
      removeCell.appendChild(removeBtn);

      row.appendChild(imgCell);
      row.appendChild(priceCell);
      row.appendChild(qtyCell);
      row.appendChild(subCell);
      row.appendChild(removeCell);
      tbody.appendChild(row);
    });

    container.appendChild(table);
    const totalsEl = qs("#ecom-cart-totals") || qs("#cart-totals");
    if (totalsEl)
      totalsEl.innerHTML = `<div class="d-flex justify-content-between"><strong>Total:</strong><div>$${fmtPrice(
        total
      )}</div></div>`;
  }

  /* -------------------- Initializers -------------------- */
  function init() {
    initShipAndLang();
    updateLoginCardUI();
    bindProductTiles();
    ensureCartBadge();
    populateProductDetailFromView();
    initSearch();
    initSubscribe();
    renderCartIfPresent();

    // deals countdown target: 2 days from now (example) — adjust as needed
    const twoDays = Date.now() + 2 * 24 * 60 * 60 * 1000;
    startDealsCountdown(twoDays);

    // re-run tile binder in case elements loaded later
    setTimeout(bindProductTiles, 600);
    // keep cart badge current
    setInterval(ensureCartBadge, 2500);
  }

  document.addEventListener("DOMContentLoaded", init);

  // expose small API for debugging
  window.ECOM = {
    DB,
    addToCart,
    updateCartItemQty,
    removeCartItem,
    showToast,
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menuToggle");
  const nav = document.querySelector("nav.desktop-nav");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  const categoryScroll = document.querySelector(".mobile-category-scroll");
  if (categoryScroll) {
    categoryScroll.addEventListener("wheel", function (e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        categoryScroll.scrollLeft += e.deltaY;
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menuToggle");
  const mobileDrawer = document.getElementById("mobileDrawer");
  const closeDrawer = document.getElementById("closeDrawer");

  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener("click", function () {
      mobileDrawer.classList.toggle("open");
    });
  }

  if (closeDrawer) {
    closeDrawer.addEventListener("click", function () {
      mobileDrawer.classList.remove("open");
    });
  }
});


document.getElementById('closeDrawer').addEventListener('click', function() {
    document.getElementById('mobileDrawer').classList.remove('open');
});





