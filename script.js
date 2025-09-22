// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const instructionsScreen = document.getElementById('instructions-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const answersModal = document.getElementById('answers-modal');

const userForm = document.getElementById('user-form');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const viewAnswersBtn = document.getElementById('view-answers-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const closeSpan = document.querySelector('.close');
const goHomeBtn = document.getElementById('go-home-btn');
const themeToggle = document.getElementById('theme-toggle'); // ✅ NEW

const timerEl = document.getElementById('timer');
const currentQEl = document.getElementById('current-q');
const questionBox = document.getElementById('question-box');
const optionsBox = document.getElementById('options-box');
const finalScoreEl = document.getElementById('final-score');
const userNameEl = document.getElementById('user-name');
const answersListEl = document.getElementById('answers-list');
const topScoresEl = document.getElementById('top-scores'); // ✅ NEW
const leaderboardEl = document.getElementById('leaderboard'); // ✅ NEW

// Quiz Data
const quizData = [
    { question: "What is the capital of France?", options: ["Berlin", "Madrid", "Paris", "Rome"], correct: 2 },
    { question: "Which planet is known as the Red Planet?", options: ["Earth", "Mars", "Jupiter", "Venus"], correct: 1 },
    { question: "What is 2 + 2?", options: ["3", "4", "5", "6"], correct: 1 },
    { question: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], correct: 1 },
    { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3 },
    { question: "Which year did World War II end?", options: ["1943", "1945", "1950", "1939"], correct: 1 },
    { question: "What is the chemical symbol for water?", options: ["H2O", "CO2", "O2", "NaCl"], correct: 0 },
    { question: "Which animal is known as the 'Ship of the Desert'?", options: ["Horse", "Camel", "Elephant", "Donkey"], correct: 1 },
    { question: "How many continents are there?", options: ["5", "6", "7", "8"], correct: 2 },
    { question: "What is the square root of 64?", options: ["6", "7", "8", "9"], correct: 2 }
];

// State
let currentUser = { name: "", email: "" };
let currentQuestionIndex = 0;
let selectedOption = null;
let userAnswers = [];
let timerInterval;
let timeLeft = 5 * 60;
let shuffledQuizData = [];

// Fisher-Yates Shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ✅ Dark Mode Toggle
function initDarkMode() {
    // Check user preference
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    document.body.classList.add(savedTheme === 'dark' ? 'dark-theme' : 'light-theme');
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-theme');
        document.body.classList.toggle('dark-theme', !isDark);
        themeToggle.textContent = isDark ? '🌙' : '☀️';
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        
        // Animate toggle
        gsap.to(themeToggle, { rotation: "+=180", duration: 0.5 });
    });
}

// ✅ High Scores Management
function saveScore(name, score) {
    const scores = JSON.parse(localStorage.getItem('quizHighScores') || '[]');
    const newScore = {
        name: name,
        score: score,
        date: new Date().toISOString()
    };
    
    scores.push(newScore);
    scores.sort((a, b) => b.score - a.score); // Sort descending
    scores.splice(5); // Keep only top 5
    
    localStorage.setItem('quizHighScores', JSON.stringify(scores));
    return scores;
}

function displayScores(container, scores, isTop = false) {
    container.innerHTML = '<h3>🏆 Leaderboard</h3>';
    
    if (scores.length === 0) {
        container.innerHTML += '<p>No scores yet!</p>';
        return;
    }

    scores.forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = `score-entry ${index < 3 ? 'top-' + (index + 1) : ''}`;
        div.innerHTML = `
            <span class="rank">${index + 1}.</span>
            <span class="name">${entry.name}</span>
            <span class="score">${entry.score}/20</span>
        `;
        container.appendChild(div);
    });
}

// GSAP Animations
function animateScreenIn(element) {
    gsap.fromTo(element,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );
}

function animateOptionIn(option, delay) {
    gsap.fromTo(option,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.4, delay: delay, ease: "power2.out" }
    );
}

