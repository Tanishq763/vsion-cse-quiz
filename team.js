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
 * INIT
 ***********************/
const team = new URLSearchParams(location.search).get("team");
const myKey = "team" + team;

document.getElementById("teamTitle").textContent = "TEAM " + team;

const qEl = document.getElementById("question");
const optEl = document.getElementById("options");
const betEl = document.getElementById("betInput");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("myScore");

let lastQuestion = null;
let currentScore = 0;

/***********************
 * LIVE LISTENER
 ***********************/
db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d || !d[myKey]) return;

  const me = d[myKey];

  // SCORE
  currentScore = parseInt(me.score ?? 0);
  scoreEl.textContent = currentScore;
  timerEl.textContent = "⏱ " + d.time;

  // FIND OPPONENT
  const opponentKey = Object.keys(d).find(
    k => k.startsWith("team") && k !== myKey
  );
  const opponent = d[opponentKey];

  // GAME OVER STATES
  if (currentScore <= 0) {
    showGameOver("ELIMINATED", "You ran out of points", "wrong");
    return;
  }

  if (opponent && opponent.score <= 0) {
    showGameOver("VICTORY!", "Opponent eliminated", "correct");
    return;
  }

  // NEW QUESTION
  if (d.question && d.question.text !== lastQuestion) {
    lastQuestion = d.question.text;
    qEl.textContent = d.question.text;
    betEl.value = me.bet ?? "";
    renderOptions(d.question.options);
  }

  betEl.disabled = d.state !== "RUNNING";

  // SHOW SELECTED ANSWER
  if (me.answer !== null && d.state === "RUNNING") {
    [...optEl.children].forEach((b, i) =>
      b.classList.toggle("selected", i === me.answer)
    );
  }

  // REVEAL ANSWERS
  if (d.state === "LOCKED") {
    reveal(me.answer, d.question.correct);
  }

  if (d.state === "FINISHED") {
    qEl.textContent = "Quiz Finished!";
  }
});

/***********************
 * OPTIONS
 ***********************/
function renderOptions(options) {
  optEl.innerHTML = "";
  options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => {
      if (currentScore <= 0) return;
      db.ref(`quiz/${myKey}/answer`).set(i);
    };
    optEl.appendChild(btn);
  });
}

/***********************
 * BET VALIDATION
 ***********************/
betEl.oninput = () => {
  let val = parseInt(betEl.value);
  if (isNaN(val) || val < 0) val = 0;
  if (val > 2000) val = 2000;
  if (val > currentScore) val = currentScore;
  betEl.value = val;
  db.ref(`quiz/${myKey}/bet`).set(val);
};

/***********************
 * VISUAL HELPERS
 ***********************/
function reveal(ans, correct) {
  [...optEl.children].forEach((b, i) => {
    if (i === correct) b.classList.add("correct");
    else if (i === ans) b.classList.add("wrong");
    b.disabled = true;
  });
}

function showGameOver(title, msg, type) {
  qEl.textContent = title;
  optEl.innerHTML = `<h3>${msg}</h3>`;
  betEl.disabled = true;
  timerEl.textContent = "---";
  document.body.style.background =
    type === "correct" ? "#064e3b" : "#7f1d1d";
}
