// ===== REGISTER PAGE JAVASCRIPT =====
// Comprehensive registration form validation and error handling

class RegisterForm {
    constructor() {
        this.form = document.querySelector('form');
        this.firstNameInput = document.getElementById('first_name');
        this.lastNameInput = document.getElementById('last_name');
        this.emailInput = document.getElementById('email');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirm_password');
        this.phoneInput = document.getElementById('phone');
        this.agreeCheckbox = document.getElementById('agree');
        this.submitBtn = document.querySelector('.submit-btn');

        this.init();
    }

    init() {
        try {
            this.setupEventListeners();
            this.initializeValidation();
        } catch (error) {
            console.error('Error initializing RegisterForm:', error);
            this.showError('Có lỗi khi khởi tạo form đăng ký. Vui lòng tải lại trang.');
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

        // Real-time validation for all inputs
        const inputs = [
            { input: this.firstNameInput, validator: this.validateName.bind(this, 'first') },
            { input: this.lastNameInput, validator: this.validateName.bind(this, 'last') },
            { input: this.emailInput, validator: this.validateEmail.bind(this) },
            { input: this.usernameInput, validator: this.validateUsername.bind(this) },
            { input: this.passwordInput, validator: this.validatePassword.bind(this) },
            { input: this.confirmPasswordInput, validator: this.validateConfirmPassword.bind(this) },
            { input: this.phoneInput, validator: this.validatePhone.bind(this) }
        ];

        inputs.forEach(({ input, validator }) => {
            if (input) {
                input.addEventListener('input', () => validator());
                input.addEventListener('blur', () => validator(true));
            }
        });

        // Agree checkbox validation
        if (this.agreeCheckbox) {
            this.agreeCheckbox.addEventListener('change', () => {
                this.validateAgreement(true);
            });
        }

        // Password strength indicator
        if (this.passwordInput) {
            this.passwordInput.addEventListener('input', () => {
                this.updatePasswordStrength();
            });
        }

        // Enter key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                const activeElement = document.activeElement;
                const inputs = [this.firstNameInput, this.lastNameInput, this.emailInput, this.usernameInput, this.passwordInput, this.confirmPasswordInput];

                const currentIndex = inputs.indexOf(activeElement);
                if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else if (activeElement === this.confirmPasswordInput) {
                    this.handleSubmit();
                }
            }
        });

        // Password visibility toggles
        this.setupPasswordToggles();
    }

    initializeValidation() {
        // Add validation classes and attributes
        const inputs = [this.firstNameInput, this.lastNameInput, this.emailInput, this.usernameInput, this.passwordInput, this.confirmPasswordInput].filter(input => input);
        inputs.forEach(input => {
            input.setAttribute('autocomplete', input.type === 'password' ? 'new-password' : 'on');
        });
    }

    setupPasswordToggles() {
        [this.passwordInput, this.confirmPasswordInput].forEach(input => {
            if (input) {
                const passwordGroup = input.parentElement;
                if (passwordGroup) {
                    const toggleBtn = document.createElement('button');
                    toggleBtn.type = 'button';
                    toggleBtn.className = 'password-toggle';
                    toggleBtn.innerHTML = '👁️';
                    toggleBtn.title = 'Hiển thị mật khẩu';

                    toggleBtn.addEventListener('click', () => {
                        const isVisible = input.type === 'text';
                        input.type = isVisible ? 'password' : 'text';
                        toggleBtn.innerHTML = isVisible ? '👁️' : '🙈';
                        toggleBtn.title = isVisible ? 'Hiển thị mật khẩu' : 'Ẩn mật khẩu';
                    });

                    passwordGroup.style.position = 'relative';
                    passwordGroup.appendChild(toggleBtn);
                }
            }
        });
    }

    validateName(type, showErrors = false) {
        const input = type === 'first' ? this.firstNameInput : this.lastNameInput;
        if (!input) return true;

        const name = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        if (!name) {
            isValid = false;
            errorMessage = `Vui lòng nhập ${type === 'first' ? 'họ' : 'tên'}`;
        } else if (name.length < 2) {
            isValid = false;
            errorMessage = `${type === 'first' ? 'Họ' : 'Tên'} phải có ít nhất 2 ký tự`;
        } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(name)) {
            isValid = false;
            errorMessage = `${type === 'first' ? 'Họ' : 'Tên'} chỉ được chứa chữ cái và khoảng trắng`;
        }

        this.updateFieldValidation(input, isValid, errorMessage, showErrors);
        return isValid;
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

    validateUsername(showErrors = false) {
        if (!this.usernameInput) return true;

        const username = this.usernameInput.value.trim();
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

        let isValid = true;
        let errorMessage = '';

        if (!username) {
            isValid = false;
            errorMessage = 'Vui lòng nhập tên đăng nhập';
        } else if (!usernameRegex.test(username)) {
            isValid = false;
            errorMessage = 'Tên đăng nhập phải 3-20 ký tự, chỉ chứa chữ, số và dấu gạch dưới';
        }

        this.updateFieldValidation(this.usernameInput, isValid, errorMessage, showErrors);
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
        } else if (password.length < 8) {
            isValid = false;
            errorMessage = 'Mật khẩu phải có ít nhất 8 ký tự';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            isValid = false;
            errorMessage = 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số';
        }

        this.updateFieldValidation(this.passwordInput, isValid, errorMessage, showErrors);
        return isValid;
    }

    validateConfirmPassword(showErrors = false) {
        if (!this.confirmPasswordInput) return true;

        const confirmPassword = this.confirmPasswordInput.value;
        const password = this.passwordInput?.value || '';

        let isValid = true;
        let errorMessage = '';

        if (!confirmPassword) {
            isValid = false;
            errorMessage = 'Vui lòng xác nhận mật khẩu';
        } else if (confirmPassword !== password) {
            isValid = false;
            errorMessage = 'Mật khẩu xác nhận không khớp';
        }

        this.updateFieldValidation(this.confirmPasswordInput, isValid, errorMessage, showErrors);
        return isValid;
    }

    validatePhone(showErrors = false) {
        if (!this.phoneInput) return true;

        const phone = this.phoneInput.value.trim();
        const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;

        let isValid = true;
        let errorMessage = '';

        // Phone is optional, so empty is valid
        if (phone && !phoneRegex.test(phone)) {
            isValid = false;
            errorMessage = 'Số điện thoại không hợp lệ (VD: 0987654321)';
        }

        this.updateFieldValidation(this.phoneInput, isValid, errorMessage, showErrors);
        return isValid;
    }

    validateAgreement(showErrors = false) {
        if (!this.agreeCheckbox) return true;

        const isChecked = this.agreeCheckbox.checked;
        let isValid = true;
        let errorMessage = '';

        if (!isChecked) {
            isValid = false;
            errorMessage = 'Vui lòng đồng ý với điều khoản dịch vụ';
        }

        // For checkbox, we need to handle error display differently
        const checkboxGroup = this.agreeCheckbox.closest('.checkbox-group');
        if (checkboxGroup) {
            const existingError = checkboxGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }

            checkboxGroup.classList.remove('has-error');

            if (!isValid && showErrors) {
                checkboxGroup.classList.add('has-error');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = errorMessage;
                checkboxGroup.appendChild(errorDiv);
            }
        }

        return isValid;
    }

    updatePasswordStrength() {
        if (!this.passwordInput) return;

        const password = this.passwordInput.value;
        const formGroup = this.passwordInput.parentElement;
        if (!formGroup) return;

        // Remove existing strength indicator
        const existingStrength = formGroup.querySelector('.password-strength');
        if (existingStrength) {
            existingStrength.remove();
        }

        if (password.length === 0) return;

        let strength = 0;
        let feedback = [];

        // Length check
        if (password.length >= 8) strength++;
        else feedback.push('Ít nhất 8 ký tự');

        // Character variety checks
        if (/[a-z]/.test(password)) strength++;
        else feedback.push('Chữ thường');

        if (/[A-Z]/.test(password)) strength++;
        else feedback.push('Chữ hoa');

        if (/\d/.test(password)) strength++;
        else feedback.push('Số');

        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
        else feedback.push('Ký tự đặc biệt');

        // Create strength indicator
        const strengthDiv = document.createElement('div');
        strengthDiv.className = 'password-strength';

        const strengthText = strength <= 1 ? 'Yếu' : strength <= 3 ? 'Trung bình' : strength <= 4 ? 'Mạnh' : 'Rất mạnh';
        const strengthClass = strength <= 1 ? 'weak' : strength <= 3 ? 'medium' : strength <= 4 ? 'strong' : 'very-strong';

        strengthDiv.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill ${strengthClass}" style="width: ${(strength / 5) * 100}%"></div>
            </div>
            <span class="strength-text ${strengthClass}">${strengthText}</span>
            ${feedback.length > 0 ? `<span class="strength-feedback">${feedback.join(', ')}</span>` : ''}
        `;

        formGroup.appendChild(strengthDiv);
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
            const validations = [
                this.validateName('first', true),
                this.validateName('last', true),
                this.validateEmail(true),
                this.validateUsername(true),
                this.validatePassword(true),
                this.validateConfirmPassword(true),
                this.validatePhone(true),
                this.validateAgreement(true)
            ];

            const allValid = validations.every(valid => valid);

            if (!allValid) {
                this.showError('Vui lòng kiểm tra lại thông tin đăng ký');
                return;
            }

            // Show loading state
            this.setLoading(true);

            // Prepare form data
            const formData = new FormData(this.form);
            const registerData = {
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                email: formData.get('email'),
                username: formData.get('username'),
                password: formData.get('password'),
                phone: formData.get('phone') || null
            };

            // Simulate API call
            await this.delay(2000);

            // For demo purposes, accept registration
            // In real app, this would be an actual API call
            this.showSuccess('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');

            // Redirect to login page
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            this.showError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        if (this.submitBtn) {
            this.submitBtn.disabled = loading;
            this.submitBtn.textContent = loading ? 'Đang đăng ký...' : 'Đăng ký';
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
        new RegisterForm();

        // Add global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });

        console.log('Register page initialized successfully');
    } catch (error) {
        console.error('Failed to initialize register page:', error);
        alert('Có lỗi khi tải trang đăng ký. Vui lòng tải lại.');
    }
});

// ===== ACCESSIBILITY =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Clear any focused inputs or close notifications
        document.querySelectorAll('.notification').forEach(notif => notif.remove());
    }
});
