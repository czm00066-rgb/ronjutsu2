
import { S2_QUESTIONS } from "./questions_s2.js";

const $ = (id) => document.getElementById(id);

const qidEl = $("qid");
const underlineBEl = $("underlineB");
const tipsEl = $("tips");
const answerEl = $("answer");
const btnCheck = $("btnCheck");
const btnShowModel = $("btnShowModel");
const btnCopyAnswer = document.getElementById("btnCopyAnswer");
const btnClearAnswer = document.getElementById("btnClearAnswer");
const charCountEl = document.getElementById("charCount");
const btnPrev = $("btnPrev");
const btnNext = $("btnNext");
const progressEl = $("progress");

const resultSection = $("resultSection");
const resultEl = $("result");
const modelAnswerEl = $("modelAnswer");
const checklistEl = $("checklist");

let idx = 0;
let modelVisible = false;

const KEYWORDS = [
  { label: "「確認し／把握し／明確にし」系", re: /(確認|把握|明確|整理)/ },
  { label: "固定結び（支援方針＋見立て）", re: /支援方針.*見立てを行うため/ },
];

function updateCharCount(){
  if(!charCountEl) return;
  const n = (answerEl.value || "").length;
  charCountEl.textContent = `文字数：${n}`;
}
answerEl.addEventListener("input", updateCharCount);

function getSelected(name){
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}
function setSelected(name, value){
  const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if(el) el.checked = true;
}
function clearSelected(name){
  document.querySelectorAll(`input[name="${name}"]`).forEach(r => r.checked = false);
}

function render(){
  const q = S2_QUESTIONS[idx];
  qidEl.textContent = `${q.id} / 全${S2_QUESTIONS.length}`;
  underlineBEl.textContent = q.underlineB;

  // tips
  tipsEl.innerHTML = "";
  if(q.tips && q.tips.length){
    const wrap = document.createElement("div");
    q.tips.forEach(t => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = t;
      wrap.appendChild(span);
    });
    tipsEl.appendChild(wrap);
  }

  // reset inputs
  clearSelected("form");
  clearSelected("intent");
  answerEl.value = "";
  modelVisible = false;
  if(charCountEl) charCountEl.textContent = "文字数：0";

  // hide results
  resultSection.style.display = "none";
  resultEl.className = "result";
  resultEl.textContent = "";
  modelAnswerEl.textContent = "";
  checklistEl.innerHTML = "";

  progressEl.textContent = `問題 ${idx+1} / ${S2_QUESTIONS.length}`;
}

function check(){
  const q = S2_QUESTIONS[idx];
  const form = getSelected("form");
  const intent = getSelected("intent");
  const ans = answerEl.value.trim();

  const misses = [];
  if(!form) misses.push("①形式が未選択です");
  if(!intent) misses.push("②主たる意図が未選択です");
  if(!ans) misses.push("③解答が未入力です");

  const wrongs = [];
  if(form && form !== q.form) wrongs.push(`形式：正解は「${q.form === "question" ? "問いかけ（質問形式）" : "伝え返し（確認形式）"}」`);
  if(intent && intent !== q.intent) {
    const label = q.intent === "info" ? "情報収集（状況把握）" : (q.intent === "insight" ? "気づき促進" : "受容（関係維持）");
    wrongs.push(`主たる意図：正解は「${label}」`);
  }

  resultSection.style.display = "block";
  modelVisible = true;
  modelAnswerEl.textContent = q.modelAnswer;

  // checklist
  checklistEl.innerHTML = "";
  KEYWORDS.forEach(k => {
    const li = document.createElement("li");
    li.textContent = `${k.label}：${k.re.test(ans) ? "✓" : "—"}`;
    checklistEl.appendChild(li);
  });

  if(misses.length){
    resultEl.classList.add("ng");
    resultEl.textContent = "未入力があります：\n" + misses.join("\n");
    return;
  }
  if(wrongs.length){
    resultEl.classList.add("ng");
    resultEl.textContent = "判定：一部ちがい\n" + wrongs.join("\n");
    return;
  }
  resultEl.classList.add("ok");
  resultEl.textContent = "判定：OK（形式・主意図は正解）";
}

