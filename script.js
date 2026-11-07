console.log('Calculator script loaded');

// ===== 1. FIND THE PARTS OF THE PAGE WE NEED =====
const display = document.getElementById('display');
const keys = document.querySelector('.keys');
const operatorButtons = document.querySelectorAll('.key-operator');

// ===== 2. THE CALCULATOR'S MEMORY =====
let currentInput = '0';      // what's on the display right now
let previousValue = null;    // the first number, saved when an operator is pressed
let operator = null;         // the chosen operation: '+', '-', '*' or '/'
let waitingForNext = false;  // true right after pressing an operator or =
let resultShown = false;     // true right after pressing %
let hasError = false;        // true when the display shows "Error"

const MAX_DIGITS = 9;

// ===== 3. DISPLAY HELPERS =====
function updateDisplay() {
  display.textContent = currentInput;
  display.classList.toggle('is-long', currentInput.length > 9);
}

function highlightOperator(chosen) {
  operatorButtons.forEach(function (button) {
    button.classList.toggle('is-active', button.dataset.operator === chosen);
  });
}

function countDigits(text) {
  return text.replace('-', '').replace('.', '').length;
}

// Turns a raw result into tidy text that fits the display.
// Returns null if the result is not a real number (e.g. dividing by zero).
function formatNumber(number) {
  if (!Number.isFinite(number)) return null;

  // Fix tiny computer rounding errors (0.1 + 0.2 = 0.30000000000000004)
  const clean = Number(number.toPrecision(12));

  // Huge or tiny numbers: use short scientific format, e.g. 1.235e+12
  if (Math.abs(clean) >= 1e9 || (clean !== 0 && Math.abs(clean) < 1e-7)) {
    return clean.toExponential(3);
  }

  // Round decimals so the whole number fits within MAX_DIGITS
  const wholeDigits = String(Math.trunc(Math.abs(clean))).length;
  const decimals = Math.max(0, MAX_DIGITS - wholeDigits);
  return String(Number(clean.toFixed(decimals)));
}

// Shows a result, or "Error" if it isn't valid. Returns true if it worked.
function showResult(number) {
  const text = formatNumber(number);
  if (text === null) {
    showError();
    return false;
  }
  currentInput = text;
  updateDisplay();
  return true;
}

function showError() {
  clearAll();
  currentInput = 'Error';
  hasError = true;
  updateDisplay();
}

// ===== 4. THE MATH =====
function calculate(a, b, op) {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  if (op === '/') return a / b;
}

// ===== 5. BUTTON ACTIONS =====
function inputNumber(digit) {
  if (hasError) clearAll();

  if (waitingForNext || resultShown) {
    currentInput = digit;
    waitingForNext = false;
    resultShown = false;
  } else if (currentInput === '0') {
    currentInput = digit;
  } else if (countDigits(currentInput) < MAX_DIGITS) {
    currentInput = currentInput + digit;
  }
  highlightOperator(null);
  updateDisplay();
}

function inputDecimal() {
  if (hasError) clearAll();

  if (waitingForNext || resultShown) {
    currentInput = '0.';
    waitingForNext = false;
    resultShown = false;
  } else if (!currentInput.includes('.')) {
    currentInput = currentInput + '.';
  }
  highlightOperator(null);
  updateDisplay();
}

function chooseOperator(nextOperator) {
  if (hasError) return;
  const inputValue = parseFloat(currentInput);
  resultShown = false;

  // Pressed two operators in a row: just switch to the new one
  if (operator && waitingForNext) {
    operator = nextOperator;
    highlightOperator(nextOperator);
    return;
  }

  if (previousValue === null) {
    previousValue = inputValue;
  } else if (operator) {
    // Mid-calculation (e.g. 2 + 3 ×): work out what we have so far
    const ok = showResult(calculate(previousValue, inputValue, operator));
    if (!ok) return;
    previousValue = parseFloat(currentInput);
  }

  operator = nextOperator;
  waitingForNext = true;
  highlightOperator(nextOperator);
}

function equals() {
  if (hasError || operator === null || waitingForNext) return;

  const result = calculate(previousValue, parseFloat(currentInput), operator);
  previousValue = null;
  operator = null;
  highlightOperator(null);

  if (showResult(result)) {
    waitingForNext = true;
  }
}

function percent() {
  if (hasError) return;
  if (operator && waitingForNext) return;

  const value = parseFloat(currentInput);
  let result;

  // 200 + 10% means "200 plus 10% of 200", so % becomes 20
  if (previousValue !== null && (operator === '+' || operator === '-')) {
    result = previousValue * value / 100;
  } else {
    // 50% on its own, or with × ÷, means 0.5
    result = value / 100;
  }

  if (showResult(result)) {
    resultShown = true;
  }
}

function deleteLast() {
  if (hasError) {
    clearAll();
    return;
  }
  if (waitingForNext || resultShown) return; // results can't be edited

  currentInput = currentInput.slice(0, -1);
  if (currentInput === '' || currentInput === '-') {
    currentInput = '0';
  }
  updateDisplay();
}

function clearAll() {
  currentInput = '0';
  previousValue = null;
  operator = null;
  waitingForNext = false;
  resultShown = false;
  hasError = false;
  highlightOperator(null);
  updateDisplay();
}

// ===== 6. MOUSE / TOUCH: LISTEN FOR BUTTON CLICKS =====
keys.addEventListener('click', function (event) {
  const button = event.target.closest('button');
  if (!button) return;

  const action = button.dataset.action;

  if (button.dataset.number !== undefined) {
    inputNumber(button.dataset.number);
  } else if (button.dataset.operator !== undefined) {
    chooseOperator(button.dataset.operator);
  } else if (action === 'decimal') {
    inputDecimal();
  } else if (action === 'equals') {
    equals();
  } else if (action === 'percent') {
    percent();
  } else if (action === 'delete') {
    deleteLast();
  } else if (action === 'clear') {
    clearAll();
  }
});

// ===== 7. KEYBOARD SUPPORT =====
// Each keyboard key is matched to an on-screen button.
const keyboardMap = {
  '+': '[data-operator="+"]',
  '-': '[data-operator="-"]',
  '*': '[data-operator="*"]',
  'x': '[data-operator="*"]',
  '/': '[data-operator="/"]',
  '.': '[data-action="decimal"]',
  ',': '[data-action="decimal"]',
  '%': '[data-action="percent"]',
  'Enter': '[data-action="equals"]',
  '=': '[data-action="equals"]',
  'Backspace': '[data-action="delete"]',
  'Escape': '[data-action="clear"]',
  'c': '[data-action="clear"]',
  'C': '[data-action="clear"]'
};

document.addEventListener('keydown', function (event) {
  // Leave shortcuts like ⌘ + R (refresh) alone
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  let selector = keyboardMap[event.key];

  if (!selector && event.key.length === 1 && '0123456789'.includes(event.key)) {
    selector = '[data-number="' + event.key + '"]';
  }
  if (!selector) return;

  event.preventDefault();

  // Press the matching on-screen button, and show it being pressed
  const button = document.querySelector(selector);
  button.click();
  button.classList.add('is-pressed');
  setTimeout(function () {
    button.classList.remove('is-pressed');
  }, 120);
});