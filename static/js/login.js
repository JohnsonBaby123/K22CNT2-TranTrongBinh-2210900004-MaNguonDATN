// ===== LOGIN PAGE JAVASCRIPT =====
// Comprehensive login form validation and error handling

class LoginForm {
    constructor() {
        this.form = document.querySelector('form');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.rememberCheckbox = document.getElementById('remember');
        this.submitBtn = document.querySelector('.submit-btn');

        this.init();
    }

    init() {
        try {
            this.setupEventListeners();
            this.initializeValidation();
            this.loadSavedCredentials();
        } catch (error) {
            console.error('Error initializing LoginForm:', error);
            this.showError('Có lỗi khi khởi tạo form đăng nhập. Vui lòng tải lại trang.');
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

        // Real-time validation
        if (this.emailInput) {
            this.emailInput.addEventListener('input', () => {
                this.validateEmail();
            });
            this.emailInput.addEventListener('blur', () => {
                this.validateEmail(true);
            });
        }

        if (this.passwordInput) {
            this.passwordInput.addEventListener('input', () => {
                this.validatePassword();
            });
            this.passwordInput.addEventListener('blur', () => {
                this.validatePassword(true);
            });
        }

        // Enter key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                const activeElement = document.activeElement;
                if (activeElement === this.emailInput) {
                    this.passwordInput.focus();
                } else if (activeElement === this.passwordInput) {
                    this.handleSubmit();
                }
            }
        });

        // Password visibility toggle (if needed)
        this.setupPasswordToggle();
    }

    initializeValidation() {
        // Add validation classes and attributes
        const inputs = [this.emailInput, this.passwordInput].filter(input => input);
        inputs.forEach(input => {
            input.setAttribute('autocomplete', input.type === 'password' ? 'current-password' : 'username');
        });
    }

    setupPasswordToggle() {
        // Create password toggle button
        const passwordGroup = this.passwordInput?.parentElement;
        if (passwordGroup && this.passwordInput) {
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'password-toggle';
            toggleBtn.innerHTML = '👁️';
            toggleBtn.title = 'Hiển thị mật khẩu';

            toggleBtn.addEventListener('click', () => {
                const isVisible = this.passwordInput.type === 'text';
                this.passwordInput.type = isVisible ? 'password' : 'text';
                toggleBtn.innerHTML = isVisible ? '👁️' : '🙈';
                toggleBtn.title = isVisible ? 'Hiển thị mật khẩu' : 'Ẩn mật khẩu';
            });

            passwordGroup.style.position = 'relative';
            passwordGroup.appendChild(toggleBtn);
        }
    }

    validateEmail(showErrors = false) {
        if (!this.emailInput) return true;

        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

        let isValid = true;
        let errorMessage = '';

        if (!email) {
            isValid = false;
            errorMessage = 'Vui lòng nhập email hoặc tên đăng nhập';
        } else if (!emailRegex.test(email) && !usernameRegex.test(email)) {
            isValid = false;
            errorMessage = 'Email hoặc tên đăng nhập không hợp lệ';
        }

        this.updateFieldValidation(this.emailInput, isValid, errorMessage, showErrors);
        return isValid;
    }

    validatePassword(showErrors = false) {
        if (!this.passwordInput) return true;

        const password = this.passwordInput.value;
        let isValid = true;
        let errorMessage = '';

        if (!password) {
            isValid = false;
            errorMessage = 'Vui lòng nhập mật khẩu';
        } else if (password.length < 6) {
            isValid = false;
            errorMessage = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        this.updateFieldValidation(this.passwordInput, isValid, errorMessage, showErrors);
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
            // Validate all fields
            const emailValid = this.validateEmail(true);
            const passwordValid = this.validatePassword(true);

            if (!emailValid || !passwordValid) {
                this.showError('Vui lòng kiểm tra lại thông tin đăng nhập');
                return;
            }

            // Thu thập dữ liệu để xử lý tính năng "ghi nhớ tôi"
            const formData = new FormData(this.form);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password'),
                remember: formData.get('remember') === 'on'
            };

            // Save credentials if remember is checked
            if (loginData.remember) {
                this.saveCredentials(loginData.email);
            } else {
                this.clearSavedCredentials();
            }

            // Chỉ đổi trạng thái nút submit để tránh double click,
            // không disable input vì input disabled sẽ không được gửi lên server.
            if (this.submitBtn) {
                this.submitBtn.disabled = true;
                this.submitBtn.textContent = 'Đang đăng nhập...';
            }

            // Submit thật về backend Flask để server quyết định redirect
            this.form.submit();

        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            // Trường hợp submit thất bại ở client-side exception,
            // khôi phục lại trạng thái nút.
            if (this.submitBtn) {
                this.submitBtn.disabled = false;
                this.submitBtn.textContent = 'Đăng nhập';
            }
        }
    }

    setLoading(loading) {
        if (this.submitBtn) {
            this.submitBtn.disabled = loading;
            this.submitBtn.textContent = loading ? 'Đang đăng nhập...' : 'Đăng nhập';
        }

        // Disable form inputs during loading
        const inputs = this.form?.querySelectorAll('input') || [];
        inputs.forEach(input => {
            input.disabled = loading;
        });
    }

    loadSavedCredentials() {
        try {
            const saved = localStorage.getItem('binksport_login_email');
            if (saved && this.emailInput) {
                this.emailInput.value = saved;
                if (this.rememberCheckbox) {
                    this.rememberCheckbox.checked = true;
                }
            }
        } catch (error) {
            console.error('Error loading saved credentials:', error);
        }
    }

    saveCredentials(email) {
        try {
            localStorage.setItem('binksport_login_email', email);
        } catch (error) {
            console.error('Error saving credentials:', error);
        }
    }

    clearSavedCredentials() {
        try {
            localStorage.removeItem('binksport_login_email');
        } catch (error) {
            console.error('Error clearing credentials:', error);
        }
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
        new LoginForm();

        // Add global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });

        console.log('Login page initialized successfully');
    } catch (error) {
        console.error('Failed to initialize login page:', error);
        alert('Có lỗi khi tải trang đăng nhập. Vui lòng tải lại.');
    }
});

// ===== ACCESSIBILITY =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Clear any focused inputs or close notifications
        document.querySelectorAll('.notification').forEach(notif => notif.remove());
    }
});
