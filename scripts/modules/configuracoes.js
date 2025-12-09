// ==========================================
// MÓDULO DE CONFIGURAÇÕES - TOP SERVICE
// ==========================================

console.log('⚙️ Módulo de configurações carregado');

const SETTINGS_KEY = 'topservice_settings_v1';

/**
 * Configurações padrão do sistema
 */
const defaultSettings = {
    tema: 'escuro',
    idioma: 'pt-BR',
    notificacoes: true,
    autoSalvar: true,
    horaExpediente: '09:00',
    minutoExpediente: '18:00',
    diasSemana: 5,
    dataUltimoBackup: null,
    mostrarDicas: true,
};

/**
 * Carrega as configurações do localStorage
 */
function loadSettings() {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) return JSON.parse(stored);
        saveSettings(defaultSettings);
        return defaultSettings;
    } catch (e) {
        console.error('❌ Erro ao carregar configurações:', e);
        return defaultSettings;
    }
}

/**
 * Salva as configurações no localStorage
 */
function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        return true;
    } catch (e) {
        console.error('❌ Erro ao salvar configurações:', e);
        return false;
    }
}

/**
 * Atualiza uma configuração específica
 */
function updateSetting(key, value) {
    const settings = loadSettings();
    settings[key] = value;
    const saved = saveSettings(settings);
    if (saved) {
        showToast(`⚙️ Configuração "${key}" atualizada`, 'success');
    }
    return saved;
}

/**
 * Exporta todos os dados para backup em JSON
 */
function exportDataBackup() {
    const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
            employees: JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]'),
            punches: JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]'),
            afastamentos: JSON.parse(localStorage.getItem('topservice_afastamentos_v1') || '[]'),
            users: JSON.parse(localStorage.getItem('topservice_users_v1') || '[]'),
            departamentos: JSON.parse(localStorage.getItem('topservice_departamentos_v1') || '[]'),
            settings: loadSettings(),
        }
    };

    // Criar arquivo JSON e fazer download
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top-service-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    // Atualizar data do último backup
    const settings = loadSettings();
    settings.dataUltimoBackup = new Date().toLocaleString('pt-BR');
    saveSettings(settings);

    showToast('✅ Backup exportado com sucesso!', 'success');
}

/**
 * Importa dados de um backup JSON
 */
function importDataBackup(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            // Validar estrutura do backup
            if (!backup.data) {
                showToast('❌ Formato de backup inválido', 'error');
                return;
            }

            // Importar dados
            if (backup.data.employees) {
                localStorage.setItem('topservice_employees_v1', JSON.stringify(backup.data.employees));
            }
            if (backup.data.punches) {
                localStorage.setItem('topservice_punches_v1', JSON.stringify(backup.data.punches));
            }
            if (backup.data.afastamentos) {
                localStorage.setItem('topservice_afastamentos_v1', JSON.stringify(backup.data.afastamentos));
            }
            if (backup.data.users) {
                localStorage.setItem('topservice_users_v1', JSON.stringify(backup.data.users));
            }
            if (backup.data.departamentos) {
                localStorage.setItem('topservice_departamentos_v1', JSON.stringify(backup.data.departamentos));
            }
            if (backup.data.settings) {
                saveSettings(backup.data.settings);
            }

            showToast('✅ Backup importado com sucesso! Sistema será recarregado.', 'success');
            setTimeout(() => location.reload(), 1500);
        } catch (error) {
            console.error('❌ Erro ao importar backup:', error);
            showToast('❌ Erro ao importar backup', 'error');
        }
    };
    reader.readAsText(file);
}

/**
 * Limpa todos os dados do localStorage (com confirmação)
 */
function clearAllData() {
    const confirmed = confirm(
        '⚠️ ATENÇÃO!\n\n' +
        'Você está prestes a APAGAR TODOS OS DADOS do sistema.\n\n' +
        'Esta ação é irreversível e não pode ser desfeita!\n\n' +
        'Tem certeza que deseja continuar?'
    );

    if (confirmed) {
        const confirmAgain = confirm('Digite "DELETAR" para confirmar permanentemente:');
        if (confirmAgain) {
            localStorage.clear();
            showToast('🗑️ Todos os dados foram removidos. Sistema será reiniciado.', 'warning');
            setTimeout(() => location.reload(), 1500);
        }
    }
}

