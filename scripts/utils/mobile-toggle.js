/* ===== SISTEMA DE TOGGLE MOBILE ===== */

/**
 * Inicializa o sistema de toggle da sidebar para mobile
 */
function initMobileToggle() {
    const toggleBtn = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (!toggleBtn || !sidebar) return;
    
    // Botão de toggle
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        updateToggleButtonState();
    });
    
    // Fechar sidebar ao clicar em um link de navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            // Fechar sidebar em mobile após navegação
            if (window.innerWidth <= 768) {
                sidebar.classList.add('collapsed');
                updateToggleButtonState();
            }
        });
    });
    
    // Fechar sidebar ao redimensionar para desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('collapsed');
        }
    });
    
    updateToggleButtonState();
}

/**
 * Atualiza o estado visual do botão de toggle
 */
function updateToggleButtonState() {
    const toggleBtn = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (!toggleBtn || !sidebar) return;
    
    // Alternar ícone entre hamburger e X
    if (sidebar.classList.contains('collapsed')) {
        toggleBtn.textContent = '☰'; // Hamburger quando collapsed
    } else {
        toggleBtn.textContent = '✕'; // X quando aberto
    }
}

/**
 * Inicializa suporte para horizontal scroll em tabelas mobile
 */
function initTableScroll() {
    const tables = document.querySelectorAll('.table');
    
    tables.forEach(table => {
        // Apenas envolver em container de scroll se não tiver já
        if (table.parentElement.style.overflowX !== 'auto') {
            const wrapper = document.createElement('div');
            wrapper.style.overflowX = 'auto';
            wrapper.style.overflowY = 'hidden';
            wrapper.style.webkitOverflowScrolling = 'touch';
            wrapper.style.marginBottom = '20px';
            
            table.parentElement.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

/**
 * Aplicar mobile-friendly classes dinamicamente
 */
function applyMobileOptimizations() {
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-view');
    } else {
        document.body.classList.remove('mobile-view');
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initMobileToggle();
    applyMobileOptimizations();
    
    // Re-inicializar ao redimensionar
    window.addEventListener('resize', () => {
        applyMobileOptimizations();
        initTableScroll();
    });
});

// Re-inicializar tabelas quando novo conteúdo for adicionado
const observeTableChanges = () => {
    const observer = new MutationObserver(() => {
        initTableScroll();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

document.addEventListener('DOMContentLoaded', observeTableChanges);
