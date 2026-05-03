// ===== CART STORAGE =====
const CART_STORAGE_KEY = 'binksport_cart';

function toLocalCartItem(serverItem) {
    return {
        id: serverItem.id,
        name: serverItem.name,
        price: Number(serverItem.price),
        quantity: Number(serverItem.quantity),
        image: serverItem.image || null
    };
}

async function fetchCartFromServer() {
    try {
        const response = await fetch('/api/cart', { credentials: 'same-origin' });
        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        return null;
    }
}

async function hydrateCartFromServer() {
    const serverCart = await fetchCartFromServer();
    if (!serverCart || !Array.isArray(serverCart.items) || serverCart.items.length === 0) {
        return;
    }

    const localCart = getCart();
    if (localCart.length === 0) {
        saveCart(serverCart.items.map(toLocalCartItem));
    }
}

async function syncCartAddToServer(productId, quantity) {
    try {
        const response = await fetch('/api/cart/items', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, quantity: quantity })
        });

        if (!response.ok) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

async function syncCartUpdateToServer(productId, quantity) {
    try {
        const response = await fetch(`/api/cart/items/${encodeURIComponent(productId)}`, {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: quantity })
        });

        if (!response.ok) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

async function syncCartRemoveFromServer(productId) {
    try {
        const response = await fetch(`/api/cart/items/${encodeURIComponent(productId)}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });

        if (!response.ok) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartDisplay();
}

// Add product to cart
function addToCart(productId, productName, productPrice, quantity = 1) {
    let cart = getCart();
    
    // Check if product already exists in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: quantity
        });
    }
    
    saveCart(cart);
    void syncCartAddToServer(productId, quantity);
    showCartNotification(`Đã thêm ${quantity} "${productName}" vào giỏ hàng`);
}

// Remove product from cart
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    void syncCartRemoveFromServer(productId);
}

// Checkout one selected item
function checkoutSingleItem(productId) {
    const cart = getCart();
    const selectedItem = cart.find(item => item.id === productId);

    if (!selectedItem) {
        showNotification('Không tìm thấy sản phẩm để thanh toán');
        return;
    }

    window.location.href = `/checkout?mode=single&id=${encodeURIComponent(productId)}`;
}

// Update quantity for product
function updateQuantity(productId, quantity) {
    let cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            saveCart(cart);
            void syncCartUpdateToServer(productId, quantity);
        }
    }
}

// ===== UI UPDATE =====
function updateCartDisplay() {
    const cart = getCart();
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cart-summary');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const totalItemsEl = document.getElementById('totalItems');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');

    // Nếu không phải trang cart thì chỉ bỏ qua phần render chi tiết
    if (!cartItemsContainer || !emptyCartMessage || !cartSummary || !checkoutBtn || !totalItemsEl || !subtotalEl || !totalEl) {
        return;
    }
    
    if (cart.length === 0) {
        cartItemsContainer.style.display = 'none';
        emptyCartMessage.style.display = 'block';
        cartSummary.style.display = 'none';
        checkoutBtn.disabled = true;
    } else {
        cartItemsContainer.style.display = 'block';
        emptyCartMessage.style.display = 'none';
        cartSummary.style.display = 'block';
        checkoutBtn.disabled = false;
        renderCartItems(cart);
    }
    
    updateSummary(cart);
}

// Render cart items in the DOM
function renderCartItems(cart) {
    const cartItemsContainer = document.getElementById('cartItems');
    cartItemsContainer.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="product-info">
                <h3>${item.name}</h3>
                <p class="product-price">${formatPrice(item.price)}</p>
            </div>
            
            <div class="quantity-section">
                <div class="quantity-control">
                    <button class="qty-btn" onclick="decreaseQuantity(${item.id})">−</button>
                    <input type="number" class="qty-input" value="${item.quantity}" 
                           onchange="updateQuantity(${item.id}, this.value)" min="1">
                    <button class="qty-btn" onclick="increaseQuantity(${item.id})">+</button>
                </div>
            </div>
            
            <div class="item-total">
                <p class="price">${formatPrice(item.price * item.quantity)}</p>
            </div>
            
            <div class="item-actions">
                <button class="pay-now-btn" onclick="checkoutSingleItem(${item.id})">Thanh toán ngay</button>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">🗑️ Xóa</button>
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItem);
    });
}

// Decrease quantity
function decreaseQuantity(productId) {
    let cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        if (item.quantity > 1) {
            item.quantity--;
            saveCart(cart);
            void syncCartUpdateToServer(productId, item.quantity);
        } else {
            removeFromCart(productId);
        }
    }
}

// Increase quantity
function increaseQuantity(productId) {
    let cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity++;
        saveCart(cart);
        void syncCartUpdateToServer(productId, item.quantity);
    }
}

// Update cart summary
function updateSummary(cart) {
    let totalItems = 0;
    let subtotal = 0;
    
    cart.forEach(item => {
        totalItems += item.quantity;
        subtotal += item.price * item.quantity;
    });
    
    const shipping = 0; // Free shipping
    const total = subtotal + shipping;
    
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('total').textContent = formatPrice(total);
}

// ===== MODAL FUNCTIONS =====
let currentModalProductId = null;

function openProductModal(productId, productName, productPrice, productDesc = '') {
    currentModalProductId = productId;
    document.getElementById('modalProductName').textContent = productName;
    document.getElementById('modalProductPrice').textContent = formatPrice(productPrice);
    document.getElementById('modalProductDesc').textContent = productDesc || 'Sản phẩm thể thao chất lượng cao';
    document.getElementById('modalQuantity').value = 1;
    document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    currentModalProductId = null;
}

function increaseModalQuantity() {
    const input = document.getElementById('modalQuantity');
    input.value = parseInt(input.value) + 1;
}

function decreaseModalQuantity() {
    const input = document.getElementById('modalQuantity');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

function addFromModal() {
    if (currentModalProductId !== null) {
        const productName = document.getElementById('modalProductName').textContent;
        const productPrice = parseInt(document.getElementById('modalProductPrice').textContent.replace(/[^\d]/g, ''));
        const quantity = parseInt(document.getElementById('modalQuantity').value);
        
        addToCart(currentModalProductId, productName, productPrice, quantity);
        closeProductModal();
    }
}

// ===== UTILITY FUNCTIONS =====
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Thông báo thêm giỏ hàng dùng riêng để luôn hiển thị ổn định
function showCartNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        background: #10b981;
        color: #fff;
        border-radius: 10px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        font-weight: 600;
        opacity: 0;
        transform: translateY(-8px);
        transition: opacity 0.2s ease, transform 0.2s ease;
    `;

    document.body.appendChild(notification);
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-8px)';
        setTimeout(() => notification.remove(), 220);
    }, 1800);
}

// ===== PRODUCT SUGGESTION =====
function quickAddProduct() {
    const select = document.getElementById('productSelect');
    const productId = parseInt(select.value);
    
    if (productId) {
        const option = select.options[select.selectedIndex];
        const productName = option.getAttribute('data-name');
        const productPrice = parseInt(option.getAttribute('data-price'));
        
        addToCart(productId, productName, productPrice);
        select.value = '';
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    hydrateCartFromServer().finally(() => {
        updateCartDisplay();
    });
    
    // Close modal when clicking outside
    document.getElementById('productModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeProductModal();
        }
    });
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            window.location.href = '/checkout';
        });
    }
});

// ===== EXPORT FOR HEADER USE =====
function addProductToCart(productId, productName, productPrice) {
    openProductModal(productId, productName, productPrice);
}
