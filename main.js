/* main.js - 대박 로또 with Theme Support and Bonus Numbers */

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

// Remove splash after 3 seconds total regardless of window load
setTimeout(hideSplash, 3000);

// Also try on window load for safety
window.addEventListener('load', hideSplash);

const generateBtn = document.getElementById('generate-btn');
const numbersContainer = document.getElementById('numbers-container');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

// Lotto Round Calculation
function getCurrentRound() {
    const firstDrawDate = new Date('2002-12-07T20:00:00'); // Round 1
    const now = new Date();
    const diffTime = Math.abs(now - firstDrawDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    return Math.floor(diffDays / 7) + 1;
}

const currentRound = getCurrentRound();
const roundEl = document.getElementById('current-round');
if (roundEl) roundEl.textContent = `${currentRound}회`;

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
        // Hide if no luck level (General Recommendation)
        blessingText.classList.remove('show');
        return;
    }

    // Select message based on luck level
    const messages = blessingMessages[luckLevel];
    const randomIndex = Math.floor(Math.random() * messages.length);
    blessingText.textContent = messages[randomIndex];

    blessingText.classList.remove('show');
    void blessingText.offsetWidth; // Trigger reflow
    blessingText.classList.add('show');
};

generateBtn.addEventListener('click', () => {
    generateLottoRows();
    showBlessing(null); // Hide blessing text
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
    plusEl.style.animationDelay = `${rowIndex * 0.2 + 0.6}s`;
    rowEl.appendChild(plusEl);

    const bonusEl = createNumberElement(bonusNumber, rowIndex, 6, true);
    rowEl.appendChild(bonusEl);

    numbersContainer.appendChild(rowEl);
}

function createNumberElement(number, rowIndex, index, isBonus = false) {
    const numberEl = document.createElement('div');
    numberEl.classList.add('number');
    if (isBonus) numberEl.classList.add('bonus');
    numberEl.textContent = number;
    numberEl.style.animationDelay = `${rowIndex * 0.2 + index * 0.1}s`;
    return numberEl;
}

function getNumberColor(number) {
    return 'transparent'; // Placeholder, handled by CSS now
}

// Initial generation
generateLottoRows();

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

// Capture & Analyze
captureBtn.addEventListener('click', () => {
    if (!stream) return;
    if (scanLine) scanLine.style.display = 'block';
    captureBtn.disabled = true;
    captureBtn.textContent = "관상 분석 중...";
    cameraStatus.textContent = "얼굴 특징을 추출하고 있습니다...";

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setTimeout(() => {
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let pixelSum = 0;
        for (let i = 0; i < frameData.length; i += 500) { pixelSum += frameData[i]; }

        // 1. Determine Luck Level First (Shared State)
        const luckLevel = determineLuckLevel(pixelSum);

        // 2. Generate Analysis Content based on luckLevel
        const reading = generateFaceReading(pixelSum, luckLevel);
        displayFaceReading(reading);
        
        stopCamera();
        
        setTimeout(() => {
            generateFaceLottoRows(pixelSum);
            // 3. Show Blessing using the SAME luckLevel
            showBlessing(luckLevel); 
            numbersContainer.scrollIntoView({ behavior: 'smooth' });
        }, 400);
    }, 3000);
});

const analysisData = {
    good: {
        wealth: ["이마가 넓고 빛이 나니 재물이 마르지 않을 대부의 상입니다.", "콧망울이 웅장하여 평생 돈 걱정 없이 풍족하게 지낼 운명입니다.", "입술 끝이 야무지게 올라가 들어온 복을 절대 놓치지 않을 상입니다."],
        personality: ["도량이 넓고 기세가 당당하니 만인을 거느릴 우두머리의 기질입니다.", "총기가 넘치고 신의가 두터워 주변의 존경을 한몸에 받을 인품입니다."],
        luck: ["필시 대운이 깃들었으니, 곧 천하를 호령할 기회가 찾아올 것입니다.", "길운이 문 앞까지 당도했으니 하는 일마다 술술 풀릴 만사형통의 상입니다."]
    },
    normal: {
        wealth: ["재물운이 평탄하니 성실히 정진하면 안락한 삶을 누릴 상입니다.", "들어오는 돈과 나가는 돈이 균형을 이루니 큰 굴곡 없는 운세입니다."],
        personality: ["성품이 온화하고 매사에 신중하니 주변과 마찰 없이 평온할 상입니다.", "융통성이 있고 사교적이니 어디서든 환영받는 원만한 성격입니다."],
        luck: ["노력한 만큼 결실을 맺는 정직한 운이니 조급해하지 마시게.", "평범함 속에 비범함이 숨어있으니 묵묵히 제 자리를 지키는 것이 상책입니다."]
    },
    bad: {
        wealth: ["재물운이 다소 정체되어 있으니 무리한 투자는 삼가는 것이 좋겠네.", "지갑에 구멍이 난 듯 돈이 새나갈 수 있으니 절약이 미덕인 시기입니다."],
        personality: ["고집이 세고 독단적일 수 있으니 타인의 조언에 귀를 기울이시게.", "마음이 불안정하고 예민한 시기이니 명상을 통해 평정심을 찾으세요."],
        luck: ["기운이 탁하고 장애물이 많으니 이번 주는 자중하며 때를 기다리게.", "먹구름이 가득하니 섣불리 움직이지 말고 내실을 다지는 데 집중하시게."]
    }
};

function determineLuckLevel(seed) {
    const score = seed % 10;
    if (score > 6) return "good";      // 30%
    if (score < 2) return "bad";       // 20%
    return "normal";                   // 50%
}

function generateFaceReading(seed, luckLevel) {
    const data = analysisData[luckLevel];
    const pick = (arr, offset) => arr[(seed + offset) % arr.length];

    return {
        wealth: pick(data.wealth, 0),
        personality: pick(data.personality, 7),
        luck: pick(data.luck, 13),
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
