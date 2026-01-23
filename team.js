const firebaseConfig = {
  apiKey: "AIzaSyDREhmA6fyafxw8dJqh30B5pjfdEAjf3no",
  authDomain: "vision-cse-quiz.firebaseapp.com",
  databaseURL: "https://vision-cse-quiz-default-rtdb.firebaseio.com",
  projectId: "vision-cse-quiz"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const team = new URLSearchParams(location.search).get("team");
document.getElementById("teamTitle").textContent = "TEAM " + team;

const qEl = document.getElementById("question");
const optEl = document.getElementById("options");
const betEl = document.getElementById("betInput");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("myScore");

// State tracking variables
let lastQuestion = null;
let currentScore = 0;
let hasScoredThisRound = false; // Prevents double-scoring

db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;

  const myKey = "team" + team;
  const me = d[myKey];
  
  // 1. UPDATE LOCAL SCORE VARIABLE
  currentScore = parseInt(me.score !== undefined ? me.score : 0);
  scoreEl.textContent = currentScore;
  timerEl.textContent = "⏱ " + d.time;

  // 2. CHECK FOR INSTANT WIN/LOSS (Priority #1)
  const opponentKey = Object.keys(d).find(k => k.startsWith('team') && k !== myKey);
  const opponent = d[opponentKey];

  // Condition A: I have 0 (or less) -> I Lose
  if (currentScore <= 0) {
    displayGameOver("ELIMINATED", "You ran out of points!", "wrong");
    return;
  }
  
  // Condition B: Opponent has 0 (or less) -> I Win
  if (opponent && opponent.score <= 0) {
    displayGameOver("VICTORY!", `Team ${opponentKey.replace('team','')} was eliminated!`, "correct");
    return;
  }

  // --- GAME LOGIC ---

  // Detect New Question -> Reset Scoring Flag
  if (d.question && d.question.text !== lastQuestion) {
    lastQuestion = d.question.text;
    qEl.textContent = d.question.text;
    
    // Reset for new round
    betEl.value = me.bet ?? "";
    renderOptions(d.question.options);
    hasScoredThisRound = false; 
    
    // Unlock betting
    betEl.disabled = false;
  }

  // Handle Betting State
  if (d.state !== "RUNNING") {
    betEl.disabled = true;
  }

  // Highlight Selection
  if (me.answer !== null && d.state === "RUNNING") {
    [...optEl.children].forEach((b, i) =>
      b.classList.toggle("selected", i === me.answer)
    );
  }

  // 3. HANDLE ANSWER REVEAL & UPDATE SCORE
  if (d.state === "LOCKED") {
    reveal(me.answer, d.question.correct);

    // Only run this logic ONCE per round (when we see the LOCKED state)
    if (!hasScoredThisRound) {
      calculateScore(me.answer, d.question.correct, me.bet);
      hasScoredThisRound = true; // Mark as done so we don't update again
    }
  }

  if (d.state === "FINISHED") {
    qEl.textContent = "Quiz Finished!";
  }
});

// --- NEW FUNCTION: Calculate & Update Score in Firebase ---
function calculateScore(myAns, correctAns, myBet) {
  let betAmount = parseInt(myBet);
  if (isNaN(betAmount)) betAmount = 0;

  // If answer is null (didn't answer), treat as wrong
  const isCorrect = (myAns === correctAns);

  let newScore = currentScore;

  if (isCorrect) {
    newScore = currentScore + betAmount;
  } else {
    // WRONG ANSWER: Deduct Bet
    newScore = currentScore - betAmount;
  }

  // Prevent negative scores in database (optional, but cleaner)
  if (newScore < 0) newScore = 0;

  // UPDATE FIREBASE
  // This sends the new score back to the database
  db.ref(`quiz/team${team}/score`).set(newScore);
}

// --- VISUALS ---

function displayGameOver(title, sub, cls) {
  qEl.textContent = title;
  // Clear options and show message
  optEl.innerHTML = `<div style="text-align:center; font-size: 1.2rem; color: #fff;">${sub}</div>`;
  betEl.disabled = true;
  betEl.value = "";
  timerEl.textContent = "---";
  
  // Apply visual style
  document.body.className = ""; // Reset body bg
  if(cls === "correct") document.body.style.background = "#064e3b"; // Dark Green
  if(cls === "wrong") document.body.style.background = "#7f1d1d"; // Dark Red
}

function renderOptions(options) {
  optEl.innerHTML = "";
  options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.dataset.index = i;
    btn.onclick = () => {
      // Prevent clicking if game over
      if(currentScore <= 0) return;
      
      [...optEl.children].forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      db.ref(`quiz/team${team}/answer`).set(i);
    };
    optEl.appendChild(btn);
  });
}

// Betting Logic (Max 2000, Max Score)
betEl.oninput = () => {
  let val = parseInt(betEl.value);
  if (isNaN(val) || val < 0) val = 0;

  if (val > 2000) {
    val = 2000;
    betEl.value = 2000;
  }
  if (val > currentScore) {
    val = currentScore;
    betEl.value = currentScore;
  }

  db.ref(`quiz/team${team}/bet`).set(val);
};

function reveal(ans, correct) {
  [...optEl.children].forEach((b, i) => {
    if (i === correct) b.classList.add("correct");
    else if (i === ans) b.classList.add("wrong");
    b.disabled = true;
  });
}