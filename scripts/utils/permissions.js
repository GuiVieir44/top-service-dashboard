// ==========================================
// SISTEMA DE PERMISSÕES - TOP SERVICE
// ==========================================

console.log('🔐 Sistema de permissões carregado');

/**
 * Obtém a sessão atual do usuário
 * @returns {Object|null}
 */
function getCurrentSession() {
    try {
        const sessionData = localStorage.getItem('topservice_session_v1');
        if (!sessionData) return null;
        return JSON.parse(sessionData);
    } catch (e) {
        console.error('Erro ao obter sessão:', e);
        return null;
    }
}

/**
 * Verifica se o usuário atual tem permissão para acessar um recurso
 * @param {string} resource - Nome do recurso (funcionarios, usuarios, etc)
 * @returns {boolean}
 */
function hasPermission(resource) {
    const session = getCurrentSession();
    if (!session) return false;
    
    // Admin tem acesso a tudo
    if (session.role === 'admin') return true;
    
    // Usuários normais têm acesso limitado
    const userResources = [
        'dashboard',
        'ponto',
        'manual',
        'relatorios', // apenas seus próprios dados
        'configuracoes' // apenas suas preferências
    ];
    
    return userResources.includes(resource);
}

/**
 * Restringe o menu de navegação baseado nas permissões do usuário
 */
function applyNavRestrictions() {
    const session = getCurrentSession();
    if (!session) return;
    
    const restrictedPages = ['funcionarios', 'usuarios', 'departamentos', 'afastamentos'];
    
    restrictedPages.forEach(page => {
        const navItem = document.querySelector(`[data-page="${page}"]`);
        if (navItem) {
            if (session.role === 'admin') {
                navItem.style.display = 'flex';
            } else {
                navItem.style.display = 'none';
            }
        }
    });
}

/**
 * Filtra dados baseado nas permissões do usuário
 */
function filterDataByRole(data, role, userEmployeeId = null) {
    if (role === 'admin') return data;
    
    // Usuário normal vê apenas seus dados
    if (userEmployeeId && Array.isArray(data)) {
        return data.filter(item => item.employeeId === userEmployeeId || item.id === userEmployeeId);
    }
    
    return data;
}

/**
 * Restringe acesso a uma página
 */
function restrictPageAccess(pageId) {
    const session = getCurrentSession();
    if (!session) {
        // If the user is trying to access the login page, allow it (no redirect)
        if (pageId === 'usuarios') return true;

        // Redirecionar para login quando não autenticado
        try {
            if (window && window.navigationSystem) window.navigationSystem.showPage('usuarios');
        } catch (e) { /* silent */ }
        return false;
    }
    
    if (!hasPermission(pageId)) {
        showToast('❌ Você não tem permissão para acessar este recurso', 'error');
        window.navigationSystem.showPage('dashboard');
        return false;
    }
    
    return true;
}

/**
 * Mostra um banner informando o perfil do usuário
 */
function showRoleIndicator() {
    const session = getCurrentSession();
    if (!session) return;
    
    const roleColors = {
        'admin': 'linear-gradient(135deg, var(--dourado) 0%, var(--dourado-escuro) 100%)',
        'user': '#3498db'
    };
    
    const roleIcons = {
        'admin': '👨‍💼',
        'user': '👤'
    };
    
    const userDetails = document.querySelector('.user-details');
    if (userDetails) {
        const badge = document.createElement('span');
        badge.style.display = 'inline-block';
        badge.style.marginTop = '5px';
        badge.style.padding = '4px 8px';
        badge.style.background = roleColors[session.role];
        badge.style.color = session.role === 'admin' ? '#000' : '#fff';
        badge.style.borderRadius = '4px';
        badge.style.fontSize = '0.75rem';
        badge.style.fontWeight = 'bold';
        badge.innerHTML = `${roleIcons[session.role]} ${session.role === 'admin' ? 'Administrador' : 'Usuário'}`;
        
        // Remover badge antigo se existir
        const oldBadge = userDetails.querySelector('span[style*="display: inline-block"]');
        if (oldBadge) oldBadge.remove();
        
        userDetails.appendChild(badge);
    }
}

/**
 * Inicializa o sistema de permissões
 */
function initPermissionsSystem() {
    applyNavRestrictions();
    showRoleIndicator();
    
    console.log('✅ Sistema de permissões ativado');
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initPermissionsSystem();
});

// Re-aplicar restrições após login/logout
window.addEventListener('storage', () => {
    initPermissionsSystem();
});
