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

const questionEl = document.getElementById("question");
const optionsEl  = document.getElementById("options");
const betInput   = document.getElementById("betInput");
const timerEl    = document.getElementById("timer");
const myScoreEl  = document.getElementById("myScore");

let renderedRound = -1;

db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;

  const me = d["team"+team];
  myScoreEl.textContent = me.score;
  timerEl.textContent = "⏱ " + d.time;

  if (d.question && d.roundId !== renderedRound) {
    renderedRound = d.roundId;
    questionEl.textContent = d.question.question;
    betInput.value = me.bet ?? "";
    renderOptions(d.question.options);
  }

  betInput.disabled = d.state !== "RUNNING";

  if (d.state === "LOCKED") reveal(me.answer, d.question.correct);
});

function renderOptions(opts) {
  optionsEl.innerHTML = "";
  opts.forEach((o,i)=>{
    const b=document.createElement("button");
    b.textContent=o;
    b.dataset.index=i;
    b.onclick=()=>db.ref(`quiz/team${team}/answer`).set(i);
    optionsEl.appendChild(b);
  });
}

betInput.addEventListener("input",()=>{
  const bet=parseInt(betInput.value);
  if (bet>=0) db.ref(`quiz/team${team}/bet`).set(bet);
});

function reveal(ans, correct) {
  [...optionsEl.children].forEach(b=>{
    const i=parseInt(b.dataset.index);
    if (i===correct) b.classList.add("correct");
    else if (i===ans) b.classList.add("wrong");
    b.disabled=true;
  });
}