function showModel(){
  const q = S2_QUESTIONS[idx];
  if(modelVisible){
    modelVisible = false;
    modelAnswerEl.textContent = "";
    if(resultEl.textContent === "模範を表示しました。"){
      resultSection.style.display = "none";
      resultEl.className = "result";
      resultEl.textContent = "";
    }else{
      resultSection.style.display = "block";
      resultEl.className = "result";
      resultEl.textContent = "模範をクリアしました。";
    }
    checklistEl.innerHTML = "";
    return;
  }
  modelVisible = true;
  resultSection.style.display = "block";
  modelVisible = true;
  modelAnswerEl.textContent = q.modelAnswer;
  if(!resultEl.textContent){
    resultEl.className = "result";
    resultEl.textContent = "模範を表示しました。";
  }
}

async function copyAnswer(){
  const text = (answerEl.value || "").trim();
  if(!text){
    resultSection.style.display = "block";
    resultEl.className = "result ng";
    resultEl.textContent = "回答が空です。";
    modelAnswerEl.textContent = "";
    checklistEl.innerHTML = "";
    modelVisible = false;
    return;
  }
  try{
    await navigator.clipboard.writeText(text);
    resultSection.style.display = "block";
    resultEl.className = "result ok";
    resultEl.textContent = "回答をコピーしました。";
  }catch(e){
    resultSection.style.display = "block";
    resultEl.className = "result ng";
    resultEl.textContent = "コピーできませんでした（ブラウザの権限設定をご確認ください）。";
  }
}

function clearAnswer(){
  answerEl.value = "";
  updateCharCount();
}

btnCheck.addEventListener("click", check);
btnShowModel.addEventListener("click", showModel);
if(btnCopyAnswer) btnCopyAnswer.addEventListener("click", copyAnswer);
if(btnClearAnswer) btnClearAnswer.addEventListener("click", clearAnswer);


btnPrev.addEventListener("click", () => {
  idx = (idx - 1 + S2_QUESTIONS.length) % S2_QUESTIONS.length;
  render();
});
btnNext.addEventListener("click", () => {
  idx = (idx + 1) % S2_QUESTIONS.length;
  render();
});

document.addEventListener("keydown", (e) => {
  // Ctrl+Enter で判定
  if((e.ctrlKey || e.metaKey) && e.key === "Enter"){
    check();
  }
});


// ===== Mode: Normal / Speed10 =====
const tabNormal = document.getElementById("tabNormal");
const tabSpeed = document.getElementById("tabSpeed");
const modeHint = document.getElementById("modeHint");
const speedCard = document.getElementById("speedCard");

// Speed elements
const speedProgressEl = document.getElementById("speedProgress");
const speedUnderlineBEl = document.getElementById("speedUnderlineB");
const btnSpeedNext = document.getElementById("btnSpeedNext");
const btnSpeedSkip = document.getElementById("btnSpeedSkip");
const btnSpeedRestart = document.getElementById("btnSpeedRestart");
const speedResultSection = document.getElementById("speedResultSection");
const speedSummaryEl = document.getElementById("speedSummary");
const speedMissListEl = document.getElementById("speedMissList");

let mode = "normal"; // normal | speed
let speedOrder = [];
let speedPos = 0;
let speedWrong = [];
let speedSkipped = 0;

function setMode(nextMode){
  mode = nextMode;
  const normalCard = document.getElementById("normalCard");
  if(mode === "normal"){
    tabNormal.classList.add("active");
    tabSpeed.classList.remove("active");
    tabNormal.setAttribute("aria-selected","true");
    tabSpeed.setAttribute("aria-selected","false");
    modeHint.textContent = "通常：1問ずつ判定";
    speedCard.style.display = "none";
    normalCard.style.display = "";
  }else{
    tabSpeed.classList.add("active");
    tabNormal.classList.remove("active");
    tabSpeed.setAttribute("aria-selected","true");
    tabNormal.setAttribute("aria-selected","false");
    modeHint.textContent = "スピード：形式＋意図のみを10連続で判定";
    normalCard.style.display = "none";
    speedCard.style.display = "";
    startSpeed();
  }
}

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clearSpeedSelected(){
  document.querySelectorAll('input[name="speed_form"]').forEach(r=>r.checked=false);
  document.querySelectorAll('input[name="speed_intent"]').forEach(r=>r.checked=false);
}
function getSpeedSelected(name){
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}

