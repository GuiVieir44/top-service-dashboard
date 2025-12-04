// ==========================================
// SISTEMA DE NOTIFICAÇÕES (TOAST) - TOP SERVICE
// ==========================================

// Criar container de toasts se não existir
function initToastContainer() {
    if (!document.getElementById('toast-container')) {
        var container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;pointer-events:none;';
        document.body.appendChild(container);
    }
}

// Garantir que o container seja criado quando o DOM estiver pronto
if (document.body) {
    initToastContainer();
} else {
    document.addEventListener('DOMContentLoaded', initToastContainer);
}

/**
 * Exibe uma notificação toast
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duração em ms (padrão: 2000 ms - reduzido)
 */
function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 2000;  // Reduzido de 3000 para 2000ms
    
    // Garantir que o container existe
    if (!document.getElementById('toast-container')) {
        initToastContainer();
    }
    
    // Garantir que os estilos existem
    if (!document.getElementById('toast-styles')) {
        ensureToastStyles();
    }

    var container = document.getElementById('toast-container');
    if (!container) {
        console.warn('Toast container não encontrado');
        alert(message);
        return;
    }

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    // Define cores e ícones por tipo
    var colors = {
        'success': { bg: '#27ae60', icon: '✓', border: '#229954' },
        'error': { bg: '#e74c3c', icon: '✕', border: '#c0392b' },
        'warning': { bg: '#f39c12', icon: '⚠', border: '#d68910' },
        'info': { bg: '#3498db', icon: 'ℹ', border: '#2980b9' }
    };
    var color = colors[type] || colors['info'];

    toast.style.cssText = `
        background: ${color.bg};
        border-left: 4px solid ${color.border};
        color: white;
        padding: 14px 20px;
        border-radius: 6px;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
        pointer-events: auto;
        cursor: pointer;
    `;

    toast.innerHTML = `
        <span style="font-weight:bold;font-size:18px;">${color.icon}</span>
        <span style="flex:1;">${message}</span>
    `;

    // Remover ao clicar
    toast.onclick = function() {
        removeToast(toast);
    };

    container.appendChild(toast);

    // Auto-remover após duration
    setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
    toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
}

// Adicionar CSS animations ao documento quando for usado
function ensureToastStyles() {
    if (!document.getElementById('toast-styles')) {
        var style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }

            .toast {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.4;
            }
        `;
        document.head.appendChild(style);
    }
}

// Garantir que os estilos sejam adicionados quando necessário
if (document.head) {
    ensureToastStyles();
} else {
    document.addEventListener('DOMContentLoaded', ensureToastStyles);
}
