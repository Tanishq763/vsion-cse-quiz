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

let questions = [];
let index = -1;
let timer = null;
let timeLeft = 20;
let roundId = 0;

let lastScoreA = 2000;
let lastScoreB = 2000;

function hardReset() {
  clearInterval(timer);
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
  if (index >= 5) return finishQuiz();
  loadQuestion();
}

function restartQuiz() {
  hardReset();
  startBtn.classList.remove("hidden");
  nextBtn.classList.add("hidden");
  restartBtn.classList.add("hidden");
}

function loadQuestion() {
  clearInterval(timer);
  timeLeft = 20;
  roundId++;

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

db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;

  scoreA.textContent = d.teamA.score;
  scoreB.textContent = d.teamB.score;

  if (d.teamA.score !== lastScoreA) {
    flashScore(scoreA, d.teamA.score > lastScoreA);
    lastScoreA = d.teamA.score;
  }
  if (d.teamB.score !== lastScoreB) {
    flashScore(scoreB, d.teamB.score > lastScoreB);
    lastScoreB = d.teamB.score;
  }

  if (
    d.state === "BETTING" &&
    d.teamA.betRound === d.roundId &&
    d.teamB.betRound === d.roundId
  ) {
    nextBtn.disabled = false;
    nextBtn.classList.remove("disabled-btn");
  } else {
    nextBtn.disabled = true;
    nextBtn.classList.add("disabled-btn");
  }
});

function flashScore(el, win) {
  el.classList.remove("flash-green", "flash-red");
  void el.offsetWidth;
  el.classList.add(win ? "flash-green" : "flash-red");
}
