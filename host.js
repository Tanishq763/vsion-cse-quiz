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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/***********************
 * QUESTIONS
 ***********************/
const allquestions = [ /* ❗ YOUR SAME QUESTIONS (UNCHANGED) */ ];

/***********************
 * GLOBALS
 ***********************/
let questions = [];
let index = -1;
let timer = null;
let timeLeft = 20;
let roundId = 0;

/***********************
 * HARD RESET
 ***********************/
function hardReset() {
  clearInterval(timer);
  roundId = 0;

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
 * START QUIZ
 ***********************/
function startQuiz() {
  index = 0;
  questions = [...allquestions].sort(() => Math.random() - 0.5);
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
  if (index >= 5) return finishQuiz();
  loadQuestion();
}

/***********************
 * RESTART QUIZ
 ***********************/
function restartQuiz() {
  clearInterval(timer);
  index = -1;
  roundId = 0;
  timeLeft = 20;

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

  document.getElementById("startBtn").classList.remove("hidden");
  document.getElementById("nextBtn").classList.add("hidden");
  document.getElementById("restartBtn").classList.add("hidden");
  document.getElementById("timer").textContent = "--";
  document.getElementById("winnerScreen").classList.add("hidden");
}

/***********************
 * LOAD QUESTION
 ***********************/
function loadQuestion() {
  clearInterval(timer);
  timeLeft = 20;
  roundId++;

  const q = questions[index];

  db.ref("quiz").update({
    state: "BETTING",
    index,
    roundId,
    time: "--",
    question: q
  });

  db.ref("quiz/teamA").update({ bet: null, betRound: -1, answer: null });
  db.ref("quiz/teamB").update({ bet: null, betRound: -1, answer: null });

  document.getElementById("timer").textContent = "--";
}

/***********************
 * PLACE BET (🔥 NEW LOGIC)
 ***********************/
function placeBet(team, bet) {
  db.ref("quiz").once("value", snap => {
    const d = snap.val();
    if (!d) return;

    const score = d[team].score;
    if (bet <= 0 || bet > score) return;

    // 🔥 deduct immediately
    db.ref(`quiz/${team}`).update({
      score: score - bet,
      bet: bet,
      betRound: d.roundId
    });
  });
}

/***********************
 * WAIT FOR BOTH BETS
 ***********************/
db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;

  document.getElementById("scoreA").textContent = d.teamA.score;
  document.getElementById("scoreB").textContent = d.teamB.score;

  if (d.state !== "BETTING") return;

  if (
    d.teamA.betRound === d.roundId &&
    d.teamB.betRound === d.roundId
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
  document.getElementById("timer").textContent = timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    db.ref("quiz/time").set(timeLeft);
    document.getElementById("timer").textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      db.ref("quiz/state").set("LOCKED");
      evaluate();
    }
  }, 1000);
}

/***********************
 * EVALUATE (10% BONUS)
 ***********************/
function evaluate() {
  db.ref("quiz").once("value", snap => {
    const d = snap.val();
    if (!d || !d.question) return;

    const correct = d.question.correct;

    if (d.teamA.answer === correct) {
      const rewardA = Math.floor(d.teamA.bet * 1.10);
      db.ref("quiz/teamA/score").set(d.teamA.score + rewardA);
    }

    if (d.teamB.answer === correct) {
      const rewardB = Math.floor(d.teamB.bet * 1.10);
      db.ref("quiz/teamB/score").set(d.teamB.score + rewardB);
    }
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

/***********************
 * EXPORTS
 ***********************/
window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.restartQuiz = restartQuiz;
window.placeBet = placeBet;
