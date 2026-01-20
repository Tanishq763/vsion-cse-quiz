/***********************
 * FIREBASE SETUP
 ***********************/
const firebaseConfig = {
  apiKey: "AIzaSyDREhmA6fyafxw8dJqh30B5pjfdEAjf3no",
  authDomain: "vision-cse-quiz.firebaseapp.com",
  databaseURL: "https://vision-cse-quiz-default-rtdb.firebaseio.com",
  projectId: "vision-cse-quiz",
  storageBucket: "vision-cse-quiz.firebasestorage.app",
  messagingSenderId: "1012496127258",
  appId: "1:1012496127258:web:345bf07712c4b90fbdc8a3"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const allquestions = [

/* =========================
   C PROGRAMMING
========================= */

{
  question: "Which of the following is a valid variable name in C?",
  options: ["2num", "num_2", "float", "num-2"],
  correct: 1
},
{
  question: "Which symbol is used to terminate a statement in C?",
  options: [":", ".", ";", ","],
  correct: 2
},
{
  question: "What is the default value of an uninitialized local variable in C?",
  options: ["0", "Garbage value", "NULL", "Depends on compiler"],
  correct: 1
},
{
  question: "Which data type is used to store decimal values in C?",
  options: ["int", "char", "float", "long"],
  correct: 2
},
{
  question: "Which header file is required for printf()?",
  options: ["stdlib.h", "stdio.h", "string.h", "math.h"],
  correct: 1
},
{
  question: "What does sizeof operator return?",
  options: ["Value", "Address", "Size in bytes", "Data type"],
  correct: 2
},
{
  question: "Which loop is guaranteed to execute at least once?",
  options: ["for", "while", "do-while", "foreach"],
  correct: 2
},
{
  question: "Which operator is used to access value at an address?",
  options: ["&", "*", "#", "%"],
  correct: 1
},
{
  question: "What is the correct way to declare a pointer?",
  options: ["int p;", "int *p;", "pointer p;", "int &p;"],
  correct: 1
},
{
  question: "Which function is used to dynamically allocate memory?",
  options: ["alloc()", "malloc()", "memory()", "new()"],
  correct: 1
},

/* =========================
   WEB DEVELOPMENT (HTML)
========================= */

{
  question: "What does HTML stand for?",
  options: [
    "Hyper Trainer Marking Language",
    "Hyper Text Markup Language",
    "Hyper Text Marketing Language",
    "Hyper Transfer Markup Language"
  ],
  correct: 1
},
{
  question: "Which HTML tag is used to create a hyperlink?",
  options: ["<link>", "<a>", "<href>", "<url>"],
  correct: 1
},
{
  question: "Which attribute is used to open a link in a new tab?",
  options: ["new", "open", "target", "href"],
  correct: 2
},
{
  question: "Which HTML tag is used to insert an image?",
  options: ["<img>", "<image>", "<pic>", "<src>"],
  correct: 0
},
{
  question: "Which tag is used for the largest heading?",
  options: ["<heading>", "<h6>", "<h1>", "<head>"],
  correct: 2
},

/* =========================
   CSS
========================= */

{
  question: "What does CSS stand for?",
  options: [
    "Creative Style Sheets",
    "Computer Style Sheets",
    "Cascading Style Sheets",
    "Colorful Style Sheets"
  ],
  correct: 2
},
{
  question: "Which CSS property changes text color?",
  options: ["font-color", "text-color", "color", "fgcolor"],
  correct: 2
},
{
  question: "Which symbol is used for class selector?",
  options: [".", "#", "*", "&"],
  correct: 0
},
{
  question: "Which CSS property is used to change background color?",
  options: ["bgcolor", "background-color", "color", "background"],
  correct: 1
},
{
  question: "Which unit is relative to screen size?",
  options: ["px", "cm", "em", "vw"],
  correct: 3
},

/* =========================
   JAVASCRIPT
========================= */

{
  question: "Which keyword is used to declare a variable in JavaScript?",
  options: ["int", "var", "float", "string"],
  correct: 1
},
{
  question: "Which symbol is used for single-line comments in JavaScript?",
  options: ["<!-- -->", "#", "//", "/* */"],
  correct: 2
},
{
  question: "Which function prints output to the browser console?",
  options: ["print()", "log()", "console.log()", "write()"],
  correct: 2
},
{
  question: "Which data type is NOT supported in JavaScript?",
  options: ["Number", "Boolean", "Character", "String"],
  correct: 2
},
{
  question: "What does DOM stand for?",
  options: [
    "Document Object Model",
    "Data Object Method",
    "Digital Output Mode",
    "Document Oriented Model"
  ],
  correct: 0
}

];

/***********************
 * DOM ELEMENTS (🔥 FIX)
 ***********************/
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const timerEl = document.getElementById("timer");
const scoreAEl = document.getElementById("scoreA");
const scoreBEl = document.getElementById("scoreB");
const winnerScreen = document.getElementById("winnerScreen");
const winnerText = document.getElementById("winnerText");

/***********************
 * SOUNDS
 ***********************/

const sndTick  = document.getElementById("sndTick");
const sndWin   = document.getElementById("sndWin");
const sndLose  = document.getElementById("sndLose");

/***********************
 * GLOBALS
 ***********************/
let questions = [];
let index = -1;
let timerInterval = null;
let timeLeft = 20;
let roundId = 0;
let timerStarted = false;

let lastScoreA = 2000;
let lastScoreB = 2000;
let confettiPlayed = false;

/***********************
 * HARD RESET
 ***********************/
function hardReset() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerStarted = false;
  confettiPlayed = false;

  timerEl.textContent = "--";

  db.ref("quiz").set({
    state: "IDLE",
    index: -1,
    roundId: 0,
    time: "--",
    question: null,
    winnerText: "",
    teamA: { score: 2000, bet: null, betRound: -1, answer: null },
    teamB: { score: 2000, bet: null, betRound: -1, answer: null }
  });
}

