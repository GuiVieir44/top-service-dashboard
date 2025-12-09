// ==========================================
// SISTEMA DE VALIDAÇÕES - TOP SERVICE
// ==========================================

console.log('✅ Sistema de validações carregado');

/**
 * Valida CPF (formato XXX.XXX.XXX-XX)
 */
function validateCPF(cpf) {
    // Remover caracteres especiais
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Validar comprimento
    if (cpf.length !== 11) return false;
    
    // Validar se todos os dígitos são iguais (inválido)
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validar dígitos verificadores
    let sum = 0;
    let remainder;
    
    // Primeiro dígito
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    // Segundo dígito
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
}

/**
 * Formata CPF automaticamente
 */
function formatCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    cpf = cpf.substring(0, 11);
    
    if (cpf.length <= 3) return cpf;
    if (cpf.length <= 6) return cpf.substring(0, 3) + '.' + cpf.substring(3);
    if (cpf.length <= 9) return cpf.substring(0, 3) + '.' + cpf.substring(3, 6) + '.' + cpf.substring(6);
    
    return cpf.substring(0, 3) + '.' + cpf.substring(3, 6) + '.' + cpf.substring(6, 9) + '-' + cpf.substring(9);
}

/**
 * Valida email
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valida telefone (formato: (XX) XXXXX-XXXX)
 */
function validatePhone(phone) {
    const phoneRegex = /^\(?[0-9]{2}\)?[0-9]{4,5}-?[0-9]{4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Formata telefone automaticamente
 */
function formatPhone(phone) {
    phone = phone.replace(/[^\d]/g, '');
    phone = phone.substring(0, 11);
    
    if (phone.length <= 2) return phone;
    if (phone.length <= 6) return '(' + phone.substring(0, 2) + ') ' + phone.substring(2);
    if (phone.length <= 10) return '(' + phone.substring(0, 2) + ') ' + phone.substring(2, 7) + '-' + phone.substring(7);
    
    return '(' + phone.substring(0, 2) + ') ' + phone.substring(2, 7) + '-' + phone.substring(7, 11);
}

/**
 * Valida data (formato DD/MM/YYYY ou YYYY-MM-DD)
 */
function validateDate(dateStr) {
    let date;
    
    if (dateStr.includes('-')) {
        // Formato YYYY-MM-DD
        date = new Date(dateStr);
    } else {
        // Formato DD/MM/YYYY
        const parts = dateStr.split('/');
        if (parts.length !== 3) return false;
        date = new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    return date instanceof Date && !isNaN(date);
}

/**
 * Valida matricula (formato: ALF-0001 ou alfanumérico)
 */
function validateMatricula(matricula) {
    return matricula.length >= 3 && matricula.length <= 20;
}

/**
 * Valida campo obrigatório
 */
function validateRequired(value, fieldName = 'Campo') {
    if (!value || value.trim() === '') {
        return {
            valid: false,
            message: `${fieldName} é obrigatório`
        };
    }
    return { valid: true };
}

/**
 * Valida comprimento mínimo/máximo
 */
function validateLength(value, min, max, fieldName = 'Campo') {
    if (value.length < min || value.length > max) {
        return {
            valid: false,
            message: `${fieldName} deve ter entre ${min} e ${max} caracteres`
        };
    }
    return { valid: true };
}

/**
 * Executa validação em tempo real com feedback visual
 */
function setupRealtimeValidation(input, validatorFn, errorMessage = '') {
    const showError = (message) => {
        input.style.borderColor = '#e74c3c';
        input.style.background = '#fadbd8';
        
        let error = input.nextElementSibling;
        if (!error || !error.classList.contains('validation-error')) {
            error = document.createElement('small');
            error.classList.add('validation-error');
            error.style.color = '#e74c3c';
            error.style.display = 'block';
            error.style.marginTop = '4px';
            error.style.fontWeight = 'bold';
            input.parentElement.appendChild(error);
        }
        error.textContent = message;
    };
    
    const clearError = () => {
        input.style.borderColor = '#2px solid #e0e0e0';
        input.style.background = '#fff';
        
        const error = input.nextElementSibling;
        if (error && error.classList.contains('validation-error')) {
            error.remove();
        }
    };
    
    input.addEventListener('blur', () => {
        const result = validatorFn(input.value);
        if (!result.valid) {
            showError(result.message || errorMessage);
        } else {
            clearError();
        }
    });
    
    input.addEventListener('input', () => {
        const error = input.nextElementSibling;
        if (error && error.classList.contains('validation-error')) {
            clearError();
        }
    });
}

/**
 * Valida formulário inteiro
 */
function validateForm(formInputs) {
    let isValid = true;
    const errors = [];
    
    formInputs.forEach(input => {
        // Verificar obrigatório
        if (input.required && (!input.value || input.value.trim() === '')) {
            isValid = false;
            errors.push(`${input.placeholder || input.name || 'Campo'} é obrigatório`);
            input.style.borderColor = '#e74c3c';
        } else {
            input.style.borderColor = '';
        }
        
        // Validar CPF
        if (input.type === 'text' && input.placeholder && input.placeholder.includes('CPF')) {
            if (input.value && !validateCPF(input.value)) {
                isValid = false;
                errors.push('CPF inválido');
                input.style.borderColor = '#e74c3c';
            }
        }
        
        // Validar Email
        if (input.type === 'email' || (input.placeholder && input.placeholder.includes('email'))) {
            if (input.value && !validateEmail(input.value)) {
                isValid = false;
                errors.push('Email inválido');
                input.style.borderColor = '#e74c3c';
            }
        }
        
        // Validar Telefone
        if (input.type === 'tel' || (input.placeholder && input.placeholder.includes('Telefone'))) {
            if (input.value && !validatePhone(input.value)) {
                isValid = false;
                errors.push('Telefone inválido');
                input.style.borderColor = '#e74c3c';
            }
        }
    });
    
    if (!isValid && errors.length > 0) {
        showToast(`❌ ${errors[0]}`, 'error');
    }
    
    return isValid;
}

/**
 * Inicializa validações globais
 */
function initValidationSystem() {
    // Auto-format CPF
    document.querySelectorAll('input[placeholder*="CPF"]').forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = formatCPF(e.target.value);
        });
        
        setupRealtimeValidation(
            input,
            (value) => ({ valid: !value || validateCPF(value), message: 'CPF inválido' })
        );
    });
    
    // Auto-format Telefone
    document.querySelectorAll('input[placeholder*="Telefone"]').forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = formatPhone(e.target.value);
        });
        
        setupRealtimeValidation(
            input,
            (value) => ({ valid: !value || validatePhone(value), message: 'Telefone inválido' })
        );
    });
    
    // Validar Email
    document.querySelectorAll('input[type="email"], input[placeholder*="email"]').forEach(input => {
        setupRealtimeValidation(
            input,
            (value) => ({ valid: !value || validateEmail(value), message: 'Email inválido' })
        );
    });
    
    console.log('✅ Sistema de validações ativado');
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initValidationSystem, 300);
});

// Re-inicializar ao adicionar novos formulários dinamicamente
const observer = new MutationObserver(() => {
    initValidationSystem();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
