/* ==========================================================================
   Clear Sight Finance – app.js
   Loads the right module (1, 2 or 3) from its JSON file and displays it
   on module.html.

   module.html?m=2  ->  loads content/module2.json  ->  fills the page

   The lesson under "What you'll learn" is also prepared for narration:
   every heading and sentence gets class "lesson-sentence" and a number
   (data-sentence="0", "1", ...), in reading order.

   When everything is displayed, it sends a "clearsight:moduleloaded"
   event on document with:

     event.detail.moduleData      – the whole JSON object (quiz.js uses .quiz)
     event.detail.narrationItems  – [{ text, element }, ...] in reading order
                                    (player.js speaks .text and highlights .element)
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


  // ---- 2. Load and check the JSON file -------------------------------------

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

    // quiz.js checks each question in detail; here we only make sure there are some
    if (!Array.isArray(data.quiz) || data.quiz.length === 0) return false;

    return true;
  }


  // ---- 3. Display the module heading ---------------------------------------

  function displayModuleInfo(data) {
    document.getElementById("module-number").textContent = "Module " + data.id;
    document.getElementById("module-title").textContent = data.title;
    document.getElementById("module-introduction").textContent = data.introduction;

    // e.g. "Module 1: Spotting the Scam – Clear Sight Finance"
    document.title = "Module " + data.id + ": " + data.title + " – " + SITE_NAME;
  }


  // ---- 4. Prepare text for narration ---------------------------------------

  // Splits a paragraph into sentences at ".", "!" or "?" followed by a space.
  // "Stop. Check first!" -> ["Stop.", "Check first!"]
  // Text without an ending full stop is kept as the last sentence.
  function splitIntoSentences(text) {
    const matches = text.match(/[^.!?]+(?:[.!?]+|$)/g) || [];

    return matches
      .map(function (sentence) { return sentence.trim(); })
      .filter(function (sentence) { return sentence !== ""; });
  }

  // Marks an element as something the player will read, and records it.
  // Its data-sentence number is its position in narrationItems, so
  // narrationItems[5] always matches the element with data-sentence="5".
  function addNarrationItem(element, narrationItems) {
    element.classList.add("lesson-sentence");
    element.setAttribute("data-sentence", String(narrationItems.length));

    narrationItems.push({
      text: element.textContent,
      element: element
    });
  }

  // Fills a <p> or <li> with one <span> per sentence, separated by spaces,
  // so it still reads as normal text.
  function appendSentences(parent, text, narrationItems) {
    const sentences = splitIntoSentences(text);

    sentences.forEach(function (sentence, index) {
      if (index > 0) {
        parent.appendChild(document.createTextNode(" "));
      }

      const span = document.createElement("span");
      span.textContent = sentence;
      parent.appendChild(span);
      addNarrationItem(span, narrationItems);
    });
  }


  // ---- 5. Display the lesson -----------------------------------------------

  // Builds one lesson section:
  //   <section class="lesson-section">
  //     <h3 class="lesson-sentence" data-sentence="0">Heading</h3>
  //     <p><span class="lesson-sentence" data-sentence="1">Sentence.</span> ...</p>
  //     <div class="safety-tip">
  //       <h4 class="safety-tip-heading lesson-sentence" data-sentence="…">Safety tip</h4>
  //       <ul class="safety-tip-list"><li><span class="lesson-sentence" …>Tip.</span></li></ul>
  //     </div>
  //   </section>
  // The headings are h3 and h4 because they sit under the "What you'll learn" h2.
  function createLessonSection(section, narrationItems) {
    const sectionElement = document.createElement("section");
    sectionElement.className = "lesson-section";

    // The heading stays a real <h3>; the whole heading is one narration item
    const heading = document.createElement("h3");
    heading.textContent = section.heading;
    sectionElement.appendChild(heading);
    addNarrationItem(heading, narrationItems);

    section.paragraphs.forEach(function (text) {
      const paragraph = document.createElement("p");
      appendSentences(paragraph, text, narrationItems);
      sectionElement.appendChild(paragraph);
    });

    // Only add a tips box if this section has tips
    if (section.tips.length > 0) {
      sectionElement.appendChild(createSafetyTips(section.tips, narrationItems));
    }

    return sectionElement;
  }

  function createSafetyTips(tips, narrationItems) {
    const tipBox = document.createElement("div");
    tipBox.className = "safety-tip";

    // A visible text label, so the tips don't rely on colour or an icon.
    // It is also read aloud, so listeners know a tip is starting.
    const label = document.createElement("h4");
    label.className = "safety-tip-heading";
    label.textContent = tips.length === 1 ? "Safety tip" : "Safety tips";
    tipBox.appendChild(label);
    addNarrationItem(label, narrationItems);

    const list = document.createElement("ul");
    list.className = "safety-tip-list";

    tips.forEach(function (text) {
      const item = document.createElement("li");
      appendSentences(item, text, narrationItems);
      list.appendChild(item);
    });

    tipBox.appendChild(list);
    return tipBox;
  }

  // Shows every section and returns the narration items in reading order
  function displayLessonSections(sections) {
    const container = document.getElementById("lesson-content");
    const narrationItems = [];

    container.textContent = "";   // clear anything already there

    sections.forEach(function (section) {
      container.appendChild(createLessonSection(section, narrationItems));
    });

    return narrationItems;
  }


  // ---- 6. Navigation -------------------------------------------------------

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


  // ---- 7. Loading and error messages ---------------------------------------

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


  // ---- 8. Start-up ---------------------------------------------------------

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
      const narrationItems = displayLessonSections(moduleData.sections);
      updateModuleNavigation(moduleNumber);
      highlightCurrentNavLink(moduleNumber);
      hideLoading();

      // Tell player.js and quiz.js the module is ready.
      // player.js uses narrationItems; quiz.js uses moduleData.quiz.
      document.dispatchEvent(
        new CustomEvent("clearsight:moduleloaded", {
          detail: {
            moduleData: moduleData,
            narrationItems: narrationItems
          }
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
