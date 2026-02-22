/* main.js - 대박 로또 with Theme Support and Bonus Numbers */

// --- Web Audio API: 범종 사운드 ---
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playBellSound() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;

    // 기본음: 묵직한 범종 (deep bell fundamental)
    const osc1 = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(130, t);
    osc1.frequency.exponentialRampToValueAtTime(85, t + 0.4);
    g1.gain.setValueAtTime(0.15, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc1.connect(g1);
    g1.connect(audioCtx.destination);
    osc1.start(t);
    osc1.stop(t + 0.45);

    // 배음: 금속성 울림 (metallic overtone)
    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(340, t);
    osc2.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    g2.gain.setValueAtTime(0.05, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc2.connect(g2);
    g2.connect(audioCtx.destination);
    osc2.start(t);
    osc2.stop(t + 0.2);

    // 타격음: 짧은 노이즈 (strike transient)
    const bufLen = Math.floor(audioCtx.sampleRate * 0.03);
    const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.15));
    }
    const noise = audioCtx.createBufferSource();
    const gn = audioCtx.createGain();
    noise.buffer = buf;
    gn.gain.setValueAtTime(0.08, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    noise.connect(gn);
    gn.connect(audioCtx.destination);
    noise.start(t);
}

function scheduleBallSounds(rowCount) {
    for (let row = 0; row < rowCount; row++) {
        for (let i = 0; i < 8; i++) {
            if (i === 6) continue; // 플러스 기호는 건너뜀
            const delay = (row * 0.4 + i * 0.2) * 1000;
            setTimeout(() => playBellSound(), delay);
        }
    }
}

// Splash Overlay Control
const hideSplash = () => {
    const splash = document.getElementById('splash-overlay');
    if (splash) {
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.style.display = 'none';
            splash.style.zIndex = '-1';
        }, 1000);
    }
};

setTimeout(hideSplash, 3000);

const generateBtn = document.getElementById('generate-btn');
const numbersContainer = document.getElementById('numbers-container');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

// Lotto Round Calculation (based on Saturday 20:45 KST draw time)
function getCurrentRound() {
    const firstDraw = new Date('2002-12-07T20:45:00+09:00');
    const now = new Date();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const elapsed = now.getTime() - firstDraw.getTime();
    return Math.floor(elapsed / msPerWeek) + 2;
}

function getLastDrawnRound() {
    const firstDraw = new Date('2002-12-07T20:45:00+09:00');
    const now = new Date();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const elapsed = now.getTime() - firstDraw.getTime();
    return Math.floor(elapsed / msPerWeek) + 1;
}

const currentRound = getCurrentRound();
const roundEl = document.getElementById('current-round');
if (roundEl) roundEl.textContent = `${currentRound}회`;

// --- Weekly Usage Limit (5회/주, 매주 월요일 리셋) ---
const WEEKLY_MAX = 5;
const ADMIN_KEY = 'lottoAdmin';
const weeklyLimitEl = document.getElementById('weekly-limit');

function isAdmin() {
    return localStorage.getItem(ADMIN_KEY) === 'true';
}

function getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - diff);
    return monday.getTime();
}

function getWeeklyUsage() {
    const raw = localStorage.getItem('lottoWeekly');
    if (!raw) return { weekStart: 0, count: 0 };
    try { return JSON.parse(raw); } catch { return { weekStart: 0, count: 0 }; }
}

function getRemainingUses() {
    if (isAdmin()) return WEEKLY_MAX;
    const usage = getWeeklyUsage();
    const currentWeek = getWeekStart();
    if (usage.weekStart !== currentWeek) return WEEKLY_MAX;
    return Math.max(0, WEEKLY_MAX - usage.count);
}

function incrementUsage() {
    if (isAdmin()) return;
    const currentWeek = getWeekStart();
    const usage = getWeeklyUsage();
    if (usage.weekStart !== currentWeek) {
        localStorage.setItem('lottoWeekly', JSON.stringify({ weekStart: currentWeek, count: 1 }));
    } else {
        usage.count++;
        localStorage.setItem('lottoWeekly', JSON.stringify(usage));
    }
}

function getDaysUntilReset() {
    const now = new Date();
    const day = now.getDay();
    const daysLeft = day === 0 ? 1 : (8 - day);
    return daysLeft;
}