/**
 * Limpa dados antigos com critérios inteligentes
 * Prioriza limpeza de registros antigos
 */
function cleanupOldData() {
    try {
        const confirmed = confirm(
            '🧹 LIMPEZA DE DADOS ANTIGOS\n\n' +
            'Esta função vai remover:\n' +
            '- Pontos com mais de 1 ano\n' +
            '- Afastamentos finalizados\n' +
            '- Logs de erro\n\n' +
            'Continuar?'
        );

        if (!confirmed) return;

        let cleaned = 0;
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // Limpar punches antigos
        try {
            const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
            const filtered = punches.filter(p => new Date(p.timestamp) > oneYearAgo);
            if (filtered.length < punches.length) {
                localStorage.setItem('topservice_punches_v1', JSON.stringify(filtered));
                cleaned += (punches.length - filtered.length);
                console.log('🗑️ Removidos', punches.length - filtered.length, 'pontos antigos');
            }
        } catch(e) {
            console.error('Erro ao limpar punches:', e);
        }

        // Limpar afastamentos finalizados
        try {
            const afastamentos = JSON.parse(localStorage.getItem('topservice_afastamentos_v1') || '[]');
            const filtered = afastamentos.filter(a => new Date(a.end) > new Date());
            if (filtered.length < afastamentos.length) {
                localStorage.setItem('topservice_afastamentos_v1', JSON.stringify(filtered));
                cleaned += (afastamentos.length - filtered.length);
                console.log('🗑️ Removidos', afastamentos.length - filtered.length, 'afastamentos finalizados');
            }
        } catch(e) {
            console.error('Erro ao limpar afastamentos:', e);
        }

        const usage = window.getStorageUsage ? window.getStorageUsage() : null;
        if (usage) {
            showToast(
                `🧹 ${cleaned} registros removidos. Storage: ${usage.percent.toFixed(1)}%`,
                'success'
            );
        } else {
            showToast(`🧹 ${cleaned} registros removidos`, 'success');
        }
    } catch(e) {
        console.error('Erro durante limpeza:', e);
        showToast('❌ Erro ao limpar dados', 'error');
    }
}

/**
 * Mostra UI para gerenciar armazenamento
 */
function showStorageCleanupUI() {
    if (confirm('Seu armazenamento está cheio!\n\nDeseja:\n1. OK = Limpar dados antigos\n2. Cancelar = Não')) {
        cleanupOldData();
    }
}

/**
 * Obtém informações de uso de armazenamento
 */
function getStorageInfo() {
    const usage = window.getStorageUsage ? window.getStorageUsage() : { percent: 0, used: 0, limit: 5 * 1024 * 1024 };
    
    return {
        used: (usage.used / 1024 / 1024).toFixed(2) + ' MB',
        limit: (usage.limit / 1024 / 1024).toFixed(2) + ' MB',
        percent: usage.percent.toFixed(1) + '%',
        available: usage.available
    };
}

/**
 * Reseta as configurações para valores padrão
 */
function resetSettings() {
    const confirmed = confirm('Deseja realmente resetar as configurações para os padrões?');
    if (confirmed) {
        saveSettings(defaultSettings);
        initSettingsModule();
        showToast('✅ Configurações resetadas para padrão', 'success');
    }
}

/**
 * Obter informações do sistema
 */
function getSystemInfo() {
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]').length;
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]').length;
    const afastamentos = JSON.parse(localStorage.getItem('topservice_afastamentos_v1') || '[]').length;
    const users = JSON.parse(localStorage.getItem('topservice_users_v1') || '[]').length;
    const departamentos = JSON.parse(localStorage.getItem('topservice_departamentos_v1') || '[]').length;

    // Calcular tamanho do localStorage
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length;
        }
    }
    const sizeInKB = (totalSize / 1024).toFixed(2);

    return {
        employees,
        punches,
        afastamentos,
        users,
        departamentos,
        storageSize: sizeInKB
    };
}