hardReset();

/***********************
 * QUIZ CONTROLS
 ***********************/
function startQuiz() {


  index = 0;
  questions = [...allquestions].sort(() => Math.random() - 0.5);
  loadQuestion();

  startBtn.classList.add("hidden");
  nextBtn.classList.remove("hidden");
  restartBtn.classList.remove("hidden");
}

function nextQuestion() {
  index++;
  if (index >= 5) {
    finishQuiz();
    return;
  }
  loadQuestion();
}

function restartQuiz() {
  hardReset();
  startBtn.classList.remove("hidden");
  nextBtn.classList.add("hidden");
  restartBtn.classList.add("hidden");
}

function toggleFullscreen() {
  if (!document.fullscreenElement)
    document.documentElement.requestFullscreen();
  else
    document.exitFullscreen();
}

/***********************
 * LOAD QUESTION
 ***********************/
function loadQuestion() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerStarted = false;

  timeLeft = 20;
  roundId++;

  timerEl.classList.remove("timer-danger");
  timerEl.textContent = "--";

  db.ref("quiz").update({
    state: "BETTING",
    index,
    roundId,
    time: "--",
    question: questions[index]
  });

  db.ref("quiz/teamA").update({ bet: null, betRound: -1, answer: null });
  db.ref("quiz/teamB").update({ bet: null, betRound: -1, answer: null });
}

/***********************
 * START TIMER (SAFE)
 ***********************/
function startTimer() {
  if (timerStarted) return; // 🔒 prevent double start
  timerStarted = true;

  db.ref("quiz/state").set("RUNNING");

  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    db.ref("quiz/time").set(timeLeft);

    if (timeLeft <= 5 && timeLeft > 0) {
      sndTick.play();
      timerEl.classList.add("timer-danger");
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerEl.classList.remove("timer-danger");

      db.ref("quiz/state").set("LOCKED");
      evaluate();
    }
  }, 1000);
}

/***********************
 * FIREBASE LISTENER
 ***********************/
db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;

  // Scores + flash
  scoreAEl.textContent = d.teamA.score;
  scoreBEl.textContent = d.teamB.score;

  if (d.teamA.score !== lastScoreA) {
    flashScore(scoreAEl, d.teamA.score > lastScoreA);
    lastScoreA = d.teamA.score;
  }
  if (d.teamB.score !== lastScoreB) {
    flashScore(scoreBEl, d.teamB.score > lastScoreB);
    lastScoreB = d.teamB.score;
  }

  // Enable next + start timer when BOTH bets done
  if (
    d.state === "BETTING" &&
    d.teamA.betRound === d.roundId &&
    d.teamB.betRound === d.roundId
  ) {
    nextBtn.disabled = false;
    nextBtn.classList.remove("disabled-btn");
    startTimer();
  } else {
    nextBtn.disabled = true;
    nextBtn.classList.add("disabled-btn");
  }
});

/***********************
 * SCORE FLASH + SOUND
 ***********************/
function flashScore(el, win) {
  el.classList.remove("flash-green", "flash-red");
  void el.offsetWidth;
  el.classList.add(win ? "flash-green" : "flash-red");
  win ? sndWin.play() : sndLose.play();
}

/***********************
 * CONFETTI
 ***********************/
function launchConfetti() {
  const colors = ["#00f0ff", "#ffd166", "#00ff99", "#ff4d4d", "#a855f7"];
  for (let i = 0; i < 120; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}

/***********************
 * FINISH QUIZ
 ***********************/
function finishQuiz() {
  db.ref("quiz").once("value", snap => {
    const d = snap.val();

    let text = "🏆 DRAW!";
    if (d.teamA.score > d.teamB.score) text = "🏆 TEAM A WINS!";
    if (d.teamB.score > d.teamA.score) text = "🏆 TEAM B WINS!";

    db.ref("quiz").update({
      state: "FINISHED",
      winnerText: text
    });

    winnerScreen.classList.remove("hidden");
    winnerText.textContent = text;

    if (!confettiPlayed) {
      confettiPlayed = true;
      launchConfetti();
    }
  });
}

/***********************
 * EXPORTS (🔥 REQUIRED)
 ***********************/
window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.restartQuiz = restartQuiz;
window.toggleFullscreen = toggleFullscreen;


