
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
 * QUESTIONS
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
    },
    {
        question: "What is the default value of an uninitialized local variable in C?",
        options: ["0", "Garbage value", "NULL", "Depends on compiler"],
        correct: 1
    },
    {
        question: "Which data type is used to store decimal values in C?",
        options: ["int", "char", "float", "long"],
        correct: 2
    },
    {
        question: "Which keyword is used to define a function in Python?",
        options: ["function", "define", "def", "fun"],
        correct: 2
    },
    {
        question: "Which of the following is used for single-line comments in C++?",
        options: ["/* */", "#", "//", "<!-- -->"],
        correct: 2
    },
    {
        question: "Which data structure follows FIFO order?",
        options: ["Stack", "Queue", "Array", "Tree"],
        correct: 1
    },
    {
        question: "What will be the output of: printf(\"%d\", 5/2); in C?",
        options: ["2.5", "2", "3", "Error"],
        correct: 1
    },
    {
        question: "Which of the following is NOT a loop in C?",
        options: ["for", "while", "repeat", "do-while"],
        correct: 2
    },
    {
        question: "What is the file extension of a Python program?",
        options: [".pt", ".py", ".pyt", ".python"],
        correct: 1
    },
    {
        question: "Which operator has the highest precedence in C?",
        options: ["+", "*", "()", "="],
        correct: 2
    },
    {
        question: "What will be the output of the following Python code? print(type(10))",
        options: ["int", "<class 'int'>", "integer", "number"],
        correct: 1
    },
    {
        question: "Which of the following is a linear data structure?",
        options: ["Graph", "Tree", "Array", "Heap"],
        correct: 2
    },
    {
        question: "What is the size of int in C (on a 32-bit compiler)?",
        options: ["2 bytes", "4 bytes", "8 bytes", "Depends on OS"],
        correct: 1
    },
    {
        question: "Which sorting algorithm has the best average time complexity?",
        options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"],
        correct: 2
    },
    {
        question: "What does break do in a loop?",
        options: ["Skips one iteration", "Stops program execution", "Terminates the loop", "Pauses the loop"],
        correct: 2
    },
    {
        question: "Which of the following is mutable in Python?",
        options: ["Tuple", "String", "List", "Integer"],
        correct: 2
    },
    {
        question: "What is the output of: cout << (5 > 3 && 2 < 1);?",
        options: ["1", "0", "true", "false"],
        correct: 1
    },
    {
        question: "Which data structure is used for recursion?",
        options: ["Queue", "Stack", "Array", "Linked List"],
        correct: 1
    },
    {
        question: "What is the worst-case time complexity of linear search?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        correct: 2
    },
    {
        question: "Which function is used to read a string in C safely?",
        options: ["gets()", "scanf()", "fgets()", "puts()"],
        correct: 2
    },
    {
        question: "What does len() function do in Python?",
        options: ["Finds data type", "Finds memory size", "Finds length", "Finds range"],
        correct: 2
    },
    {
        question: "Which traversal technique uses recursion naturally?",
        options: ["BFS", "DFS", "Level Order", "Circular"],
        correct: 1
    },
    {
        question: "Which of the following is NOT an OOP concept?",
        options: ["Encapsulation", "Polymorphism", "Compilation", "Inheritance"],
        correct: 2
    },
    {
        question: "What is the output of the following C code? int a = 10; printf(\"%d\", a++);",
        options: ["11", "10", "9", "Error"],
        correct: 1
    },
    {
        question: "What is the time complexity of binary search?",
        options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
        correct: 1
    },
    {
        question: "Which of the following causes memory leak in C?",
        options: ["Not using pointers", "Using malloc without free", "Using free twice", "Using static variables"],
        correct: 1
    },
    {
        question: "What will be the output of the following Python code? a=[1,2,3]; b=a; b.append(4); print(a)",
        options: ["[1, 2, 3]", "[4]", "[1, 2, 3, 4]", "Error"],
        correct: 2
    },
    {
        question: "Which data structure is best for implementing a priority queue?",
        options: ["Stack", "Queue", "Heap", "Array"],
        correct: 2
    },
    {
        question: "What is the output of the following C++ code? int x = 5; cout << ++x * x++;",
        options: ["30", "36", "Undefined behavior", "25"],
        correct: 2
    }
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
    index++;

    if (index >= questions.length) {
        alert("Quiz Finished");
        return;
    }

    const q = questions[index];

    // Push question to Firebase
    db.ref("quiz").set({
        index,
        time: timeLeft,
        question: q,
        teamA: { answer: null, bet: 0, score: 0 },
        teamB: { answer: null, bet: 0, score: 0 }
    });

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

    q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        optionsDiv.appendChild(btn);
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
        const correct = data.questions.correct;

        let scoreA = data.teamA.score;
        let scoreB = data.teamB.score;

        if (data.teamA.answer !== null) {
            scoreA += (data.teamA.answer === correct ? data.teamA.bet : -data.teamA.bet);
        }

        if (data.teamB.answer !== null) {
            scoreB += (data.teamB.answer === correct ? data.teamB.bet : -data.teamB.bet);
        }

        db.ref("quiz/teamA/score").set(scoreA);
        db.ref("quiz/teamB/score").set(scoreB);

        document.getElementById("scoreA").textContent = scoreA;
        document.getElementById("scoreB").textContent = scoreB;
    });
}
window.startQuiz = startQuiz;



