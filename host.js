/***********************
 * FIREBASE SETUP
 ***********************/
const firebaseConfig = {
  apiKey: "AIzaSyDREhmA6fyafxw8dJqh30B5pjfdEAjf3no",
  authDomain: "vision-cse-quiz.firebaseapp.com",
  databaseURL: "https://vision-cse-quiz-default-rtdb.firebaseio.com",
  projectId: "vision-cse-quiz"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/***********************
 * QUESTIONS
 ***********************/
const allquestions = [
  { q:"Which symbol ends a C statement?", o:[":",".",";","?"], a:2 },
  { q:"HTML tag for link?", o:["<a>","<link>","<url>","<href>"], a:0 },
  { q:"CSS stands for?", o:["Creative","Cascading","Color","Coding"], a:1 },
  { q:"JS single-line comment?", o:["#","//","<!--","**"], a:1 },
  { q:"Which is NOT a C datatype?", o:["int","float","char","string"], a:3 },
  { q:"Which tag is used for JavaScript?", o:["<js>","<javascript>","<script>","<code>"], a:2 },
  { q:"Which loop runs at least once?", o:["for","while","do-while","foreach"], a:2 }
];

/***********************
 * DOM
 ***********************/
const timerEl = document.getElementById("timer");
const scoreAEl = document.getElementById("scoreA");
const scoreBEl = document.getElementById("scoreB");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const winnerScreen = document.getElementById("winnerScreen");
const winnerText = document.getElementById("winnerText");

/***********************
 * STATE
 ***********************/
let shuffled = [];
let idx = -1;
let timer = null;
let timeLeft = 20;

/***********************
 * INIT RESET
 ***********************/
db.ref("quiz").set({
  state: "IDLE",
  time: "--",
  question: null,
  teamA: { score: 2000, bet: null, answer: null },
  teamB: { score: 2000, bet: null, answer: null }
});

/***********************
 * START QUIZ
 ***********************/
function startQuiz() {
  shuffled = [...allquestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  idx = 0;
  loadQuestion();

  startBtn.classList.add("hidden");
  nextBtn.classList.remove("hidden");
}

/***********************
 * LOAD QUESTION
 ***********************/
function loadQuestion() {
  clearInterval(timer);
  timeLeft = 20;

  db.ref("quiz").update({
    state: "RUNNING",
    time: timeLeft,
    question: {
      text: shuffled[idx].q,
      options: shuffled[idx].o,
      correct: shuffled[idx].a
    }
  });

  db.ref("quiz/teamA").update({ bet: null, answer: null });
  db.ref("quiz/teamB").update({ bet: null, answer: null });

  startTimer();
}

/***********************
 * TIMER
 ***********************/
function startTimer() {
  timerEl.textContent = timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    db.ref("quiz/time").set(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timer);
      db.ref("quiz/state").set("LOCKED");
      evaluate();
    }
  }, 1000);
}

/***********************
 * SCORE LOGIC
 ***********************/
function evaluate() {
  db.ref("quiz").once("value", snap => {
    const d = snap.val();
    applyScore("A", d.teamA, d.question.correct);
    applyScore("B", d.teamB, d.question.correct);
  });
}

function applyScore(team, data, correct) {
  let score = data.score;

  if (data.answer === null) score -= Math.floor(score * 0.2);
  else if (data.answer === correct) score += Math.floor(data.bet * 1.1);
  else score -= data.bet;

  if (score < 0) score = 0;
  db.ref(`quiz/team${team}/score`).set(score);
}

/***********************
 * NEXT QUESTION
 ***********************/
function nextQuestion() {
  idx++;
  if (idx >= shuffled.length) {
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

    db.ref("quiz").update({ state: "FINISHED" });

    winnerText.textContent = text;
    winnerScreen.classList.remove("hidden");
    launchConfetti();
  });
}

/***********************
 * CONFETTI
 ***********************/
function launchConfetti() {
  const colors = ["#00f0ff","#ffd166","#00ff99","#ff4d4d"];
  for (let i = 0; i < 120; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.backgroundColor = colors[i % colors.length];
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}

/***********************
 * RESTART
 ***********************/
function restartQuiz() {
  location.reload();
}

/***********************
 * LIVE UPDATE
 ***********************/
db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;

  scoreAEl.textContent = d.teamA.score;
  scoreBEl.textContent = d.teamB.score;
  nextBtn.disabled = d.state !== "LOCKED";
});

/***********************
 * EXPORT
 ***********************/
window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.restartQuiz = restartQuiz;
