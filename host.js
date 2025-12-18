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
 * QUESTIONS (UNCHANGED)
 ***********************/
const questions = [
  {
    question: "Which of the following is a valid variable name in C?",
    options: ["2num", "num_2", "float", "num-2"],
    correct: 1
  },
  {
    question: "Which symbol is used to terminate a statement in C/C++?",
    options: [":", ".", ";", ","],
    correct: 2
  }
  // (rest of your questions stay SAME)
];

/***********************
 * GLOBALS
 ***********************/
let index = -1;
let timer = null;
let timeLeft = 10;

/***********************
 * START / NEXT
 ***********************/
function startQuiz() {
  console.log("🔥 Start Quiz clicked");

  index++;

  if (index >= questions.length) {
    alert("Quiz Finished");
    return;
  }

  const q = questions[index];

  // 🔥 WRITE EVERYTHING UNDER ONE NODE: quiz
  db.ref("quiz").update({
    index: index,
    time: timeLeft,
    question: {
      question: q.question,
      options: q.options,
      correct: q.correct
    }
  });

  // Initialize teams ONLY once
  if (index === 0) {
    db.ref("quiz/teamA").set({ answer: null, bet: 0, score: 0 });
    db.ref("quiz/teamB").set({ answer: null, bet: 0, score: 0 });
  }

  showQuestion(q);
  startTimer();
}

/***********************
 * DISPLAY (HOST)
 ***********************/
function showQuestion(q) {
  document.getElementById("questionText").textContent = q.question;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.options.forEach(opt => {
    const row = document.createElement("div");
    row.className = "option-row";

    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.disabled = true;

    row.appendChild(btn);
    optionsDiv.appendChild(row);
  });
}

/***********************
 * TIMER (SYNCED)
 ***********************/
function startTimer() {
  clearInterval(timer);
  timeLeft = 10;

  document.getElementById("timer").textContent = `⏱ ${timeLeft}`;

  timer = setInterval(() => {
    timeLeft--;

    document.getElementById("timer").textContent = `⏱ ${timeLeft}`;
    db.ref("quiz/time").set(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timer);
      evaluate();
    }
  }, 1000);
}

/***********************
 * EVALUATE ANSWERS
 ***********************/
function evaluate() {
  db.ref("quiz").once("value", snap => {
    const data = snap.val();
    if (!data) return;

    const correct = data.question.correct;

    let scoreA = data.teamA?.score || 0;
    let scoreB = data.teamB?.score || 0;

    if (data.teamA?.answer !== null) {
      scoreA += (data.teamA.answer === correct ? data.teamA.bet : -data.teamA.bet);
    }

    if (data.teamB?.answer !== null) {
      scoreB += (data.teamB.answer === correct ? data.teamB.bet : -data.teamB.bet);
    }

    db.ref("quiz/teamA/score").set(scoreA);
    db.ref("quiz/teamB/score").set(scoreB);

    document.getElementById("scoreA").textContent = scoreA;
    document.getElementById("scoreB").textContent = scoreB;
  });
}

/***********************
 * EXPOSE TO HTML
 ***********************/
window.startQuiz = startQuiz;
