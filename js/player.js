/* ==========================================================================
   Clear Sight Finance – player.js
   Reads the lesson aloud with the browser's built-in speech feature
   (Web Speech API) and highlights each item as it is spoken.

   app.js sends "clearsight:moduleloaded" with event.detail.narrationItems:
     [{ text: "What is a financial scam?", element: <h3> }, ...]
   These are the headings and sentences under "What you'll learn", in order.

   How it works:
   - One SpeechSynthesisUtterance per item.
   - When an item starts speaking (onstart), its element gets "is-current".
   - When it finishes (onend), the next item is spoken.
   - A "session number" changes every time playback starts or stops, so
     events from cancelled speech are ignored and can't restart anything.
   ========================================================================== */

// Everything sits inside this function so the names below can't clash
// with names used in the other script files.
(function () {
  "use strict";

  const playButton = document.getElementById("audio-play");
  const pauseButton = document.getElementById("audio-pause");
  const resumeButton = document.getElementById("audio-resume");
  const stopButton = document.getElementById("audio-stop");
  const speedSelect = document.getElementById("audio-speed");
  const statusText = document.getElementById("audio-status");   // has aria-live="polite"

  // Stop quietly if this page has no audio player (e.g. index.html)
  if (!playButton || !pauseButton || !resumeButton || !stopButton || !speedSelect || !statusText) {
    return;
  }

  const isSpeechSupported =
    "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";

  const ALLOWED_RATES = [0.75, 1, 1.25, 1.5];
  const DEFAULT_RATE = 1;
  const HIGHLIGHT_CLASS = "is-current";

  let narrationItems = [];           // [{ text, element }, ...] from app.js
  let playState = "idle";            // "idle", "playing" or "paused"
  let currentIndex = 0;              // which item is being spoken
  let sessionId = 0;                 // changes on every Play / Stop / error
  let currentUtterance = null;       // kept so the browser doesn't throw it away mid-sentence
  let highlightedElement = null;     // the element that currently has "is-current"
  let nextItemWaiting = false;       // an item finished while paused; speak the next on Resume


  // ---- Small helpers -------------------------------------------------------

  function setStatus(message) {
    statusText.textContent = message;
  }

  // Reads the speed menu each time, so a change applies to the next item
  function getSelectedRate() {
    const rate = parseFloat(speedSelect.value);
    return ALLOWED_RATES.includes(rate) ? rate : DEFAULT_RATE;
  }

  // Enables or disables each button to match the current state
  function updateButtons() {
    const hasNarration = isSpeechSupported && narrationItems.length > 0;

    playButton.disabled = !hasNarration || playState !== "idle";
    pauseButton.disabled = playState !== "playing";
    resumeButton.disabled = playState !== "paused";
    stopButton.disabled = playState === "idle";
  }

  function highlightItem(element) {
    clearHighlight();
    element.classList.add(HIGHLIGHT_CLASS);
    highlightedElement = element;
    // No scrolling and no focus change: the user stays where they are
  }

  function clearHighlight() {
    if (highlightedElement) {
      highlightedElement.classList.remove(HIGHLIGHT_CLASS);
      highlightedElement = null;
    }
  }

  // Cancels everything the browser has queued. If speech was paused, the
  // browser can stay "paused" after cancel(), which would silence the next
  // Play, so resume() clears that (there is nothing left to resume).
  //
  // cancel() is only called when something may still be playing or queued.
  // In Safari, a cancel() that isn't needed can be processed late and stop
  // the first sentence of the next Play. Our own state is checked as well as
  // the browser's flags, because Safari doesn't always report them correctly.
  function cancelAllSpeech() {
    const synth = window.speechSynthesis;

    try {
      const mayHaveSpeech = playState !== "idle" || currentUtterance !== null ||
        synth.speaking || synth.pending || synth.paused;

      if (mayHaveSpeech) {
        synth.cancel();
      }
      if (synth.paused) {
        synth.resume();
      }
    } catch (error) {
      // Never let a browser error stop the player from resetting
      console.error("Clear Sight Finance: could not cancel speech.", error);
    }
  }

  // Ends the current session: old utterances' events will now be ignored
  function endSession() {
    sessionId = sessionId + 1;
    cancelAllSpeech();
    currentUtterance = null;
    nextItemWaiting = false;
    playState = "idle";
    currentIndex = 0;
    clearHighlight();
    updateButtons();
  }

  // Stops playback safely after a speech problem and tells the user.
  // Problems from a cancelled session are ignored.
  function handleSpeechError(session, reason) {
    if (session !== sessionId) return;

    console.error("Clear Sight Finance: speech error.", reason);
    endSession();
    setStatus("Audio could not be played. Please try again.");
  }


  // ---- Speaking one item at a time -----------------------------------------

  function speakNextItem(session) {
    // Ignore calls from a session that has been stopped or replaced
    if (session !== sessionId || playState === "idle") return;

    // Every item has been read
    if (currentIndex >= narrationItems.length) {
      finishPlayback();
      return;
    }

    const item = narrationItems[currentIndex];
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.lang = "en-GB";
    utterance.rate = getSelectedRate();

    // Highlight only when the browser actually starts speaking this item
    utterance.onstart = function () {
      if (session !== sessionId) return;
      highlightItem(item.element);
    };

    // When this item finishes, move on to the next one
    utterance.onend = function () {
      if (session !== sessionId) return;   // cancelled: ignore

      currentIndex = currentIndex + 1;

      if (playState === "paused") {
        // Some browsers finish the item just as Pause is pressed.
        // Don't start the next one until the user presses Resume.
        nextItemWaiting = true;
        return;
      }

      speakNextItem(session);
    };

    // Errors from our own cancel() belong to an old session and are ignored
    utterance.onerror = function (event) {
      handleSpeechError(session, event.error);
    };

    currentUtterance = utterance;

    // speak() can throw in some browsers; don't leave the player stuck on "Playing"
    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      handleSpeechError(session, error);
    }
  }


  // ---- Controls ------------------------------------------------------------

  function startPlayback() {
    if (!isSpeechSupported || narrationItems.length === 0) return;

    // Clear anything still playing or queued, then start a fresh session
    endSession();

    playState = "playing";
    updateButtons();
    setStatus("Playing.");

    speakNextItem(sessionId);
  }

  function pausePlayback() {
    if (playState !== "playing") return;

    try {
      window.speechSynthesis.pause();
    } catch (error) {
      handleSpeechError(sessionId, error);
      return;
    }

    playState = "paused";
    updateButtons();
    setStatus("Paused.");
    // The highlight stays on the current item
  }

  function resumePlayback() {
    if (playState !== "paused") return;

    try {
      window.speechSynthesis.resume();
    } catch (error) {
      handleSpeechError(sessionId, error);
      return;
    }

    playState = "playing";
    updateButtons();
    setStatus("Playing.");

    // If the item ended while paused, carry on with the next one.
    // (resume() is called first so the new item isn't queued behind a pause.)
    if (nextItemWaiting) {
      nextItemWaiting = false;
      speakNextItem(sessionId);
    }
  }

  function stopPlayback() {
    if (playState === "idle") return;

    endSession();   // cancels speech, removes the highlight, goes back to the start
    setStatus("Stopped.");
  }

  function finishPlayback() {
    endSession();
    setStatus("Lesson finished.");
  }


  // ---- Checking the narration items ----------------------------------------

  // Every item needs text and an element inside the lesson area, so the
  // player can never read the quiz, navigation or anything else.
  // The text must also match what is shown on screen, so the voice and the
  // highlight always refer to the same words.
  function areNarrationItemsValid(items) {
    const lesson = document.getElementById("lesson-content");
    if (!lesson || !Array.isArray(items) || items.length === 0) return false;

    return items.every(function (item) {
      return item &&
        typeof item.text === "string" && item.text.trim() !== "" &&
        item.element instanceof Element &&
        lesson.contains(item.element) &&
        item.element.textContent.trim() === item.text.trim();
    });
  }


  // ---- Start-up ------------------------------------------------------------

  playButton.addEventListener("click", startPlayback);
  pauseButton.addEventListener("click", pausePlayback);
  resumeButton.addEventListener("click", resumePlayback);
  stopButton.addEventListener("click", stopPlayback);
  // No listener is needed for the speed menu: its value is read for each new item.

  if (!isSpeechSupported) {
    // Leave every audio control disabled; the lesson can still be read
    speedSelect.disabled = true;
    setStatus("Audio narration is not supported in this browser. You can still read the lesson below.");
    return;
  }

  // app.js sends this event after the module has loaded
  document.addEventListener("clearsight:moduleloaded", function (event) {
    const detail = event.detail || {};

    if (playState !== "idle") {
      endSession();
    }

    if (!areNarrationItemsValid(detail.narrationItems)) {
      console.error("Clear Sight Finance: narration items are missing or invalid.", detail.narrationItems);
      narrationItems = [];
      updateButtons();
      setStatus("Audio narration is not available for this lesson. You can still read it below.");
      return;
    }

    narrationItems = detail.narrationItems;
    updateButtons();   // enables Play; nothing plays until the user presses it
    setStatus("Ready to play.");
  });

  // Leaving the page (including going to another module): stop all speech.
  // pagehide also fires when the page is kept in the back/forward cache,
  // so coming back later shows a stopped player rather than restarting.
  window.addEventListener("pagehide", function () {
    endSession();
    if (narrationItems.length > 0) {
      setStatus("Ready to play.");
    }
  });
})();
