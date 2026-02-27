/**
 * Forms Component
 * Modern UI Redesign - White Lab
 * 
 * Features:
 * - Real-time validation (Requirement 11.3)
 * - Validation state animations (Requirement 11.4)
 * - Form submission animation (Requirement 11.5)
 * - Floating labels
 * - Ripple effect for buttons
 * - Accessibility support
 * 
 * Validates Requirements: 11.3, 11.4, 11.5
 */

(function() {
  'use strict';

  // ========================================
  // Configuration
  // ========================================

  const CONFIG = {
    validationDelay: 300, // Debounce delay for validation (ms)
    animationDuration: 300, // Animation duration (ms)
    rippleDuration: 600, // Ripple effect duration (ms)
    
    // Validation patterns
    patterns: {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^\+?[\d\s\-\(\)]{10,}$/,
      minLength: 2
    },
    
    // Validation messages
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

  // ========================================
  // Validation Functions
  // ========================================

  /**
   * Validate email field
   * @param {string} value - Email value
   * @returns {boolean} - Is valid
   */
  function validateEmail(value) {
    return CONFIG.patterns.email.test(value);
  }

  /**
   * Validate phone field
   * @param {string} value - Phone value
   * @returns {boolean} - Is valid
   */
  function validatePhone(value) {
    return CONFIG.patterns.phone.test(value);
  }

  /**
   * Validate text field
   * @param {string} value - Text value
   * @param {number} minLength - Minimum length
   * @returns {boolean} - Is valid
   */
  function validateText(value, minLength = CONFIG.patterns.minLength) {
    return value.trim().length >= minLength;
  }

  /**
   * Get validation result for a field
   * @param {HTMLInputElement|HTMLTextAreaElement} input - Input element
   * @returns {{isValid: boolean, message: string}} - Validation result
   */
  function getValidationResult(input) {
    const value = input.value;
    const type = input.type;
    const required = input.required;
    
    // Empty field handling
    if (value.trim().length === 0) {
      if (required) {
        return {
          isValid: false,
          message: CONFIG.messages.required.invalid
        };
      }
      return { isValid: null, message: '' };
    }
    
    // Type-specific validation
    let isValid = false;
    let messageKey = 'text';
    
    switch (type) {
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

  // ========================================
  // Field Validation with Animation
  // ========================================

  /**
   * Validate and update field UI with animation
   * @param {HTMLElement} field - Form field container
   */
  function validateField(field) {
    const input = field.querySelector('.form-input, .form-textarea');
    const icon = field.querySelector('.form-validation-icon');
    const message = field.querySelector('.form-validation-message');
    
    if (!input) return;
    
    const result = getValidationResult(input);
    
    // Remove previous states
    field.classList.remove('is-valid', 'is-invalid');
    
    // Apply new state with animation
    if (result.isValid === true) {
      // Valid state
      requestAnimationFrame(() => {
        field.classList.add('is-valid');
        if (icon) icon.textContent = '✓';
        if (message) message.textContent = result.message;
      });
    } else if (result.isValid === false) {
      // Invalid state
      requestAnimationFrame(() => {
        field.classList.add('is-invalid');
        if (icon) icon.textContent = '✕';
        if (message) message.textContent = result.message;
      });
    } else {
      // Neutral state (empty non-required field)
      if (icon) icon.textContent = '';
      if (message) message.textContent = '';
    }
  }

  /**
   * Debounce function for validation
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} - Debounced function
   */
  function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // ========================================
  // Floating Label Management
  // ========================================

  /**
   * Update floating label state
   * @param {HTMLElement} field - Form field container
   */
  function updateFloatingLabel(field) {
    const input = field.querySelector('.form-input, .form-textarea');
    if (!input) return;
    
    if (input.value.trim().length > 0) {
      field.classList.add('has-value');
    } else {
      field.classList.remove('has-value');
    }
  }

  // ========================================
  // Ripple Effect
  // ========================================

  /**
   * Create ripple effect on button click
   * @param {MouseEvent} event - Click event
   */
  function createRipple(event) {
    const button = event.currentTarget;
    
    // Don't create ripple if button is disabled or loading
    if (button.disabled || button.classList.contains('is-loading')) {
      return;
    }
    
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    // Calculate ripple size and position
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('form-button-ripple');
    
    button.appendChild(ripple);
    
    // Remove ripple after animation
    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }

  // ========================================
  // Form Submission
  // ========================================

  /**
   * Handle form submission with animation
   * @param {HTMLFormElement} form - Form element
   * @param {Function} onSubmit - Submit callback
   */
  function handleFormSubmit(form, onSubmit) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      // Validate all fields
      const fields = form.querySelectorAll('.form-field');
      let isFormValid = true;
      
      fields.forEach(field => {
        validateField(field);
        if (field.classList.contains('is-invalid')) {
          isFormValid = false;
        }
      });
      
      // Check required checkboxes
      const requiredCheckboxes = form.querySelectorAll('input[type="checkbox"][required]');
      requiredCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
          isFormValid = false;
          // Add visual feedback for unchecked required checkbox
          const checkboxContainer = checkbox.closest('.form-checkbox');
          if (checkboxContainer) {
            checkboxContainer.style.color = 'var(--color-accent)';
            setTimeout(() => {
              checkboxContainer.style.color = '';
            }, 2000);
          }
        }
      });
      
      if (!isFormValid) {
        // Shake animation for invalid form
        form.style.animation = 'formShake 0.4s ease';
        setTimeout(() => {
          form.style.animation = '';
        }, 400);
        return;
      }
      
      // Get submit button
      const submitButton = form.querySelector('button[type="submit"]');
      
      if (submitButton) {
        // Add loading state
        submitButton.classList.add('is-loading');
        submitButton.disabled = true;
      }
      
      try {
        // Call submit callback if provided
        if (onSubmit && typeof onSubmit === 'function') {
          await onSubmit(new FormData(form));
        }
        
        // Success animation
        if (submitButton) {
          submitButton.classList.remove('is-loading');
          submitButton.classList.add('is-success');
          submitButton.textContent = '✓ Отправлено';
          
          // Reset button after delay
          setTimeout(() => {
            submitButton.classList.remove('is-success');
            submitButton.textContent = submitButton.dataset.originalText || 'Отправить';
            submitButton.disabled = false;
          }, 2000);
        }
        
        // Reset form after successful submission
        setTimeout(() => {
          form.reset();
          fields.forEach(field => {
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
        
        // Error state
        if (submitButton) {
          submitButton.classList.remove('is-loading');
          submitButton.classList.add('is-error');
          submitButton.textContent = '✕ Ошибка';
          
          // Reset button after delay
          setTimeout(() => {
            submitButton.classList.remove('is-error');
            submitButton.textContent = submitButton.dataset.originalText || 'Отправить';
            submitButton.disabled = false;
          }, 2000);
        }
      }
    });
  }

  // ========================================
  // Form Reset Handler
  // ========================================

  /**
   * Handle form reset
   * @param {HTMLFormElement} form - Form element
   */
  function handleFormReset(form) {
    form.addEventListener('reset', () => {
      // Small delay to let the reset complete
      setTimeout(() => {
        const fields = form.querySelectorAll('.form-field');
        fields.forEach(field => {
          field.classList.remove('is-valid', 'is-invalid', 'has-value');
          const icon = field.querySelector('.form-validation-icon');
          const message = field.querySelector('.form-validation-message');
          if (icon) icon.textContent = '';
          if (message) message.textContent = '';
        });
      }, 10);
    });
  }

  // ========================================
  // Initialize Form
  // ========================================

  /**
   * Initialize a form with all features
   * @param {HTMLFormElement} form - Form element
   * @param {Object} options - Configuration options
   */
  function initForm(form, options = {}) {
    const {
      onSubmit = null,
      validateOnInput = true,
      validateOnBlur = true
    } = options;
    
    // Store original button text
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton && !submitButton.dataset.originalText) {
      submitButton.dataset.originalText = submitButton.textContent;
    }
    
    // Initialize all form fields
    const fields = form.querySelectorAll('.form-field');
    
    fields.forEach(field => {
      const input = field.querySelector('.form-input, .form-textarea');
      if (!input) return;
      
      // Update floating label on load
      updateFloatingLabel(field);
      
      // Real-time validation on input (debounced)
      if (validateOnInput) {
        const debouncedValidate = debounce(() => {
          validateField(field);
        }, CONFIG.validationDelay);
        
        input.addEventListener('input', () => {
          updateFloatingLabel(field);
          debouncedValidate();
        });
      }
      
      // Validation on blur
      if (validateOnBlur) {
        input.addEventListener('blur', () => {
          validateField(field);
        });
      }
      
      // Update floating label on focus
      input.addEventListener('focus', () => {
        updateFloatingLabel(field);
      });
    });
    
    // Initialize ripple effect for all buttons
    const buttons = form.querySelectorAll('.form-button, .form-button-secondary, .form-button-outline, .btn-modern');
    buttons.forEach(button => {
      button.addEventListener('click', createRipple);
    });
    
    // Handle form submission
    handleFormSubmit(form, onSubmit);
    
    // Handle form reset
    handleFormReset(form);
  }

  // ========================================
  // Auto-initialize forms
  // ========================================

  /**
   * Initialize all forms on page load
   */
  function initAllForms() {
    const forms = document.querySelectorAll('.form-modern');
    forms.forEach(form => {
      // Skip if already initialized
      if (form.dataset.initialized === 'true') return;
      
      initForm(form);
      form.dataset.initialized = 'true';
    });
  }

  // ========================================
  // Add shake animation CSS
  // ========================================

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

  // ========================================
  // Public API
  // ========================================

  window.WhiteLabForms = {
    init: initForm,
    initAll: initAllForms,
    validate: validateField,
    createRipple: createRipple,
    validateEmail: validateEmail,
    validatePhone: validatePhone,
    validateText: validateText
  };

  // ========================================
  // Auto-initialize on DOM ready
  // ========================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addShakeAnimation();
      initAllForms();
    });
  } else {
    addShakeAnimation();
    initAllForms();
  }

})();
