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
 * GLOBAL STATE
 ***********************/
let index = -1;
let timer = null;
let timeLeft = 10;
let timerStarted = false;

/***********************
 * INITIAL STATE
 ***********************/
db.ref("quiz").set({
  started: false,
  finished: false,
  betsOpen: false,
  teamA: { score: 0 },
  teamB: { score: 0 }
});

/***********************
 * START QUIZ
 ***********************/
function startQuiz() {
  index = 0;

  db.ref("quiz").update({
    started: true,
    finished: false
  });

  document.getElementById("startBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.remove("hidden");
  document.getElementById("restartBtn").classList.remove("hidden");
  document.getElementById("winnerScreen").classList.add("hidden");

  loadQuestion();
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
  clearInterval(timer);
  index = -1;
  timerStarted = false;

  db.ref("quiz").set({
    started: false,
    finished: false,
    betsOpen: false,
    teamA: { score: 0 },
    teamB: { score: 0 }
  });

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
  timerStarted = false;
  timeLeft = 10;

  const q = questions[index];

  db.ref("quiz").update({
    index,
    time: "--",
    betsOpen: true,
    question: {
      question: q.question,
      options: q.options,
      correct: q.correct
    }
  });

  db.ref("quiz/teamA/answer").set(null);
  db.ref("quiz/teamA/bet").set(null);
  db.ref("quiz/teamB/answer").set(null);
  db.ref("quiz/teamB/bet").set(null);

  document.getElementById("timer").textContent = "--";
}

/***********************
 * WAIT FOR BOTH BETS
 ***********************/
db.ref("quiz").on("value", snap => {
  const data = snap.val();
  if (!data || !data.started || data.finished) return;

  document.getElementById("scoreA").textContent = data.teamA?.score ?? 0;
  document.getElementById("scoreB").textContent = data.teamB?.score ?? 0;

  if (timerStarted) return;

  if (
    data.betsOpen &&
    typeof data.teamA?.bet === "number" &&
    typeof data.teamB?.bet === "number"
  ) {
    startTimer();
  }
});

/***********************
 * TIMER
 ***********************/
function startTimer() {
  timerStarted = true;
  timeLeft = 10;

  db.ref("quiz/betsOpen").set(false);
  db.ref("quiz/time").set(timeLeft);

  document.getElementById("timer").textContent = timeLeft;

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
    const data = snap.val();
    if (!data) return;

    const correct = data.question.correct;

    let a = data.teamA?.score ?? 0;
    let b = data.teamB?.score ?? 0;

    if (data.teamA?.answer !== null)
      a += data.teamA.answer === correct ? data.teamA.bet : -data.teamA.bet;

    if (data.teamB?.answer !== null)
      b += data.teamB.answer === correct ? data.teamB.bet : -data.teamB.bet;

    db.ref("quiz/teamA/score").set(a);
    db.ref("quiz/teamB/score").set(b);
  });
}

/***********************
 * FINISH QUIZ
 ***********************/
function finishQuiz() {
  db.ref("quiz").once("value", snap => {
    const data = snap.val();
    let text = "🏆 DRAW!";
    if (data.teamA.score > data.teamB.score) text = "🏆 TEAM A WINS!";
    if (data.teamB.score > data.teamA.score) text = "🏆 TEAM B WINS!";

    db.ref("quiz").update({
      finished: true,
      winnerText: text
    });

    document.getElementById("winnerScreen").classList.remove("hidden");
    document.getElementById("winnerText").textContent = text;
  });
}

window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.restartQuiz = restartQuiz;
