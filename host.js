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
 * QUESTIONS
 ***********************/
const allquestions = [
  { question:"Which symbol ends a C statement?", options:[":",".",";","?"], correct:2 },
  { question:"HTML hyperlink tag?", options:["<a>","<link>","<url>","<href>"], correct:0 },
  { question:"CSS stands for?", options:["Creative","Cascading","Color","Coding"], correct:1 },
  { question:"JS single-line comment?", options:["#","//","<!--","**"], correct:1 },
  { question:"Which is NOT a C data type?", options:["int","float","char","string"], correct:3 }
];

/***********************
 * DOM ELEMENTS
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
 * GLOBAL STATE
 ***********************/
let index = -1;
let timer = null;
let timeLeft = 20;
let roundId = 0;

/***********************
 * HARD RESET (FIRST LOAD ONLY)
 ***********************/
function hardReset() {
  clearInterval(timer);
  timer = null;

  db.ref("quiz").set({
    state: "IDLE",
    roundId: 0,
    time: "--",
    question: null,
    winnerText: "",
    teamA: { score: 2000, bet: null, answer: null },
    teamB: { score: 2000, bet: null, answer: null }
  });
}
hardReset();

/***********************
 * START QUIZ
 ***********************/
function startQuiz() {
  index = 0;
  loadQuestion();

  startBtn.classList.add("hidden");
  nextBtn.classList.remove("hidden");
  restartBtn.classList.remove("hidden");
}

/***********************
 * LOAD QUESTION (⚠️ SCORE SAFE)
 ***********************/
function loadQuestion() {
  clearInterval(timer);
  timeLeft = 20;
  roundId++;

  // ✅ UPDATE ONLY – DO NOT TOUCH SCORE
  db.ref("quiz").update({
    state: "RUNNING",
    roundId,
    time: timeLeft,
    question: allquestions[index]
  });

  // reset per-round values only
  db.ref("quiz/teamA").update({ bet: null, answer: null });
  db.ref("quiz/teamB").update({ bet: null, answer: null });

  startTimer();
}

/***********************
 * TIMER (STARTS IMMEDIATELY)
 ***********************/
function startTimer() {
  timerEl.textContent = timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    db.ref("quiz/time").set(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timer);
      timer = null;
      db.ref("quiz/state").set("LOCKED");
      evaluate();
    }
  }, 1000);
}

/***********************
 * EVALUATE (FINAL SCORING LOGIC)
 ***********************/
function evaluate() {
  db.ref("quiz").once("value", snap => {
    const d = snap.val();
    if (!d || !d.question) return;

    const correct = d.question.correct;

    // TEAM A
    let scoreA = d.teamA.score;
    if (d.teamA.answer === null) {
      scoreA -= Math.floor(scoreA * 0.20);
    } else if (d.teamA.answer === correct) {
      scoreA += Math.floor(d.teamA.bet * 1.10);
    } else {
      scoreA -= d.teamA.bet;
    }

    // TEAM B
    let scoreB = d.teamB.score;
    if (d.teamB.answer === null) {
      scoreB -= Math.floor(scoreB * 0.20);
    } else if (d.teamB.answer === correct) {
      scoreB += Math.floor(d.teamB.bet * 1.10);
    } else {
      scoreB -= d.teamB.bet;
    }

    db.ref("quiz/teamA/score").set(scoreA);
    db.ref("quiz/teamB/score").set(scoreB);
  });
}

/***********************
 * NEXT QUESTION
 ***********************/
function nextQuestion() {
  index++;
  if (index >= allquestions.length) {
    finishQuiz();
    return;
  }
  loadQuestion();
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

    winnerText.textContent = text;
    winnerScreen.classList.remove("hidden");
  });
}

/***********************
 * RESTART QUIZ (RELOAD ALL)
 ***********************/
function restartQuiz() {
  db.ref("quiz").remove().then(() => {
    location.reload();
  });
}

/***********************
 * FIREBASE LISTENER
 ***********************/
db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;

  scoreAEl.textContent = d.teamA.score;
  scoreBEl.textContent = d.teamB.score;

  // enable NEXT only after round ends
  nextBtn.disabled = d.state !== "LOCKED";
});

/***********************
 * EXPORTS
 ***********************/
window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.restartQuiz = restartQuiz;