function startSpeed(){
  const ids = S2_QUESTIONS.map((_, i)=>i);
  speedOrder = shuffle(ids).slice(0, Math.min(10, ids.length));
  speedPos = 0;
  speedWrong = [];
  speedSkipped = 0;
  speedResultSection.style.display = "none";
  speedSummaryEl.textContent = "";
  speedMissListEl.textContent = "";
  renderSpeed();
}

function renderSpeed(){
  const total = speedOrder.length;
  if(speedPos >= total){
    finishSpeed();
    return;
  }
  const q = S2_QUESTIONS[speedOrder[speedPos]];
  speedProgressEl.textContent = `スピード ${speedPos+1} / ${total}`;
  speedUnderlineBEl.textContent = q.underlineB;
  clearSpeedSelected();
  const first = document.querySelector('input[name="speed_form"]');
  if(first) first.focus();
}

function finishSpeed(){
  const total = speedOrder.length;
  const correct = total - speedWrong.length - speedSkipped;
  speedResultSection.style.display = "block";
  speedSummaryEl.className = "result " + (speedWrong.length===0 && speedSkipped===0 ? "ok" : "ng");
  speedSummaryEl.textContent = `結果：${correct} / ${total} 正解（スキップ ${speedSkipped}）`;

  if(speedWrong.length){
    const lines = speedWrong.map(w=>{
      const f = w.correctForm==="question" ? "問いかけ" : "伝え返し";
      const i = w.correctIntent==="info" ? "情報" : (w.correctIntent==="insight" ? "気づき" : "受容");
      return `・${w.id}：${w.underlineB}\n  正：${f} / ${i}　（あなた：${w.yourForm} / ${w.yourIntent}）`;
    });
    speedMissListEl.textContent = lines.join("\n\n");
  }else{
    speedMissListEl.textContent = "間違いなし！";
  }
}

function speedNext(isSkip=false){
  const total = speedOrder.length;
  const q = S2_QUESTIONS[speedOrder[speedPos]];
  if(isSkip){
    speedSkipped += 1;
  }else{
    const form = getSpeedSelected("speed_form");
    const intent = getSpeedSelected("speed_intent");
    if(!form || !intent){
      speedResultSection.style.display = "block";
      speedSummaryEl.className = "result ng";
      speedSummaryEl.textContent = "①形式と②意図を選択してください（スキップも可）";
      return;
    }
    if(form !== q.form || intent !== q.intent){
      speedWrong.push({
        id: q.id,
        underlineB: q.underlineB,
        correctForm: q.form,
        correctIntent: q.intent,
        yourForm: form==="question" ? "問いかけ" : "伝え返し",
        yourIntent: intent==="info" ? "情報" : (intent==="insight" ? "気づき" : "受容")
      });
    }
  }
  speedResultSection.style.display = "none";
  speedSummaryEl.textContent = "";
  speedPos += 1;
  if(speedPos >= total){
    finishSpeed();
  }else{
    renderSpeed();
  }
}

if(tabNormal && tabSpeed){
  tabNormal.addEventListener("click", ()=>setMode("normal"));
  tabSpeed.addEventListener("click", ()=>setMode("speed"));
}
if(btnSpeedNext) btnSpeedNext.addEventListener("click", ()=>speedNext(false));
if(btnSpeedSkip) btnSpeedSkip.addEventListener("click", ()=>speedNext(true));
if(btnSpeedRestart) btnSpeedRestart.addEventListener("click", startSpeed);

// Enter key in speed mode -> next
document.addEventListener("keydown", (e)=>{
  if(mode !== "speed") return;
  if(e.key === "Enter"){
    e.preventDefault();
    speedNext(false);
  }
});

render();
