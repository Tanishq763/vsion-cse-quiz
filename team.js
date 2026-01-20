const firebaseConfig = {
  apiKey: "AIzaSyDREhmA6fyafxw8dJqh30B5pjfdEAjf3no",
  authDomain: "vision-cse-quiz.firebaseapp.com",
  databaseURL: "https://vision-cse-quiz-default-rtdb.firebaseio.com",
  projectId: "vision-cse-quiz"
};
if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db=firebase.database();

const team=new URLSearchParams(location.search).get("team");
document.getElementById("teamTitle").textContent="TEAM "+team;

const qEl=document.getElementById("question");
const optEl=document.getElementById("options");
const betEl=document.getElementById("betInput");
const timerEl=document.getElementById("timer");
const scoreEl=document.getElementById("myScore");

let rendered=-1;

db.ref("quiz").on("value",s=>{
  const d=s.val(); if(!d) return;
  const me=d["team"+team];
  scoreEl.textContent=me.score;
  timerEl.textContent="⏱ "+d.time;

  if(d.question && d.roundId!==rendered){
    rendered=d.roundId;
    qEl.textContent=d.question.text;
    betEl.value=me.bet??"";
    render(d.question.options);
  }

  betEl.disabled=d.state!=="RUNNING";
  if(d.state==="LOCKED") reveal(me.answer,d.question.correct);
});

function render(opts){
  optEl.innerHTML="";
  opts.forEach((o,i)=>{
    const b=document.createElement("button");
    b.textContent=o;
    b.onclick=()=>db.ref(`quiz/team${team}/answer`).set(i);
    optEl.appendChild(b);
  });
}

betEl.oninput=()=>{
  const v=parseInt(betEl.value);
  if(v>=0) db.ref(`quiz/team${team}/bet`).set(v);
};

function reveal(ans,correct){
  [...optEl.children].forEach((b,i)=>{
    if(i===correct) b.classList.add("correct");
    else if(i===ans) b.classList.add("wrong");
    b.disabled=true;
  });
}