/**
 * Inicializa o módulo de configurações
 */
function initSettingsModule() {
    const container = document.getElementById('settings-module-container');
    if (!container) {
        console.error('❌ Elemento settings-module-container não encontrado');
        return;
    }

    const settings = loadSettings();
    const systemInfo = getSystemInfo();

    let html = `
        <div class="form-container">
            <h2>⚙️ Configurações do Sistema</h2>

            <!-- SEÇÃO: PREFERÊNCIAS GERAIS -->
            <div class="form-section">
                <h3>🎨 Preferências Gerais</h3>
                
                <div class="form-group">
                    <div>
                        <label class="form-label">Tema</label>
                        <select id="setting-tema" class="form-input">
                            <option value="escuro" ${settings.tema === 'escuro' ? 'selected' : ''}>Escuro</option>
                            <option value="claro" ${settings.tema === 'claro' ? 'selected' : ''}>Claro</option>
                            <option value="auto" ${settings.tema === 'auto' ? 'selected' : ''}>Automático</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Idioma</label>
                        <select id="setting-idioma" class="form-input">
                            <option value="pt-BR" ${settings.idioma === 'pt-BR' ? 'selected' : ''}>Português (Brasil)</option>
                            <option value="en-US" ${settings.idioma === 'en-US' ? 'selected' : ''}>English (USA)</option>
                            <option value="es-ES" ${settings.idioma === 'es-ES' ? 'selected' : ''}>Español (España)</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <div>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="setting-notificacoes" ${settings.notificacoes ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Habilitar Notificações</span>
                        </label>
                    </div>
                    <div>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="setting-autoSalvar" ${settings.autoSalvar ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Auto-salvar dados</span>
                        </label>
                    </div>
                    <div>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="setting-mostrarDicas" ${settings.mostrarDicas ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Mostrar Dicas</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- SEÇÃO: HORÁRIO DE EXPEDIENTE -->
            <div class="form-section">
                <h3>🕒 Horário de Expediente</h3>
                
                <div class="form-group">
                    <div>
                        <label class="form-label">Entrada</label>
                        <input type="time" id="setting-horaExpediente" class="form-input" value="${settings.horaExpediente}">
                    </div>
                    <div>
                        <label class="form-label">Saída</label>
                        <input type="time" id="setting-minutoExpediente" class="form-input" value="${settings.minutoExpediente}">
                    </div>
                    <div>
                        <label class="form-label">Dias de Semana</label>
                        <input type="number" id="setting-diasSemana" class="form-input" min="1" max="7" value="${settings.diasSemana}">
                    </div>
                </div>
            </div>

            <!-- SEÇÃO: INFORMAÇÕES DO SISTEMA -->
            <div class="form-section">
                <h3>📊 Informações do Sistema</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                    <div style="padding: 15px; background: #f0f0f0; border-radius: 8px; text-align: center; border: 1px solid var(--dourado);">
                        <strong style="display: block; font-size: 1.5rem; color: var(--dourado);">${systemInfo.employees}</strong>
                        <small style="color: #666;">Funcionários</small>
                    </div>
                    <div style="padding: 15px; background: #f0f0f0; border-radius: 8px; text-align: center; border: 1px solid var(--dourado);">
                        <strong style="display: block; font-size: 1.5rem; color: var(--dourado);">${systemInfo.punches}</strong>
                        <small style="color: #666;">Pontos Registrados</small>
                    </div>
                    <div style="padding: 15px; background: #f0f0f0; border-radius: 8px; text-align: center; border: 1px solid var(--dourado);">
                        <strong style="display: block; font-size: 1.5rem; color: var(--dourado);">${systemInfo.afastamentos}</strong>
                        <small style="color: #666;">Afastamentos</small>
                    </div>
                    <div style="padding: 15px; background: #f0f0f0; border-radius: 8px; text-align: center; border: 1px solid var(--dourado);">
                        <strong style="display: block; font-size: 1.5rem; color: var(--dourado);">${systemInfo.departamentos}</strong>
                        <small style="color: #666;">Departamentos</small>
                    </div>
                    <div style="padding: 15px; background: #f0f0f0; border-radius: 8px; text-align: center; border: 1px solid var(--dourado);">
                        <strong style="display: block; font-size: 1.5rem; color: var(--dourado);">${systemInfo.users}</strong>
                        <small style="color: #666;">Usuários</small>
                    </div>
                    <div style="padding: 15px; background: #f0f0f0; border-radius: 8px; text-align: center; border: 1px solid var(--dourado);">
                        <strong style="display: block; font-size: 1.5rem; color: var(--dourado);">${systemInfo.storageSize}KB</strong>
                        <small style="color: #666;">Armazenamento</small>
                    </div>
                </div>
            </div>

            <!-- SEÇÃO: BACKUP E RESTAURAÇÃO -->
            <div class="form-section">
                <h3>💾 Backup e Restauração</h3>
                
                <div style="margin-bottom: 15px;">
                    <p style="color: #666; margin-bottom: 10px;">
                        <strong>Último backup:</strong> ${settings.dataUltimoBackup || 'Nenhum backup realizado'}
                    </p>
                </div>

                <div class="form-group full" style="gap: 10px;">
                    <button id="btn-exportar-backup" class="btn btn-primary" style="flex: 1;">
                        💾 Exportar Backup (JSON)
                    </button>
                    <button id="btn-importar-backup" class="btn btn-secondary" style="flex: 1;">
                        📥 Importar Backup
                    </button>
                </div>

                <input type="file" id="import-file" accept=".json" style="display: none;">
            </div>

            <!-- SEÇÃO: RESETAR E LIMPAR DADOS -->
            <div class="form-section" style="background: #fff3cd; border-color: #ffc107;">
                <h3 style="color: #856404;">⚠️ Zona de Perigo</h3>
                
                <p style="color: #856404; margin-bottom: 15px; font-weight: 500;">
                    ⚠️ Estas ações não podem ser desfeitas. Use com cuidado!
                </p>

                <div class="form-group full" style="gap: 10px;">
                    <button id="btn-reset-settings" class="btn btn-secondary" style="flex: 1;">
                        🔄 Resetar Configurações
                    </button>
                    <button id="btn-clear-data" class="btn btn-danger" style="flex: 1;">
                        🗑️ Limpar Todos os Dados
                    </button>
                </div>
            </div>

            <!-- SEÇÃO: BOTÕES DE AÇÃO -->
            <div class="form-actions">
                <button id="btn-salvar-settings" class="btn btn-primary">💾 Salvar Alterações</button>
                <button id="btn-cancelar-settings" class="btn btn-ghost">❌ Cancelar</button>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Event Listeners
    document.getElementById('btn-exportar-backup').addEventListener('click', exportDataBackup);
    
    document.getElementById('btn-importar-backup').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importDataBackup(e.target.files[0]);
        }
    });

    document.getElementById('btn-reset-settings').addEventListener('click', resetSettings);
    document.getElementById('btn-clear-data').addEventListener('click', clearAllData);

    document.getElementById('btn-salvar-settings').addEventListener('click', () => {
        const newSettings = {
            ...settings,
            tema: document.getElementById('setting-tema').value,
            idioma: document.getElementById('setting-idioma').value,
            notificacoes: document.getElementById('setting-notificacoes').checked,
            autoSalvar: document.getElementById('setting-autoSalvar').checked,
            horaExpediente: document.getElementById('setting-horaExpediente').value,
            minutoExpediente: document.getElementById('setting-minutoExpediente').value,
            diasSemana: parseInt(document.getElementById('setting-diasSemana').value),
            mostrarDicas: document.getElementById('setting-mostrarDicas').checked,
        };

        saveSettings(newSettings);
        showToast('✅ Todas as configurações foram salvas!', 'success');
    });

    document.getElementById('btn-cancelar-settings').addEventListener('click', () => {
        window.navigationSystem.showPage('dashboard');
    });
}
