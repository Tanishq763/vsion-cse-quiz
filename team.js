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
 * TEAM DETECTION
 ***********************/
const team = new URLSearchParams(window.location.search).get("team");
document.getElementById("teamTitle").textContent = `TEAM ${team}`;

/***********************
 * DOM
 ***********************/
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const timerEl = document.getElementById("timer");
const betInput = document.getElementById("betInput");
const myScoreEl = document.getElementById("myScore");
const resultBox = document.getElementById("resultBox");
const resultText = document.getElementById("resultText");

let lastIndex = -1;

/***********************
 * LISTEN TO QUIZ
 ***********************/
db.ref("quiz").on("value", snap => {
  const data = snap.val();
  if (!data) return;

  if (!data.started) {
    questionEl.textContent = "Waiting for host to start quiz…";
    optionsEl.innerHTML = "";
    timerEl.textContent = "⏱ --";
    betInput.disabled = true;
    return;
  }

  myScoreEl.textContent = data[`team${team}`]?.score ?? 0;

  if (data.finished) {
    questionEl.textContent = "Quiz Finished";
    optionsEl.innerHTML = "";
    betInput.disabled = true;
    timerEl.textContent = "⏱ --";
    resultBox.classList.remove("hidden");
    resultText.textContent = data.winnerText;
    return;
  }

  questionEl.textContent = data.question.question;
  timerEl.textContent = `⏱ ${data.time ?? "--"}`;

  if (data.index !== lastIndex) {
    lastIndex = data.index;
    renderOptions(data.question.options);
    betInput.disabled = !data.betsOpen;
    betInput.value = "";
  }

  betInput.disabled = !data.betsOpen;
});

/***********************
 * OPTIONS
 ***********************/
function renderOptions(options) {
  optionsEl.innerHTML = "";
  options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => {
      [...optionsEl.children].forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      db.ref(`quiz/team${team}/answer`).set(i);
    };
    optionsEl.appendChild(btn);
  });
}

/***********************
 * BET
 ***********************/
betInput.addEventListener("change", () => {
  const bet = parseInt(betInput.value);
  if (!isNaN(bet)) {
    db.ref(`quiz/team${team}/bet`).set(bet);
  }
});
