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

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

/***********************
 * QUESTIONS DATABASE
 ***********************/
const allquestions = [
  {
    question: "Which symbol is used to end a statement in C?",
    options: [":", ".", ";", ","],
    correct: 2
  },
  {
    question: "Which HTML tag creates a hyperlink?",
    options: ["<link>", "<a>", "<url>", "<href>"],
    correct: 1
  },
  {
    question: "CSS stands for?",
    options: [
      "Creative Style Sheets",
      "Cascading Style Sheets",
      "Computer Style Sheets",
      "Colorful Style Sheets"
    ],
    correct: 1
  },
  {
    question: "Which is a JavaScript single-line comment?",
    options: ["<!-- -->", "//", "#", "/* */"],
    correct: 1
  },
  {
    question: "Which data type does NOT exist in C?",
    options: ["int", "float", "char", "string"],
    correct: 3
  }
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
let currentQuestionIndex = -1;
let timerInterval = null;
let timeLeft = 20;
let roundId = 0;

/***********************
 * HARD RESET
 ***********************/
function hardReset() {
  clearInterval(timerInterval);
  timerInterval = null;
  timeLeft = 20;
  roundId = 0;

  timerEl.textContent = "--";

  db.ref("quiz").set({
    state: "IDLE",
    roundId: 0,
    time: "--",
    question: null,
    winnerText: "",
    teamA: {
      score: 2000,
      bet: null,
      betRound: -1,
      answer: null
    },
    teamB: {
      score: 2000,
      bet: null,
      betRound: -1,
      answer: null
    }
  });
}

hardReset();

/***********************
 * START QUIZ
 ***********************/
function startQuiz() {
  currentQuestionIndex = 0;
  loadQuestion();

  startBtn.classList.add("hidden");
  nextBtn.classList.remove("hidden");
  restartBtn.classList.remove("hidden");
}

/***********************
 * LOAD QUESTION
 ***********************/
function loadQuestion() {
  clearInterval(timerInterval);

  timeLeft = 20;
  roundId++;

  db.ref("quiz").update({
    state: "RUNNING",
    roundId: roundId,
    time: timeLeft,
    question: allquestions[currentQuestionIndex]
  });

  // reset per-round data
  db.ref("quiz/teamA").update({
    bet: null,
    betRound: -1,
    answer: null
  });

  db.ref("quiz/teamB").update({
    bet: null,
    betRound: -1,
    answer: null
  });

  startTimer();
}

/***********************
 * TIMER (STARTS IMMEDIATELY)
 ***********************/
function startTimer() {
  timerEl.textContent = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    db.ref("quiz/time").set(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;

      db.ref("quiz/state").set("LOCKED");
      evaluateRound();
    }
  }, 1000);
}

/***********************
 * EVALUATE ROUND
 ***********************/
function evaluateRound() {
  db.ref("quiz").once("value", snap => {
    const data = snap.val();
    if (!data || !data.question) return;

    const correctIndex = data.question.correct;

    // TEAM A
    if(data.teamA.answer === NULL){
     db.ref("quiz/teamA/score")
        .set(data.teamA.score * 0.8);
    }
    else if (data.teamA.answer === correctIndex) {
      const rewardA = Math.floor(data.teamA.bet * 0.1);
      db.ref("quiz/teamA/score")
        .set(data.teamA.score + rewardA);
    }
    else{
    const rewardA = Math.floor(data.teamA.bet);
      db.ref("quiz/teamA/score")
        .set(data.teamA.score - rewardA);
    }

    // TEAM B
    if(data.teamB.answer === NULL){
     db.ref("quiz/teamB/score")
        .set(data.teamB.score * 0.8);
    }
    else if (data.teamB.answer === correctIndex) {
      const rewardB = Math.floor(data.teamB.bet * 0.1);
      db.ref("quiz/teamB/score")
        .set(data.teamB.score + rewardB);
    }
    else{
    const rewardB = Math.floor(data.teamB.bet );
      db.ref("quiz/teamB/score")
        .set(data.teamB.score - rewardB);
    }
  });
}

/***********************
 * NEXT QUESTION
 ***********************/
function nextQuestion() {
  currentQuestionIndex++;

  if (currentQuestionIndex >= allquestions.length) {
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
    if (!d) return;

    let result = "🏆 DRAW!";
    if (d.teamA.score > d.teamB.score) result = "🏆 TEAM A WINS!";
    if (d.teamB.score > d.teamA.score) result = "🏆 TEAM B WINS!";

    db.ref("quiz").update({
      state: "FINISHED",
      winnerText: result
    });

    winnerScreen.classList.remove("hidden");
    winnerText.textContent = result;
  });
}

/***********************
 * FIREBASE LISTENER
 ***********************/

db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;

  // Update scores
  scoreAEl.textContent = d.teamA.score;
  scoreBEl.textContent = d.teamB.score;

  // 🔥 ENABLE NEXT ONLY AFTER TIMER ENDS
  if (d.state === "LOCKED") {
    nextBtn.disabled = false;
    nextBtn.classList.remove("disabled-btn");
  } else {
    nextBtn.disabled = true;
    nextBtn.classList.add("disabled-btn");
  }
});


/***********************
 * EXPORTS
 ***********************/
window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.restartQuiz = hardReset;


