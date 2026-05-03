// JavaScript cho trang sản phẩm

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    setupQuantityButtons();
    setupAddToCartButtons();
    setupDetailButtons();
});

// Cập nhật số lượng giỏ hàng
function updateCartCount() {
    const cart = getCart();
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement && cartCount > 0) {
        cartCountElement.textContent = cartCount;
        cartCountElement.style.display = 'block';
    }
}

// Setup nút xem chi tiết
function setupDetailButtons() {
    const detailButtons = document.querySelectorAll('.btn-view-details');
    detailButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.productId;
            if (!productId) return;
            fetch(`/api/product/${productId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        showNotification('Không thể tải thông tin sản phẩm');
                        return;
                    }

                    const product = data;
                    const tbody = document.getElementById('modal-specs-tbody');
                    const modalName = document.getElementById('modal-product-name');
                    tbody.innerHTML = '';

                    function addRow(label, value) {
                        const tr = document.createElement('tr');
                        tr.style.borderTop = '1px solid #eee';
                        tr.innerHTML = `<td style="padding:8px; font-weight:600; width:35%;">${label}</td><td style="padding:8px;">${value !== null && value !== undefined ? value : ''}</td>`;
                        tbody.appendChild(tr);
                    }

                    modalName.textContent = product.name || 'Thông số sản phẩm';
                    addRow('Mã sản phẩm', product.id || '');
                    addRow('Tên', product.name || '');
                    addRow('Danh mục', product.category_name || product.category_id || '');
                    addRow('Giá', product.price ? new Intl.NumberFormat('vi-VN').format(product.price) + ' ₫' : '');
                    addRow('Tồn kho', product.stock != null ? product.stock : '');
                    // Material field - prefer 'material' or 'chất liệu' fields if present
                    const material = product.material || product.materials || product.spec_material || product.chatlieu || '';
                    addRow('Chất liệu', material || 'Không xác định');
                    addRow('Mô tả', product.description || '');

                    // Show modal
                    const modal = document.getElementById('product-modal');
                    if (modal) modal.style.display = 'flex';

                    // Close handlers
                    const closeBtn = document.getElementById('product-modal-close');
                    if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };
                    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
                    document.addEventListener('keydown', function escListener(ev) { if (ev.key === 'Escape') { modal.style.display = 'none'; document.removeEventListener('keydown', escListener); } });
                })
                .catch(() => showNotification('Lỗi mạng khi tải thông tin sản phẩm'));
        });
    });
}

// Setup nút tăng/giảm số lượng
function setupQuantityButtons() {
    const minusButtons = document.querySelectorAll('.qty-btn.minus');
    const plusButtons = document.querySelectorAll('.qty-btn.plus');

    minusButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.productId;
            const input = document.querySelector(`input[data-product-id="${productId}"]`);
            if (input && input.value > 1) {
                input.value--;
            }
        });
    });

    plusButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.productId;
            const input = document.querySelector(`input[data-product-id="${productId}"]`);
            if (input) {
                const maxStock = parseInt(input.max);
                if (input.value < maxStock) {
                    input.value++;
                }
            }
        });
    });
}

// Setup nút thêm vào giỏ
function setupAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('.btn-add-cart:not(.disabled)');

    addToCartButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.dataset.productId);
            const productName = this.dataset.productName;
            const productPrice = parseFloat(this.dataset.productPrice);
            const qtyInput = document.querySelector(`input[data-product-id="${productId}"]`);
            const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

            // Thêm vào giỏ
            addToCart(productId, productName, productPrice, quantity);
            
            // Reset quantity input
            if (qtyInput) {
                qtyInput.value = 1;
            }
        });
    });
}

// Hiển thị thông báo
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: #4CAF50;
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Thêm animation nếu chưa có
if (!document.querySelector('style[data-notification-style]')) {
    const style = document.createElement('style');
    style.setAttribute('data-notification-style', 'true');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}
