/***********************
 * FIREBASE SETUP
 ***********************/
const firebaseConfig = {
  apiKey: "AIzaSyAF_enzLhyTIymgOooZYBfz0w5FnKsL1nw",
  authDomain: "vison-cse-quiz.firebaseapp.com",
  databaseURL: "https://vison-cse-quiz-default-rtdb.firebaseio.com",
  projectId: "vison-cse-quiz",
  storageBucket: "vison-cse-quiz.firebasestorage.app",
  messagingSenderId: "961037861554",
  appId: "1:961037861554:web:e155fc16fdd74ca503bfab"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/***********************
 * QUESTIONS
 ***********************/
const questions = [
  {
    question: "Which data structure follows FIFO order?",
    options: ["Stack", "Queue", "Array", "Tree"],
    correct: 1
  },
  {
    question: "Which keyword is used to define a function in Python?",
    options: ["function", "define", "def", "fun"],
    correct: 2
  }
];

/***********************
 * GLOBALS
 ***********************/
let index = -1;
let timer = null;
let timeLeft = 10;

/***********************
 * RESET EVERYTHING (SAFE)
 ***********************/
function hardReset() {
  clearInterval(timer);
  db.ref("quiz").set({
    state: "IDLE",
    index: -1,
    time: "--",
    question: null,
    teamA: { score: 0, bet: null, answer: null },
    teamB: { score: 0, bet: null, answer: null },
    winnerText: ""
  });
}

/***********************
 * INIT
 ***********************/
hardReset();

/***********************
 * START QUIZ
 ***********************/
function startQuiz() {
  index = 0;
  loadQuestion();

  document.getElementById("startBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.remove("hidden");
  document.getElementById("restartBtn").classList.remove("hidden");
  document.getElementById("winnerScreen").classList.add("hidden");
}

/***********************
 * NEXT QUESTION
 ***********************/
function nextQuestion() {
  index++;
  if (index >= questions.length) {
    finishQuiz();
    return;
  }
  loadQuestion();
}

/***********************
 * RESTART QUIZ
 ***********************/
function restartQuiz() {
  hardReset();

  document.getElementById("startBtn").classList.remove("hidden");
  document.getElementById("nextBtn").classList.add("hidden");
  document.getElementById("restartBtn").classList.add("hidden");
  document.getElementById("winnerScreen").classList.add("hidden");
  document.getElementById("timer").textContent = "--";
}

/***********************
 * LOAD QUESTION
 ***********************/
function loadQuestion() {
  clearInterval(timer);
  timeLeft = 10;

  const q = questions[index];

  db.ref("quiz").update({
    state: "BETTING",
    index,
    time: "--",
    question: q
  });

  db.ref("quiz/teamA/bet").set(null);
  db.ref("quiz/teamA/answer").set(null);
  db.ref("quiz/teamB/bet").set(null);
  db.ref("quiz/teamB/answer").set(null);

  document.getElementById("timer").textContent = "--";
}

/***********************
 * LISTEN FOR BETS
 ***********************/
db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d || d.state !== "BETTING") return;

  document.getElementById("scoreA").textContent = d.teamA.score;
  document.getElementById("scoreB").textContent = d.teamB.score;

  if (
    typeof d.teamA.bet === "number" &&
    typeof d.teamB.bet === "number"
  ) {
    startTimer();
  }
});

/***********************
 * TIMER
 ***********************/
function startTimer() {
  db.ref("quiz/state").set("RUNNING");
  db.ref("quiz/time").set(timeLeft);

  timer = setInterval(() => {
    timeLeft--;
    db.ref("quiz/time").set(timeLeft);
    document.getElementById("timer").textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      evaluate();
    }
  }, 1000);
}

/***********************
 * EVALUATE
 ***********************/
function evaluate() {
  db.ref("quiz").once("value", snap => {
    const d = snap.val();
    const c = d.question.correct;

    let a = d.teamA.score;
    let b = d.teamB.score;

    if (d.teamA.answer !== null)
      a += d.teamA.answer === c ? d.teamA.bet : -d.teamA.bet;

    if (d.teamB.answer !== null)
      b += d.teamB.answer === c ? d.teamB.bet : -d.teamB.bet;

    db.ref("quiz/teamA/score").set(a);
    db.ref("quiz/teamB/score").set(b);
  });
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

    document.getElementById("winnerScreen").classList.remove("hidden");
    document.getElementById("winnerText").textContent = text;
  });
}

window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.restartQuiz = restartQuiz;