function updateLimitDisplay() {
    if (!weeklyLimitEl) return;
    if (isAdmin()) {
        weeklyLimitEl.className = 'weekly-limit';
        weeklyLimitEl.innerHTML = '';
        return;
    }
    const remaining = getRemainingUses();
    if (remaining > 0) {
        weeklyLimitEl.className = 'weekly-limit';
        weeklyLimitEl.innerHTML = `이번 주 남은 천기누설: <b>${remaining}회</b>`;
    } else {
        const days = getDaysUntilReset();
        weeklyLimitEl.className = 'weekly-limit exhausted';
        weeklyLimitEl.innerHTML = `이번 주의 천기가 모두 소진되었습니다.<span class="days-left">다음 주 기운 충전까지 ${days}일 남음</span>`;
        generateBtn.disabled = true;
        faceBtn.disabled = true;
    }
}

function checkWeeklyLimit() {
    if (getRemainingUses() <= 0) {
        alert('이번 주에 허락된 5번의 천기를 모두 확인하셨습니다.\n\n기운이 다시 모이는 다음 주에 찾아오십시오.');
        return false;
    }
    return true;
}

updateLimitDisplay();

// Theme Logic
const currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeIcons(currentTheme);

themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcons(theme);
});

function updateThemeIcons(theme) {
    if (theme === 'dark') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}

const blessingText = document.getElementById('blessing-text');
const blessingMessages = {
    good: [
        "❝ 필시 1등이 될 상이네. 대박 나시게나! ❞",
        "❝ 재물운이 미간에 훤히 빛나고 있네. 꽉 잡으시게! ❞"
    ],
    normal: [
        "❝ 천기를 누설하는 것이니, 아무에게도 말하지 마시게. ❞",
        "❝ 이번 주엔 귀인을 만날 상이야. 이 번호를 믿어보시게. ❞"
    ],
    bad: [
        "❝ 음... 오늘은 기운이 탁하네. 이번엔 가볍게만 하시게나. ❞"
    ]
};

const showBlessing = (luckLevel = null) => {
    if (!blessingText) return;

    if (!luckLevel) {
        blessingText.classList.remove('show');
        return;
    }

    const messages = blessingMessages[luckLevel];
    const randomIndex = Math.floor(Math.random() * messages.length);
    blessingText.textContent = messages[randomIndex];

    blessingText.classList.remove('show');
    void blessingText.offsetWidth;
    blessingText.classList.add('show');
};

// --- Placeholder Balls (Initial State) ---
function showPlaceholderRow() {
    numbersContainer.innerHTML = '';
    const rowEl = document.createElement('div');
    rowEl.classList.add('number-row');

    for (let i = 0; i < 6; i++) {
        const ball = document.createElement('div');
        ball.classList.add('number', 'placeholder');
        ball.textContent = '?';
        rowEl.appendChild(ball);
    }

    const plusEl = document.createElement('div');
    plusEl.classList.add('plus-sign', 'placeholder');
    plusEl.textContent = '+';
    rowEl.appendChild(plusEl);

    const bonusBall = document.createElement('div');
    bonusBall.classList.add('number', 'bonus', 'placeholder');
    bonusBall.textContent = '?';
    rowEl.appendChild(bonusBall);

    numbersContainer.appendChild(rowEl);
}

// --- Analysis Loading Sequence ---
const analysisSteps = [
    '잉크 농도 측정 중...',
    '물리 가중치 분석 중...',
    '통계 엔진 연산 중...',
    '번호 도출 완료!'
];

function showAnalysisLoading(callback) {
    numbersContainer.innerHTML = '';
    const loadingEl = document.createElement('div');
    loadingEl.className = 'analysis-loading';

    const spinner = document.createElement('div');
    spinner.className = 'analysis-spinner';
    loadingEl.appendChild(spinner);

    const stepEl = document.createElement('p');
    stepEl.className = 'analysis-step';
    stepEl.textContent = analysisSteps[0];
    loadingEl.appendChild(stepEl);

    numbersContainer.appendChild(loadingEl);

    let stepIndex = 0;
    const interval = setInterval(() => {
        stepIndex++;
        if (stepIndex < analysisSteps.length) {
            stepEl.style.animation = 'none';
            void stepEl.offsetWidth;
            stepEl.textContent = analysisSteps[stepIndex];
            stepEl.style.animation = 'stepFade 0.4s ease';
        }
        if (stepIndex >= analysisSteps.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
                numbersContainer.innerHTML = '';
                callback();
            }, 400);
        }
    }, 1200);
}

