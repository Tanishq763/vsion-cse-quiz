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

// 🔥 Prevent double initialization
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

/***********************
 * TEAM DETECTION
 ***********************/
const team = new URLSearchParams(window.location.search).get("team");

if (!team || (team !== "A" && team !== "B")) {
  alert("Invalid team link");
}

document.getElementById("teamTitle").textContent = `TEAM ${team}`;

/***********************
 * DOM ELEMENTS
 ***********************/
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const timerEl = document.getElementById("timer");
const betInput = document.getElementById("betInput");
const myScoreEl = document.getElementById("myScore");
const resultBox = document.getElementById("resultBox");
const resultText = document.getElementById("resultText");

/***********************
 * LOCAL STATE
 ***********************/
let lastRoundId = -1;

/***********************
 * LISTEN TO QUIZ STATE
 ***********************/
db.ref("quiz").on("value", snap => {
  const data = snap.val();
  if (!data) return;

  // Always update score
  myScoreEl.textContent = data[`team${team}`]?.score ?? 0;

  /* ---------- IDLE ---------- */
  if (data.state === "IDLE") {
    questionEl.textContent = "Waiting for host to start quiz…";
    optionsEl.innerHTML = "";
    timerEl.textContent = "⏱ --";
    betInput.disabled = true;
    resultBox.classList.add("hidden");
    return;
  }

  /* ---------- FINISHED ---------- */
  if (data.state === "FINISHED") {
    questionEl.textContent = "Quiz Finished";
    optionsEl.innerHTML = "";
    timerEl.textContent = "⏱ --";
    betInput.disabled = true;

    resultBox.classList.remove("hidden");
    resultText.textContent = data.winnerText ?? "";

    return;
  }

  /* ---------- BETTING / RUNNING ---------- */
  if (!data.question) return;

  questionEl.textContent = data.question.question;
  timerEl.textContent = `⏱ ${data.time ?? "--"}`;

  // New round detected
  if (data.roundId !== lastRoundId) {
    lastRoundId = data.roundId;
    renderOptions(data.question.options);
    betInput.value = "";
  }

  // Bet input enabled ONLY during BETTING
  betInput.disabled = data.state !== "BETTING";
});

/***********************
 * RENDER OPTIONS
 ***********************/
function renderOptions(options) {
  optionsEl.innerHTML = "";

  options.forEach((opt, index) => {
    const btn = document.createElement("button");
    btn.textContent = opt;

    btn.onclick = () => {
      [...optionsEl.children].forEach(b =>
        b.classList.remove("selected")
      );
      btn.classList.add("selected");

      db.ref(`quiz/team${team}/answer`).set(index);
    };

    optionsEl.appendChild(btn);
  });
}

/***********************
 * BET INPUT
 ***********************/
betInput.addEventListener("change", () => {
  const bet = parseInt(betInput.value);
  if (isNaN(bet)) return;

  // 🔥 Attach bet to CURRENT round only
  db.ref(`quiz/team${team}`).update({
    bet,
    betRound: lastRoundId
  });
});

