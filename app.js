/**************************************************************************
 * app.js
 * PHẦN 1
 * Khởi tạo - Load dữ liệu - Bắt đầu bài làm - Thanh điều hướng
 **************************************************************************/

const BLOCK_SIZE = 50;

const state = {

    allQuestions: [],

    currentBlock: null,

    questions: [],

    currentIndex: 0,

    score: 0,

    answered: 0,

    // đáp án người dùng
    answers: [],

    // danh sách câu sai
    wrongQuestions: [],

    reviewMode: false
};


/*======================================================
    DOM
======================================================*/

const pickerScreen = document.getElementById("pickerScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const setButtons = document.getElementById("setButtons");

const progressText = document.getElementById("progressText");
const scoreText = document.getElementById("scoreText");

const caseText = document.getElementById("caseText");
const questionText = document.getElementById("questionText");
const choicesEl = document.getElementById("choices");

const feedbackEl = document.getElementById("feedback");
const answerResultEl = document.getElementById("answerResult");
const hintTextEl = document.getElementById("hintText");

const questionNav = document.getElementById("questionNav");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");

const retryWrongBtn = document.getElementById("retryWrongBtn");
const continueBtn = document.getElementById("continueBtn");

const finalScore = document.getElementById("finalScore");
const correctCount = document.getElementById("correctCount");
const wrongCount = document.getElementById("wrongCount");
const accuracy = document.getElementById("accuracy");


/*======================================================
    Utility
======================================================*/

function shuffle(items){

    const arr=[...items];

    for(let i=arr.length-1;i>0;i--){

        const j=Math.floor(Math.random()*(i+1));

        [arr[i],arr[j]]=[arr[j],arr[i]];
    }

    return arr;
}

function normalizeHint(text){

    if(!text) return "Không có gợi ý.";

    return text
        .replace(/\[<br>\]/g,"\n")
        .replace(/\s+\n/g,"\n")
        .trim();
}


function isValidQuestion(item){

    return(

        item &&

        Number.isInteger(item.id)&&

        Array.isArray(item.choices)&&

        item.choices.length===5&&

        typeof item.question==="string"

    );

}

function prepareQuestion(item){

    const answers=item.choices.map((choice,index)=>({

        text:String(choice),

        isCorrect:index+1===item.correct

    }));

    return{

        ...item,

        answers:shuffle(answers)

    };

}


/*======================================================
    Block
======================================================*/

function buildBlocks(validQuestions){

    const maxId=Math.max(...validQuestions.map(q=>q.id));

    const blocks=[];

    for(let start=1;start<=maxId;start+=BLOCK_SIZE){

        const end=start+BLOCK_SIZE-1;

        const count=validQuestions.filter(q=>q.id>=start&&q.id<=end).length;

        if(count){

            blocks.push({

                start,

                end,

                count

            });

        }

    }

    return blocks;

}

function renderBlockPicker(){

    setButtons.innerHTML="";

    const blocks=buildBlocks(state.allQuestions);

    blocks.forEach(block=>{

        const btn=document.createElement("button");

        btn.className="set-btn";

        btn.innerHTML=`

            <h3 class="set-title">${block.start}-${block.end}</h3>

            <p class="set-desc">${block.count} câu</p>

        `;

        btn.onclick=()=>startBlock(block);

        setButtons.appendChild(btn);

    });

}


/*======================================================
    Start Quiz
======================================================*/

function startBlock(block){

    state.currentBlock=block;

    state.questions=shuffle(

        state.allQuestions

        .filter(q=>q.id>=block.start&&q.id<=block.end)

        .map(prepareQuestion)

    );

    state.currentIndex=0;

    state.score=0;

    state.answered=0;

    state.answers=[];

    state.wrongQuestions=[];

    state.reviewMode=false;

    pickerScreen.classList.add("hidden");

    resultScreen.classList.add("hidden");

    quizScreen.classList.remove("hidden");

    buildNavigator();

    renderQuestion();

}


/*======================================================
    Navigator
======================================================*/

function buildNavigator(){

    questionNav.innerHTML="";

    state.questions.forEach((q,index)=>{

        const btn=document.createElement("button");

        btn.className="nav-btn";

        btn.textContent=index+1;

        btn.onclick=()=>{

            state.currentIndex=index;

            renderQuestion();

        };

        questionNav.appendChild(btn);

    });

}

function updateNavigator(){

    [...questionNav.children].forEach((btn,index)=>{

        btn.className="nav-btn";

        if(index===state.currentIndex){

            btn.classList.add("nav-current");

        }

        const ans=state.answers[index];

        if(ans){

            if(ans.correct){

                btn.classList.add("nav-correct");

            }else{

                btn.classList.add("nav-wrong");

            }

        }

    });

}


/*======================================================
    Load JSON
======================================================*/

async function init(){

    const response=await fetch("../cases.json");

    const raw=await response.json();

    state.allQuestions=raw.filter(isValidQuestion);

    renderBlockPicker();

}

/**************************************************************************
 * app.js
 * PHẦN 2
 * Hiển thị câu hỏi - Chấm điểm - Previous/Next
 **************************************************************************/

/*======================================================
    Hiển thị câu hỏi
======================================================*/

function renderQuestion() {

    updateNavigator();

    const q = state.questions[state.currentIndex];

    progressText.textContent =
        `Bộ ${state.currentBlock.start}-${state.currentBlock.end} • Câu ${state.currentIndex + 1}/${state.questions.length}`;

    scoreText.textContent =
        `Đúng ${state.score}/${state.answered}`;

    caseText.textContent = q.case || "";

    questionText.textContent = q.question;

    choicesEl.innerHTML = "";

    feedbackEl.classList.add("hidden");

    answerResultEl.textContent = "";

    hintTextEl.textContent = "";

    prevBtn.disabled = state.currentIndex === 0;

    nextBtn.disabled = true;

    const oldAnswer = state.answers[state.currentIndex];

    q.answers.forEach((answer, index) => {

        const button = document.createElement("button");

        button.className = "choice";

        button.textContent =
            `${String.fromCharCode(65 + index)}. ${answer.text}`;

        if (!oldAnswer) {

            button.onclick = () => submitAnswer(index);

        } else {

            button.disabled = true;

            if (answer.isCorrect) {

                button.classList.add("correct");

            }

            if (oldAnswer.selected === index && !answer.isCorrect) {

                button.classList.add("wrong");

            }

        }

        choicesEl.appendChild(button);

    });

    if (oldAnswer) {

        feedbackEl.classList.remove("hidden");

        answerResultEl.textContent =
            oldAnswer.correct
                ? "Chính xác."
                : "Sai.";

        hintTextEl.textContent =
            normalizeHint(q.hint);

        nextBtn.disabled = false;

    }

}

/*======================================================
    Trả lời
======================================================*/

function submitAnswer(selectedIndex) {

    const q = state.questions[state.currentIndex];

    const buttons =
        [...choicesEl.querySelectorAll(".choice")];

    buttons.forEach(btn => btn.disabled = true);

    const answer = q.answers[selectedIndex];

    state.answered++;

    if (answer.isCorrect) {

        state.score++;

    } else {

        state.wrongQuestions.push(q);

    }

    state.answers[state.currentIndex] = {

        selected: selectedIndex,

        correct: answer.isCorrect

    };

    buttons.forEach((btn, i) => {

        if (q.answers[i].isCorrect) {

            btn.classList.add("correct");

        }

    });

    if (!answer.isCorrect) {

        buttons[selectedIndex].classList.add("wrong");

    }

    answerResultEl.textContent =
        answer.isCorrect
            ? "Chính xác."
            : "Sai.";

    hintTextEl.textContent =
        normalizeHint(q.hint);

    feedbackEl.classList.remove("hidden");

    scoreText.textContent =
        `Đúng ${state.score}/${state.answered}`;

    updateNavigator();

    nextBtn.disabled = false;

}

/*======================================================
    Previous
======================================================*/

function previousQuestion() {

    if (state.currentIndex === 0) return;

    state.currentIndex--;

    renderQuestion();

}

/*======================================================
    Next
======================================================*/

function nextQuestion() {

    if (state.currentIndex >= state.questions.length - 1) {

        showResult();

        return;

    }

    state.currentIndex++;

    renderQuestion();

}
/**************************************************************************
 * app.js
 * PHẦN 3
 * Kết quả - Làm lại câu sai - Tiếp tục - Event
 **************************************************************************/

/*======================================================
    Hiển thị kết quả
======================================================*/

function showResult() {

    quizScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    const total = state.questions.length;
    const correct = state.score;
    const wrong = total - correct;

    finalScore.textContent =
        `Điểm: ${correct}/${total}`;

    correctCount.textContent =
        `✅ Đúng: ${correct}`;

    wrongCount.textContent =
        `❌ Sai: ${wrong}`;

    accuracy.textContent =
        `Tỷ lệ chính xác: ${(correct / total * 100).toFixed(1)}%`;

    if (wrong === 0) {

        retryWrongBtn.disabled = true;

        retryWrongBtn.textContent =
            "Bạn đã làm đúng toàn bộ";

    } else {

        retryWrongBtn.disabled = false;

        retryWrongBtn.textContent =
            `Làm lại ${wrong} câu sai`;

    }

}


/*======================================================
    Làm lại câu sai
======================================================*/

function retryWrongQuestions() {

    if (state.wrongQuestions.length === 0) {

        alert("Bạn đã làm đúng toàn bộ.");

        return;

    }

    state.questions =
        shuffle(
            state.wrongQuestions.map(prepareQuestion)
        );

    state.currentIndex = 0;

    state.score = 0;

    state.answered = 0;

    state.answers = [];

    state.wrongQuestions = [];

    resultScreen.classList.add("hidden");

    quizScreen.classList.remove("hidden");

    buildNavigator();

    renderQuestion();

}


/*======================================================
    Tiếp tục
======================================================*/

function continueQuiz() {

    resultScreen.classList.add("hidden");

    pickerScreen.classList.remove("hidden");

}


/*======================================================
    Quay lại
======================================================*/

function backToPicker() {

    if (!confirm("Bạn có muốn thoát khỏi bài làm?")) {

        return;

    }

    quizScreen.classList.add("hidden");

    pickerScreen.classList.remove("hidden");

}


/*======================================================
    Event
======================================================*/

nextBtn.addEventListener(

    "click",

    nextQuestion

);

prevBtn.addEventListener(

    "click",

    previousQuestion

);

backBtn.addEventListener(

    "click",

    backToPicker

);

retryWrongBtn.addEventListener(

    "click",

    retryWrongQuestions

);

continueBtn.addEventListener(

    "click",

    continueQuiz

);


/*======================================================
    Khởi động
======================================================*/

init().catch(error => {

    setButtons.innerHTML =

        `<p>Lỗi tải dữ liệu: ${error.message}</p>`;

});