// --- Generate Button ---
generateBtn.addEventListener('click', () => {
    if (!checkWeeklyLimit()) return;
    initAudio();
    generateBtn.disabled = true;
    showBlessing(null);
    incrementUsage();
    updateLimitDisplay();

    showAnalysisLoading(() => {
        generateLottoRows();
        scheduleBallSounds(5);
        if (getRemainingUses() > 0) generateBtn.disabled = false;
    });
});

function generateLottoRows() {
    numbersContainer.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        generateLottoNumbers(i);
    }
}

function generateLottoNumbers(rowIndex) {
    const numbers = new Set();
    while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    const mainNumbers = Array.from(numbers).sort((a, b) => a - b);

    let bonusNumber;
    do {
        bonusNumber = Math.floor(Math.random() * 45) + 1;
    } while (numbers.has(bonusNumber));

    displayNumbers(mainNumbers, bonusNumber, rowIndex);
}

function displayNumbers(mainNumbers, bonusNumber, rowIndex) {
    const rowEl = document.createElement('div');
    rowEl.classList.add('number-row');

    mainNumbers.forEach((number, index) => {
        const numberEl = createNumberElement(number, rowIndex, index);
        rowEl.appendChild(numberEl);
    });

    const plusEl = document.createElement('div');
    plusEl.classList.add('plus-sign');
    plusEl.textContent = '+';
    plusEl.style.animationDelay = `${rowIndex * 0.4 + 6 * 0.2}s`;
    rowEl.appendChild(plusEl);

    const bonusEl = createNumberElement(bonusNumber, rowIndex, 7, true);
    rowEl.appendChild(bonusEl);

    numbersContainer.appendChild(rowEl);
}

function createNumberElement(number, rowIndex, index, isBonus = false) {
    const numberEl = document.createElement('div');
    numberEl.classList.add('number');
    if (isBonus) numberEl.classList.add('bonus');
    numberEl.textContent = number;
    numberEl.style.animationDelay = `${rowIndex * 0.4 + index * 0.2}s`;
    return numberEl;
}

// Initial state: placeholder balls (no numbers)
showPlaceholderRow();

// Tab Switching Logic
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.content-section');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        navBtns.forEach(nb => nb.classList.remove('active'));
        btn.classList.add('active');
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetId) {
                section.classList.add('active');
            }
        });
    });
});

/* --- Face Analysis Logic --- */
const faceBtn = document.getElementById('face-btn');
const cameraModal = document.getElementById('camera-modal');
const closeCamera = document.getElementById('close-camera');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture-btn');
const cameraStatus = document.getElementById('camera-status');
const scanLine = document.querySelector('.scan-line');
let stream = null;

faceBtn.addEventListener('click', async () => {
    if (!checkWeeklyLimit()) return;
    try {
        cameraStatus.textContent = "카메라를 준비하고 있습니다...";
        const constraints = {
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();
            cameraModal.style.display = 'flex';
            setTimeout(() => cameraModal.classList.add('show'), 10);
            cameraStatus.textContent = "얼굴을 화면에 맞춰주세요";
        };
    } catch (err) {
        console.error("Camera Error: ", err);
        alert("카메라를 켤 수 없습니다. 권한 설정을 확인해주세요.");
    }
});

closeCamera.addEventListener('click', stopCamera);
window.addEventListener('click', (e) => { if (e.target === cameraModal) stopCamera(); });

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    cameraModal.classList.remove('show');
    setTimeout(() => {
        cameraModal.style.display = 'none';
        if (scanLine) scanLine.style.display = 'none';
        captureBtn.disabled = false;
        captureBtn.textContent = "촬영 및 분석";
    }, 300);
}

// Determine luck level from pixel data
function determineLuckLevel(pixelSum) {
    const normalized = pixelSum % 100;
    if (normalized > 70) return 'good';
    if (normalized < 30) return 'bad';
    return 'normal';
}

