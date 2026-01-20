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
 * QUESTIONS (CATEGORY + DIFFICULTY READY)
 ***********************/
const allquestions = [
  { q:"Which symbol ends a C statement?", o:[":",".",";","?"], a:2, cat:"C", diff:1 },
  { q:"HTML tag for link?", o:["<a>","<link>","<url>","<href>"], a:0, cat:"WEB", diff:1 },
  { q:"CSS stands for?", o:["Creative","Cascading","Color","Coding"], a:1, cat:"WEB", diff:1 },
  { q:"JS comment?", o:["#","//","<!--","**"], a:1, cat:"WEB", diff:1 },
  { q:"Not a C data type?", o:["int","float","char","string"], a:3, cat:"C", diff:2 }
];

/***********************
 * DOM
 ***********************/
const timerEl = document.getElementById("timer");
const scoreAEl = document.getElementById("scoreA");
const scoreBEl = document.getElementById("scoreB");
const betAEl = document.getElementById("betA");
const betBEl = document.getElementById("betB");
const ansAEl = document.getElementById("ansA");
const ansBEl = document.getElementById("ansB");
const nextBtn = document.getElementById("nextBtn");
const winnerText = document.getElementById("winnerText");
const winnerScreen = document.getElementById("winnerScreen");

/***********************
 * STATE
 ***********************/
let shuffled = [];
let idx = -1;
let timer = null;
let timeLeft = 20;
let roundId = 0;

/***********************
 * UTILS
 ***********************/
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/***********************
 * INIT
 ***********************/
db.ref("quiz").once("value", s => {
  if (!s.exists()) {
    db.ref("quiz").set({
      state: "IDLE",
      roundId: 0,
      time: "--",
      question: null,
      teamA: { score:2000, bet:null, answer:null },
      teamB: { score:2000, bet:null, answer:null }
    });
  }
});

/***********************
 * GAME CONTROL
 ***********************/
function startQuiz() {
  shuffled = shuffle(allquestions);
  idx = 0;
  loadQuestion();
}

function loadQuestion() {
  clearInterval(timer);
  timeLeft = 20;
  roundId++;

  db.ref("quiz").update({
    state:"RUNNING",
    roundId,
    time:timeLeft,
    question:{
      text:shuffled[idx].q,
      options:shuffled[idx].o,
      correct:shuffled[idx].a
    }
  });

  db.ref("quiz/teamA").update({ bet:null, answer:null });
  db.ref("quiz/teamB").update({ bet:null, answer:null });

  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    db.ref("quiz/time").set(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timer);
      db.ref("quiz/state").set("LOCKED");
      evaluate();
    }
  },1000);
}

function evaluate() {
  db.ref("quiz").once("value", s => {
    const d = s.val();
    applyScore("A", d.teamA, d.question.correct);
    applyScore("B", d.teamB, d.question.correct);
  });
}

function applyScore(t, data, correct) {
  let score = data.score;
  if (data.answer === null) score -= Math.floor(score * 0.2);
  else if (data.answer === correct) score += Math.floor(data.bet * 1.1);
  else score -= data.bet;
  if (score < 0) score = 0;
  db.ref(`quiz/team${t}/score`).set(score);
}

function nextQuestion() {
  idx++;
  if (idx >= shuffled.length) {
    finish();
    return;
  }
  loadQuestion();
}

function finish() {
  db.ref("quiz").once("value", s => {
    const d = s.val();
    let t="🏆 DRAW";
    if (d.teamA.score>d.teamB.score) t="🏆 TEAM A WINS!";
    if (d.teamB.score>d.teamA.score) t="🏆 TEAM B WINS!";
    winnerText.textContent=t;
    winnerScreen.classList.remove("hidden");
    confetti();
  });
}

function restartQuiz() {
  db.ref("quiz").remove().then(()=>location.reload());
}

function addTime(x) {
  timeLeft += x;
  if (timeLeft < 1) timeLeft = 1;
  db.ref("quiz/time").set(timeLeft);
}

/***********************
 * LIVE MONITOR
 ***********************/
db.ref("quiz").on("value", s => {
  const d=s.val(); if(!d) return;
  scoreAEl.textContent=d.teamA.score;
  scoreBEl.textContent=d.teamB.score;
  betAEl.textContent=d.teamA.bet ?? "--";
  betBEl.textContent=d.teamB.bet ?? "--";
  ansAEl.textContent=d.teamA.answer!==null?"✅":"❌";
  ansBEl.textContent=d.teamB.answer!==null?"✅":"❌";
  nextBtn.disabled=d.state!=="LOCKED";
});

/***********************
 * FX
 ***********************/
function confetti() {
  for(let i=0;i<120;i++){
    const c=document.createElement("div");
    c.className="confetti";
    c.style.left=Math.random()*100+"vw";
    c.style.backgroundColor=["#00f0ff","#ffd166","#00ff99","#ff4d4d"][i%4];
    document.body.appendChild(c);
    setTimeout(()=>c.remove(),3000);
  }
}

/***********************
 * EXPORT
 ***********************/
window.startQuiz=startQuiz;
window.nextQuestion=nextQuestion;
window.restartQuiz=restartQuiz;
window.addTime=addTime;
