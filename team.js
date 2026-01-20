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
 * TEAM IDENTIFICATION
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
 * MAIN LISTENER
 ***********************/
db.ref("quiz").on("value", snap => {
  const data = snap.val();
  if (!data) return;

  const me = data[`team${team}`];

  myScore = me.score;
  myScoreEl.textContent = myScore;

  timerEl.textContent = `⏱ ${data.time ?? "--"}`;

  if (data.question && data.roundId !== lastRoundId) {
    lastRoundId = data.roundId;
    questionEl.textContent = data.question.question;
    betInput.value = "";
    renderOptions(data.question.options);
  }

  // enable bet ONLY once per round while RUNNING
  if (data.state === "RUNNING" && me.betRound !== data.roundId) {
    betInput.disabled = false;
  } else {
    betInput.disabled = true;
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

    btn.onclick = () => {
      db.ref(`quiz/team${team}/answer`).set(idx);
      [...optionsEl.children].forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    };

    optionsEl.appendChild(btn);
  });
}

/***********************
 * BET INPUT HANDLER
 ***********************/
betInput.addEventListener("input", () => {
  const bet = parseInt(betInput.value);

  if (!bet || bet <= 0) return;
  if (bet > myScore) {
    alert("Not enough points");
    betInput.value = "";
    return;
  }

  const teamRef = db.ref(`quiz/team${team}`);

  teamRef.transaction(curr => {
    if (!curr) return curr;
    if (curr.betRound === lastRoundId) return;
    if (bet > curr.score) return;

    return {
      ...curr,
      score: curr.score - bet,
      bet: bet,
      betRound: lastRoundId
    };
  });

  betInput.disabled = true;
});
