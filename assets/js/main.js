/* =====================================================================
   LUMEN & LENS — homepage interactions
   ---------------------------------------------------------------------
   Vanilla ES2019+, no dependencies. Every enhancement is progressive:
   without JS the page still renders all content and links.
   ===================================================================== */
(function () {
  "use strict";

  var doc = document;
  var header = doc.querySelector("[data-header]");
  var megaItem = doc.querySelector("[data-mega]");
  var navToggle = doc.querySelector("[data-nav-toggle]");
  var navPanel = doc.getElementById("primaryNav");

  /* The mega panel is a desktop affordance; below 1080px the nav becomes
     an accordion inside the mobile drawer. Hover capability is not part of
     the test: pointer-less desktops and headless QA tools still need it. */
  var mobileNav = window.matchMedia("(max-width: 1080px)");

  /* ---------------------------------------------------------------
     Toast — lightweight feedback for demo interactions
     --------------------------------------------------------------- */
  var toastEl = null;
  var toastTimer = null;

  function toast(message) {
    if (!toastEl) {
      toastEl = doc.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      doc.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2600);
  }

  /* ---------------------------------------------------------------
     Sticky header shadow
     --------------------------------------------------------------- */
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------
     Mega menu — hover, focus, click and keyboard
     --------------------------------------------------------------- */
  var megaLink = megaItem ? megaItem.querySelector(".nav-link") : null;
  var openTimer = null;
  var closeTimer = null;

  function setMega(open) {
    if (!megaItem || !megaLink) return;
    window.clearTimeout(openTimer);
    window.clearTimeout(closeTimer);
    megaItem.classList.toggle("is-open", open);
    megaLink.setAttribute("aria-expanded", String(open));
  }

  function scheduleOpen() {
    window.clearTimeout(closeTimer);
    window.clearTimeout(openTimer);
    openTimer = window.setTimeout(function () {
      setMega(true);
    }, 90);
  }

  function scheduleClose() {
    window.clearTimeout(openTimer);
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(function () {
      setMega(false);
    }, 170);
  }

  if (megaItem && megaLink) {
    /* Pointer */
    megaItem.addEventListener("mouseenter", function () {
      if (!mobileNav.matches) scheduleOpen();
    });
    megaItem.addEventListener("mouseleave", function () {
      if (!mobileNav.matches) scheduleClose();
    });

    /* Keyboard focus inside the item keeps it open */
    megaItem.addEventListener("focusin", function () {
      if (!mobileNav.matches) scheduleOpen();
    });
    megaItem.addEventListener("focusout", function (event) {
      if (mobileNav.matches) return;
      if (!megaItem.contains(event.relatedTarget)) scheduleClose();
    });

    /* Click: toggle on touch/mobile, follow the link on desktop */
    megaLink.addEventListener("click", function (event) {
      if (!mobileNav.matches) return;
      event.preventDefault();
      event.stopPropagation();
      var open = megaItem.classList.contains("is-open");
      setMega(!open);
    });

    /* Escape closes and restores focus */
    megaItem.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && megaItem.classList.contains("is-open")) {
        setMega(false);
        megaLink.focus();
      }
    });

    /* Deep link / QA hook: ?mega=open or #mega-cameras opens the panel */
    var params = new URLSearchParams(window.location.search);
    if (params.get("mega") === "open" || window.location.hash === "#mega-cameras") {
      setMega(true);
    }

    doc.addEventListener("click", function (event) {
      if (!megaItem.contains(event.target)) setMega(false);
    });
  }

  /* ---------------------------------------------------------------
     Mobile navigation panel
     --------------------------------------------------------------- */
  function setNav(open) {
    if (!header || !navToggle) return;
    header.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    if (!open && megaItem) setMega(false);
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      setNav(!header.classList.contains("nav-open"));
    });
  }

  doc.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (header && header.classList.contains("nav-open")) {
      setNav(false);
      if (navToggle) navToggle.focus();
    }
  });

  mobileNav.addEventListener("change", function (event) {
    if (!event.matches) setNav(false);
  });

  /* ---------------------------------------------------------------
     Wishlist toggle
     --------------------------------------------------------------- */
  doc.querySelectorAll(".wish-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      var active = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", String(!active));
      var label = button.getAttribute("aria-label") || "product";
      var product = label.replace(/^Save\s+/, "").replace(/\s+to wishlist$/, "");
      toast(active ? product + " removed from wishlist" : product + " saved to wishlist");
    });
  });

  /* ---------------------------------------------------------------
     Quick add
     --------------------------------------------------------------- */
  doc.querySelectorAll("[data-quick-add]").forEach(function (button) {
    var original = button.innerHTML;
    button.addEventListener("click", function () {
      var card = button.closest(".product-card");
      var title = card ? card.querySelector(".product-card__title") : null;
      button.classList.add("is-added");
      button.innerHTML =
        '<svg class="icon" aria-hidden="true"><use href="#i-check"></use></svg> Added to bag';
      toast((title ? title.textContent.trim() : "Item") + " added to bag");
      window.setTimeout(function () {
        button.classList.remove("is-added");
        button.innerHTML = original;
      }, 1800);
    });
  });

  /* ---------------------------------------------------------------
     Newsletter — client-side validation + success state
     --------------------------------------------------------------- */
  var form = doc.getElementById("newsletterForm");
  var status = doc.getElementById("newsletterStatus");

  if (form && status) {
    var email = doc.getElementById("newsletterEmail");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = email ? email.value.trim() : "";
      var valid = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value);
      status.classList.toggle("is-error", !valid);

      if (!valid) {
        status.textContent = "Please enter a valid email address.";
        if (email) email.focus();
        return;
      }

      status.textContent = "You're in — check your inbox for your 10% welcome code.";
      form.reset();
      toast("Subscribed to gear updates");
    });

    if (email) {
      email.addEventListener("input", function () {
        if (status.classList.contains("is-error")) {
          status.textContent = "";
          status.classList.remove("is-error");
        }
      });
    }
  }

  /* ---------------------------------------------------------------
     Scroll reveal (respects prefers-reduced-motion)
     --------------------------------------------------------------- */
  var reveals = doc.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );

    doc.querySelectorAll(".product-grid, .category-grid").forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, index) {
        child.style.setProperty("--reveal-delay", index * 70 + "ms");
      });
    });

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }
})();