// Capture & Analyze
captureBtn.addEventListener('click', () => {
    if (!stream) return;
    initAudio();
    if (scanLine) scanLine.style.display = 'block';
    captureBtn.disabled = true;
    captureBtn.textContent = "관상 분석 중...";
    cameraStatus.textContent = "얼굴 특징을 추출하고 있습니다...";

    // Canvas capture (may fail on some mobile browsers)
    try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } catch (e) {
        console.warn('Canvas capture skipped:', e);
    }

    setTimeout(() => {
        try {
            // Calculate pixel-based seed if canvas has data, otherwise use random
            let pixelSum = 0;
            try {
                const ctx = canvas.getContext('2d');
                const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                for (let i = 0; i < frameData.length; i += 500) { pixelSum += frameData[i]; }
            } catch (e) {
                pixelSum = Math.floor(Math.random() * 10000);
            }

            const luckLevel = determineLuckLevel(pixelSum);
            const reading = generateFaceReading(pixelSum, luckLevel);
            displayFaceReading(reading);

            stopCamera();
            incrementUsage();
            updateLimitDisplay();

            setTimeout(() => {
                document.querySelector('[data-target="lotto-section"]').click();
                showAnalysisLoading(() => {
                    generateFaceLottoRows(pixelSum);
                    scheduleBallSounds(5);
                    showBlessing(luckLevel);
                    numbersContainer.scrollIntoView({ behavior: 'smooth' });
                });
            }, 400);
        } catch (e) {
            console.error('Analysis error:', e);
            stopCamera();
        }
    }, 3000);
});

const fortuneResults = {
    good: {
        wealth: "재백궁(코)에 윤기가 흐르고 금갑(콧방울)이 두툼하게 자리를 잡았으니, 명리학적으로 정재(正財)와 편재(偏財)의 기운이 동시에 동(動)하는 대길의 상입니다. 뜻밖의 횡재수나 큰 재물을 거머쥘 수 있는 강력한 운기입니다.",
        character: "눈빛에 신기(神氣)가 안정되어 있고 안광이 맑습니다. 천을귀인(天乙貴人)이 곁에서 돕는 형국으로, 주변 사람들의 조력과 긍정적인 에너지를 이끌어내는 덕장(德將)의 기질을 발휘할 때입니다.",
        overall: "초년, 중년, 말년을 의미하는 삼정(三停)의 비율이 완벽에 가까운 균형을 이룹니다. 오행(五행)의 흐름이 막힘없이 상생(相生)하니, 평소 주저하던 일에 과감히 승부수를 던져도 좋을 대운(大運)입니다."
    },
    normal: {
        wealth: "입술 선이 뚜렷하고 구각(입꼬리)이 안정적이어서 재물이 쉽게 새어나가지 않는 상입니다. 큰 횡재보다는 땀 흘린 만큼의 정직한 보상(정관, 정재)이 따르는 시기이니, 안정적인 투자나 소소한 행운을 기대해 볼 만합니다.",
        character: "눈썹(보수관)이 차분하게 누워 있어 심리적인 안정감이 돋보입니다. 오행 중 토(土)의 기운이 강해져 포용력이 넓어지고, 사람들과의 마찰 없이 평탄하고 원만한 인간관계를 유지할 수 있습니다.",
        overall: "관록궁(이마 중앙)이 평탄하고 맑은 기운을 띱니다. 급격한 변화를 추구하기보다는, 현재의 자리를 지키며 내실을 다지는 것이 훗날의 큰 도약을 위한 튼튼한 발판(인수운)이 될 것입니다."
    },
    bad: {
        wealth: "명궁(미간)에 일시적으로 옅은 그림자가 스치고, 콧대의 기운이 다소 정체되어 있습니다. 명리학적으로 겁재(劫財: 재물이 흩어짐)의 기운이 엿보이니, 무리한 요행이나 충동적인 지출은 피하는 것이 좋습니다.",
        character: "눈꼬리(어미) 부분에 역마(驛馬)의 기운이 동하여 마음이 다소 들뜨거나 조급해질 수 있습니다. 감정적인 결정보다는 이성적이고 차분한 판단이 강하게 요구되는 시기입니다.",
        overall: "얼굴 전체의 찰색(혈색)이 일시적으로 탁해질 수 있는 시기입니다. 편관(偏官: 예기치 않은 난관)의 운기가 스쳐 지나가니, 이번 회차는 가벼운 마음으로 즐기며 다음 대운을 기약하는 지혜가 필요합니다."
    }
};

