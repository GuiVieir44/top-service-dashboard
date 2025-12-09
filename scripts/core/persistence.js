// ==========================================
// PERSISTÊNCIA CENTRAL - VERSÃO OTIMIZADA
// Salva dados ao fechar/ocultar a aba com melhor controle
// ==========================================

(function(){
    console.log('✅ Persistence helper (v2 - otimizado) carregado');

    // ===== CONFIGURAÇÕES OTIMIZADAS =====
    const CONFIG = {
        debounceDelay: 300,           // Reduzido de 500ms para mais responsividade
        maxStorageAttempts: 3,
        retryDelay: 100,
        storageQuotaWarning: 0.8,
        autoSaveInterval: 15000,      // Auto-save a cada 15s (novo)
        enableAutoSave: true,         // Auto-save habilitado (novo)
        logLevel: 'info'              // 'debug', 'info', 'warn', 'error'
    };

    // ===== ESTADO DO MÓDULO =====
    let isSaving = false;
    let savePending = false;
    let lastSaveTime = 0;
    let saveDebounceTimer = null;
    let autoSaveTimer = null;
    let storageUsagePercent = 0;
    let lastSavedHash = {};  // Rastrear o que já foi salvo
    let saveStats = {        // Estatísticas de salvamento (novo)
        totalSaves: 0,
        successSaves: 0,
        failedSaves: 0,
        lastSaveTime: 0,
        moduleStats: {}
    };

    // ===== LOGGING MELHORADO =====
    const Log = {
        debug: (msg, data) => {},
        info: (msg, data) => {}, // Desabilitado para evitar spam
        warn: (msg, data) => console.warn(`%c[PERSIST-WARN] ${msg}`, 'color: #f39c12; font-weight: bold;', data || ''),
        error: (msg, data) => console.error(`%c[PERSIST-ERROR] ${msg}`, 'color: #e74c3c; font-weight: bold;', data || ''),
    };

    // ===== FUNÇÕES AUXILIARES =====

    /**
     * Calcula uso de armazenamento com cache
     */
    function getStorageUsage() {
        try {
            const used = new Blob(Object.values(localStorage)).size;
            const limit = 5 * 1024 * 1024; // ~5MB padrão
            storageUsagePercent = (used / limit) * 100;
            return {
                used: used,
                limit: limit,
                percent: storageUsagePercent,
                available: limit - used,
                formattedUsed: (used / 1024 / 1024).toFixed(2) + 'MB'
            };
        } catch(e) {
            Log.error('Erro ao calcular uso de storage:', e);
            return { used: 0, limit: 5 * 1024 * 1024, percent: 0, available: 0 };
        }
    }

    /**
     * Gera hash para detectar mudanças (novo)
     */
    function hashData(data) {
        try {
            const str = JSON.stringify(data);
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash.toString(36);
        } catch (e) {
            return Math.random().toString(36);
        }
    }

    /**
     * Verifica se dados mudaram desde último save (novo)
     */
    function hasChanged(key, data) {
        const hash = hashData(data);
        const changed = lastSavedHash[key] !== hash;
        if (changed) {
            lastSavedHash[key] = hash;
        }
        return changed;
    }

    /**
     * Valida integridade pós-salvamento
     */
    function validateSave(key, data) {
        try {
            const saved = localStorage.getItem(key);
            const savedObj = JSON.parse(saved || 'null');
            const originalObj = JSON.parse(data);
            
            // Verificação básica de comprimento
            if (JSON.stringify(savedObj).length !== JSON.stringify(originalObj).length) {
                Log.warn(`Validação: tamanho divergente para ${key}`);
                return false;
            }
            return true;
        } catch(e) {
            Log.error(`Erro ao validar ${key}:`, e);
            return false;
        }
    }

    /**
     * Tenta salvar com retry inteligente
     */
    function saveWithRetry(key, data, attempts = 0) {
        try {
            // Verificar se realmente mudou (novo)
            if (!hasChanged(key, data)) {
                Log.debug(`Pulando save de ${key} (sem mudanças)`);
                return true;
            }

            localStorage.setItem(key, data);
            
            // Validar se salvou
            if (!validateSave(key, data)) {
                if (attempts < CONFIG.maxStorageAttempts) {
                    Log.debug(`Retry salvamento ${key} (tentativa ${attempts + 1})`);
                    setTimeout(() => saveWithRetry(key, data, attempts + 1), CONFIG.retryDelay);
                    return false;
                }
            }

            // Atualizar estatísticas
            if (!saveStats.moduleStats[key]) {
                saveStats.moduleStats[key] = { saves: 0, failures: 0 };
            }
            saveStats.moduleStats[key].saves++;

            return true;
        } catch(e) {
            if (e.name === 'QuotaExceededError') {
                handleStorageQuotaExceeded();
                return false;
            }
            Log.error(`Erro ao salvar ${key}:`, e);
            
            if (!saveStats.moduleStats[key]) {
                saveStats.moduleStats[key] = { saves: 0, failures: 0 };
            }
            saveStats.moduleStats[key].failures++;

            return false;
        }
    }

    /**
     * Notifica usuário sobre quota excedida
     */
    function handleStorageQuotaExceeded() {
        Log.error('QUOTA DE ARMAZENAMENTO EXCEDIDA!');
        
        // DESABILITADO - Não mostrar toast (causava loop)
        /*
        if (typeof window.showToast === 'function') {
            window.showToast(
                '❌ Espaço de armazenamento insuficiente! Limpe dados antigos na configuração.',
                'error'
            );
        }
        */

        if (confirm('⚠️ Espaço insuficiente!\n\nDeseja limpar dados antigos para continuar?')) {
            if (typeof window.showStorageCleanupUI === 'function') {
                window.showStorageCleanupUI();
            }
        }
    }

    /**
     * Salva um módulo específico
     */
    function saveModule(moduleName, saveFunction, loadFunction) {
        try {
            if (typeof saveFunction === 'function') {
                const data = typeof loadFunction === 'function' ? loadFunction() : [];
                saveFunction(data);
                Log.debug(`Módulo ${moduleName} salvo via função`);
                return true;
            }
            return false;
        } catch (e) {
            Log.warn(`Erro ao salvar módulo ${moduleName}:`, e.message);
            return false;
        }
    }

    /**
     * Função principal de salvamento otimizada
     */
    function safeSaveAll() {
        // TEMPORARIAMENTE DESABILITADO PARA EVITAR LOOP
        return;
        
        /* CÓDIGO ORIGINAL COMENTADO
        // Evitar salvamentos simultâneos
        if (isSaving) {
            savePending = true;
            return;
        }

        isSaving = true;
        const startTime = performance.now();
        try {
            let saveCount = 0;
            let failureLog = [];
            let savedModules = [];
            
            // Verificar quota antes de salvar
            const usage = getStorageUsage();
            if (usage.percent > 100) {
                handleStorageQuotaExceeded();
                isSaving = false;
                return;
            } else if (usage.percent > CONFIG.storageQuotaWarning * 100) {
                Log.warn(`Aviso: ${usage.percent.toFixed(1)}% de storage em uso`);
            }
            
            // 1. Employees
            if (saveModule('Employees', window.saveEmployees, window.loadEmployees) ||
                saveWithRetry('topservice_employees_v1', JSON.stringify(window.employees || []))) {
                saveCount++;
                savedModules.push('👥 Employees');
            } else {
                failureLog.push('Employees');
            }

            // 2. Punches
            if (saveModule('Punches', window.savePunches, window.loadPunches) ||
                saveWithRetry('topservice_punches_v1', JSON.stringify(window.punches || []))) {
                saveCount++;
                savedModules.push('⏰ Punches');
            } else {
                failureLog.push('Punches');
            }

            // 3. Afastamentos
            if (saveModule('Afastamentos', window.saveAfastamentos, window.loadAfastamentos)) {
                saveCount++;
                savedModules.push('🏖️ Afastamentos');
            } else {
                failureLog.push('Afastamentos');
            }

            // 4. Departamentos
            if (saveModule('Departamentos', window.saveDepartments, window.loadDepartments)) {
                saveCount++;
                savedModules.push('🏢 Departamentos');
            } else {
                failureLog.push('Departamentos');
            }

            // 5. Users
            if (saveModule('Users', window.saveUsers, window.loadUsers)) {
                saveCount++;
                savedModules.push('👤 Users');
            } else {
                failureLog.push('Users');
            }

            // 6. Settings
            if (saveModule('Settings', window.saveSettings, window.loadSettings)) {
                saveCount++;
                savedModules.push('⚙️ Settings');
            } else {
                failureLog.push('Settings');
            }

            // 7. Absences
            if (saveModule('Absences', window.saveAbsences, window.loadAbsences)) {
                saveCount++;
                savedModules.push('📋 Absences');
            } else {
                failureLog.push('Absences');
            }

            // 8. Notifications
            if (typeof window.updateNotificationBadge === 'function') {
                window.updateNotificationBadge();
            }

            // Atualizar estatísticas
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(2);
            saveStats.totalSaves++;
            saveStats.lastSaveTime = Date.now();
            
            if (failureLog.length === 0) {
                saveStats.successSaves++;
                Log.info(
                    `✅ ${saveCount} módulos sincronizados em ${duration}ms - ${savedModules.join(' ')}`,
                    `${usage.percent.toFixed(1)}% storage (${usage.formattedUsed})`
                );
                
                if (typeof window.showSaveIndicator === 'function') {
                    window.showSaveIndicator(true);
                }
            } else {
                saveStats.failedSaves++;
                Log.warn(
                    `⚠️ ${saveCount}/${saveCount + failureLog.length} módulos salvos - Erros: ${failureLog.join(', ')}`,
                    duration + 'ms'
                );
                
                // DESABILITADO - Não mostrar toast (causava loop)
                /*
                if (typeof window.showToast === 'function' && failureLog.length > 2) {
                    window.showToast('⚠️ Erro ao sincronizar dados. Consulte console.', 'warning');
                }
                */
                
                if (typeof window.showSaveIndicator === 'function') {
                    window.showSaveIndicator(false, 'warning');
                }
            }

            lastSaveTime = Date.now();

            // 🔥 SYNC INSTANTÂNEO COM SUPABASE
            if (typeof window.supabaseSync !== 'undefined' && typeof window.supabaseSync.syncAllData === 'function') {
                window.supabaseSync.syncAllData().catch(e => console.error('Erro no sync:', e));
            }

        } catch (e) {
            saveStats.failedSaves++;
            Log.error('Erro crítico ao executar safeSaveAll:', e);
            // DESABILITADO - Não mostrar toast (causava loop)
            /*
            if (typeof window.showToast === 'function') {
                window.showToast('❌ Erro crítico na sincronização!', 'error');
            }
            */
            if (typeof window.showSaveIndicator === 'function') {
                window.showSaveIndicator(false, 'error');
            }
        } finally {
            isSaving = false;
            
            // Se houver salvamento pendente, executar
            if (savePending) {
                savePending = false;
                scheduleDebouncedsave();
            }
        }
    }

    /**
     * Debounce para salvamentos
     */
    function scheduleDebouncedsave() {
        if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
        
        saveDebounceTimer = setTimeout(() => {
            safeSaveAll();
        }, CONFIG.debounceDelay);
    }

    /**
     * Auto-save periódico (novo)
     */
    function startAutoSave() {
        if (!CONFIG.enableAutoSave) return;
        
        if (autoSaveTimer) clearInterval(autoSaveTimer);
        
        autoSaveTimer = setInterval(() => {
            if (!isSaving && !savePending) {
                Log.debug('Auto-save executado');
                safeSaveAll();
            }
        }, CONFIG.autoSaveInterval);
        
        Log.info(`Auto-save habilitado a cada ${CONFIG.autoSaveInterval}ms`);
    }

    /**
     * Para auto-save
     */
    function stopAutoSave() {
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
            autoSaveTimer = null;
            Log.info('Auto-save desabilitado');
        }
    }

    /**
     * Obtém estatísticas de salvamento (novo)
     */
    function getSaveStats() {
        return {
            ...saveStats,
            uptime: Date.now() - (saveStats.lastSaveTime || 0),
            successRate: saveStats.totalSaves > 0 ? 
                ((saveStats.successSaves / saveStats.totalSaves) * 100).toFixed(1) + '%' : 
                'N/A'
        };
    }

    // ===== EVENT LISTENERS =====

    // Salva ao tentar sair da página
    window.addEventListener('beforeunload', () => {
        Log.info('Página fechando - salvando dados...');
        safeSaveAll();
    });

    // Salva ao ocultar a aba (mobile/desktop switching)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            Log.info('Aba oculta - salvando dados...');
            safeSaveAll();
        }
    });

    // Listener para mudanças manuais (eventos de dados)
    window.addEventListener('dataChanged', () => {
        scheduleDebouncedsave();
    });

    // Listener para sincronizar com Supabase (DESABILITADO TEMPORARIAMENTE)
    /*
    window.addEventListener('dataChanged', () => {
        // Aguardar um pouco para garantir que o localStorage foi salvo
        setTimeout(() => {
            if (typeof window.supabaseSync !== 'undefined' && typeof window.supabaseSync.syncAllData === 'function') {
                window.supabaseSync.syncAllData().catch(e => Log.warn('Erro ao sincronizar Supabase:', e.message));
            }
        }, 1000);
    });
    */

    // ===== FUNÇÕES EXPOSTAS =====
    window.safeSaveAll = safeSaveAll;
    window.getStorageUsage = getStorageUsage;
    window.scheduleDebouncedsave = scheduleDebouncedsave;
    window.startAutoSave = startAutoSave;
    window.stopAutoSave = stopAutoSave;
    window.getSaveStats = getSaveStats;

    // Placeholder para notificação visual
    if (!window.showSaveIndicator) {
        window.showSaveIndicator = function(success, type) {
            // Placeholder
        };
    }

    // Iniciar auto-save ao carregar
    startAutoSave();
    
    Log.info('🚀 Sistema de persistência otimizado iniciado');
})();
