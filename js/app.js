/* ==========================================================================
   Clear Sight Finance – app.js
   Loads the right module (1, 2 or 3) from its JSON file and displays it
   on module.html.

   module.html?m=2  ->  loads content/module2.json  ->  fills the page

   When everything is displayed, it sends a "clearsight:moduleloaded"
   event so player.js and quiz.js can start working with the same data.
   ========================================================================== */

// Everything sits inside this function so the names below don't become
// global variables that could clash with the other script files.
(function () {
  "use strict";

  const VALID_MODULE_NUMBERS = ["1", "2", "3"];
  const LAST_MODULE = 3;
  const SITE_NAME = "Clear Sight Finance";


  // ---- 1. Read the module number from the address --------------------------

  // Returns "1", "2" or "3", or null if the address doesn't ask for a valid module.
  // Only these exact strings are accepted, so "01", "1.5", "4" or "abc" are rejected.
  function getModuleNumber() {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("m");   // null if there's no ?m= in the address

    if (VALID_MODULE_NUMBERS.includes(value)) {
      return value;
    }
    return null;
  }


  // ---- 2. Load the JSON file -----------------------------------------------

  // Fetches content/moduleN.json and returns the data inside it.
  // Throws an error if the file can't be loaded or isn't valid JSON.
  async function loadModuleData(moduleNumber) {
    const response = await fetch("content/module" + moduleNumber + ".json");

    // fetch only fails by itself on network problems, so a missing file
    // (404) has to be checked here
    if (!response.ok) {
      throw new Error("Could not load module file (status " + response.status + ")");
    }

    // .json() throws an error if the file contains invalid JSON
    return await response.json();
  }

  // Helper: true if the value is a piece of text that isn't empty
  function isText(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  // Checks the data has everything the page needs, so we never show a
  // half-filled page. Returns true or false.
  function isValidModuleData(data, moduleNumber) {
    if (!data || typeof data !== "object") return false;

    // The file must be the module we asked for
    if (data.id !== Number(moduleNumber)) return false;

    if (!isText(data.title) || !isText(data.introduction)) return false;

    if (!Array.isArray(data.sections) || data.sections.length === 0) return false;

    const sectionsAreValid = data.sections.every(function (section) {
      return section &&
        isText(section.heading) &&
        Array.isArray(section.paragraphs) && section.paragraphs.every(isText) &&
        Array.isArray(section.tips) && section.tips.every(isText);
    });
    if (!sectionsAreValid) return false;

    if (!Array.isArray(data.transcript) || data.transcript.length === 0) return false;
    if (!data.transcript.every(isText)) return false;

    // quiz.js checks the questions in detail; here we only make sure the list exists
    if (!Array.isArray(data.quiz)) return false;

    return true;
  }


  // ---- 3. Display the module -----------------------------------------------

  function displayModuleInfo(data) {
    document.getElementById("module-number").textContent = "Module " + data.id;
    document.getElementById("module-title").textContent = data.title;
    document.getElementById("module-introduction").textContent = data.introduction;

    // e.g. "Module 1: Spotting the Scam – Clear Sight Finance"
    document.title = "Module " + data.id + ": " + data.title + " – " + SITE_NAME;
  }

  // Builds one lesson section:
  //   <section class="lesson-section">
  //     <h3>Heading</h3>
  //     <p>Paragraph</p> ...
  //     <div class="safety-tip">
  //       <h4 class="safety-tip-heading">Safety tips</h4>
  //       <ul class="safety-tip-list"><li>Tip</li> ...</ul>
  //     </div>
  //   </section>
  // The headings are h3 and h4 because they sit under the "What you'll learn" h2.
  function createLessonSection(section) {
    const sectionElement = document.createElement("section");
    sectionElement.className = "lesson-section";

    const heading = document.createElement("h3");
    heading.textContent = section.heading;
    sectionElement.appendChild(heading);

    section.paragraphs.forEach(function (text) {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      sectionElement.appendChild(paragraph);
    });

    // Only add a tips box if this section has tips
    if (section.tips.length > 0) {
      sectionElement.appendChild(createSafetyTips(section.tips));
    }

    return sectionElement;
  }

  function createSafetyTips(tips) {
    const tipBox = document.createElement("div");
    tipBox.className = "safety-tip";

    // A visible text label, so the tips don't rely on colour or an icon
    const label = document.createElement("h4");
    label.className = "safety-tip-heading";
    label.textContent = tips.length === 1 ? "Safety tip" : "Safety tips";
    tipBox.appendChild(label);

    const list = document.createElement("ul");
    list.className = "safety-tip-list";

    tips.forEach(function (text) {
      const item = document.createElement("li");
      item.textContent = text;
      list.appendChild(item);
    });

    tipBox.appendChild(list);
    return tipBox;
  }

  function displayLessonSections(sections) {
    const container = document.getElementById("lesson-content");
    container.textContent = "";   // clear anything already there

    sections.forEach(function (section) {
      container.appendChild(createLessonSection(section));
    });
  }

  // Puts each sentence in its own span, numbered from 0:
  //   <span class="transcript-sentence" data-sentence="0">First sentence.</span>
  // player.js uses the number to highlight the sentence being spoken.
  function displayTranscript(sentences) {
    const container = document.getElementById("transcript-content");
    container.textContent = "";

    sentences.forEach(function (text, index) {
      // A space between sentences, so they don't run together
      if (index > 0) {
        container.appendChild(document.createTextNode(" "));
      }

      const span = document.createElement("span");
      span.className = "transcript-sentence";
      span.setAttribute("data-sentence", String(index));
      span.textContent = text;
      container.appendChild(span);
    });
  }


  // ---- 4. Navigation -------------------------------------------------------

  // Shows Previous/Next only when that module exists, and sets their links
  function updateModuleNavigation(moduleNumber) {
    const current = Number(moduleNumber);
    const previousLink = document.getElementById("previous-module");
    const nextLink = document.getElementById("next-module");

    if (previousLink) {
      if (current > 1) {
        previousLink.href = "module.html?m=" + (current - 1);
        previousLink.hidden = false;
      } else {
        previousLink.removeAttribute("href");
        previousLink.hidden = true;
      }
    }

    if (nextLink) {
      if (current < LAST_MODULE) {
        nextLink.href = "module.html?m=" + (current + 1);
        nextLink.hidden = false;
      } else {
        nextLink.removeAttribute("href");
        nextLink.hidden = true;
      }
    }
  }

  // Marks the current module in the main menu, the same way index.html
  // marks Home (class "active" for the look, aria-current for screen readers)
  function highlightCurrentNavLink(moduleNumber) {
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(function (link) {
      if (link.getAttribute("href") === "module.html?m=" + moduleNumber) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      }
    });
  }


  // ---- 5. Loading and error messages ---------------------------------------

  function showLoading() {
    const loading = document.getElementById("module-loading");
    const error = document.getElementById("module-error");

    if (loading) loading.hidden = false;
    if (error) {
      error.hidden = true;
      error.textContent = "";
    }
  }

  function hideLoading() {
    const loading = document.getElementById("module-loading");
    if (loading) loading.hidden = true;
  }

  // Shows a friendly message and hides the empty module sections, so the
  // user never sees a broken, half-empty page
  function showError(message) {
    hideLoading();

    const error = document.getElementById("module-error");

    // Fill the message first, then reveal it: the box has role="alert",
    // so screen readers announce it once when it appears
    error.textContent = "";

    const text = document.createElement("p");
    text.textContent = message;
    error.appendChild(text);

    const homeLink = document.createElement("a");
    homeLink.href = "index.html";
    homeLink.textContent = "Go to the home page";
    error.appendChild(homeLink);

    error.hidden = false;

    // Keep a clear page heading, but hide the empty sections below it
    document.getElementById("module-number").hidden = true;
    document.getElementById("module-title").textContent = "Module not available";
    document.getElementById("module-introduction").hidden = true;
    document.title = "Module not available – " + SITE_NAME;

    document.querySelectorAll(".module-section").forEach(function (section) {
      if (!section.classList.contains("module-intro")) {
        section.hidden = true;
      }
    });
  }


  // ---- 6. Start-up ---------------------------------------------------------

  async function initModulePage() {
    const moduleNumber = getModuleNumber();

    if (moduleNumber === null) {
      // Don't try to fetch anything for an invalid address
      console.warn("Invalid or missing module number in the address:", window.location.search);
      showError("Sorry, we could not find that module. Please choose a module from the home page.");
      return;
    }

    showLoading();

    try {
      const moduleData = await loadModuleData(moduleNumber);

      if (!isValidModuleData(moduleData, moduleNumber)) {
        throw new Error("Module " + moduleNumber + " data is missing information or has the wrong id");
      }

      // Everything has been checked, so the page can be filled in
      displayModuleInfo(moduleData);
      displayLessonSections(moduleData.sections);
      displayTranscript(moduleData.transcript);
      updateModuleNavigation(moduleNumber);
      highlightCurrentNavLink(moduleNumber);
      hideLoading();

      // Tell player.js and quiz.js the module is ready, and give them its data
      document.dispatchEvent(
        new CustomEvent("clearsight:moduleloaded", {
          detail: moduleData
        })
      );
    } catch (error) {
      // Technical details go to the console for debugging, not to the user
      console.error("Clear Sight Finance: module could not be loaded.", error);
      showError("Sorry, this module could not be loaded. Please return to the home page and try again.");
    }
  }

  // app.js is also loaded on index.html, which has no module to show.
  // Only run on a page that has the lesson area.
  if (!document.getElementById("lesson-content")) {
    return;
  }

  // Wait for DOMContentLoaded before loading. It fires only after ALL deferred
  // scripts have run, so player.js and quiz.js will already be listening
  // for "clearsight:moduleloaded" when it is sent.
  document.addEventListener("DOMContentLoaded", initModulePage);
})();