function generateFaceReading(seed, luckLevel) {
    const data = fortuneResults[luckLevel];
    return {
        wealth: data.wealth,
        personality: data.character,
        luck: data.overall,
        luckLevel: luckLevel
    };
}

function displayFaceReading(reading) {
    const container = document.getElementById('face-analysis-result');
    if (container) {
        container.innerHTML = `
            <div class="analysis-item"><h3>💰 재물운</h3><p>${reading.wealth}</p></div>
            <div class="analysis-item"><h3>👤 성격 및 기질</h3><p>${reading.personality}</p></div>
            <div class="analysis-item"><h3>🌟 성공 및 총운</h3><p>${reading.luck}</p></div>
            <div class="analysis-footer" style="text-align: center; margin-top: 1rem; opacity: 0.7; font-size: 0.8rem;">* 본 분석은 재미를 위한 시뮬레이션입니다.</div>
        `;
    }
}

function generateFaceLottoRows(seed) {
    numbersContainer.innerHTML = '';
    for (let i = 0; i < 5; i++) { generateLottoNumbers(i); }
    const viewResultBtn = document.createElement('button');
    viewResultBtn.innerHTML = '나의 관상 풀이 결과 보기 ➔';
    viewResultBtn.className = 'view-result-btn';
    viewResultBtn.onclick = () => {
        document.querySelector('[data-target="inquiry-section"]').click();
        document.getElementById('inquiry-section').scrollIntoView({ behavior: 'smooth' });
    };
    numbersContainer.appendChild(viewResultBtn);
}

/* --- Winning Number Lookup --- */
const roundInput = document.getElementById('round-input');
const lookupBtn = document.getElementById('lookup-btn');
const prevRoundBtn = document.getElementById('prev-round-btn');
const nextRoundBtn = document.getElementById('next-round-btn');
const winningResult = document.getElementById('winning-result');

// Set default round to last drawn
if (roundInput) roundInput.value = getLastDrawnRound();

async function fetchLottoResult(drwNo) {
    const firebaseUrl = `https://us-central1-blog-product-52707032-c02af.cloudfunctions.net/getLottoResult?drwNo=${drwNo}`;
    const response = await fetch(firebaseUrl);
    if (!response.ok) throw new Error('API request failed');
    return response.json();
}

function formatPrize(amount) {
    if (amount >= 100000000) return Math.floor(amount / 100000000) + '억 ' + (Math.floor((amount % 100000000) / 10000) > 0 ? Math.floor((amount % 100000000) / 10000) + '만원' : '원');
    if (amount >= 10000) return Math.floor(amount / 10000) + '만원';
    return amount.toLocaleString() + '원';
}

function renderWinningBall(number, isBonus) {
    const ball = document.createElement('div');
    ball.className = 'number' + (isBonus ? ' bonus' : '');
    ball.textContent = number;
    ball.style.animation = 'ballAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards';
    return ball;
}