function confettiCelebration() {
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

// Event Listeners
userForm.addEventListener('submit', showInstructions);
startBtn.addEventListener('click', startQuiz);
nextBtn.addEventListener('click', nextQuestion);
submitBtn.addEventListener('click', showResult);
viewAnswersBtn.addEventListener('click', showAnswersModal);
closeModalBtn.addEventListener('click', hideAnswersModal);
closeSpan.addEventListener('click', hideAnswersModal);
goHomeBtn.addEventListener('click', goHome);

// ✅ Initialize
initDarkMode();
loadTopScores(); // ✅ Load scores on start

// Functions
function loadTopScores() {
    const scores = JSON.parse(localStorage.getItem('quizHighScores') || '[]');
    displayScores(topScoresEl, scores.slice(0, 3), true); // Show top 3 on welcome
}

function showInstructions(e) {
    e.preventDefault();
    currentUser.name = document.getElementById('name').value.trim();
    currentUser.email = document.getElementById('email').value.trim();

    gsap.to(welcomeScreen, { opacity: 0, y: -30, duration: 0.5, onComplete: () => {
        welcomeScreen.classList.remove('active');
        instructionsScreen.classList.add('active');
        animateScreenIn(instructionsScreen);
    }});
}

function startQuiz() {
    currentQuestionIndex = 0;
    selectedOption = null;
    userAnswers = new Array(quizData.length).fill(null);
    timeLeft = 5 * 60;
    timerEl.textContent = "05:00";
    clearInterval(timerInterval);

    shuffledQuizData = [...quizData];
    shuffleArray(shuffledQuizData);

    gsap.to(instructionsScreen, { opacity: 0, y: -30, duration: 0.5, onComplete: () => {
        instructionsScreen.classList.remove('active');
        quizScreen.classList.add('active');
        animateScreenIn(quizScreen);
        loadQuestion();
        startTimer();
    }});
}

function loadQuestion() {
    const q = shuffledQuizData[currentQuestionIndex];
    questionBox.textContent = q.question;

    gsap.fromTo(questionBox,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5 }
    );

    optionsBox.innerHTML = '';

    const shuffledOptions = [...q.options];
    const originalIndices = [...Array(q.options.length).keys()];
    const shuffledIndices = shuffleArray([...originalIndices]);

    shuffledIndices.forEach((origIndex, displayIndex) => {
        const optionText = q.options[origIndex];
        const button = document.createElement('button');
        button.classList.add('option');
        button.textContent = optionText;
        button.dataset.index = origIndex;

        if (userAnswers[currentQuestionIndex] === origIndex) {
            button.classList.add('selected');
        }

        button.addEventListener('click', () => selectOption(button, origIndex));
        optionsBox.appendChild(button);

        animateOptionIn(button, displayIndex * 0.1);
    });

    currentQEl.textContent = currentQuestionIndex + 1;

    if (currentQuestionIndex === quizData.length - 1) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
        submitBtn.classList.add('pulse');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
        submitBtn.classList.remove('pulse');
    }
}

function selectOption(button, index) {
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
        gsap.to(opt, { scale: 1, duration: 0.2 });
    });

    button.classList.add('selected');
    gsap.to(button, { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 });

    selectedOption = index;
    userAnswers[currentQuestionIndex] = index;
}

function nextQuestion() {
    if (selectedOption === null) {
        alert("Please select an option!");
        return;
    }

    currentQuestionIndex++;
    selectedOption = null;
    loadQuestion();
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const seconds = (timeLeft % 60).toString().padStart(2, '0');
        timerEl.textContent = `${minutes}:${seconds}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            autoSubmit();
        }
    }, 1000);
}

function autoSubmit() {
    alert("Time's up! Quiz auto-submitted.");
    showResult();
}

function showResult() {
    clearInterval(timerInterval);
    quizScreen.classList.remove('active');

    let score = 0;
    userAnswers.forEach((answer, index) => {
        if (answer === shuffledQuizData[index].correct) score += 2;
    });

    finalScoreEl.textContent = `${score}/20`;
    userNameEl.textContent = `Well done, ${currentUser.name}!`;
    document.documentElement.style.setProperty('--p', `${(score / 20) * 100}%`);

    // ✅ Save and display scores
    const allScores = saveScore(currentUser.name, score);
    displayScores(leaderboardEl, allScores.slice(0, 5));

    gsap.to(quizScreen, { opacity: 0, duration: 0.5, onComplete: () => {
        resultScreen.classList.add('active');
        animateScreenIn(resultScreen);

        if (score >= 10) confettiCelebration();
    }});
}

function showAnswersModal() {
    answersListEl.innerHTML = '';
    shuffledQuizData.forEach((q, i) => {
        const userAnswer = userAnswers[i] !== null ? q.options[userAnswers[i]] : "Not answered";
        const correctAnswer = q.options[q.correct];

        const item = document.createElement('div');
        item.classList.add('answer-item');
        item.innerHTML = `
            <strong>Q${i+1}:</strong> ${q.question}<br>
            <span class="user-answer">Your Answer: ${userAnswer}</span><br>
            <span class="correct-answer">Correct Answer: ${correctAnswer}</span>
        `;
        answersListEl.appendChild(item);

        gsap.fromTo(item,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.3, delay: i * 0.1 }
        );
    });

    answersModal.style.display = 'flex';
    gsap.fromTo('.modal-content', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4 });
}

function hideAnswersModal() {
    gsap.to('.modal-content', {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        onComplete: () => answersModal.style.display = 'none'
    });
}

function goHome() {
    currentQuestionIndex = 0;
    selectedOption = null;
    userAnswers = new Array(quizData.length).fill(null);
    timeLeft = 5 * 60;
    timerEl.textContent = "05:00";
    clearInterval(timerInterval);

    // ✅ Reload top scores
    loadTopScores();

    gsap.to(resultScreen, { opacity: 0, y: 30, duration: 0.5, onComplete: () => {
        resultScreen.classList.remove('active');
        welcomeScreen.classList.add('active');
        animateScreenIn(welcomeScreen);
        userForm.reset();
    }});
}

window.addEventListener('click', (e) => {
    if (e.target === answersModal) {
        hideAnswersModal();
    }
});