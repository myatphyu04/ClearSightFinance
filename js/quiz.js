/* ==========================================================================
   Clear Sight Finance – quiz.js
   The "Check your understanding" quiz on module.html.

   1. Waits for app.js to load the module ("clearsight:moduleloaded").
   2. Builds one radio-button group per question from moduleData.quiz.
   3. Check Answers: marks each answer and shows the overall score.
   4. Try Again: clears everything so the quiz can be taken again.

   The questions come only from the module's JSON file.
   ========================================================================== */

// Everything sits inside this function so the names below can't clash
// with names used in the other script files.
(function () {
  "use strict";

  const questionsContainer = document.getElementById("quiz-questions");
  const submitButton = document.getElementById("quiz-submit");
  const retryButton = document.getElementById("quiz-retry");
  const feedbackArea = document.getElementById("quiz-feedback");   // has aria-live="polite"

  // Stop quietly if this page has no quiz (e.g. index.html)
  if (!questionsContainer || !submitButton || !retryButton || !feedbackArea) {
    return;
  }

  const OPTIONS_PER_QUESTION = 3;

  let quizQuestions = [];    // the questions from the JSON file
  let questionGroups = [];   // the matching <fieldset> for each question


  // ---- Checking the quiz data ----------------------------------------------

  function isText(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  // Returns a description of the first problem found, or null if the quiz is fine
  function findQuizProblem(quiz) {
    if (!Array.isArray(quiz) || quiz.length === 0) {
      return "The quiz is missing or has no questions.";
    }

    for (let i = 0; i < quiz.length; i++) {
      const question = quiz[i];
      const label = "Question " + (i + 1) + ": ";

      if (!question || typeof question !== "object") {
        return label + "is not a valid question object.";
      }
      if (!isText(question.question)) {
        return label + "the question text is missing.";
      }
      if (!Array.isArray(question.options) ||
          question.options.length !== OPTIONS_PER_QUESTION ||
          !question.options.every(isText)) {
        return label + "it needs exactly " + OPTIONS_PER_QUESTION + " non-empty answer options.";
      }
      if (!Number.isInteger(question.correctIndex) ||
          question.correctIndex < 0 ||
          question.correctIndex >= OPTIONS_PER_QUESTION) {
        return label + "correctIndex must be 0, 1 or 2.";
      }
      if (!isText(question.explanation)) {
        return label + "the explanation is missing.";
      }
    }

    return null;
  }


  // ---- Overall message (the aria-live area) --------------------------------

  // A new <p> is added each time, so screen readers announce the message
  // even if the same text is shown twice in a row
  function showOverallMessage(text) {
    feedbackArea.textContent = "";
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    feedbackArea.appendChild(paragraph);
  }

  function clearOverallMessage() {
    feedbackArea.textContent = "";
  }


  // ---- Displaying the questions --------------------------------------------

  // Builds one question:
  //   <fieldset class="quiz-question">
  //     <legend>Question 1: …</legend>
  //     <div class="quiz-option">
  //       <input type="radio" name="quiz-q1" id="quiz-q1-option1" value="0">
  //       <label for="quiz-q1-option1">Answer text</label>
  //     </div> …
  //     <div class="quiz-question-feedback" hidden></div>
  //   </fieldset>
  function createQuestion(question, questionIndex) {
    const number = questionIndex + 1;

    const fieldset = document.createElement("fieldset");
    fieldset.className = "quiz-question";

    // The legend names the group, so screen readers read the question
    // when the user moves into its answers
    const legend = document.createElement("legend");
    legend.textContent = "Question " + number + ": " + question.question;
    fieldset.appendChild(legend);

    question.options.forEach(function (optionText, optionIndex) {
      const inputId = "quiz-q" + number + "-option" + (optionIndex + 1);

      const option = document.createElement("div");
      option.className = "quiz-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "quiz-q" + number;      // same name = one group, so only one answer per question
      input.id = inputId;
      input.value = String(optionIndex);   // the option's position, compared with correctIndex

      // for/id links the label to its radio button, so clicking the text selects it
      const label = document.createElement("label");
      label.htmlFor = inputId;
      label.textContent = optionText;

      option.appendChild(input);
      option.appendChild(label);
      fieldset.appendChild(option);
    });

    // Empty feedback box for this question, filled in after checking
    const feedback = document.createElement("div");
    feedback.className = "quiz-question-feedback";
    feedback.hidden = true;
    fieldset.appendChild(feedback);

    return fieldset;
  }

  function displayQuiz(quiz) {
    quizQuestions = quiz;
    questionGroups = [];
    questionsContainer.textContent = "";

    quiz.forEach(function (question, questionIndex) {
      const group = createQuestion(question, questionIndex);
      questionsContainer.appendChild(group);
      questionGroups.push(group);
    });

    clearOverallMessage();
    retryButton.hidden = true;
    submitButton.disabled = false;   // the quiz is ready to use
  }

  // Shown instead of the quiz if the data is broken
  function showQuizError() {
    quizQuestions = [];
    questionGroups = [];
    questionsContainer.textContent = "";
    submitButton.disabled = true;
    retryButton.hidden = true;
    showOverallMessage("Sorry, the questions for this module could not be loaded. You can still read the lesson above.");
  }


  // ---- Checking the answers ------------------------------------------------

  // Returns the chosen option's position (0, 1 or 2), or -1 if nothing is chosen
  function getSelectedIndex(group) {
    const checked = group.querySelector('input[type="radio"]:checked');
    return checked ? Number(checked.value) : -1;
  }

  function getResultMessage(score, total) {
    const scoreText = "You got " + score + " out of " + total + " correct. ";

    if (score === total) {
      return scoreText + "Well done! You can read the explanations under each question.";
    }
    if (score === 0) {
      return scoreText + "That is okay. Have another look at the explanations under each question and try again.";
    }
    return scoreText + "Good effort! Have a look at the feedback under each question.";
  }

  // Fills in the feedback box under one question.
  // The words "Correct!" or "Not quite." show the result, so it doesn't rely on colour.
  function showQuestionFeedback(group, question, isCorrect) {
    const feedback = group.querySelector(".quiz-question-feedback");
    feedback.textContent = "";
    feedback.classList.remove("quiz-correct", "quiz-incorrect");
    feedback.classList.add(isCorrect ? "quiz-correct" : "quiz-incorrect");

    const result = document.createElement("p");
    const resultText = document.createElement("strong");
    resultText.textContent = isCorrect ? "Correct!" : "Not quite.";
    result.appendChild(resultText);
    feedback.appendChild(result);

    if (!isCorrect) {
      const correctAnswer = document.createElement("p");
      correctAnswer.textContent = "The correct answer is: " + question.options[question.correctIndex];
      feedback.appendChild(correctAnswer);
    }

    const explanation = document.createElement("p");
    explanation.textContent = question.explanation;
    feedback.appendChild(explanation);

    feedback.hidden = false;
  }

  function checkAnswers() {
    if (questionGroups.length === 0) return;   // no quiz loaded

    // 1. Make sure every question has an answer before marking anything
    const unanswered = [];
    questionGroups.forEach(function (group, index) {
      if (getSelectedIndex(group) === -1) {
        unanswered.push(index + 1);
      }
    });

    if (unanswered.length > 0) {
      if (unanswered.length === 1) {
        showOverallMessage("Please answer Question " + unanswered[0] + " before checking your answers.");
      } else {
        showOverallMessage("Please answer all the questions before checking your answers.");
      }
      return;   // focus stays on Check Answers, so the user can carry on
    }

    // 2. Mark each question and count the correct answers
    let score = 0;

    questionGroups.forEach(function (group, index) {
      const question = quizQuestions[index];
      const isCorrect = getSelectedIndex(group) === question.correctIndex;

      if (isCorrect) {
        score = score + 1;
      }

      showQuestionFeedback(group, question, isCorrect);

      // Disabling the fieldset locks all its radio buttons until Try Again
      group.disabled = true;
    });

    // 3. Show the score (announced by the aria-live area) and switch buttons
    showOverallMessage(getResultMessage(score, quizQuestions.length));
    submitButton.disabled = true;
    retryButton.hidden = false;

    // Check Answers is now disabled, so move focus to the next useful control
    // instead of letting it disappear
    retryButton.focus();
  }


  // ---- Try Again -----------------------------------------------------------

  function resetQuiz() {
    questionGroups.forEach(function (group) {
      group.disabled = false;

      group.querySelectorAll('input[type="radio"]').forEach(function (input) {
        input.checked = false;
      });

      const feedback = group.querySelector(".quiz-question-feedback");
      feedback.textContent = "";
      feedback.classList.remove("quiz-correct", "quiz-incorrect");
      feedback.hidden = true;
    });

    clearOverallMessage();
    retryButton.hidden = true;
    submitButton.disabled = false;

    // Try Again is now hidden, so put focus on the first answer to start again
    const firstOption = questionsContainer.querySelector('input[type="radio"]');
    if (firstOption) {
      firstOption.focus();
    }
  }


  // ---- Start-up ------------------------------------------------------------

  // The buttons are set up once; they do nothing until a quiz is displayed
  submitButton.addEventListener("click", checkAnswers);
  retryButton.addEventListener("click", resetQuiz);

  // app.js sends this event after the module has loaded
  document.addEventListener("clearsight:moduleloaded", function (event) {
    const detail = event.detail || {};
    const quiz = detail.moduleData ? detail.moduleData.quiz : undefined;

    const problem = findQuizProblem(quiz);

    if (problem) {
      console.error("Clear Sight Finance: quiz data is invalid.", problem, quiz);
      showQuizError();
      return;
    }

    displayQuiz(quiz);
  });
})();
