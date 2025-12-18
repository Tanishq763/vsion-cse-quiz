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
  // your full list stays same
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
 * LOAD QUESTION (NO TIMER HERE)
 ***********************/
function loadQuestion() {
  clearInterval(timer);
  timerStarted = false;
  timeLeft = 10;

  const q = questions[index];

  db.ref("quiz").set({
    index,
    time: "--",
    question: {
      question: q.question,
      options: q.options,
      correct: q.correct
    },
    teamA: { answer: null, bet: null, score: 0 },
    teamB: { answer: null, bet: null, score: 0 }
  });

  document.getElementById("timer").textContent = "--";
}

/***********************
 * LISTEN FOR BETS → START TIMER
 ***********************/
db.ref("quiz").on("value", snap => {
  const data = snap.val();
  if (!data || timerStarted) return;

  const betA = data.teamA?.bet;
  const betB = data.teamB?.bet;

  if (typeof betA === "number" && typeof betB === "number") {
    startTimer();
  }
});

/***********************
 * TIMER
 ***********************/
function startTimer() {
  timerStarted = true;
  timeLeft = 10;

  document.getElementById("timer").textContent = timeLeft;
  db.ref("quiz/time").set(timeLeft);

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = timeLeft;
    db.ref("quiz/time").set(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timer);
      evaluate();
    }
  }, 1000);
}

/***********************
 * EVALUATE ANSWERS
 ***********************/
function evaluate() {
  db.ref("quiz").once("value", snap => {
    const data = snap.val();
    const correct = data.question.correct;

    let a = data.teamA.score;
    let b = data.teamB.score;

    if (data.teamA.answer !== null)
      a += data.teamA.answer === correct ? data.teamA.bet : -data.teamA.bet;

    if (data.teamB.answer !== null)
      b += data.teamB.answer === correct ? data.teamB.bet : -data.teamB.bet;

    db.ref("quiz/teamA/score").set(a);
    db.ref("quiz/teamB/score").set(b);
  });
}

window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
