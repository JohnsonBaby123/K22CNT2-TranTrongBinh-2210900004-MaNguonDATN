// ===== INDEX PAGE JAVASCRIPT =====
// Enhanced functionality for the main page with error handling

class IndexPage {
    constructor() {
        this.init();
    }

    init() {
        try {
            this.setupEventListeners();
            this.initializeComponents();
            this.handleScrollEffects();
        } catch (error) {
            console.error('Error initializing IndexPage:', error);
            this.showError('Có lỗi khi khởi tạo trang. Vui lòng tải lại.');
        }
    }

    setupEventListeners() {
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Dropdown menu functionality
        const dropdowns = document.querySelectorAll('.nav-item.dropdown');
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            if (toggle) {
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                });
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-item.dropdown')) {
                document.querySelectorAll('.nav-item.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });

        // Category card hover effects
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });

        // Hero card animations
        const heroCards = document.querySelectorAll('.hero-card');
        heroCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-in');
        });
    }

    initializeComponents() {
        // Initialize cart count
        this.updateCartCount();

        // Add loading states for buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.classList.contains('loading')) return;

                const originalText = button.textContent;
                button.classList.add('loading');
                button.innerHTML = '<span class="spinner"></span> Đang xử lý...';

                // Remove loading state after 2 seconds (simulate processing)
                setTimeout(() => {
                    button.classList.remove('loading');
                    button.textContent = originalText;
                }, 2000);
            });
        });
    }

    handleScrollEffects() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Observe sections for scroll animations
        document.querySelectorAll('.section').forEach(section => {
            observer.observe(section);
        });

        // Parallax effect for hero section (removed to prevent layout issues)
        // window.addEventListener('scroll', () => {
        //     const scrolled = window.pageYOffset;
        //     const hero = document.querySelector('.hero');
        //     if (hero) {
        //         hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        //     }
        // });
    }

    updateCartCount() {
        try {
            const cart = this.getCart();
            const count = cart.reduce((sum, item) => sum + item.quantity, 0);
            const countEl = document.getElementById('cart-count');

            if (countEl) {
                if (count > 0) {
                    countEl.textContent = count;
                    countEl.style.display = 'inline-block';
                } else {
                    countEl.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error updating cart count:', error);
        }
    }

    getCart() {
        try {
            const cart = localStorage.getItem('binksport_cart');
            return cart ? JSON.parse(cart) : [];
        } catch (error) {
            console.error('Error getting cart from localStorage:', error);
            return [];
        }
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span>${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(errorDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Create success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✅</span>
                <span>${message}</span>
                <button class="success-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(successDiv);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentElement) {
                successDiv.remove();
            }
        }, 3000);
    }
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize the page
        new IndexPage();

        // Add global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            // Don't show error to user for minor errors
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            // Handle unhandled promises
        });

        console.log('Index page initialized successfully');
    } catch (error) {
        console.error('Failed to initialize index page:', error);
        alert('Có lỗi khi tải trang. Vui lòng tải lại.');
    }
});

// ===== RESPONSIVE HANDLING =====
window.addEventListener('resize', debounce(() => {
    // Handle responsive adjustments
    const width = window.innerWidth;

    if (width < 768) {
        // Mobile adjustments
        document.body.classList.add('mobile');
        document.body.classList.remove('tablet', 'desktop');
    } else if (width < 1024) {
        // Tablet adjustments
        document.body.classList.add('tablet');
        document.body.classList.remove('mobile', 'desktop');
    } else {
        // Desktop adjustments
        document.body.classList.add('desktop');
        document.body.classList.remove('mobile', 'tablet');
    }
}, 250));

// ===== ACCESSIBILITY =====
document.addEventListener('keydown', (e) => {
    // Handle keyboard navigation
    if (e.key === 'Escape') {
        // Close any open modals or dropdowns
        document.querySelectorAll('.nav-item.dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
});
