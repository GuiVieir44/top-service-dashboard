// ==========================================
// SISTEMA DE TEMAS (ESCURO/CLARO) - TOP SERVICE
// ==========================================

console.log('Tema: Sistema carregado');

const THEME_KEY = 'topservice_theme_v1';

/**
 * Define o tema atual
 */
function setTheme(theme) {
    if (theme === 'escuro') {
        applyDarkTheme();
    } else if (theme === 'claro') {
        applyLightTheme();
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
    
    document.body.style.background = '#121212';
    document.body.style.color = '#E8E8E8';
    
    // Ajustar cards
    document.querySelectorAll('.metric-card, .status-card, .chart-container, .form-container').forEach(card => {
        card.style.background = '#1E1E1E';
        card.style.color = '#E8E8E8';
        card.style.borderColor = '#404040';
    });
    
    // Ajustar inputs
    document.querySelectorAll('.form-input, .form-select, .form-date').forEach(input => {
        input.style.background = '#2A2A2A';
        input.style.color = '#FFFFFF';
        input.style.borderColor = '#505050';
    });
    
    // Ajustar tabelas
    document.querySelectorAll('.table').forEach(table => {
        table.style.background = '#1E1E1E';
        table.style.color = '#E8E8E8';
    });
    
    document.querySelectorAll('.table thead').forEach(thead => {
        thead.style.background = '#2A2A2A';
        thead.style.color = '#FFFFFF';
    });
    
    document.querySelectorAll('.table tbody tr').forEach(tr => {
        tr.style.borderColor = '#303030';
        tr.style.color = '#E8E8E8';
    });
    
    // Ajustar modais
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.style.background = 'rgba(0, 0, 0, 0.7)';
    });
    
    document.querySelectorAll('.modal-content').forEach(modal => {
        modal.style.background = '#1E1E1E';
        modal.style.color = '#E8E8E8';
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
    
    document.body.style.background = '#F8F9FA';
    document.body.style.color = '#212121';
    
    // Ajustar cards
    document.querySelectorAll('.metric-card, .status-card, .chart-container, .form-container').forEach(card => {
        card.style.background = '#FFFFFF';
        card.style.color = '#212121';
        card.style.borderColor = '#E0E0E0';
    });
    
    // Ajustar inputs
    document.querySelectorAll('.form-input, .form-select, .form-date').forEach(input => {
        input.style.background = '#FFFFFF';
        input.style.color = '#212121';
        input.style.borderColor = '#BDBDBD';
    });
    
    // Ajustar tabelas
    document.querySelectorAll('.table').forEach(table => {
        table.style.background = '#FFFFFF';
        table.style.color = '#212121';
    });
    
    document.querySelectorAll('.table thead').forEach(thead => {
        thead.style.background = '#F5F5F5';
        thead.style.color = '#212121';
    });
    
    document.querySelectorAll('.table tbody tr').forEach(tr => {
        tr.style.borderColor = '#EEEEEE';
        tr.style.color = '#212121';
    });
    
    // Ajustar modais
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.style.background = 'rgba(0, 0, 0, 0.3)';
    });
    
    document.querySelectorAll('.modal-content').forEach(modal => {
        modal.style.background = '#FFFFFF';
        modal.style.color = '#212121';
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
    btn.style.fontSize = '1.4rem';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    btn.style.transition = 'all 0.3s ease';
    btn.style.zIndex = '9998';
    btn.style.fontWeight = 'bold';
    btn.title = 'Alternar tema';
    
    const currentTheme = getSavedTheme();
    const icons = { 'escuro': '◐', 'claro': '◑' };
    btn.innerHTML = icons[currentTheme];
    
    btn.addEventListener('click', () => {
        const current = getSavedTheme();
        const next = current === 'escuro' ? 'claro' : 'escuro';
        setTheme(next);
        
        const names = { 'escuro': 'Escuro', 'claro': 'Claro' };
        btn.innerHTML = icons[next];
        
        showToast(`Tema alterado para ${names[next]}`, 'success');
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
    console.log('✅ Tema: Sistema ativado');
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initThemeSystem, 100);
});
