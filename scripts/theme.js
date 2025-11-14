// ==========================================
// SISTEMA DE TEMAS (ESCURO/CLARO) - TOP SERVICE
// ==========================================

console.log('🎨 Sistema de temas carregado');

const THEME_KEY = 'topservice_theme_v1';

/**
 * Define o tema atual
 */
function setTheme(theme) {
    if (theme === 'escuro') {
        applyDarkTheme();
    } else if (theme === 'claro') {
        applyLightTheme();
    } else if (theme === 'auto') {
        applyAutoTheme();
    }
    
    localStorage.setItem(THEME_KEY, theme);
}

/**
 * Obtém o tema salvo
 */
function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || 'escuro';
}

/**
 * Aplica tema escuro
 */
function applyDarkTheme() {
    document.documentElement.style.setProperty('--preto', '#1A1A1A');
    document.documentElement.style.setProperty('--branco', '#FFFFFF');
    document.documentElement.style.setProperty('--cinza-escuro', '#0D0D0D');
    document.documentElement.style.setProperty('--cinza-medio', '#2A2A2A');
    document.documentElement.style.setProperty('--cinza-claro', '#3A3A3A');
    
    document.body.style.background = '#1A1A1A';
    document.body.style.color = '#FFFFFF';
    
    // Ajustar cards
    document.querySelectorAll('.metric-card, .status-card, .chart-container, .form-container').forEach(card => {
        card.style.background = '#2A2A2A';
        card.style.color = '#FFFFFF';
        card.style.borderColor = 'var(--dourado)';
    });
    
    // Ajustar inputs
    document.querySelectorAll('.form-input, .form-select, .form-date').forEach(input => {
        input.style.background = '#3A3A3A';
        input.style.color = '#FFFFFF';
        input.style.borderColor = '#555';
    });
    
    // Ajustar tabelas
    document.querySelectorAll('.table').forEach(table => {
        table.style.background = '#2A2A2A';
        table.style.color = '#FFFFFF';
    });
    
    document.querySelectorAll('.table thead').forEach(thead => {
        thead.style.background = '#1A1A1A';
    });
    
    document.querySelectorAll('.table tbody tr').forEach(tr => {
        tr.style.borderColor = '#3A3A3A';
    });
    
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
}

/**
 * Aplica tema claro
 */
function applyLightTheme() {
    document.documentElement.style.setProperty('--preto', '#000000');
    document.documentElement.style.setProperty('--branco', '#FFFFFF');
    document.documentElement.style.setProperty('--cinza-escuro', '#F5F5F5');
    document.documentElement.style.setProperty('--cinza-medio', '#EEEEEE');
    document.documentElement.style.setProperty('--cinza-claro', '#F9F9F9');
    
    document.body.style.background = '#FFFFFF';
    document.body.style.color = '#000000';
    
    // Ajustar cards
    document.querySelectorAll('.metric-card, .status-card, .chart-container, .form-container').forEach(card => {
        card.style.background = '#FFFFFF';
        card.style.color = '#000000';
        card.style.borderColor = 'var(--dourado)';
    });
    
    // Ajustar inputs
    document.querySelectorAll('.form-input, .form-select, .form-date').forEach(input => {
        input.style.background = '#F5F5F5';
        input.style.color = '#000000';
        input.style.borderColor = '#DDD';
    });
    
    // Ajustar tabelas
    document.querySelectorAll('.table').forEach(table => {
        table.style.background = '#FFFFFF';
        table.style.color = '#000000';
    });
    
    document.querySelectorAll('.table thead').forEach(thead => {
        thead.style.background = '#F5F5F5';
    });
    
    document.querySelectorAll('.table tbody tr').forEach(tr => {
        tr.style.borderColor = '#EEEEEE';
    });
    
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
}

/**
 * Aplica tema automático (baseado na preferência do sistema)
 */
function applyAutoTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyDarkTheme();
    } else {
        applyLightTheme();
    }
    
    // Escutar mudanças do sistema
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (getSavedTheme() === 'auto') {
                e.matches ? applyDarkTheme() : applyLightTheme();
            }
        });
    }
}

/**
 * Cria botão flutuante de toggle de tema
 */
function createThemeToggleButton() {
    if (document.getElementById('theme-toggle-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'theme-toggle-btn';
    btn.style.position = 'fixed';
    btn.style.bottom = '100px';
    btn.style.right = '30px';
    btn.style.width = '50px';
    btn.style.height = '50px';
    btn.style.borderRadius = '50%';
    btn.style.background = 'linear-gradient(135deg, var(--dourado) 0%, var(--dourado-escuro) 100%)';
    btn.style.border = 'none';
    btn.style.color = 'black';
    btn.style.fontSize = '1.2rem';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    btn.style.transition = 'all 0.3s ease';
    btn.style.zIndex = '9998';
    btn.title = 'Alternar tema';
    
    const currentTheme = getSavedTheme();
    btn.innerHTML = currentTheme === 'escuro' ? '☀️' : (currentTheme === 'claro' ? '🌙' : '🔄');
    
    btn.addEventListener('click', () => {
        const current = getSavedTheme();
        const next = current === 'escuro' ? 'claro' : (current === 'claro' ? 'auto' : 'escuro');
        setTheme(next);
        
        const icons = { 'escuro': '☀️', 'claro': '🌙', 'auto': '🔄' };
        btn.innerHTML = icons[next];
        
        showToast(`🎨 Tema alterado para ${next}`, 'success');
    });
    
    btn.addEventListener('mouseover', () => {
        btn.style.transform = 'scale(1.1)';
    });
    btn.addEventListener('mouseout', () => {
        btn.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(btn);
}

/**
 * Inicializa o sistema de temas
 */
function initThemeSystem() {
    const savedTheme = getSavedTheme();
    setTheme(savedTheme);
    createThemeToggleButton();
    console.log('✅ Sistema de temas ativado');
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initThemeSystem, 100);
});
