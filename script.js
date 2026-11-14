const MAX_ATTEMPTS = 2;        
const RETRY_DELAY_MS = 1000;   
const TIMEOUT_MS = 5000;       
const DEMO_TIMEOUT_MS = 2000;  

const loadButton = document.getElementById('loadCartButton');
const cartIdInput = document.getElementById('cartIdInput');
const testModeCheckbox = document.getElementById('testModeCheckbox');
const scenarioSelect = document.getElementById('scenarioSelect');
const cartContainer = document.getElementById('cartData');
const cartDisplay = document.getElementById('cartDisplay');
const cartError = document.getElementById('cartError');

loadButton.addEventListener('click', () => {
    const cartId = cartIdInput.value.trim();

    cartError.innerHTML = '';

    if (!cartId || Number(cartId) < 1) {
        showErrorBox('Введіть коректний ID кошика (ціле число від 1).');
        return;
    }

    requestWithRetry(cartId);
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function buildUrl(id, scenario) {
    switch (scenario) {
        case '404':
            return 'https://dummyjson.com/http/404/Not_Found';
        case '503':
            return 'https://dummyjson.com/http/503/Service_Unavailable';
        default:
            return `https://dummyjson.com/carts/${id}?delay=3000`;
    }
}

async function requestWithRetry(cartId) {
    loadButton.disabled = true;
    cartContainer.innerHTML = '';
    cartError.innerHTML = '';
    cartDisplay.innerHTML = '';

    let lastError = null;

    try {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            const stopLoading = startLoading(attempt);

            try {
                const data = await loadCart(cartId, attempt);
                renderCart(data);
                return; 
            } catch (error) {
                lastError = error;
                console.error(`Спроба ${attempt} невдала:`, error);
            } finally {
                stopLoading();
            }

            if (attempt < MAX_ATTEMPTS) {
                const warning = document.createElement('p');
                warning.classList.add('error-text');
                warning.textContent =
                    `Спроба ${attempt} невдала: ${lastError.message}. Повторна спроба через ${RETRY_DELAY_MS / 1000} с...`;
                cartDisplay.appendChild(warning);
                await sleep(RETRY_DELAY_MS);
                cartDisplay.innerHTML = '';
            }
        }

        showFinalError(lastError);
    } finally {
        cartDisplay.innerHTML = '';
        loadButton.disabled = false;
    }
}

async function loadCart(id, attemptNumber) {
    if (testModeCheckbox.checked && attemptNumber === 1) {
        throw new Error('штучна помилка на стороні клієнта (тестовий режим)');
    }

    const scenario = scenarioSelect.value;
    const timeoutMs = scenario === 'timeout' ? DEMO_TIMEOUT_MS : TIMEOUT_MS;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(buildUrl(id, scenario), { signal: controller.signal });

        if (!response.ok) {
            throw new Error(`сервер повернув помилку HTTP ${response.status} ${response.statusText}`.trim());
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`сервер не відповів протягом ${timeoutMs / 1000} с (таймаут)`);
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

function startLoading(attemptNumber) {
    cartDisplay.innerHTML = '';

    const message = document.createElement('p');
    message.classList.add('loading-text');
    cartDisplay.appendChild(message);

    let dotCount = 0;
    const update = () => {
        const dots = '.'.repeat(dotCount % 4);
        message.textContent =
            `Завантаження кошика${dots} Будь ласка, зачекайте (Спроба ${attemptNumber} із ${MAX_ATTEMPTS})`;
        dotCount++;
    };

    update(); 
    const interval = setInterval(update, 350);

    return () => {
        clearInterval(interval);
        message.remove();
    };
}

function renderCart(data) {
    const cartHeader = document.createElement('h2');
    cartHeader.textContent = `Інформація про кошик №${data.id}`;

    const totalCostP = document.createElement('p');
    totalCostP.classList.add('cart-total');
    totalCostP.textContent = `Загальна вартість кошика: $${data.total.toFixed(2)}`;

    const divider = document.createElement('hr');

    const productsListHeader = document.createElement('h3');
    productsListHeader.textContent = 'Список товарів:';

    cartContainer.append(cartHeader, totalCostP, divider, productsListHeader);

    for (const product of data.products) {
        const productElement = document.createElement('div');
        productElement.classList.add('product-item');

        const titleH4 = document.createElement('h4');
        titleH4.textContent = product.title;

        const priceP = document.createElement('p');
        priceP.textContent = `Ціна: $${product.price.toFixed(2)} | Кількість: ${product.quantity} шт.`;

        const totalP = document.createElement('p');
        totalP.textContent = `Вартість товару: $${product.total.toFixed(2)}`;

        const discountP = document.createElement('p');
        discountP.textContent = `Зі знижкою: $${product.discountedTotal.toFixed(2)}`;

        productElement.append(titleH4, priceP, totalP, discountP);
        cartContainer.appendChild(productElement);
    }
}

function showErrorBox(text, title = 'Помилка! ') {
    cartError.innerHTML = '';

    const errorDiv = document.createElement('div');
    errorDiv.classList.add('error-box');

    const errorTitle = document.createElement('strong');
    errorTitle.textContent = title;

    const errorText = document.createElement('span');
    errorText.textContent = text;

    errorDiv.append(errorTitle, errorText);
    cartError.appendChild(errorDiv);
}

function showFinalError(error) {
    showErrorBox(
        `Не вдалося завантажити кошик після ${MAX_ATTEMPTS} спроб. Деталі: ${error.message}. Спробуйте ще раз.`,
        'Ой, халепа! '
    );

    const errorImg = document.createElement('img');
    errorImg.src = 'error.png';
    errorImg.alt = 'Помилка';
    errorImg.classList.add('error-img');
    cartError.appendChild(errorImg);
}