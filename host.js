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
const techComedyQuestions = [
  {
    q: "Why did the programmer go broke?",
    o: ["Lost wallet", "Too many bugs", "Used all cache", "Couldn't save"],
    a: 3
  },
  {
    q: "What is a programmer’s favorite place to hang out?",
    o: ["Cafe", "GitHub", "Stack Overflow", "Debug Room"],
    a: 2
  },
  {
    q: "Why do Java developers wear glasses?",
    o: ["Style", "Eye strain", "They can’t C#", "Too much screen time"],
    a: 2
  },
  {
    q: "What happens when a programmer gets stuck?",
    o: ["Cries", "Sleeps", "Blames compiler", "Searches Google"],
    a: 3
  },
  {
    q: "Why was the developer unhappy at work?",
    o: ["Low salary", "No coffee", "No semicolons", "Too many meetings"],
    a: 2
  },
  {
    q: "Best way to fix a bug?",
    o: ["Pray", "Restart PC", "Comment code", "Google it"],
    a: 3
  },
  {
    q: "What does a programmer say when things go wrong?",
    o: ["Oops", "It works on my machine", "Why me?", "Help!"],
    a: 1
  },
  {
    q: "Why do programmers prefer dark mode?",
    o: ["Looks cool", "Saves battery", "Light attracts bugs", "Eye safety"],
    a: 2
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

