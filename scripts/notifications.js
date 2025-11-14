// ==========================================
// SISTEMA DE NOTIFICAÇÕES - TOP SERVICE
// ==========================================

console.log('🔔 Sistema de notificações carregado');

/**
 * Registra uma notificação no sistema
 */
function logNotification(message, type = 'info') {
    const notifications = JSON.parse(localStorage.getItem('topservice_notifications_v1') || '[]');
    
    const notification = {
        id: Date.now(),
        message: message,
        type: type, // info, warning, error, success
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    // Manter apenas últimas 50 notificações
    if (notifications.length > 50) {
        notifications.pop();
    }
    
    localStorage.setItem('topservice_notifications_v1', JSON.stringify(notifications));
    return notification;
}

/**
 * Obtém todas as notificações
 */
function getNotifications(unreadOnly = false) {
    let notifications = JSON.parse(localStorage.getItem('topservice_notifications_v1') || '[]');
    
    if (unreadOnly) {
        notifications = notifications.filter(n => !n.read);
    }
    
    return notifications;
}

/**
 * Marca uma notificação como lida
 */
function markNotificationAsRead(id) {
    const notifications = JSON.parse(localStorage.getItem('topservice_notifications_v1') || '[]');
    const notification = notifications.find(n => n.id === id);
    
    if (notification) {
        notification.read = true;
        localStorage.setItem('topservice_notifications_v1', JSON.stringify(notifications));
    }
}

/**
 * Limpa todas as notificações lidas
 */
function clearReadNotifications() {
    let notifications = JSON.parse(localStorage.getItem('topservice_notifications_v1') || '[]');
    notifications = notifications.filter(n => !n.read);
    localStorage.setItem('topservice_notifications_v1', JSON.stringify(notifications));
}

/**
 * Verifica e gera notificações automáticas
 */
function checkAndGenerateNotifications() {
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const afastamentos = JSON.parse(localStorage.getItem('topservice_afastamentos_v1') || '[]');
    
    // Notificação 1: Funcionários sem ponto hoje
    const today = new Date().toISOString().split('T')[0];
    const todayPunches = punches.filter(p => p.timestamp.split('T')[0] === today);
    const employeesWithPunch = new Set(todayPunches.map(p => p.employeeId));
    const employeesWithoutPunch = employees.filter(e => e.status === 'Ativo' && !employeesWithPunch.has(e.id));
    
    if (employeesWithoutPunch.length > 0) {
        logNotification(
            `⚠️ ${employeesWithoutPunch.length} funcionário(s) sem ponto registrado hoje`,
            'warning'
        );
    }
    
    // Notificação 2: Afastamentos próximos (últimos 7 dias)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingAbsences = afastamentos.filter(a => {
        const startDate = new Date(a.dataInicio);
        return startDate >= new Date() && startDate <= nextWeek;
    });
    
    if (upcomingAbsences.length > 0) {
        logNotification(
            `🏖️ ${upcomingAbsences.length} afastamento(s) agendado(s) para a próxima semana`,
            'info'
        );
    }
    
    // Notificação 3: Funcionários em férias/afastamento
    const activeAbsences = afastamentos.filter(a => {
        const startDate = new Date(a.dataInicio);
        const endDate = new Date(a.dataFim);
        const today = new Date();
        return startDate <= today && today <= endDate;
    });
    
    if (activeAbsences.length > 0) {
        logNotification(
            `👤 ${activeAbsences.length} funcionário(s) em afastamento no momento`,
            'info'
        );
    }
}

/**
 * Mostra central de notificações em um modal
 */
function showNotificationsCenter() {
    const notifications = getNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;
    
    let html = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
            <div style="background: white; border-radius: 12px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid var(--dourado);">
                    <h3 style="margin: 0; color: var(--preto);">🔔 Notificações (${unreadCount})</h3>
                    <button onclick="document.querySelector('[style*=position: fixed]').remove()" style="background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">✕</button>
                </div>
    `;
    
    if (notifications.length === 0) {
        html += `<p style="text-align: center; color: #999; padding: 30px 0;">Nenhuma notificação</p>`;
    } else {
        notifications.forEach(n => {
            const typeColors = {
                'info': '#3498db',
                'warning': '#f39c12',
                'error': '#e74c3c',
                'success': '#2ecc71'
            };
            
            const readStyle = n.read ? 'opacity: 0.6;' : 'font-weight: bold;';
            
            html += `
                <div style="padding: 15px; border-left: 4px solid ${typeColors[n.type]}; background: #f5f5f5; margin-bottom: 10px; border-radius: 6px; ${readStyle}">
                    <p style="margin: 0 0 5px 0; color: var(--preto);">${n.message}</p>
                    <small style="color: #999;">${new Date(n.timestamp).toLocaleString('pt-BR')}</small>
                </div>
            `;
        });
    }
    
    html += `
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button onclick="clearReadNotifications(); showToast('✅ Notificações lidas apagadas', 'success'); document.querySelector('[style*=position: fixed]').remove();" style="flex: 1; background: var(--dourado); color: black; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold;">🗑️ Limpar Lidas</button>
                    <button onclick="document.querySelector('[style*=position: fixed]').remove()" style="flex: 1; background: #999; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold;">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
}

/**
 * Mostra badge com contagem de notificações não lidas
 */
function updateNotificationBadge() {
    const unreadCount = getNotifications(true).length;
    
    // Remover badge antigo
    const oldBadge = document.getElementById('notification-badge');
    if (oldBadge) oldBadge.remove();
    
    if (unreadCount > 0) {
        const badge = document.createElement('span');
        badge.id = 'notification-badge';
        badge.style.position = 'fixed';
        badge.style.top = '70px';
        badge.style.right = '20px';
        badge.style.background = '#e74c3c';
        badge.style.color = 'white';
        badge.style.padding = '4px 8px';
        badge.style.borderRadius = '50%';
        badge.style.fontSize = '0.8rem';
        badge.style.fontWeight = 'bold';
        badge.style.minWidth = '20px';
        badge.style.textAlign = 'center';
        badge.innerHTML = unreadCount > 9 ? '9+' : unreadCount;
        document.body.appendChild(badge);
    }
}

/**
 * Cria botão flutuante para notificações
 */
function createNotificationButton() {
    if (document.getElementById('notification-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'notification-btn';
    btn.innerHTML = '🔔';
    btn.style.position = 'fixed';
    btn.style.bottom = '30px';
    btn.style.right = '30px';
    btn.style.width = '60px';
    btn.style.height = '60px';
    btn.style.borderRadius = '50%';
    btn.style.background = 'linear-gradient(135deg, var(--dourado) 0%, var(--dourado-escuro) 100%)';
    btn.style.border = '3px solid white';
    btn.style.color = 'black';
    btn.style.fontSize = '1.5rem';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    btn.style.transition = 'all 0.3s ease';
    btn.style.zIndex = '9999';
    
    btn.addEventListener('click', showNotificationsCenter);
    btn.addEventListener('mouseover', () => {
        btn.style.transform = 'scale(1.1)';
    });
    btn.addEventListener('mouseout', () => {
        btn.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(btn);
}

/**
 * Inicializa o sistema de notificações
 */
function initNotificationsSystem() {
    checkAndGenerateNotifications();
    createNotificationButton();
    updateNotificationBadge();
    
    // Atualizar a cada 5 minutos
    setInterval(() => {
        checkAndGenerateNotifications();
        updateNotificationBadge();
    }, 5 * 60 * 1000);
    
    console.log('✅ Sistema de notificações ativado');
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initNotificationsSystem, 500);
});
