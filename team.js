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

db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;

  const me = d["team"+team];
  scoreEl.textContent = me.score;
  timerEl.textContent = "⏱ " + d.time;

  if (d.question && d.question.text !== lastQuestion) {
    lastQuestion = d.question.text;
    qEl.textContent = d.question.text;
    betEl.value = me.bet ?? "";
    renderOptions(d.question.options);
  }

  betEl.disabled = d.state !== "RUNNING";

  if (me.answer !== null && d.state === "RUNNING") {
    [...optEl.children].forEach((b, i) =>
      b.classList.toggle("selected", i === me.answer)
    );
  }

  if (d.state === "LOCKED") reveal(me.answer, d.question.correct);
  if (d.state === "FINISHED") qEl.textContent = "Quiz Finished!";
});

function renderOptions(options) {
  optEl.innerHTML = "";
  options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.dataset.index = i;

    btn.onclick = () => {
      [...optEl.children].forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      db.ref(`quiz/team${team}/answer`).set(i);
    };

    optEl.appendChild(btn);
  });
}

betEl.oninput = () => {
  const val = parseInt(betEl.value);
  if (!isNaN(val)) db.ref(`quiz/team${team}/bet`).set(val);
};

function reveal(ans, correct) {
  [...optEl.children].forEach((b, i) => {
    if (i === correct) b.classList.add("correct");
    else if (i === ans) b.classList.add("wrong");
    b.disabled = true;
  });
}
