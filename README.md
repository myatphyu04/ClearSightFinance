# Clear Sight Finance

Clear Sight Finance is a financial safety guide that teaches people how to spot scams, protect their money and know what to do if something goes wrong. It is designed with accessibility in mind, particularly for people with sight loss and anyone who prefers to learn by listening.

## Project overview

Financial scams are becoming more convincing, and anyone can be targeted. A lot of online safety advice is presented in ways that are hard to use with a screen reader, a screen magnifier or a keyboard, which can leave the people who most need the information without easy access to it.

Clear Sight Finance aims to make this guidance easier to reach. The website is designed for:

- people with sight loss or low vision
- people who prefer to learn by listening rather than reading
- anyone who wants a calm, plain-English introduction to financial safety

Each learning module can be used in three ways. Users can read the lesson, listen to it being read aloud while each sentence is highlighted, and then answer a few short questions to check what they have learned.

## Features

### Interactive learning modules

- Three learning modules about financial scam awareness.
- Written lessons split into short sections, each with a safety tip.
- A short quiz at the end of each module, with feedback on every answer, an overall score and a Try Again option.
- Previous Module, Next Module and Back to Home links between modules.

### Audio narration

- Browser-based text-to-speech using the Web Speech API (no audio files are needed).
- Play, Pause, Resume and Stop controls.
- Adjustable playback speed (0.75×, 1×, 1.25× and 1.5×).
- Sentence highlighting that follows the narration, covering lesson headings, sentences and safety tips.
- A status message that is announced to screen readers (for example "Playing" or "Paused").
- A clear message if the browser does not support speech.

### Accessibility features

- High-contrast mode (yellow on black).
- Adjustable text sizes (A, A+ and A++).
- Contrast and text-size settings are remembered between visits using the browser's local storage.
- Keyboard navigation for all controls, including the audio player and the quiz.
- A Keyboard Help dialog that explains how to use the website with a keyboard.
- A Skip to main content link.
- Visible keyboard focus indicators.
- Semantic HTML, including landmarks, headings, and quiz questions grouped with `fieldset` and `legend`.
- Labelled form controls and live regions for status and quiz feedback messages.
- A responsive, mobile-first layout.

## Learning modules

1. **Spotting the Scam** – recognising common scam warning signs, people pretending to be trusted organisations, and how to check a suspicious message safely.
2. **Protecting Yourself Day to Day** – everyday habits for keeping bank details, passwords, online payments and personal information safe.
3. **What to Do If It Happens** – the steps to take if you think you have been scammed, from contacting your bank to securing your accounts and reporting what happened.

Each module has four lesson sections and two quiz questions.

## Technologies used

- **HTML5** – page structure and semantic elements.
- **CSS3** – styling, responsive layout and the high-contrast and text-size themes.
- **JavaScript** (vanilla, no frameworks) – loading lesson content, audio narration, quizzes, settings and keyboard help.
- **JSON** – storing the lesson content and quiz questions for each module.
- **Web Speech API** – browser-based text-to-speech.

No external libraries, frameworks or build tools are used.

## Project structure

```
ClearSightFinance/
├── index.html          Homepage with an introduction and the three module cards
├── module.html         Reusable module page (module.html?m=1, ?m=2 or ?m=3)
├── README.md
├── content/
│   ├── module1.json    Spotting the Scam
│   ├── module2.json    Protecting Yourself Day to Day
│   └── module3.json    What to Do If It Happens
├── css/
│   ├── base.css        Main layout, colours and component styles
│   └── themes.css      High-contrast mode and text-size settings
└── js/
    ├── settings.js     High contrast and text size, saved in local storage
    ├── app.js          Loads the module JSON and builds the lesson page
    ├── player.js       Audio narration and sentence highlighting
    ├── quiz.js         Builds and checks the quiz
    └── keyboard.js     Keyboard Help dialog and Skip to main content
```

`module.html` is a single page shared by all three modules. `app.js` reads the module number from the address, loads the matching JSON file and builds the lesson. It then passes the lesson to `player.js` and the quiz questions to `quiz.js`. Keeping the content in JSON means lessons can be edited without changing the code.

## How to run locally

1. Download or clone this repository.
2. Open the project folder in Visual Studio Code.
3. Install the **Live Server** extension if you do not already have it.
4. Right-click `index.html` and choose **Open with Live Server**.
5. Use the module cards or the navigation menu to work through the three modules.

A local server is needed because the module content is loaded from JSON files using JavaScript `fetch()`. Most browsers block these requests when a page is opened directly from the file system, so opening `module.html` by double-clicking it will show an error instead of the lesson.

Audio narration depends on the browser supporting the Web Speech API. The voices available depend on the browser and operating system.

## Accessibility and testing

Accessibility has been considered throughout the project:

- Colours were chosen to give strong contrast in both the standard and high-contrast themes.
- All sizes use relative units, so text, spacing and buttons scale together with the A, A+ and A++ settings.
- Focus outlines are never removed from interactive elements.
- Sentence highlighting uses a coloured background with an outline, so it does not rely on colour alone, and it does not move the surrounding text.
- Controls use native HTML elements (buttons, links, radio buttons, a select menu and a `dialog`), so they work with the keyboard and assistive technologies without custom key handling.

### Automated checks

The WAVE browser extension was used to check accessibility. WAVE checks of the homepage and Module 1 reported zero errors and zero contrast errors. WAVE also raised "possible heading" alerts, which were reviewed and treated as contextual warnings rather than errors.

Automated tools can only detect some types of accessibility problem, so they do not replace manual testing.

### Manual testing

Manual testing should cover:

- keyboard navigation, including the Skip to main content link and the Keyboard Help dialog
- the audio controls (Play, Pause, Resume, Stop and playback speed)
- sentence highlighting during narration
- quiz interactions, feedback and Try Again
- high-contrast mode
- the A, A+ and A++ text sizes
- responsive layouts on mobile, tablet and desktop screen sizes

This project does not claim full WCAG compliance. Further testing with screen readers and other assistive technologies is still needed.

## Known limitations

- The narration voices available differ between browsers, operating systems and devices.
- Text-to-speech behaviour, such as pausing and resuming, can vary depending on browser support for the Web Speech API.
- The website must be served from a web server (or a local server such as Live Server) for the module content to load.
- The website provides general educational information. It does not give personalised financial advice.

## Future improvements

These are ideas for future work and are not yet implemented:

- More financial safety learning modules.
- Additional practice quizzes and realistic scam scenarios.
- Further accessibility testing with screen readers and other assistive technologies, including testing with users.

## Live demo

[Visit Clear Sight Finance](https://myatphyu04.github.io/ClearSightFinance/)

## Author

Myat Noe Kyi Phyu – Computer Science student

Github: https://github.com/myatphyu04
