const loadButton = document.getElementById('loadCartButton'); 
const cartIdInput = document.getElementById('cartIdInput'); 
const cartContainer = document.getElementById('cartData');  
const cartDisplay = document.getElementById('cartDisplay'); 
const cartError = document.getElementById('cartError');  

loadButton.addEventListener('click', async () => {
    const cartId = cartIdInput.value;

    if (cartId) {
        await loadCart(cartId);
    }
});


async function loadCart(id) {
    cartContainer.innerHTML = '';
    cartError.innerHTML = '';
    cartDisplay.innerHTML = '';

    const loadingMessage = document.createElement('p');
    loadingMessage.classList.add('loading-text'); 
    cartDisplay.appendChild(loadingMessage);

    let dotCount = 0;
    let loadingInterval;

    loadingInterval = setInterval(() => {
        if (dotCount > 3) dotCount = 0; 
        
        const dots = '.'.repeat(dotCount); 
        loadingMessage.textContent = `Завантаження кошика${dots} (Будь ласка, зачекайте)`;
        dotCount++;
    }, 350);

    loadButton.disabled = true;

    try{

        const response = await fetch(`https://dummyjson.com/carts/${id}?delay=3000`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
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
    } catch (error) {
        console.error("Виникла помилка:", error);
        
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('error-box');
        
        const errorTitle = document.createElement('strong');
        errorTitle.textContent = 'Ой, халепа!';
        
        const errorText = document.createElement('span');
        errorText.textContent = `Не вдалося завантажити кошик. Деталі: ${error.message}`;
        
        errorDiv.append(errorTitle, errorText);
        cartError.appendChild(errorDiv);


    } finally {
        clearInterval(loadingInterval);
        cartDisplay.innerHTML = '';
        loadButton.disabled = false;
    }
}
