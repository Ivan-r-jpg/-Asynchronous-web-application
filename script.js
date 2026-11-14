const loadButton = document.getElementById('loadCartButton'); 
const cartIdInput = document.getElementById('cartIdInput'); 
const cartContainer = document.getElementById('cartData');    

loadButton.addEventListener('click', async () => {
    const cartId = cartIdInput.value;

    if (cartId) {
        await loadCart(cartId);
    }
});

async function loadCart(id) {
    cartContainer.innerHTML = '';

    const response = await fetch(`https://dummyjson.com/carts/${id}`);
    const data = await response.json();
    
    cartContainer.innerHTML = `
        <h2>Інформація про кошик №${data.id}</h2>
        <p><strong>Загальна вартість кошика:</strong> $${data.total}</p>
        <hr>
        <h3>Список товарів:</h3>
    `;

    for (const product of data.products) {
        const productElement = document.createElement('div');
        
        productElement.style.borderBottom = '1px dashed #ccc';
        productElement.style.padding = '10px 0';
        
        productElement.innerHTML = `
            <h4>${product.title}</h4>
            <p><strong>Ціна:</strong> $${product.price.toFixed(2)} | <strong>Кількість:</strong> ${product.quantity} шт.</p>
            <p><strong>Вартість товару:</strong> $${product.total.toFixed(2)}</p>
            <p><strong>Зі знижкою:</strong> $${product.discountedTotal.toFixed(2)}</p>
        `;
        
        cartContainer.appendChild(productElement);
    }
}