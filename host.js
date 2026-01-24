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
  {
    q: "Your friend says 'Bro, trust me'. What should you do?",
    o: ["Trust immediately", "Run away", "Double-check", "Pray first"],
    a: 2
  },
  {
    q: "What does 'I'm not angry' usually mean?",
    o: ["All good", "Slightly annoyed", "Danger zone", "Game over"],
    a: 3
  },
  {
    q: "Your friend says 'Only one episode'. What actually happens?",
    o: ["One episode", "Two episodes", "Entire season", "No sleep"],
    a: 3
  },
  {
    q: "Who replies fastest in a group chat?",
    o: ["Class topper", "Crush", "Free friend", "Admin"],
    a: 2
  },
  {
    q: "Your friend says 'I’m outside'. Where are they?",
    o: ["At the door", "Near the gate", "Still at home", "In another city"],
    a: 2
  },
  {
    q: "What does 'Seen 2 hours ago' mean?",
    o: ["Busy", "No network", "Ignoring you", "Phone dead"],
    a: 2
  },
  {
    q: "Your best friend asks 'Can I have one bite?'. What happens?",
    o: ["One bite", "Half plate gone", "Full plate gone", "Food disappears"],
    a: 3
  },
  {
    q: "What is the strongest relationship test?",
    o: ["Long distance", "Trust issues", "Sharing food", "Group project"],
    a: 3
  },
  {
    q: "Friend says 'I know a shortcut'. Result?",
    o: ["Reached early", "On time", "Lost badly", "Tour of city"],
    a: 3
  },
  {
    q: "What does 'We should hang out sometime' mean?",
    o: ["Today", "Soon", "Someday", "Never"],
    a: 3
  },
  {
    q: "Who borrows things and never returns them?",
    o: ["Enemy", "Neighbor", "Best friend", "Stranger"],
    a: 2
  },
  {
    q: "Your friend says 'Just 5 minutes more'. Actual time?",
    o: ["5 minutes", "15 minutes", "30 minutes", "Infinite loop"],
    a: 3
  }
];



/***********************
 * STATE
 ***********************/
let idx = -1;
let shuffled = [];
let timer;
let timeLeft = 20;

/***********************
 * RESET FUNCTION (USED ON LOAD AND RESTART)
 ***********************/
function resetQuiz() {
  clearInterval(timer);
  db.ref("quiz").set({
    state: "IDLE",
    time: "--",
    question: null,
    teamA: { score: 2000, bet: null, answer: null },
    teamB: { score: 2000, bet: null, answer: null }
  });
  // Reset local state
  idx = -1;
  shuffled = [];
  timeLeft = 20;
  // Reset UI
  document.getElementById("startBtn").classList.remove("hidden");
  document.getElementById("nextBtn").classList.add("hidden");
  document.getElementById("winnerScreen").classList.add("hidden");
}

// Run reset on load
resetQuiz();

/***********************
 * START QUIZ
 ***********************/
function startQuiz() {
  shuffled = [...allquestions].sort(() => Math.random() - 0.5);
  idx = 0;
  loadQuestion();
  document.getElementById("startBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.add("hidden"); // Hide until needed
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
  timer = setInterval(() => {
    timeLeft--;
    db.ref("quiz/time").set(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timer);
      db.ref("quiz/state").set("LOCKED");
      evaluateScores();
    }
  }, 1000);
}

/***********************
 * SCORING (HOST ONLY)
 ***********************/
function evaluateScores() {
  db.ref("quiz").once("value", snap => {
    const d = snap.val();
    scoreTeam("A", d.teamA, d.question.correct);
    scoreTeam("B", d.teamB, d.question.correct);
    checkImmediateGameOver();
  });
}

function scoreTeam(team, data, correct) {
  let score = data.score;
  const bet = data.bet ?? 0;

  if (data.answer === null) score -= Math.floor(score * 0.2);
  else if (data.answer === correct) score += bet;
  else score -= bet;

  if (score < 0) score = 0;
  db.ref(`quiz/team${team}/score`).set(score);
}

function checkImmediateGameOver() {
  db.ref("quiz").once("value", snap => {
    const d = snap.val();
    let winner = null;

    if (d.teamA.score <= 0 && d.teamB.score <= 0) {
      winner = "DRAW";
    } 
    else if (d.teamA.score <= 0) {
      winner = "B";
    } 
    else if (d.teamB.score <= 0) {
      winner = "A";
    }

    if (winner) {
      db.ref("quiz").update({
        state: "FINISHED",
        winner: winner
      });
    }
  });
}

/***********************
 * NEXT QUESTION
 ***********************/
function nextQuestion() {
  idx++;
  if (idx >= shuffled.length) {
    db.ref("quiz/state").set("FINISHED");
    return;
  }
  loadQuestion();
  document.getElementById("nextBtn").classList.add("hidden"); // Hide after clicking
}

/***********************
 * RESTART QUIZ (NEW FUNCTION)
 ***********************/
function restartQuiz() {
  resetQuiz();
}

/***********************
 * LIVE UI UPDATER (NEW: LISTEN FOR DB CHANGES)
 ***********************/
db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;

  // Update timer
  document.getElementById("timer").textContent = d.time;
  if (d.time <= 5 && d.time > 0) {
    document.getElementById("timer").classList.add("timer-danger");
  } else {
    document.getElementById("timer").classList.remove("timer-danger");
  }

  // Update scores
  document.getElementById("scoreA").textContent = d.teamA ? d.teamA.score : 2000;
  document.getElementById("scoreB").textContent = d.teamB ? d.teamB.score : 2000;

  // Handle states and buttons
  if (d.state === "IDLE") {
    document.getElementById("startBtn").classList.remove("hidden");
    document.getElementById("nextBtn").classList.add("hidden");
    document.getElementById("winnerScreen").classList.add("hidden");
  } else if (d.state === "RUNNING") {
    document.getElementById("startBtn").classList.add("hidden");
    document.getElementById("nextBtn").classList.add("hidden");
  } else if (d.state === "LOCKED") {
    document.getElementById("nextBtn").classList.remove("hidden"); // Show next after evaluation
  } else if (d.state === "FINISHED") {
    document.getElementById("startBtn").classList.add("hidden");
    document.getElementById("nextBtn").classList.add("hidden");
    document.getElementById("winnerScreen").classList.remove("hidden");
    if (d.winner === "DRAW") {
      document.getElementById("winnerText").textContent = "It's a DRAW!";
    } else {
      document.getElementById("winnerText").textContent = `Team ${d.winner} WINS!`;
    }
  }
});

window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.restartQuiz = restartQuiz; // Expose the new function


