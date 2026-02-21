/* main.js */
const generateBtn = document.getElementById('generate-btn');
const numbersContainer = document.getElementById('numbers-container');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

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

    displayNumbers(Array.from(numbers), rowIndex);
}

function displayNumbers(numbers, rowIndex) {
    const rowEl = document.createElement('div');
    rowEl.classList.add('number-row');
    numbers.sort((a, b) => a - b).forEach((number, index) => {
        const numberEl = document.createElement('div');
        numberEl.classList.add('number');
        numberEl.textContent = number;
        numberEl.style.backgroundColor = getNumberColor(number);
        numberEl.style.animationDelay = `${rowIndex * 0.2 + index * 0.1}s`;
        rowEl.appendChild(numberEl);
    });
    numbersContainer.appendChild(rowEl);
}

function getNumberColor(number) {
    const hue = (number / 45) * 360;
    return `oklch(65% 0.15 ${hue})`;
}

// Initial generation
generateLottoRows();
