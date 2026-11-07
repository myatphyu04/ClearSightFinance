/* ==========================================================================
   Clear Sight Finance – settings.js
   Accessibility settings: high contrast and text size.

   This script only adds or removes classes on the <html> element.
   All the colours and sizes themselves live in css/themes.css.

     High contrast      ->  class "high-contrast"
     A   (normal)       ->  class "text-normal"
     A+  (large)        ->  class "text-large"
     A++ (extra-large)  ->  class "text-extra-large"

   The user's choices are saved in localStorage so they carry over to
   other pages (index.html, module.html) and future visits.
   ========================================================================== */

// Everything sits inside this function so the names below can't clash
// with names used in app.js, player.js or quiz.js.
(function () {
  "use strict";

  // ---- Settings ------------------------------------------------------------

  const HIGH_CONTRAST_KEY = "clearSightHighContrast";   // saved as "true" or "false"
  const TEXT_SIZE_KEY = "clearSightTextSize";           // saved as a size below

  const TEXT_SIZES = ["normal", "large", "extra-large"];
  const DEFAULT_TEXT_SIZE = "normal";

  // The <html> element, where the theme classes go
  const root = document.documentElement;


  // ---- Saving and loading --------------------------------------------------
  // localStorage can be blocked (for example in some private browsing modes).
  // try...catch stops that from crashing the page: the settings still work,
  // they just won't be remembered.

  function loadSetting(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function saveSetting(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Saving isn't possible; the setting still applies to this page.
    }
  }


  // ---- High contrast -------------------------------------------------------

  // Turns high contrast on (true) or off (false) and updates the button
  function applyHighContrast(isOn) {
    if (isOn) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    const contrastButton = document.getElementById("contrast-toggle");

    // Some pages might not have the button, so check it exists first
    if (contrastButton) {
      contrastButton.setAttribute("aria-pressed", isOn ? "true" : "false");
    }
  }

  function handleContrastClick() {
    const isCurrentlyOn = root.classList.contains("high-contrast");
    const newValue = !isCurrentlyOn;

    applyHighContrast(newValue);
    saveSetting(HIGH_CONTRAST_KEY, newValue ? "true" : "false");
  }


  // ---- Text size -----------------------------------------------------------

  // Applies one text size ("normal", "large" or "extra-large") and updates
  // the A / A+ / A++ buttons so only the chosen one is selected
  function applyTextSize(size) {
    // Unknown or missing values fall back to normal
    if (!TEXT_SIZES.includes(size)) {
      size = DEFAULT_TEXT_SIZE;
    }

    // Remove every text-size class, then add the chosen one,
    // so only one is ever applied
    TEXT_SIZES.forEach(function (eachSize) {
      root.classList.remove("text-" + eachSize);
    });
    root.classList.add("text-" + size);

    const sizeButtons = document.querySelectorAll(".text-size-button");

    sizeButtons.forEach(function (button) {
      const isSelected = button.getAttribute("data-size") === size;

      button.setAttribute("aria-pressed", isSelected ? "true" : "false");

      if (isSelected) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }

  function handleTextSizeClick(event) {
    // event.currentTarget is the button the listener belongs to
    const size = event.currentTarget.getAttribute("data-size");

    // Only save sizes we recognise
    if (TEXT_SIZES.includes(size)) {
      applyTextSize(size);
      saveSetting(TEXT_SIZE_KEY, size);
    }
  }


  // ---- Start-up ------------------------------------------------------------

  // 1. Apply any saved settings (or the defaults) as soon as the page loads
  function applySavedSettings() {
    const savedContrast = loadSetting(HIGH_CONTRAST_KEY);
    const savedSize = loadSetting(TEXT_SIZE_KEY);

    applyHighContrast(savedContrast === "true");   // anything else = off
    applyTextSize(savedSize);                     // invalid or missing = normal
  }

  // 2. Make the buttons respond to clicks.
  //    <button> elements already work with Enter and Space on the keyboard,
  //    so a "click" listener covers mouse, keyboard and touch.
  function setUpButtons() {
    const contrastButton = document.getElementById("contrast-toggle");

    if (contrastButton) {
      contrastButton.addEventListener("click", handleContrastClick);
    }

    const sizeButtons = document.querySelectorAll(".text-size-button");

    sizeButtons.forEach(function (button) {
      button.addEventListener("click", handleTextSizeClick);
    });
  }

  applySavedSettings();
  setUpButtons();
})();
