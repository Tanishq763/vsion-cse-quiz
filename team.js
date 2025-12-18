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
 * TEAM DETECTION
 ***********************/
const params = new URLSearchParams(window.location.search);
const team = params.get("team"); // A or B

if (!team || (team !== "A" && team !== "B")) {
    alert("Invalid team link");
}

document.getElementById("teamTitle").textContent = `TEAM ${team}`;

/***********************
 * DOM
 ***********************/
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const timerEl = document.getElementById("timer");
const betInput = document.getElementById("betInput");

let selectedAnswer = null;

/***********************
 * LISTEN TO QUIZ STATE
 ***********************/
db.ref("quiz").on("value", snap => {
    const data = snap.val();
    if (!data || !data.question) return;

    // Question
    questionEl.textContent = data.question.text;

    // Timer
    timerEl.textContent = `⏱ ${data.time}`;

    // Render options
    renderOptions(data.question.options);

    // Score sync is handled by host only
});

/***********************
 * RENDER OPTIONS
 ***********************/
function renderOptions(options) {
    optionsEl.innerHTML = "";
    selectedAnswer = null;

    options.forEach((opt, index) => {
        const btn = document.createElement("button");
        btn.textContent = opt;

        btn.onclick = () => {
            selectOption(index, btn);
        };

        optionsEl.appendChild(btn);
    });
}

/***********************
 * OPTION SELECT (BLUE)
 ***********************/
function selectOption(index, btn) {
    selectedAnswer = index;

    // UI
    [...optionsEl.children].forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");

    // Send answer to Firebase
    db.ref(`quiz/team${team}/answer`).set(index);
}

/***********************
 * BET INPUT
 ***********************/
betInput.addEventListener("change", () => {
    const bet = parseInt(betInput.value) || 0;
    db.ref(`quiz/team${team}/bet`).set(bet);
});
