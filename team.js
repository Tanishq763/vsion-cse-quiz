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
 * TEAM IDENTIFICATION
 ***********************/
const team = new URLSearchParams(location.search).get("team");
if (!team || (team !== "A" && team !== "B")) {
  alert("Invalid team link");
}
document.getElementById("teamTitle").textContent = `TEAM ${team}`;

/***********************
 * DOM ELEMENTS
 ***********************/
const questionEl = document.getElementById("question");
const optionsEl  = document.getElementById("options");
const timerEl    = document.getElementById("timer");
const betInput   = document.getElementById("betInput");
const myScoreEl  = document.getElementById("myScore");

/***********************
 * LOCAL STATE
 ***********************/
let lastRoundId = -1;
let currentQuestion = null;

/***********************
 * MAIN LISTENER
 ***********************/
db.ref("quiz").on("value", snap => {
  const data = snap.val();
  if (!data) return;

  const me = data[`team${team}`];
  myScoreEl.textContent = me.score;
  timerEl.textContent = `⏱ ${data.time ?? "--"}`;

  /* NEW QUESTION */
  if (data.question && data.roundId !== lastRoundId) {
    lastRoundId = data.roundId;
    currentQuestion = data.question;
    questionEl.textContent = data.question.question;
    betInput.value = me.bet ?? "";
    renderOptions(data.question.options);
  }

  /* BET EDITABLE DURING TIMER */
  betInput.disabled = data.state !== "RUNNING";

  /* SHOW CORRECT / WRONG AFTER TIMER */
  if (data.state === "LOCKED" && currentQuestion) {
    revealAnswer(me.answer, currentQuestion.correct);
  }
});

/***********************
 * RENDER OPTIONS
 ***********************/
function renderOptions(options) {
  optionsEl.innerHTML = "";

  options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.dataset.index = idx;

    btn.onclick = () => {
      db.ref(`quiz/team${team}/answer`).set(idx);
      [...optionsEl.children].forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    };

    optionsEl.appendChild(btn);
  });
}

/***********************
 * BET INPUT (EDITABLE ANYTIME)
 ***********************/
betInput.addEventListener("input", () => {
  const bet = parseInt(betInput.value);
  if (!bet || bet < 0) return;

  db.ref(`quiz/team${team}/bet`).set(bet);
});

/***********************
 * REVEAL ANSWER (GREEN / RED)
 ***********************/
function revealAnswer(myAnswer, correctAnswer) {
  [...optionsEl.children].forEach(btn => {
    const idx = parseInt(btn.dataset.index);

    btn.disabled = true;
    btn.classList.remove("selected");

    if (idx === correctAnswer) {
      btn.classList.add("correct");     // ✅ GREEN
    } else if (idx === myAnswer) {
      btn.classList.add("wrong");       // ❌ RED
    }
  });
}
