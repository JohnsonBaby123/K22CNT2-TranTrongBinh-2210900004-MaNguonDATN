const CART_STORAGE_KEY = 'binksport_cart';
const VOUCHERS = {
    SPORT10: 0.10,
    SPORT20: 0.20,
    SPORT30: 0.30
};

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

function getSelectedPaymentMethod() {
    const selected = document.querySelector('input[name="paymentMethod"]:checked');
    return selected ? selected.value : 'cod';
}

function getSelectedVoucher() {
    const voucherSelect = document.getElementById('voucherCode');
    return voucherSelect ? voucherSelect.value : '';
}

function getDiscountRate(voucherCode) {
    return VOUCHERS[voucherCode] || 0;
}

function calculateCheckoutTotals(items) {
    let totalQuantity = 0;
    let subtotal = 0;

    items.forEach(item => {
        totalQuantity += item.quantity;
        subtotal += item.price * item.quantity;
    });

    const voucherCode = getSelectedVoucher();
    const discountRate = getDiscountRate(voucherCode);
    const discountAmount = Math.round(subtotal * discountRate);
    const total = subtotal - discountAmount;

    return {
        totalQuantity,
        subtotal,
        discountAmount,
        total,
        voucherCode,
        paymentMethod: getSelectedPaymentMethod()
    };
}

function renderCheckout() {
    const items = getCheckoutItems();
    const emptyBox = document.getElementById('checkoutEmpty');
    const contentBox = document.getElementById('checkoutContent');
    const itemsContainer = document.getElementById('checkoutItems');
    const voucherSelect = document.getElementById('voucherCode');
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');

    if (!items.length) {
        emptyBox.style.display = 'block';
        contentBox.style.display = 'none';
        return;
    }

    emptyBox.style.display = 'none';
    contentBox.style.display = 'block';
    itemsContainer.innerHTML = '';

    items.forEach(item => {

        const row = document.createElement('div');
        row.className = 'checkout-item';
        row.innerHTML = `
            <div class="item-name">${item.name}</div>
            <div class="item-qty">SL: ${item.quantity}</div>
            <div class="item-total">${formatPrice(item.price * item.quantity)}</div>
        `;
        itemsContainer.appendChild(row);
    });

    const updateSummaryView = () => {
        const totals = calculateCheckoutTotals(items);
        document.getElementById('summaryQuantity').textContent = totals.totalQuantity;
        document.getElementById('summarySubtotal').textContent = formatPrice(totals.subtotal);
        document.getElementById('summaryDiscount').textContent = `-${formatPrice(totals.discountAmount)}`;
        document.getElementById('summaryTotal').textContent = formatPrice(totals.total);
    };

    updateSummaryView();

    if (voucherSelect) {
        voucherSelect.addEventListener('change', updateSummaryView, { once: false });
    }

    paymentMethods.forEach(method => {
        method.addEventListener('change', updateSummaryView, { once: false });
    });
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
                    })),
                    payment_method: getSelectedPaymentMethod(),
                    voucher_code: getSelectedVoucher()
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

                const paymentLabel = result.payment_method === 'online' ? 'online' : 'khi nhận hàng';
                alert(`Đặt hàng thành công!\nMã đơn hàng: #${result.order_id}\nPhương thức: Thanh toán ${paymentLabel}\nTổng sau giảm giá: ${formatPrice(result.total)}`);
                window.location.href = '/';
            } catch (error) {
                alert(error.message || 'Có lỗi khi đặt hàng');
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = 'Xác nhận đặt hàng';
            }
        });
    }
});
