// ==========================================
// SISTEMA DE NOTIFICAÇÕES - TOP SERVICE
// ==========================================

console.log('🔔 Notificações: Sistema carregado');

/**
 * Registra uma notificação no sistema
 */
function logNotification(message, type = 'info', actionData = null) {
    const newNotification = {
        id: 'notif_' + Date.now(),
        message: message,
        type: type,
        timestamp: new Date().toISOString(),
        read: false,
        action: actionData
    };

    if (window.supabaseRealtime && window.supabaseRealtime.insert) {
        window.supabaseRealtime.insert('notifications', newNotification)
            .catch(err => console.error('Erro ao logar notificação no Supabase:', err));
    } else {
        // Fallback removido
        console.error('Supabase não disponível. Notificação não registrada.');
    }
    
    updateNotificationBadge();
    return newNotification;
}

/**
 * Obtém todas as notificações
 */
function getNotifications(unreadOnly = false) {
    let notifications = (window.supabaseRealtime && window.supabaseRealtime.data.notifications) || [];
    
    if (unreadOnly) {
        notifications = notifications.filter(n => !n.read);
    }
    
    return notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Marca uma notificação como lida
 */
function markNotificationAsRead(id) {
    if (window.supabaseRealtime && window.supabaseRealtime.update) {
        window.supabaseRealtime.update('notifications', id, { read: true })
            .catch(err => console.error('Erro ao marcar notificação como lida no Supabase:', err));
    } else {
        // Fallback removido
        console.error('Supabase não disponível. Não foi possível marcar como lida.');
    }
}

async function marcarTodasComoLidas(modalId) {
    const unreadNotifications = getNotifications(true);
    if (unreadNotifications.length === 0) return;

    if (window.supabaseRealtime && window.supabaseRealtime.update) {
        const updates = unreadNotifications.map(n => 
            window.supabaseRealtime.update('notifications', n.id, { read: true })
        );
        await Promise.all(updates).catch(err => console.error("Erro ao marcar todas como lidas:", err));
    } else {
        // Fallback removido
        console.error('Supabase não disponível. Não foi possível marcar todas como lidas.');
    }

    if (modalId && document.getElementById(modalId)) {
        document.getElementById(modalId).remove();
    }
    showNotificationsCenter(1);
}   // Recarregar o modal
    if (modalId) {
async function clearReadNotifications() {
    const readNotifications = getNotifications().filter(n => n.read);
    if (readNotifications.length === 0) return;

    if (window.supabaseRealtime && window.supabaseRealtime.remove) {
        const deletions = readNotifications.map(n => 
            window.supabaseRealtime.remove('notifications', n.id)
        );
        await Promise.all(deletions).catch(err => console.error("Erro ao limpar notificações lidas:", err));
    } else {
        // Fallback removido
        console.error('Supabase não disponível. Não foi possível limpar notificações.');
    }
}

/**
 * Verifica e gera notificações automáticas
 */
function checkAndGenerateNotifications() {
    const employees = (window.supabaseRealtime && window.supabaseRealtime.data.employees) || [];
    const punches = (window.supabaseRealtime && window.supabaseRealtime.data.punches) || [];
    const afastamentos = (window.supabaseRealtime && window.supabaseRealtime.data.afastamentos) || [];
    
    // Notificação 1: Funcionários sem ponto hoje
    const today = new Date().toISOString().split('T')[0];
    const todayPunches = punches.filter(p => p.timestamp.split('T')[0] === today);
    const employeesWithPunch = new Set(todayPunches.map(p => p.employeeId));
    const employeesWithoutPunch = employees.filter(e => e.status === 'Ativo' && !employeesWithPunch.has(e.id));
    
    if (employeesWithoutPunch.length > 0) {
        logNotification(
            `${employeesWithoutPunch.length} funcionário(s) sem ponto registrado hoje`,
            'warning',
            { page: 'ponto', label: 'Registrar Ponto' }
        );
    }
    
    // Notificação 2: Afastamentos próximos
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingAbsences = afastamentos.filter(a => {
        const startDate = new Date(a.dataInicio || a.start);
        return startDate >= new Date() && startDate <= nextWeek;
    });
    
    if (upcomingAbsences.length > 0) {
        logNotification(
            `${upcomingAbsences.length} afastamento(s) agendado(s) para a próxima semana`,
            'info',
            { page: 'afastamentos', label: 'Ver Afastamentos' }
        );
    }
    
    // Notificação 3: Funcionários em afastamento
    const activeAbsences = afastamentos.filter(a => {
        const startDate = new Date(a.dataInicio || a.start);
        const endDate = new Date(a.dataFim || a.end);
        const today = new Date();
        return startDate <= today && today <= endDate;
    });
    
    if (activeAbsences.length > 0) {
        logNotification(
            `${activeAbsences.length} funcionário(s) em afastamento no momento`,
            'info',
            { page: 'afastamentos', label: 'Ver Afastamentos' }
        );
    }
}

/**
 * Mostra central de notificações com paginação
 */
function showNotificationsCenter(page = 1) {
    const notifications = getNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;
    const itemsPerPage = 10;
    const totalPages = Math.ceil(notifications.length / itemsPerPage);
    
    if (page < 1) page = 1;
    if (page > totalPages && totalPages > 0) page = totalPages;
    
    const startIndex = (page - 1) * itemsPerPage;
    const pageNotifications = notifications.slice(startIndex, startIndex + itemsPerPage);
    
    const modalId = 'notifications-modal-' + Date.now();
    
    let html = `
        <div id="${modalId}" class="modal-overlay" onclick="if(event.target === this) this.remove()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Notificações (${unreadCount} não lidas)</h2>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        ${unreadCount > 0 ? `<button class="btn btn-secondary" onclick="marcarTodasComoLidas('${modalId}')" style="font-size:0.85rem;padding:6px 12px;">✓ Marcar todas como lidas</button>` : ''}
                        <button class="modal-close-btn" onclick="document.getElementById('${modalId}').remove()">×</button>
                    </div>
                </div>
    `;
    
    if (notifications.length === 0) {
        html += `<p style="text-align: center; color: var(--text-tertiary); padding: 30px 0;">Nenhuma notificação</p>`;
    } else {
        pageNotifications.forEach(n => {
            const typeColors = {
                'info': '#3498db',
                'warning': '#f39c12',
                'error': '#e74c3c',
                'success': '#2ecc71'
            };
            
            const readStyle = n.read ? 'opacity: 0.6;' : 'font-weight: 600;';
            const timeStr = new Date(n.timestamp).toLocaleString('pt-BR');
            
            html += `
                <div class="notification-item" data-id="${n.id}" style="padding: 15px; border-left: 4px solid ${typeColors[n.type]}; background: var(--bg-tertiary); margin-bottom: 10px; border-radius: 6px; ${readStyle}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                        <div style="flex: 1;">
                            <p style="margin: 0 0 5px 0; color: var(--text-primary);">${n.message}</p>
                            <small style="color: var(--text-tertiary);">${timeStr}</small>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            ${n.action ? `<button class="btn btn-secondary" onclick="navegarParaNotificacao('${n.id}')" style="font-size:0.8rem;padding:4px 8px;white-space:nowrap;">Ir Para</button>` : ''}
                            <button class="btn ${n.read ? 'btn-ghost' : 'btn-primary'}" onclick="marcarComoLida('${n.id}', '${modalId}')" style="font-size:0.8rem;padding:4px 8px;white-space:nowrap;">${n.read ? 'Lida' : 'Marcar'}</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    if (totalPages > 1) {
        html += `
            <div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin: 20px 0; border-top: 1px solid var(--border-color); padding-top: 15px;">
                <button ${page === 1 ? 'disabled' : ''} onclick="showNotificationsCenter(${page - 1})" class="btn btn-secondary" style="padding: 6px 12px;">← Anterior</button>
                <span style="color: var(--text-primary); font-weight: 600;">Página ${page} de ${totalPages}</span>
                <button ${page === totalPages ? 'disabled' : ''} onclick="showNotificationsCenter(${page + 1})" class="btn btn-secondary" style="padding: 6px 12px;">Próximo →</button>
            </div>
        `;
    }
    
    html += `
                <div style="display: flex; gap: 10px; margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                    <button class="btn btn-primary" onclick="limparNotificacoesLidas()" style="flex: 1;">Limpar Lidas</button>
                    <button class="btn btn-ghost" onclick="document.getElementById('${modalId}').remove()" style="flex: 1;">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    const oldModals = document.querySelectorAll('[id^="notifications-modal-"]');
    oldModals.forEach(m => m.remove());
    
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
}

/**
 * Marca notificação como lida
 */
function marcarComoLida(notificationId, modalId = null) {
    markNotificationAsRead(notificationId);
    updateNotificationBadge();
    
    if (modalId && document.getElementById(modalId)) {
        const pageMatch = modalId.match(/page-(\d+)/);
        const page = pageMatch ? parseInt(pageMatch[1]) : 1;
        document.getElementById(modalId).remove();
        showNotificationsCenter(page);
    } else {
        showNotificationsCenter(1);
    }
}

/**
 * Limpa notificações lidas
 */
function limparNotificacoesLidas() {
    clearReadNotifications()
        .then(() => showNotificationsCenter(1))
        .catch(err => console.error("Erro ao limpar notificações:", err));
}

/**
 * Navega para ação da notificação
 */
function navegarParaNotificacao(notificationId) {
    const notifications = getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification || !notification.action) {
        return;
    }
    
    const modals = document.querySelectorAll('[id^="notifications-modal-"]');
    modals.forEach(m => m.remove());
    
    markNotificationAsRead(notificationId);
    
    const action = notification.action;
    
    if (typeof window.navigationSystem !== 'undefined' && action.page) {
        window.navigationSystem.showPage(action.page, action.params || {});
    }
}

/**
 * Atualiza badge de notificações
 */
function updateNotificationBadge() {
    const unreadCount = getNotifications(true).length;
    
    const oldBadge = document.getElementById('notification-badge');
    if (oldBadge) oldBadge.remove();
    
    if (unreadCount > 0) {
        const badge = document.createElement('span');
        badge.id = 'notification-badge';
        badge.style.position = 'fixed';
        badge.style.bottom = '75px';
        badge.style.right = '15px';
        badge.style.background = '#e74c3c';
        badge.style.color = 'white';
        badge.style.padding = '4px 8px';
        badge.style.borderRadius = '50%';
        badge.style.fontSize = '0.75rem';
        badge.style.fontWeight = 'bold';
        badge.style.minWidth = '24px';
        badge.style.height = '24px';
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.style.zIndex = '10000';
        badge.innerHTML = unreadCount > 9 ? '9+' : unreadCount;
        document.body.appendChild(badge);
    }
}

/**
 * Cria botão de notificações
 */
function createNotificationButton() {
    if (document.getElementById('notification-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'notification-btn';
    
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.93 6 11v5l-2 2v1h16v-1l-2-2z"/>
    </svg>`;
    
    btn.style.position = 'fixed';
    btn.style.bottom = '30px';
    btn.style.right = '30px';
    btn.style.width = '60px';
    btn.style.height = '60px';
    btn.style.borderRadius = '50%';
    btn.style.background = 'linear-gradient(135deg, var(--dourado) 0%, var(--dourado-escuro) 100%)';
    btn.style.border = 'none';
    btn.style.outline = 'none';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    btn.style.transition = 'all 0.3s ease';
    btn.style.zIndex = '9999';
    btn.style.padding = '0';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.appearance = 'none';
    btn.style.webkitAppearance = 'none';
    btn.style.color = '#1a1a1a';
    
    btn.onclick = function() {
        showNotificationsCenter(1);
    };
    
    btn.addEventListener('mouseover', () => {
        btn.style.transform = 'scale(1.1)';
    });
    
    btn.addEventListener('mouseout', () => {
        btn.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(btn);
    console.log('✅ Botão de notificações criado');
}

/**
 * Inicializa sistema de notificações
 */
function initNotificationsSystem() {
function initNotificationsSystem() {
    console.log('🔔 Iniciando sistema de notificações...');
    try {
        createNotificationButton();
        updateNotificationBadge();
        
        // Listen for real-time updates
        window.addEventListener('notifications-updated', updateNotificationBadge);

        // Check for new notifications periodically
        setInterval(() => {
            checkAndGenerateNotifications();
        }, 5 * 60 * 1000);
        
        console.log('✅ Sistema de notificações ativado');
    } catch (e) {
        console.error('❌ Erro ao inicializar notificações:', e);
    }
}
// Inicializa quando document estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotificationsSystem);
} else {
    initNotificationsSystem();
}

// Re-criar botão se desaparecer
setInterval(() => {
    if (!document.getElementById('notification-btn') && document.body) {
        console.log('🔔 Recriando botão de notificações...');
        createNotificationButton();
    }
}, 2000);
