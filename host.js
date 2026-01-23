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
 * QUESTIONS POOL
 ***********************/
const allquestions = [
  { q:"Which symbol ends a C statement?", o:[":",".",";","?"], a:2 },
  { q:"HTML tag for link?", o:["<a>","<link>","<url>","<href>"], a:0 },
  { q:"CSS stands for?", o:["Creative","Cascading","Color","Coding"], a:1 },
  { q:"JS single-line comment?", o:["#","//","<!--","**"], a:1 },
  { q:"Which is NOT a C datatype?", o:["int","float","char","string"], a:3 },
  { q:"Time complexity of binary search?", o:["O(n)","O(log n)","O(n log n)","O(1)"], a:1 },
  { q:"Worst-case time complexity of linear search?", o:["O(1)","O(log n)","O(n)","O(n log n)"], a:2 },
  { q:"Time complexity of nested loops?", o:["O(n)","O(n log n)","O(n²)","O(log n)"], a:2 },
  { q:"Best-case time complexity of binary search?", o:["O(1)","O(log n)","O(n)","O(n²)"], a:0 }
];

/***********************
 * STATE
 ***********************/
let remainingQuestions = [];
let currentQuestion = null;
let timer = null;
let timeLeft = 20;

/***********************
 * INITIAL RESET
 ***********************/
db.ref("quiz").set({
  state: "IDLE",
  time: "--",
  question: null,
  winner: null,
  teamA: { score: 2000, bet: null, answer: null },
  teamB: { score: 2000, bet: null, answer: null }
});

/***********************
 * START QUIZ
 ***********************/
function startQuiz() {
  remainingQuestions = [...allquestions]; // fresh pool
  loadQuestion();
}

/***********************
 * LOAD RANDOM QUESTION
 ***********************/
function loadQuestion() {
  if (remainingQuestions.length === 0) {
    finishQuiz();
    return;
  }

  clearInterval(timer);
  timeLeft = 20;

  // 🎯 PICK RANDOM QUESTION
  const index = Math.floor(Math.random() * remainingQuestions.length);
  currentQuestion = remainingQuestions.splice(index, 1)[0];

  db.ref("quiz").update({
    state: "RUNNING",
    time: timeLeft,
    question: {
      text: currentQuestion.q,
      options: currentQuestion.o,
      correct: currentQuestion.a
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

  if (data.answer === null) {
    score -= Math.floor(score * 0.2);
  } else if (data.answer === correct) {
    score += bet;
  } else {
    score -= bet;
  }

  if (score < 0) score = 0;
  db.ref(`quiz/team${team}/score`).set(score);
}

/***********************
 * EARLY GAME OVER CHECK
 ***********************/
function checkImmediateGameOver() {
  db.ref("quiz").once("value", snap => {
    const d = snap.val();
    let winner = null;

    if (d.teamA.score <= 0 && d.teamB.score <= 0) winner = "DRAW";
    else if (d.teamA.score <= 0) winner = "B";
    else if (d.teamB.score <= 0) winner = "A";

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
  loadQuestion();
}

/***********************
 * FINISH QUIZ (NORMAL END)
 ***********************/
function finishQuiz() {
  db.ref("quiz").once("value", snap => {
    const d = snap.val();
    let winner = "DRAW";

    if (d.teamA.score > d.teamB.score) winner = "A";
    else if (d.teamB.score > d.teamA.score) winner = "B";

    db.ref("quiz").update({
      state: "FINISHED",
      winner: winner
    });
  });
}

/***********************
 * EXPORTS
 ***********************/
window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
