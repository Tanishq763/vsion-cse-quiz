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

/***********************
 * LOCAL STATE
 ***********************/
let lastRoundId = -1;
let myScore = 0;

/***********************
 * LISTEN TO QUIZ STATE
 ***********************/
db.ref("quiz").on("value", snap => {
  const data = snap.val();
  if (!data) return;

  const myData = data[`team${team}`];

  /* ----- SCORE ----- */
  myScore = myData?.score ?? 0;
  myScoreEl.textContent = myScore;

  /* ----- IDLE ----- */
  if (data.state === "IDLE") {
    questionEl.textContent = "Waiting for host to start quiz…";
    optionsEl.innerHTML = "";
    timerEl.textContent = "⏱ --";
    betInput.disabled = true;
    timerEl.classList.remove("timer-danger");
    return;
  }

  /* ----- FINISHED ----- */
  if (data.state === "FINISHED") {
    questionEl.textContent = "Quiz Finished";
    optionsEl.innerHTML = "";
    timerEl.textContent = "⏱ --";
    betInput.disabled = true;
    timerEl.classList.remove("timer-danger");
    return;
  }

  /* ----- QUESTION ----- */
  if (data.question) {
    questionEl.textContent = data.question.question;
  }

  /* ----- TIMER ----- */
  timerEl.textContent = `⏱ ${data.time ?? "--"}`;

  if (typeof data.time === "number" && data.time <= 5 && data.time > 0) {
    timerEl.classList.add("timer-danger");
  } else {
    timerEl.classList.remove("timer-danger");
  }

  /* ----- NEW ROUND ----- */
  if (data.roundId !== lastRoundId && data.question) {
    lastRoundId = data.roundId;
    renderOptions(data.question.options);
    betInput.value = "";
  }

  /* ----- BET INPUT ENABLE ----- */
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
 * BET INPUT (SAFE + ATOMIC)
 ***********************/
betInput.addEventListener("change", () => {
  const bet = parseInt(betInput.value);

  if (isNaN(bet) || bet <= 0) {
    betInput.value = "";
    return;
  }

  if (bet > myScore) {
    alert("Not enough points");
    betInput.value = "";
    return;
  }

  const teamRef = db.ref(`quiz/team${team}`);

  teamRef.transaction(curr => {
    if (!curr) return curr;

    // ❌ already bet this round
    if (curr.betRound === lastRoundId) return;

    // ❌ safety check
    if (bet > curr.score) return;

    return {
      ...curr,
      score: curr.score - bet, // 🔥 deduct immediately
      bet: bet,
      betRound: lastRoundId
    };
  });
});
