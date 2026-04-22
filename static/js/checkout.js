const CART_STORAGE_KEY = 'binksport_cart';

function getCart() {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
}

function getCheckoutItems() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const productId = Number(params.get('id'));
    const cart = getCart();

    if (mode === 'single' && productId) {
        const item = cart.find(p => p.id === productId);
        return item ? [item] : [];
    }

    return cart;
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function renderCheckout() {
    const items = getCheckoutItems();
    const emptyBox = document.getElementById('checkoutEmpty');
    const contentBox = document.getElementById('checkoutContent');
    const itemsContainer = document.getElementById('checkoutItems');

    if (!items.length) {
        emptyBox.style.display = 'block';
        contentBox.style.display = 'none';
        return;
    }

    emptyBox.style.display = 'none';
    contentBox.style.display = 'block';
    itemsContainer.innerHTML = '';

    let totalQuantity = 0;
    let totalAmount = 0;

    items.forEach(item => {
        totalQuantity += item.quantity;
        totalAmount += item.price * item.quantity;

        const row = document.createElement('div');
        row.className = 'checkout-item';
        row.innerHTML = `
            <div class="item-name">${item.name}</div>
            <div class="item-qty">SL: ${item.quantity}</div>
            <div class="item-total">${formatPrice(item.price * item.quantity)}</div>
        `;
        itemsContainer.appendChild(row);
    });

    document.getElementById('summaryQuantity').textContent = totalQuantity;
    document.getElementById('summaryTotal').textContent = formatPrice(totalAmount);
}

document.addEventListener('DOMContentLoaded', () => {
    renderCheckout();

    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', async () => {
            try {
                const checkoutItems = getCheckoutItems();
                if (!checkoutItems.length) {
                    alert('Không có sản phẩm để thanh toán');
                    return;
                }

                placeOrderBtn.disabled = true;
                placeOrderBtn.textContent = 'Đang xử lý đơn hàng...';

                const payload = {
                    items: checkoutItems.map(item => ({
                        id: item.id,
                        quantity: item.quantity
                    }))
                };

                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Đặt hàng thất bại');
                }

                // Xóa các sản phẩm đã thanh toán khỏi localStorage cart
                const paidIds = new Set(checkoutItems.map(item => item.id));
                const updatedCart = getCart().filter(item => !paidIds.has(item.id));
                saveCart(updatedCart);

                alert(`Đặt hàng thành công! Mã đơn hàng: #${result.order_id}`);
                window.location.href = '/';
            } catch (error) {
                alert(error.message || 'Có lỗi khi đặt hàng');
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = 'Xác nhận đặt hàng';
            }
        });
    }
});
