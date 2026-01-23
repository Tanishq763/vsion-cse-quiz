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

let lastQuestion = null;
let currentScore = 0; // Global variable for betting validation

db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;

  const myKey = "team" + team;
  const me = d[myKey];

  // 1. ROBUST SCORE UPDATE
  // We use parseInt to ensure it's treated as a number, defaulting to 0 if missing
  currentScore = parseInt(me.score !== undefined ? me.score : 0);
  scoreEl.textContent = currentScore;
  
  timerEl.textContent = "⏱ " + d.time;

  // 2. CHECK WIN/LOSS CONDITION IMMEDIATELY
  // Find the opponent (any key starting with 'team' that isn't me)
  const opponentKey = Object.keys(d).find(k => k.startsWith('team') && k !== myKey);
  const opponent = d[opponentKey];

  if (currentScore <= 0) {
    // I have 0 points -> I LOSE
    handleGameOver("GAME OVER", "You have 0 points.", "wrong");
    return; // Stop processing the rest of the script
  } 
  
  if (opponent && opponent.score <= 0) {
    // Opponent has 0 points -> I WIN
    handleGameOver("VICTORY!", "Opponent was eliminated.", "correct");
    return; // Stop processing
  }

  // --- Normal Game Loop ---

  if (d.question && d.question.text !== lastQuestion) {
    lastQuestion = d.question.text;
    qEl.textContent = d.question.text;
    
    // Reset inputs for new question
    betEl.value = me.bet ?? "";
    betEl.disabled = false; 
    renderOptions(d.question.options);
  }

  // Lock betting if state is not RUNNING
  if (d.state !== "RUNNING") {
    betEl.disabled = true;
  } else {
    betEl.disabled = false;
  }

  // Highlight my selected answer
  if (me.answer !== null && d.state === "RUNNING") {
    [...optEl.children].forEach((b, i) =>
      b.classList.toggle("selected", i === me.answer)
    );
  }

  // Reveal answers
  if (d.state === "LOCKED") reveal(me.answer, d.question.correct);
  if (d.state === "FINISHED") qEl.textContent = "Quiz Finished!";
});

// Helper to stop the game and show status
function handleGameOver(title, subtext, cssClass) {
  qEl.textContent = title;
  qEl.classList.add(cssClass); // Adds green or red glow
  
  // Create or update a subtext element
  optEl.innerHTML = `<h3>${subtext}</h3>`;
  
  betEl.disabled = true;
  betEl.placeholder = "---";
  timerEl.textContent = "⏱ STOP";
}

function renderOptions(options) {
  optEl.innerHTML = "";
  options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.dataset.index = i;

    btn.onclick = () => {
      // Prevent answering if score is 0 (double check)
      if(currentScore <= 0) return;

      [...optEl.children].forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      db.ref(`quiz/team${team}/answer`).set(i);
    };

    optEl.appendChild(btn);
  });
}

// 3. BETTING LOGIC (Max 2000, Max Score)
betEl.oninput = () => {
  let val = parseInt(betEl.value);

  if (isNaN(val) || val < 0) {
     val = 0;
  }

  // Limit to 2000
  if (val > 2000) {
    val = 2000;
    betEl.value = 2000;
  }

  // Limit to available Score
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