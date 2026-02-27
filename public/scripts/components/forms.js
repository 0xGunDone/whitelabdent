(function() {
    'use strict';
    const CONFIG = {
        validationDelay: 300,
        animationDuration: 300,
        rippleDuration: 600,
        patterns: {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^\+?[\d\s\-\(\)]{10,}$/,
            minLength: 2
        },
        messages: {
            email: {
                valid: 'Адрес электронной почты корректен',
                invalid: 'Введите корректный адрес электронной почты'
            },
            phone: {
                valid: 'Телефон корректен',
                invalid: 'Введите корректный номер телефона'
            },
            text: {
                valid: 'Поле заполнено корректно',
                invalid: 'Поле должно содержать минимум 2 символа'
            },
            required: {
                invalid: 'Это поле обязательно для заполнения'
            }
        }
    };
    function validateEmail(value) {
        return CONFIG.patterns.email.test(value);
    }
    function validatePhone(value) {
        return CONFIG.patterns.phone.test(value);
    }
    function validateText(value, minLength = CONFIG.patterns.minLength) {
        return value.trim().length >= minLength;
    }
    function getValidationResult(input) {
        const value = input.value;
        const type = input.type;
        const required = input.required;
        if (value.trim().length === 0) {
            if (required) {
                return {
                    isValid: false,
                    message: CONFIG.messages.required.invalid
                };
            }
            return {
                isValid: null,
                message: ''
            };
        }
        let isValid = false;
        let messageKey = 'text';
        switch(type){
            case 'email':
                isValid = validateEmail(value);
                messageKey = 'email';
                break;
            case 'tel':
                isValid = validatePhone(value);
                messageKey = 'phone';
                break;
            default:
                isValid = validateText(value);
                messageKey = 'text';
                break;
        }
        const messages = CONFIG.messages[messageKey];
        return {
            isValid,
            message: isValid ? messages.valid : messages.invalid
        };
    }
    function validateField(field) {
        const input = field.querySelector('.form-input, .form-textarea');
        const icon = field.querySelector('.form-validation-icon');
        const message = field.querySelector('.form-validation-message');
        if (!input) return;
        const result = getValidationResult(input);
        field.classList.remove('is-valid', 'is-invalid');
        if (result.isValid === true) {
            requestAnimationFrame(()=>{
                field.classList.add('is-valid');
                if (icon) icon.textContent = '✓';
                if (message) message.textContent = result.message;
            });
        } else if (result.isValid === false) {
            requestAnimationFrame(()=>{
                field.classList.add('is-invalid');
                if (icon) icon.textContent = '✕';
                if (message) message.textContent = result.message;
            });
        } else {
            if (icon) icon.textContent = '';
            if (message) message.textContent = '';
        }
    }
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(()=>func.apply(this, args), delay);
        };
    }
    function updateFloatingLabel(field) {
        const input = field.querySelector('.form-input, .form-textarea');
        if (!input) return;
        if (input.value.trim().length > 0) {
            field.classList.add('has-value');
        } else {
            field.classList.remove('has-value');
        }
    }
    function createRipple(event) {
        const button = event.currentTarget;
        if (button.disabled || button.classList.contains('is-loading')) {
            return;
        }
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('form-button-ripple');
        button.appendChild(ripple);
        ripple.addEventListener('animationend', ()=>{
            ripple.remove();
        });
    }
    function handleFormSubmit(form, onSubmit) {
        form.addEventListener('submit', async (event)=>{
            event.preventDefault();
            const fields = form.querySelectorAll('.form-field');
            let isFormValid = true;
            fields.forEach((field)=>{
                validateField(field);
                if (field.classList.contains('is-invalid')) {
                    isFormValid = false;
                }
            });
            const requiredCheckboxes = form.querySelectorAll('input[type="checkbox"][required]');
            requiredCheckboxes.forEach((checkbox)=>{
                if (!checkbox.checked) {
                    isFormValid = false;
                    const checkboxContainer = checkbox.closest('.form-checkbox');
                    if (checkboxContainer) {
                        checkboxContainer.style.color = 'var(--color-accent)';
                        setTimeout(()=>{
                            checkboxContainer.style.color = '';
                        }, 2000);
                    }
                }
            });
            if (!isFormValid) {
                form.style.animation = 'formShake 0.4s ease';
                setTimeout(()=>{
                    form.style.animation = '';
                }, 400);
                return;
            }
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.classList.add('is-loading');
                submitButton.disabled = true;
            }
            try {
                if (onSubmit && typeof onSubmit === 'function') {
                    await onSubmit(new FormData(form));
                }
                if (submitButton) {
                    submitButton.classList.remove('is-loading');
                    submitButton.classList.add('is-success');
                    submitButton.textContent = '✓ Отправлено';
                    setTimeout(()=>{
                        submitButton.classList.remove('is-success');
                        submitButton.textContent = submitButton.dataset.originalText || 'Отправить';
                        submitButton.disabled = false;
                    }, 2000);
                }
                setTimeout(()=>{
                    form.reset();
                    fields.forEach((field)=>{
                        field.classList.remove('is-valid', 'is-invalid');
                        updateFloatingLabel(field);
                        const icon = field.querySelector('.form-validation-icon');
                        const message = field.querySelector('.form-validation-message');
                        if (icon) icon.textContent = '';
                        if (message) message.textContent = '';
                    });
                }, 2500);
            } catch (error) {
                console.error('Form submission error:', error);
                if (submitButton) {
                    submitButton.classList.remove('is-loading');
                    submitButton.classList.add('is-error');
                    submitButton.textContent = '✕ Ошибка';
                    setTimeout(()=>{
                        submitButton.classList.remove('is-error');
                        submitButton.textContent = submitButton.dataset.originalText || 'Отправить';
                        submitButton.disabled = false;
                    }, 2000);
                }
            }
        });
    }
    function handleFormReset(form) {
        form.addEventListener('reset', ()=>{
            setTimeout(()=>{
                const fields = form.querySelectorAll('.form-field');
                fields.forEach((field)=>{
                    field.classList.remove('is-valid', 'is-invalid', 'has-value');
                    const icon = field.querySelector('.form-validation-icon');
                    const message = field.querySelector('.form-validation-message');
                    if (icon) icon.textContent = '';
                    if (message) message.textContent = '';
                });
            }, 10);
        });
    }
    function initForm(form, options = {}) {
        const { onSubmit = null, validateOnInput = true, validateOnBlur = true } = options;
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton && !submitButton.dataset.originalText) {
            submitButton.dataset.originalText = submitButton.textContent;
        }
        const fields = form.querySelectorAll('.form-field');
        fields.forEach((field)=>{
            const input = field.querySelector('.form-input, .form-textarea');
            if (!input) return;
            updateFloatingLabel(field);
            if (validateOnInput) {
                const debouncedValidate = debounce(()=>{
                    validateField(field);
                }, CONFIG.validationDelay);
                input.addEventListener('input', ()=>{
                    updateFloatingLabel(field);
                    debouncedValidate();
                });
            }
            if (validateOnBlur) {
                input.addEventListener('blur', ()=>{
                    validateField(field);
                });
            }
            input.addEventListener('focus', ()=>{
                updateFloatingLabel(field);
            });
        });
        const buttons = form.querySelectorAll('.form-button, .form-button-secondary, .form-button-outline, .btn-modern');
        buttons.forEach((button)=>{
            button.addEventListener('click', createRipple);
        });
        handleFormSubmit(form, onSubmit);
        handleFormReset(form);
    }
    function initAllForms() {
        const forms = document.querySelectorAll('.form-modern');
        forms.forEach((form)=>{
            if (form.dataset.initialized === 'true') return;
            initForm(form);
            form.dataset.initialized = 'true';
        });
    }
    function addShakeAnimation() {
        if (document.getElementById('form-shake-animation')) return;
        const style = document.createElement('style');
        style.id = 'form-shake-animation';
        style.textContent = `
      @keyframes formShake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
        20%, 40%, 60%, 80% { transform: translateX(8px); }
      }
      
      .form-button.is-success,
      .btn-modern.is-success {
        background: var(--gradient-brand) !important;
        animation: successPulse 0.4s ease;
      }
      
      .form-button.is-error,
      .btn-modern.is-error {
        background: linear-gradient(98deg, #ff6e6e, #ff4757) !important;
        animation: errorShake 0.4s ease;
      }
      
      @keyframes successPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      @keyframes errorShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
      }
    `;
        document.head.appendChild(style);
    }
    window.WhiteLabForms = {
        init: initForm,
        initAll: initAllForms,
        validate: validateField,
        createRipple: createRipple,
        validateEmail: validateEmail,
        validatePhone: validatePhone,
        validateText: validateText
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ()=>{
            addShakeAnimation();
            initAllForms();
        });
    } else {
        addShakeAnimation();
        initAllForms();
    }
})();


//# sourceURL=src/public/scripts/components/forms.ts