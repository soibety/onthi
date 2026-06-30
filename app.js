const BLOCK_SIZE = 50;

const state = {
  allQuestions: [],
  currentBlock: null,
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: 0,
};

const pickerScreen = document.getElementById("pickerScreen");
const quizScreen = document.getElementById("quizScreen");
const setButtons = document.getElementById("setButtons");
const progressText = document.getElementById("progressText");
const scoreText = document.getElementById("scoreText");
const caseText = document.getElementById("caseText");
const questionText = document.getElementById("questionText");
const choicesEl = document.getElementById("choices");
const feedbackEl = document.getElementById("feedback");
const answerResultEl = document.getElementById("answerResult");
const hintTextEl = document.getElementById("hintText");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeHint(text) {
  if (!text) return "Không có gợi ý.";
  return text
    .replace(/\[<br>\]/g, "\n")
    .replace(/\s+\n/g, "\n")
    .trim() || "Không có gợi ý.";
}

function isValidQuestion(item) {
  return (
    item &&
    Number.isInteger(item.id) &&
    Array.isArray(item.choices) &&
    item.choices.length === 5 &&
    Number.isInteger(item.correct) &&
    item.correct >= 1 &&
    item.correct <= 5 &&
    typeof item.question === "string" &&
    item.question.trim().length > 0
  );
}

function prepareQuestion(item) {
  const answers = item.choices.map((choice, index) => ({
    text: String(choice).trim(),
    isCorrect: index + 1 === item.correct,
  }));

  return {
    ...item,
    answers: shuffle(answers),
  };
}

function buildBlocks(validQuestions) {
  const maxId = Math.max(...validQuestions.map((q) => q.id));
  const blocks = [];

  for (let start = 1; start <= maxId; start += BLOCK_SIZE) {
    const end = start + BLOCK_SIZE - 1;
    const count = validQuestions.filter((q) => q.id >= start && q.id <= end).length;

    if (count > 0) {
      blocks.push({ start, end, count });
    }
  }

  return blocks;
}

function renderBlockPicker() {
  const blocks = buildBlocks(state.allQuestions);
  setButtons.innerHTML = "";

  blocks.forEach((block) => {
    const btn = document.createElement("button");
    btn.className = "set-btn";
    btn.innerHTML = `
      <h3 class="set-title">${block.start} - ${block.end}</h3>
      <p class="set-desc">${block.count} câu hợp lệ</p>
    `;
    btn.addEventListener("click", () => startBlock(block));
    setButtons.appendChild(btn);
  });
}

function startBlock(block) {
  state.currentBlock = block;
  state.questions = shuffle(
    state.allQuestions
      .filter((q) => q.id >= block.start && q.id <= block.end)
      .map(prepareQuestion)
  );
  state.currentIndex = 0;
  state.score = 0;
  state.answered = 0;

  pickerScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  renderQuestion();
}

function renderQuestion() {
  const q = state.questions[state.currentIndex];
  const current = state.currentIndex + 1;

  progressText.textContent = `Bộ ${state.currentBlock.start}-${state.currentBlock.end} • Câu ${current}/${state.questions.length}`;
  scoreText.textContent = `Đúng ${state.score}/${state.answered}`;
  caseText.textContent = q.case || "";
  questionText.textContent = q.question;
  choicesEl.innerHTML = "";
  feedbackEl.classList.add("hidden");
  answerResultEl.textContent = "";
  hintTextEl.textContent = "";
  nextBtn.disabled = true;

  q.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.textContent = `${String.fromCharCode(65 + index)}. ${answer.text}`;
    button.addEventListener("click", () => submitAnswer(answer, button));
    choicesEl.appendChild(button);
  });
}

function submitAnswer(answer, clickedButton) {
  const q = state.questions[state.currentIndex];
  const buttons = [...choicesEl.querySelectorAll(".choice")];

  buttons.forEach((button) => {
    button.disabled = true;
  });

  state.answered += 1;

  buttons.forEach((button, index) => {
    if (q.answers[index].isCorrect) {
      button.classList.add("correct");
    }
  });

  if (answer.isCorrect) {
    state.score += 1;
    answerResultEl.textContent = "Chính xác.";
  } else {
    clickedButton.classList.add("wrong");
    const correctAnswer = q.answers.find((item) => item.isCorrect);
    answerResultEl.textContent = `Sai. Đáp án đúng: ${correctAnswer.text}`;
  }

  hintTextEl.textContent = normalizeHint(q.hint);
  feedbackEl.classList.remove("hidden");
  scoreText.textContent = `Đúng ${state.score}/${state.answered}`;
  nextBtn.disabled = false;
}

function nextQuestion() {
  if (state.currentIndex >= state.questions.length - 1) {
    questionText.textContent = `Hoàn thành bộ ${state.currentBlock.start}-${state.currentBlock.end}`;
    caseText.textContent = "";
    choicesEl.innerHTML = "";
    feedbackEl.classList.remove("hidden");
    answerResultEl.textContent = `Điểm của bạn: ${state.score}/${state.answered}`;
    hintTextEl.textContent = "Bấm Quay lại để chọn bộ khác.";
    nextBtn.disabled = true;
    progressText.textContent = `Đã xong ${state.questions.length} câu`;
    return;
  }

  state.currentIndex += 1;
  renderQuestion();
}

function backToPicker() {
  quizScreen.classList.add("hidden");
  pickerScreen.classList.remove("hidden");
}

async function init() {
  const response = await fetch("../cases.json");
  const raw = await response.json();
  state.allQuestions = raw.filter(isValidQuestion);

  if (state.allQuestions.length === 0) {
    setButtons.innerHTML = "<p>Không có câu hỏi hợp lệ trong dữ liệu.</p>";
    return;
  }

  renderBlockPicker();
}

nextBtn.addEventListener("click", nextQuestion);
backBtn.addEventListener("click", backToPicker);

init().catch((error) => {
  setButtons.innerHTML = `<p>Lỗi tải dữ liệu: ${error.message}</p>`;
});