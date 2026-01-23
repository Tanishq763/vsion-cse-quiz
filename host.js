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
  { q:"Which symbol ends a C statement?", o:[":",".",";","?"], a:2 },
  { q:"HTML tag for link?", o:["<a>","<link>","<url>","<href>"], a:0 },
  { q:"CSS stands for?", o:["Creative","Cascading","Color","Coding"], a:1 },
  { q:"JS single-line comment?", o:["#","//","<!--","**"], a:1 },
  { q:"Which is NOT a C datatype?", o:["int","float","char","string"], a:3 },
  { q: "Time complexity of binary search?", 
    o: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], 
    a: 1 
  },
  { q: "Worst-case time complexity of linear search?", 
    o: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 
    a: 2 
  },
  { q: "Time complexity of a loop running n times?", 
    o: ["O(1)", "O(log n)", "O(n)", "O(n²)"], 
    a: 2 
  },
  { q: "Time complexity of nested loops each running n times?", 
    o: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], 
    a: 2 
  },
  { q: "Best-case time complexity of binary search?", 
    o: ["O(1)", "O(log n)", "O(n)", "O(n²)"], 
    a: 0 
  },
  { q: "Time complexity of merge sort?", 
    o: ["O(n²)", "O(n log n)", "O(log n)", "O(n)"], 
    a: 1 
  },
  { q: "Worst-case time complexity of quicksort?", 
    o: ["O(n log n)", "O(n)", "O(n²)", "O(log n)"], 
    a: 2 
  },
  { q: "Time complexity of accessing an array element by index?", 
    o: ["O(n)", "O(log n)", "O(1)", "O(n log n)"], 
    a: 2 
  },
  { q: "Time complexity of inserting an element at the end of an array (amortized)?", 
    o: ["O(n)", "O(1)", "O(log n)", "O(n log n)"], 
    a: 1 
  },
  { q: "Time complexity of DFS using adjacency list?", 
    o: ["O(V)", "O(E)", "O(V + E)", "O(V²)"], 
    a: 2 
  },
  { q: "Time complexity of BFS using queue?", 
    o: ["O(V)", "O(E)", "O(V + E)", "O(V²)"], 
    a: 2 
  },
  { q: "Which time complexity is the fastest?", 
    o: ["O(n)", "O(log n)", "O(n log n)", "O(n²)"], 
    a: 1 
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
