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
 * DOM
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
 * SOUND CONTROLS
 ***********************/
const sndTick = document.getElementById("sndTick");
const sndWin  = document.getElementById("sndWin");
const sndLose = document.getElementById("sndLose");

const toggleTick = document.getElementById("toggleTick");
const toggleWin  = document.getElementById("toggleWin");
const toggleLose = document.getElementById("toggleLose");

/***********************
 * GLOBALS
 ***********************/
let index = -1;
let timer = null;
let timeLeft = 20;
let roundId = 0;

/***********************
 * RESET + PAGE RELOAD
 ***********************/
function restartQuiz() {
  db.ref("quiz").remove().then(() => {
    location.reload(); // 🔥 reload host
  });
}

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
 * LOAD QUESTION
 ***********************/
function loadQuestion() {
  clearInterval(timer);
  timeLeft = 20;
  roundId++;

  db.ref("quiz").set({
    state: "RUNNING",
    roundId,
    time: timeLeft,
    question: allquestions[index],
    teamA: { score: getScore("A"), bet:null, answer:null },
    teamB: { score: getScore("B"), bet:null, answer:null }
  });

  timer = setInterval(() => {
    timeLeft--;
    db.ref("quiz/time").set(timeLeft);
    timerEl.textContent = timeLeft;

    if (timeLeft <= 5 && toggleTick.checked) sndTick.play().catch(()=>{});

    if (timeLeft <= 0) {
      clearInterval(timer);
      db.ref("quiz/state").set("LOCKED");
      evaluate();
    }
  },1000);
}

/***********************
 * SCORE EVALUATION
 ***********************/
function evaluate() {
  db.ref("quiz").once("value", snap => {
    const d = snap.val();
    const c = d.question.correct;

    updateTeam("A", d.teamA, c);
    updateTeam("B", d.teamB, c);
  });
}

function updateTeam(team, data, correct) {
  let score = data.score;

  if (data.answer === null) {
    score -= Math.floor(score * 0.2);
    if (toggleLose.checked) sndLose.play().catch(()=>{});
  } else if (data.answer === correct) {
    score += Math.floor(data.bet * 1.1);
    if (toggleWin.checked) sndWin.play().catch(()=>{});
  } else {
    score -= data.bet;
    if (toggleLose.checked) sndLose.play().catch(()=>{});
  }

  db.ref(`quiz/team${team}/score`).set(score);
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
 * FINISH
 ***********************/
function finishQuiz() {
  db.ref("quiz").once("value", snap => {
    const d = snap.val();
    let text = "🏆 DRAW!";
    if (d.teamA.score > d.teamB.score) text = "🏆 TEAM A WINS!";
    if (d.teamB.score > d.teamA.score) text = "🏆 TEAM B WINS!";
    winnerText.textContent = text;
    winnerScreen.classList.remove("hidden");
  });
}

/***********************
 * HELPERS
 ***********************/
function getScore(team) {
  return 2000;
}

/***********************
 * LISTENER
 ***********************/
db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;
  scoreAEl.textContent = d.teamA.score;
  scoreBEl.textContent = d.teamB.score;
  nextBtn.disabled = d.state !== "LOCKED";
});

/***********************
 * EXPORTS
 ***********************/
window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.restartQuiz = restartQuiz;
