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
let timerStarted = false;

/***********************
 * START QUIZ
 ***********************/
function startQuiz() {
  index = 0;
  document.getElementById("startBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.remove("hidden");
  loadQuestion();
}

/***********************
 * NEXT QUESTION
 ***********************/
function nextQuestion() {
  index++;
  if (index >= questions.length) {
    alert("Quiz Finished");
    return;
  }
  loadQuestion();
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
    question: {
      question: q.question,
      options: q.options,
      correct: q.correct
    },
    teamA: { answer: null, bet: null },
    teamB: { answer: null, bet: null }
  });

  document.getElementById("timer").textContent = "--";
}

/***********************
 * WAIT FOR BOTH BETS
 ***********************/
db.ref("quiz").on("value", snap => {
  const data = snap.val();
  if (!data) return;

  // Update scores live
  document.getElementById("scoreA").textContent = data.teamA?.score ?? 0;
  document.getElementById("scoreB").textContent = data.teamB?.score ?? 0;

  if (timerStarted) return;

  if (
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

    if (data.teamA?.answer !== null) {
      a += data.teamA.answer === correct ? data.teamA.bet : -data.teamA.bet;
    }

    if (data.teamB?.answer !== null) {
      b += data.teamB.answer === correct ? data.teamB.bet : -data.teamB.bet;
    }

    db.ref("quiz/teamA/score").set(a);
    db.ref("quiz/teamB/score").set(b);
  });
}

window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
