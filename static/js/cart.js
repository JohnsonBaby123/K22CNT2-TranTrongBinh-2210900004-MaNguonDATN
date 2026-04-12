// ===== CART STORAGE =====
const CART_STORAGE_KEY = 'binksport_cart';

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
    showNotification(`Đã thêm "${productName}" vào giỏ hàng!`);
}

// Remove product from cart
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
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
        }
    }
}

// ===== UI UPDATE =====
function updateCartDisplay() {
    const cart = getCart();
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCart');
    
    if (cart.length === 0) {
        cartItemsContainer.style.display = 'none';
        emptyCartMessage.style.display = 'block';
        document.getElementById('checkoutBtn').disabled = true;
    } else {
        cartItemsContainer.style.display = 'block';
        emptyCartMessage.style.display = 'none';
        document.getElementById('checkoutBtn').disabled = false;
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
            
            <button class="remove-btn" onclick="removeFromCart(${item.id})">🗑️ Xóa</button>
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
    updateCartDisplay();
    
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
            alert('Chức năng thanh toán sẽ được phát triển sớm!');
            // TODO: Implement checkout functionality
        });
    }
});

// ===== EXPORT FOR HEADER USE =====
function addProductToCart(productId, productName, productPrice) {
    openProductModal(productId, productName, productPrice);
}
