/* ==========================================================================
   Clear Sight Finance – keyboard.js
   Keyboard Help dialog and the "Skip to main content" link.

   Used on every page (index.html and module.html).

   1. Keyboard Help
      - The "Keyboard Help" button opens a native <dialog> with showModal().
      - While it is open, the browser keeps keyboard focus inside it and
        closes it when Escape is pressed (no custom focus-trapping code).
      - The Close button closes it.
      - However it closes, focus goes back to the Keyboard Help button.

   2. Skip to main content
      - The link works without JavaScript. This file only makes sure that
        keyboard focus (not just the scroll position) moves to <main> in
        every browser, including when the link is used more than once.

   This file adds no keyboard shortcuts of its own.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- 1. Keyboard Help dialog ---------- */

  function setUpKeyboardHelp() {
    const helpButton = document.getElementById("keyboard-help-button");
    const dialog = document.getElementById("keyboard-help-dialog");
    const closeButton = document.getElementById("keyboard-help-close");
    const title = document.getElementById("keyboard-help-title");

    // Stop safely if part of the dialog is missing, or the browser is too
    // old to support modal dialogs. The button stays hidden in that case,
    // so there is never a button that does nothing.
    if (!helpButton || !dialog || !closeButton || typeof dialog.showModal !== "function") {
      return;
    }

    // Only set up once, even if this script were included twice
    if (dialog.dataset.keyboardHelpReady === "true") {
      return;
    }
    dialog.dataset.keyboardHelpReady = "true";

    function openDialog() {
      // Already open: nothing to do (calling showModal() again could throw an error)
      if (dialog.open) {
        return;
      }

      try {
        dialog.showModal();
      } catch (error) {
        return;   // the dialog could not open, so leave focus where it is
      }

      // Start on the heading, so screen readers read the dialog from the top.
      // Otherwise the browser would jump straight to the Close button at the
      // bottom. Pressing Tab then moves to the Close button.
      if (title) {
        title.focus();
      }
    }

    function closeDialog() {
      if (dialog.open) {
        dialog.close();
      }
    }

    helpButton.addEventListener("click", openDialog);
    closeButton.addEventListener("click", closeDialog);

    // "close" fires however the dialog closes: the Close button, Escape or
    // dialog.close(). Put focus back on the button that opened it.
    dialog.addEventListener("close", function () {
      helpButton.focus();
    });

    // Everything is ready, so show the Keyboard Help button
    const group = helpButton.closest(".toolbar-group");
    if (group) {
      group.hidden = false;
    }
    helpButton.hidden = false;
  }


  /* ---------- 2. Skip to main content ---------- */

  function setUpSkipLink() {
    const skipLink = document.querySelector('.skip-link[href="#main-content"]');
    const main = document.getElementById("main-content");

    if (!skipLink || !main) {
      return;
    }

    // Only set up once
    if (skipLink.dataset.skipLinkReady === "true") {
      return;
    }
    skipLink.dataset.skipLinkReady = "true";

    skipLink.addEventListener("click", function () {
      // tabindex="-1" lets <main> receive focus from code without adding it
      // to the Tab order. It is already in the HTML; this is a safety net.
      if (!main.hasAttribute("tabindex")) {
        main.setAttribute("tabindex", "-1");
      }

      // The browser still follows the link as normal (it updates the address
      // and scrolls). This line makes sure focus moves too, so the next Tab
      // goes to the first link or button inside the main content.
      main.focus();
    });
  }


  /* ---------- Start ---------- */

  function init() {
    setUpKeyboardHelp();
    setUpSkipLink();
  }

  // With "defer" the page is already parsed, but check in case the script
  // is ever loaded without it
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
