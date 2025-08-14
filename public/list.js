(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const productsRow = document.getElementById("products");
    const btnGrid = document.getElementById("btnGrid");
    const btnList = document.getElementById("btnList");

    if (!productsRow || !btnGrid || !btnList) return;

    const setActive = (activeBtn, inactiveBtn) => {
      activeBtn.classList.add("active", "btn-outline-primary");
      activeBtn.classList.remove("btn-outline-secondary");

      inactiveBtn.classList.remove("active", "btn-outline-primary");
      inactiveBtn.classList.add("btn-outline-secondary");
    };

    const toGridView = () => {
      setActive(btnGrid, btnList);

      // Add grid gutters to the row
      productsRow.classList.add("g-3", "g-md-4");

      // Make each product a grid card
      const cols = Array.from(productsRow.children);
      cols.forEach((col) => {
        col.classList.add("col-12", "col-sm-6", "col-lg-4"); // xs=1, sm=2, lg+=3

        const card = col.querySelector(".product-card");
        if (card) {
          card.classList.add("grid-card");
          card.classList.remove("d-flex", "align-items-start");
        }
      });
    };

    const toListView = () => {
      setActive(btnList, btnGrid);

      // Remove grid gutters
      productsRow.classList.remove("g-3", "g-md-4");

      // Revert each product to list card
      const cols = Array.from(productsRow.children);
      cols.forEach((col) => {
        col.classList.remove("col-sm-6", "col-lg-4");
        col.classList.add("col-12");

        const card = col.querySelector(".product-card");
        if (card) {
          card.classList.remove("grid-card");
          card.classList.add("d-flex", "align-items-start");
        }
      });
    };

    // Expose for inline onclick="toGridView()" / "toListView()"
    window.toGridView = toGridView;
    window.toListView = toListView;

    // Also attach JS listeners (works even if you remove inline onclick)
    btnGrid.addEventListener("click", toGridView);
    btnList.addEventListener("click", toListView);

    // Default view on load
    toListView();

    // Wishlist heart toggle (works in both views)
    document.addEventListener("click", (e) => {
      const heart = e.target.closest(".heart-icon");
      if (heart) {
        heart.classList.toggle("bi-heart");
        heart.classList.toggle("bi-heart-fill");
        heart.classList.toggle("text-danger");
      }
    });
  });
})();


/* list.js - listing page behaviors (sorting placeholder) */
document.addEventListener('DOMContentLoaded', function () {
  const sortEl = document.getElementById('showCount') || document.getElementById('sort-select') || null;
  if (!sortEl) return;
  sortEl.addEventListener('change', function () {
    // Simple placeholder: you can implement sort UI here.
    // Re-run the product tile binder in case items were re-ordered dynamically.
    if (window.ECOM && typeof window.ECOM.addToCart === 'function') {
      setTimeout(function () {
        // re-bind add buttons if necessary
        const ev = new Event('rebind-tiles');
        document.dispatchEvent(ev);
      }, 200);
    }
  });
});