function renderWinningResult(data) {
    if (!data || data.returnValue !== 'success') {
        winningResult.innerHTML = '<p class="lookup-error">해당 회차의 정보를 찾을 수 없습니다.</p>';
        return;
    }

    const numbers = [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6];
    const bonus = data.bnusNo;

    const numbersDiv = document.createElement('div');
    numbersDiv.className = 'winning-numbers';
    numbers.forEach((n, i) => {
        const ball = renderWinningBall(n, false);
        ball.style.animationDelay = `${i * 0.2}s`;
        numbersDiv.appendChild(ball);
    });

    const plus = document.createElement('div');
    plus.className = 'plus-sign';
    plus.textContent = '+';
    plus.style.animationDelay = `${6 * 0.2}s`;
    numbersDiv.appendChild(plus);

    const bonusBall = renderWinningBall(bonus, true);
    bonusBall.style.animationDelay = `${7 * 0.2}s`;
    numbersDiv.appendChild(bonusBall);

    winningResult.innerHTML = '';
    winningResult.innerHTML = `<p class="winning-round-title">제 ${data.drwNo}회 당첨번호 (${data.drwNoDate})</p>`;
    winningResult.appendChild(numbersDiv);

    if (data.firstWinamnt) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'winning-info';
        infoDiv.innerHTML = `
            <div class="winning-info-row">
                <span class="winning-info-label">1등 당첨금</span>
                <span class="winning-info-value">${formatPrize(data.firstWinamnt)}</span>
            </div>
            <div class="winning-info-row">
                <span class="winning-info-label">1등 당첨자 수</span>
                <span class="winning-info-value">${data.firstPrzwnerCo}명</span>
            </div>
            <div class="winning-info-row">
                <span class="winning-info-label">추첨일</span>
                <span class="winning-info-value">${data.drwNoDate}</span>
            </div>
        `;
        winningResult.appendChild(infoDiv);
    }
}

async function lookupRound() {
    const drwNo = parseInt(roundInput.value);
    if (!drwNo || drwNo < 1) {
        winningResult.innerHTML = '<p class="lookup-error">올바른 회차를 입력해주세요.</p>';
        return;
    }
    if (drwNo > getLastDrawnRound()) {
        winningResult.innerHTML = '<p class="lookup-error">아직 추첨되지 않은 회차입니다.</p>';
        return;
    }

    initAudio();
    winningResult.innerHTML = '<p class="lookup-loading">조회 중...</p>';
    lookupBtn.disabled = true;

    try {
        const data = await fetchLottoResult(drwNo);
        renderWinningResult(data);
        // 당첨번호 볼 사운드 (1행: 6볼 + 보너스)
        if (data && data.returnValue === 'success') {
            for (let i = 0; i < 8; i++) {
                if (i === 6) continue;
                setTimeout(() => playBellSound(), i * 200);
            }
        }
    } catch (e) {
        winningResult.innerHTML = '<p class="lookup-error">조회에 실패했습니다. 잠시 후 다시 시도해주세요.</p>';
    } finally {
        lookupBtn.disabled = false;
    }
}

if (lookupBtn) lookupBtn.addEventListener('click', lookupRound);

if (roundInput) roundInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') lookupRound();
});

if (prevRoundBtn) prevRoundBtn.addEventListener('click', () => {
    const val = parseInt(roundInput.value) || getLastDrawnRound();
    if (val > 1) {
        roundInput.value = val - 1;
        lookupRound();
    }
});

if (nextRoundBtn) nextRoundBtn.addEventListener('click', () => {
    const val = parseInt(roundInput.value) || 0;
    if (val < getLastDrawnRound()) {
        roundInput.value = val + 1;
        lookupRound();
    }
});

/* --- Privacy Policy Modal --- */
const privacyLink = document.getElementById('privacy-link');
const privacyModal = document.getElementById('privacy-modal');
const closePrivacy = document.getElementById('close-privacy');

if (privacyLink) {
    privacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        privacyModal.style.display = 'flex';
        setTimeout(() => privacyModal.classList.add('show'), 10);
    });
}

if (closePrivacy) {
    closePrivacy.addEventListener('click', () => {
        privacyModal.classList.remove('show');
        setTimeout(() => { privacyModal.style.display = 'none'; }, 300);
    });
}

if (privacyModal) {
    window.addEventListener('click', (e) => {
        if (e.target === privacyModal) {
            privacyModal.classList.remove('show');
            setTimeout(() => { privacyModal.style.display = 'none'; }, 300);
        }
    });
}

/* --- Secret Rapid Click Reset (일반추천 7번 연속 클릭) --- */
(function() {
    let clickCount = 0;
    let resetTimer = null;

    generateBtn.addEventListener('click', () => {
        clickCount++;
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => { clickCount = 0; }, 3000);
        if (clickCount >= 7) {
            clickCount = 0;
            clearTimeout(resetTimer);
            localStorage.removeItem('lottoWeekly');
            localStorage.setItem(ADMIN_KEY, 'true');
            alert('관리자 권한으로 주간 기운이 충전되었습니다!');
            location.reload();
        }
    });
})();
