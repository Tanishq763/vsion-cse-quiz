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
const sndStart = document.getElementById("sndStart");
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
  sndStart.play();

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
