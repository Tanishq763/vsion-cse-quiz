const firebaseConfig = {
  apiKey: "AIzaSyDREhmA6fyafxw8dJqh30B5pjfdEAjf3no",
  authDomain: "vision-cse-quiz.firebaseapp.com",
  databaseURL: "https://vision-cse-quiz-default-rtdb.firebaseio.com",
  projectId: "vision-cse-quiz"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/**************** QUESTIONS ****************/
const allquestions = [
  { q:"C statement ends with?", o:[":",".",";","?"], a:2 },
  { q:"Binary search complexity?", o:["O(n)","O(log n)","O(1)","O(n²)"], a:1 },
  { q:"Fastest complexity?", o:["O(n)","O(log n)","O(n²)","O(n log n)"], a:1 }
];

let pool = [];
let timer, timeLeft = 20;

/**************** RESET ****************/
db.ref("quiz").set({
  state: "IDLE",
  time: "--",
  winner: null,
  question: null,
  teamA: { score: 2000, bet: null, answer: null },
  teamB: { score: 2000, bet: null, answer: null }
});

/**************** START ****************/
function startQuiz() {
  pool = [...allquestions];
  nextQuestion();
}

/**************** NEXT QUESTION ****************/
function nextQuestion() {
  if (pool.length === 0) return finishQuiz();

  clearInterval(timer);
  timeLeft = 20;

  const q = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];

  db.ref("quiz").update({
    state: "RUNNING",
    time: timeLeft,
    question: { text: q.q, options: q.o, correct: q.a }
  });

  db.ref("quiz/teamA").update({ bet: null, answer: null });
  db.ref("quiz/teamB").update({ bet: null, answer: null });

  timer = setInterval(() => {
    timeLeft--;
    db.ref("quiz/time").set(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timer);
      db.ref("quiz/state").set("LOCKED");
      evaluate();
    }
  }, 1000);
}

/**************** SCORING ****************/
function evaluate() {
  db.ref("quiz").once("value").then(snap => {
    const d = snap.val();

    return Promise.all([
      score("A", d.teamA, d.question.correct),
      score("B", d.teamB, d.question.correct)
    ]);
  }).then(checkWinner);
}

function score(t, data, correct) {
  let s = data.score;
  const b = data.bet || 0;

  if (data.answer === null) s -= Math.floor(s * 0.2);
  else if (data.answer === correct) s += b;
  else s -= b;

  if (s < 0) s = 0;
  return db.ref(`quiz/team${t}/score`).set(s);
}

/**************** WINNER ****************/
function checkWinner() {
  db.ref("quiz").once("value").then(snap => {
    const d = snap.val();
    let w = null;

    if (d.teamA.score <= 0 && d.teamB.score <= 0) w = "DRAW";
    else if (d.teamA.score <= 0) w = "B";
    else if (d.teamB.score <= 0) w = "A";

    if (w) db.ref("quiz").update({ state: "FINISHED", winner: w });
  });
}

function finishQuiz() {
  db.ref("quiz").once("value").then(snap => {
    const d = snap.val();
    let w = d.teamA.score > d.teamB.score ? "A" :
            d.teamB.score > d.teamA.score ? "B" : "DRAW";

    db.ref("quiz").update({ state: "FINISHED", winner: w });
  });
}

/**************** HOST UI ****************/
db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;

  scoreA.textContent = d.teamA.score;
  scoreB.textContent = d.teamB.score;
  timer.textContent = "⏱ " + d.time;

  if (d.state === "FINISHED" && d.winner) {
    winnerScreen.classList.remove("hidden");
    winnerText.textContent =
      d.winner === "A" ? "🏆 TEAM A WINS" :
      d.winner === "B" ? "🏆 TEAM B WINS" :
      "🏆 DRAW";
  }
});
