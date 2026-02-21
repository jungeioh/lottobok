/* main.js - 대박 로또 with Theme Support and Bonus Numbers */

// Splash Overlay Control
document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-overlay');
    
    // Hold for 2 seconds
    setTimeout(() => {
        if (splash) {
            splash.classList.add('fade-out');
            
            // Wait for 1s transition to finish before display: none
            setTimeout(() => {
                splash.style.display = 'none';
            }, 1000);
        }
    }, 2000);
});

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

generateBtn.addEventListener('click', () => {
    generateLottoRows();
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
    numberEl.style.backgroundColor = getNumberColor(number);
    numberEl.style.animationDelay = `${rowIndex * 0.2 + index * 0.1}s`;
    return numberEl;
}

function getNumberColor(number) {
    const hue = (number / 45) * 360;
    return `oklch(65% 0.15 ${hue})`;
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

        const reading = generateFaceReading(pixelSum);
        displayFaceReading(reading);
        
        stopCamera();
        
        setTimeout(() => {
            generateFaceLottoRows(pixelSum);
            numbersContainer.scrollIntoView({ behavior: 'smooth' });
        }, 400);
    }, 3000);
});

function generateFaceReading(seed) {
    const wealthReadings = ["이마가 넓어 초년운이 좋으며...", "콧망울이 단단하여 재물이 쌓일 상...", "입술 끝이 올라가 복을 놓치지 않을 상...", "눈매가 깊어 횡재수가 따를 상..."];
    const personalityReadings = ["리더의 기질이 있습니다.", "귀인의 도움을 받을 성격입니다.", "인내심이 강한 우직함이 돋보입니다.", "예술적인 감각이 뛰어납니다."];
    const luckReadings = ["큰 행운이 찾아올 시기입니다.", "자신의 분야에서 이름을 알릴 운명입니다.", "말년까지 평안한 복을 누릴 상입니다.", "안정적인 성공 가도를 달릴 것입니다."];
    return {
        wealth: wealthReadings[seed % wealthReadings.length],
        personality: personalityReadings[(seed + 7) % personalityReadings.length],
        luck: luckReadings[(seed + 13) % luckReadings.length]
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
