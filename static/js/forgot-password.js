// ===== FORGOT PASSWORD PAGE JAVASCRIPT =====
// Password reset form validation and error handling

class ForgotPasswordForm {
    constructor() {
        this.form = document.querySelector('form');
        this.emailInput = document.getElementById('email');
        this.submitBtn = document.querySelector('.submit-btn');
        this.isSubmitted = false;

        this.init();
    }

    init() {
        try {
            this.setupEventListeners();
            this.initializeValidation();
        } catch (error) {
            console.error('Error initializing ForgotPasswordForm:', error);
            this.showError('Có lỗi khi khởi tạo form quên mật khẩu. Vui lòng tải lại trang.');
        }
    }

    setupEventListeners() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // Email validation
        if (this.emailInput) {
            this.emailInput.addEventListener('input', () => {
                this.validateEmail();
            });
            this.emailInput.addEventListener('blur', () => {
                this.validateEmail(true);
            });
        }

        // Enter key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                const activeElement = document.activeElement;
                if (activeElement === this.emailInput) {
                    this.handleSubmit();
                }
            }
        });
    }

    initializeValidation() {
        // Add validation attributes
        if (this.emailInput) {
            this.emailInput.setAttribute('autocomplete', 'email');
        }
    }

    validateEmail(showErrors = false) {
        if (!this.emailInput) return true;

        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        let isValid = true;
        let errorMessage = '';

        if (!email) {
            isValid = false;
            errorMessage = 'Vui lòng nhập email';
        } else if (!emailRegex.test(email)) {
            isValid = false;
            errorMessage = 'Email không hợp lệ';
        }

        this.updateFieldValidation(this.emailInput, isValid, errorMessage, showErrors);
        return isValid;
    }

    updateFieldValidation(input, isValid, errorMessage, showErrors) {
        const formGroup = input.parentElement;
        if (!formGroup) return;

        // Remove existing error messages
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Update input classes
        input.classList.remove('valid', 'invalid');
        formGroup.classList.remove('has-error', 'has-success');

        if (input.value.trim()) {
            if (isValid) {
                input.classList.add('valid');
                formGroup.classList.add('has-success');
            } else if (showErrors) {
                input.classList.add('invalid');
                formGroup.classList.add('has-error');

                // Add error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = errorMessage;
                formGroup.appendChild(errorDiv);
            }
        }
    }

    async handleSubmit() {
        try {
            // Prevent multiple submissions
            if (this.isSubmitted) return;

            // Validate email
            const emailValid = this.validateEmail(true);
            if (!emailValid) {
                this.showError('Vui lòng kiểm tra lại email');
                return;
            }

            // Mark as submitted
            this.isSubmitted = true;

            // Show loading state
            this.setLoading(true);

            // Prepare data
            const email = this.emailInput.value.trim();

            // Simulate API call to send reset email
            await this.delay(2000);

            // For demo purposes, always show success
            // In real app, this would check if email exists and send reset link
            this.showSuccess('Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn!');

            // Update UI to show success state
            this.showResetSuccess(email);

        } catch (error) {
            console.error('Forgot password error:', error);
            this.showError(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            this.setLoading(false);
            this.isSubmitted = false;
        }
    }

    showResetSuccess(email) {
        // Hide form and show success message
        if (this.form) {
            this.form.style.display = 'none';
        }

        const successDiv = document.createElement('div');
        successDiv.className = 'reset-success';
        successDiv.innerHTML = `
            <div class="success-icon">📧</div>
            <h3>Đã gửi hướng dẫn đặt lại mật khẩu</h3>
            <p>Chúng tôi đã gửi email hướng dẫn đặt lại mật khẩu đến <strong>${email}</strong>.</p>
            <p>Vui lòng kiểm tra hộp thư đến và làm theo hướng dẫn. Nếu không thấy email, hãy kiểm tra thư mục spam.</p>
            <div class="success-actions">
                <button class="btn-secondary" onclick="window.location.href='/login'">Quay lại đăng nhập</button>
                <button class="btn-primary" onclick="this.parentElement.parentElement.remove(); document.querySelector('form').style.display='block';">Gửi lại email</button>
            </div>
        `;

        const authCard = document.querySelector('.auth-card');
        if (authCard) {
            authCard.appendChild(successDiv);
        }
    }

    setLoading(loading) {
        if (this.submitBtn) {
            this.submitBtn.disabled = loading;
            this.submitBtn.textContent = loading ? 'Đang gửi...' : 'Gửi hướng dẫn đặt lại';
        }

        // Disable form inputs during loading
        const inputs = this.form?.querySelectorAll('input') || [];
        inputs.forEach(input => {
            input.disabled = loading;
        });
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, type === 'error' ? 5000 : 3000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ===== EMAIL SUGGESTIONS =====
class EmailSuggestions {
    constructor(input) {
        this.input = input;
        this.suggestions = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
        this.suggestionBox = null;
        this.currentSuggestion = null;

        this.init();
    }

    init() {
        this.createSuggestionBox();
        this.setupEventListeners();
    }

    createSuggestionBox() {
        this.suggestionBox = document.createElement('div');
        this.suggestionBox.className = 'email-suggestions';
        this.suggestionBox.style.display = 'none';

        const inputParent = this.input.parentElement;
        if (inputParent) {
            inputParent.style.position = 'relative';
            inputParent.appendChild(this.suggestionBox);
        }
    }

    setupEventListeners() {
        this.input.addEventListener('input', () => {
            this.handleInput();
        });

        this.input.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        this.input.addEventListener('blur', () => {
            // Delay hiding to allow clicking on suggestions
            setTimeout(() => {
                this.hideSuggestions();
            }, 150);
        });

        this.input.addEventListener('focus', () => {
            if (this.currentSuggestion) {
                this.showSuggestions();
            }
        });
    }

    handleInput() {
        const value = this.input.value;
        const atIndex = value.indexOf('@');

        if (atIndex !== -1) {
            const prefix = value.substring(0, atIndex);
            const domain = value.substring(atIndex + 1);

            if (prefix && domain.length > 0) {
                const matchingSuggestions = this.suggestions.filter(suggestion =>
                    suggestion.toLowerCase().startsWith(domain.toLowerCase())
                );

                if (matchingSuggestions.length > 0) {
                    this.currentSuggestion = prefix + '@' + matchingSuggestions[0];
                    this.showSuggestions();
                    return;
                }
            }
        }

        this.hideSuggestions();
    }

    handleKeydown(e) {
        if (this.suggestionBox.style.display !== 'none') {
            if (e.key === 'Tab' || e.key === 'ArrowRight') {
                e.preventDefault();
                this.acceptSuggestion();
            } else if (e.key === 'Escape') {
                this.hideSuggestions();
            }
        }
    }

    showSuggestions() {
        if (!this.currentSuggestion) return;

        this.suggestionBox.innerHTML = `
            <div class="suggestion-item">
                Nhấn Tab để hoàn thành: <strong>${this.currentSuggestion}</strong>
            </div>
        `;
        this.suggestionBox.style.display = 'block';
    }

    hideSuggestions() {
        if (this.suggestionBox) {
            this.suggestionBox.style.display = 'none';
        }
        this.currentSuggestion = null;
    }

    acceptSuggestion() {
        if (this.currentSuggestion) {
            this.input.value = this.currentSuggestion;
            this.hideSuggestions();
            this.input.focus();
        }
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

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    try {
        new ForgotPasswordForm();

        // Initialize email suggestions
        const emailInput = document.getElementById('email');
        if (emailInput) {
            new EmailSuggestions(emailInput);
        }

        // Add global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });

        console.log('Forgot password page initialized successfully');
    } catch (error) {
        console.error('Failed to initialize forgot password page:', error);
        alert('Có lỗi khi tải trang quên mật khẩu. Vui lòng tải lại.');
    }
});

// ===== ACCESSIBILITY =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Clear any focused inputs or close notifications
        document.querySelectorAll('.notification').forEach(notif => notif.remove());
    }
});
