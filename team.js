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

const team = new URLSearchParams(window.location.search).get("team");

const qEl = document.getElementById("question");
const optEl = document.getElementById("options");
const tEl = document.getElementById("timer");
const betEl = document.getElementById("betInput");
const scoreEl = document.getElementById("myScore");
const resultBox = document.getElementById("resultBox");
const resultText = document.getElementById("resultText");

let lastIndex = -1;

db.ref("quiz").on("value", snap => {
  const d = snap.val();
  if (!d) return;

  scoreEl.textContent = d[`team${team}`].score;

  if (d.state === "IDLE") {
    qEl.textContent = "Waiting for host…";
    optEl.innerHTML = "";
    betEl.disabled = true;
    tEl.textContent = "--";
    resultBox.classList.add("hidden");
    return;
  }

  if (d.state === "FINISHED") {
    qEl.textContent = "Quiz Finished";
    optEl.innerHTML = "";
    betEl.disabled = true;
    tEl.textContent = "--";
    resultBox.classList.remove("hidden");
    resultText.textContent = d.winnerText;
    return;
  }

  qEl.textContent = d.question.question;
  tEl.textContent = d.time;

  if (d.index !== lastIndex) {
    lastIndex = d.index;
    renderOptions(d.question.options);
    betEl.value = "";
  }

  betEl.disabled = d.state !== "BETTING";
});

function renderOptions(opts) {
  optEl.innerHTML = "";
  opts.forEach((o, i) => {
    const b = document.createElement("button");
    b.textContent = o;
    b.onclick = () => {
      [...optEl.children].forEach(x => x.classList.remove("selected"));
      b.classList.add("selected");
      db.ref(`quiz/team${team}/answer`).set(i);
    };
    optEl.appendChild(b);
  });
}

betEl.addEventListener("change", () => {
  const v = parseInt(betEl.value);
  if (!isNaN(v)) db.ref(`quiz/team${team}/bet`).set(v);
});
