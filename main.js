/* main.js - 대박 로또 with Theme Support and Bonus Numbers */
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
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Use floor for full days
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
    
    // Generate 1 bonus number that doesn't overlap with main numbers
    let bonusNumber;
    do {
        bonusNumber = Math.floor(Math.random() * 45) + 1;
    } while (numbers.has(bonusNumber));

    displayNumbers(mainNumbers, bonusNumber, rowIndex);
}

function displayNumbers(mainNumbers, bonusNumber, rowIndex) {
    const rowEl = document.createElement('div');
    rowEl.classList.add('number-row');
    
    // Display main numbers
    mainNumbers.forEach((number, index) => {
        const numberEl = createNumberElement(number, rowIndex, index);
        rowEl.appendChild(numberEl);
    });

    // Add "+" separator
    const plusEl = document.createElement('div');
    plusEl.classList.add('plus-sign');
    plusEl.textContent = '+';
    plusEl.style.animationDelay = `${rowIndex * 0.2 + 0.6}s`;
    rowEl.appendChild(plusEl);

    // Display bonus number
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
        
        // Update Buttons
        navBtns.forEach(nb => nb.classList.remove('active'));
        btn.classList.add('active');
        
        // Update Sections
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

// Open Camera
faceBtn.addEventListener('click', async () => {
    try {
        cameraStatus.textContent = "카메라를 준비하고 있습니다...";
        
        const constraints = { 
            video: { 
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            } 
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        video.srcObject = stream;
        
        // Ensure video is playing before showing the modal
        video.onloadedmetadata = () => {
            video.play();
            cameraModal.style.display = 'flex';
            setTimeout(() => cameraModal.classList.add('show'), 10);
            cameraStatus.textContent = "얼굴을 화면에 맞춰주세요";
        };
        
    } catch (err) {
        console.error("Camera Error: ", err);
        let errorMsg = "카메라를 켤 수 없습니다.";
        if (err.name === 'NotAllowedError') {
            errorMsg = "카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.";
        } else if (err.name === 'NotFoundError') {
            errorMsg = "카메라 장치를 찾을 수 없습니다.";
        }
        alert(errorMsg);
    }
});

// Close Camera
closeCamera.addEventListener('click', stopCamera);
window.addEventListener('click', (e) => {
    if (e.target === cameraModal) stopCamera();
});

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    cameraModal.classList.remove('show');
    setTimeout(() => {
        cameraModal.style.display = 'none';
        scanLine.style.display = 'none';
        captureBtn.disabled = false;
        captureBtn.textContent = "촬영 및 분석";
    }, 300);
}

// Capture & Analyze
captureBtn.addEventListener('click', () => {
    if (!stream) return;

    // Start Scanning Effect
    scanLine.style.display = 'block';
    captureBtn.disabled = true;
    captureBtn.textContent = "관상 분석 중...";
    cameraStatus.textContent = "얼굴 특징을 추출하고 있습니다...";

    // Capture Frame immediately
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simulate Analysis Delay
    setTimeout(() => {
        // Generate numbers based on pixel data (Simulation)
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let pixelSum = 0;
        // Sample pixels to create a seed
        for (let i = 0; i < frameData.length; i += 500) {
            pixelSum += frameData[i];
        }

        const reading = generateFaceReading(pixelSum);
        displayFaceReading(reading);
        generateFaceLottoRows(pixelSum);
        
        stopCamera();
        
        // Switch to the analysis section automatically
        document.querySelector('[data-target="inquiry-section"]').click();
        
        // Scroll to the result
        document.getElementById('inquiry-section').scrollIntoView({ behavior: 'smooth' });

    }, 3000); // 3-second scan simulation
});

function generateFaceReading(seed) {
    const wealthReadings = [
        "이마가 넓고 훤하여 초년운이 좋으며, 중년 이후 큰 재물을 모을 상입니다.",
        "코끝이 도톰하고 콧망울이 단단하여 재물이 새어나가지 않고 차곡차곡 쌓일 관상입니다.",
        "입술의 끝이 위로 살짝 올라가 있어 들어온 복을 놓치지 않는 재물 그릇을 가졌습니다.",
        "눈매가 깊고 그윽하여 돈의 흐름을 읽는 능력이 탁월하며 횡재수가 따릅니다."
    ];
    
    const personalityReadings = [
        "눈동자가 맑고 빛이 나니 성품이 강직하고 주변의 신망을 얻는 리더의 기질이 있습니다.",
        "눈썹의 흐름이 부드러워 대인관계가 원만하며 귀인의 도움을 많이 받을 성격입니다.",
        "턱 선이 견고하여 인내심이 강하고 한번 시작한 일은 끝을 보는 우직함이 돋보입니다.",
        "전체적인 이목구비의 조화가 좋아 창의적이고 예술적인 감각이 뛰어난 성격입니다."
    ];
    
    const luckReadings = [
        "현재 미간의 기운이 매우 맑아 곧 인생의 큰 전환점이 될 행운이 찾아올 시기입니다.",
        "광대의 기세가 좋아 명예운이 따르며, 자신의 분야에서 이름을 널리 알릴 운명입니다.",
        "귀가 두툼하고 귓볼이 넉넉하여 무병장수하며 말년까지 평안한 복을 누릴 상입니다.",
        "양 눈의 균형이 완벽하여 큰 어려움 없이 평탄하고 안정적인 성공 가도를 달릴 것입니다."
    ];

    // Select based on seed
    return {
        wealth: wealthReadings[seed % wealthReadings.length],
        personality: personalityReadings[(seed + 7) % personalityReadings.length],
        luck: luckReadings[(seed + 13) % luckReadings.length]
    };
}

function displayFaceReading(reading) {
    const container = document.getElementById('face-analysis-result');
    container.innerHTML = `
        <div class="analysis-item">
            <h3>💰 재물운</h3>
            <p>${reading.wealth}</p>
        </div>
        <div class="analysis-item">
            <h3>👤 성격 및 기질</h3>
            <p>${reading.personality}</p>
        </div>
        <div class="analysis-item">
            <h3>🌟 성공 및 총운</h3>
            <p>${reading.luck}</p>
        </div>
        <div class="analysis-footer" style="text-align: center; margin-top: 1rem; opacity: 0.7; font-size: 0.8rem;">
            * 본 분석은 재미를 위한 시뮬레이션입니다.
        </div>
    `;
}

function generateFaceLottoRows(seed) {
    numbersContainer.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        generateLottoNumbers(i); 
    }
}
