// ==========================================
// SUPABASE REALTIME v2 - SINCRONIZAÇÃO CORRIGIDA
// ==========================================
// CORRIGIDO: Agora preserva dados locais e faz merge inteligente
// Não perde mais dados ao recarregar a página

(function() {
    'use strict';
    
    console.log('🚀 Supabase Realtime v2 - Iniciando...');

    // ===== CONFIGURAÇÃO =====
    const SUPABASE_URL = 'https://szwqezafiilwxgpyukxq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3FlemFmaWlsd3hncHl1a3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTExNjAsImV4cCI6MjA4MDQyNzE2MH0.eENe9npKaeN9dCWTn019a04Ekl9EjXKaYJd-aGYuNt0';
    
    // Tabelas que vamos sincronizar
    const TABLES = {
        employees: { localStorage: 'topservice_employees_v1', render: 'renderEmployeeList' },
        departamentos: { localStorage: 'topservice_departamentos_v1', render: 'renderDepartments' },
        punches: { localStorage: 'topservice_punches_v1', render: 'renderPunches' },
        cargos: { localStorage: 'topservice_cargos_v1', render: 'renderCargos' },
        afastamentos: { localStorage: 'topservice_afastamentos_v1', render: 'renderAfastamentos' },
        ausencias: { localStorage: 'topservice_ausencias_v1', render: 'renderAusencias' },
        adiantamentos: { localStorage: 'topservice_adiantamentos_v1', render: 'renderAdiantamentos' },
        ferias: { localStorage: 'topservice_ferias_v1', render: 'renderFerias' }
    };

    let isConnected = false;
    let ws = null;
    let syncInProgress = false;

    // ===== GERAR UUID =====
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // ===== NORMALIZAR ID PARA UUID =====
    function ensureUUID(id) {
        if (!id) return generateUUID();
        // Se já é UUID (contém hífens e tem pelo menos 32 caracteres)
        if (typeof id === 'string' && id.includes('-') && id.length >= 32) {
            return id;
        }
        // Se é número ou string sem hífen, gerar novo UUID
        return generateUUID();
    }

    // ===== API REST =====
    async function apiRequest(method, table, data = null, filter = '') {
        const url = `${SUPABASE_URL}/rest/v1/${table}${filter ? '?' + filter : ''}`;
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': method === 'POST' ? 'return=representation,resolution=merge-duplicates' : 'return=representation'
            }
        };
        
        if (data && (method === 'POST' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            // 409 Conflict significa que já existe - não é erro
            if (response.status === 409) {
                console.log(`⚠️ ${table}: registro já existe, ignorando...`);
                return [];
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API ${method} ${table}: ${response.status} - ${errorText}`);
                return null;
            }
            
            const text = await response.text();
            return text ? JSON.parse(text) : [];
        } catch (error) {
            console.error(`❌ API Error:`, error);
            return null;
        }
    }

    // ===== NORMALIZAÇÃO DE DADOS (Supabase -> Local) =====
    function normalizeFromSupabase(table, data) {
        if (!Array.isArray(data)) return [];
        
        return data.map(item => {
            if (table === 'departamentos') {
                return {
                    id: item.id,
                    nome: item.name || item.nome || '',
                    name: item.name || item.nome || '',
                    description: item.description || ''
                };
            }
            if (table === 'punches') {
                return {
                    ...item,
                    employeeId: item.employeeid || item.employeeId
                };
            }
            if (table === 'employees') {
                return {
                    id: item.id,
                    matricula: item.matricula,
                    nome: item.nome,
                    cargo: item.cargo,
                    departamento: item.departamento,
                    adicional: item.adicional,
                    valeAlimentacao: item.vale_alimentacao || item.valeAlimentacao,
                    valeTransporte: item.vale_transporte || item.valeTransporte,
                    cpf: item.cpf,
                    email: item.email,
                    admissao: item.admissao,
                    telefone: item.telefone,
                    endereco: item.endereco,
                    status: item.status
                };
            }
            return item;
        });
    }

    // ===== NORMALIZAÇÃO DE DADOS (Local -> Supabase) =====
    function normalizeToSupabase(table, item) {
        // Garantir que o ID seja UUID
        const normalizedId = ensureUUID(item.id);
        
        if (table === 'departamentos') {
            return {
                id: normalizedId,
                name: item.nome || item.name || '',
                description: item.description || ''
            };
        }
        if (table === 'punches') {
            return {
                id: normalizedId,
                employeeid: item.employeeId || item.employeeid,
                type: item.type,
                timestamp: item.timestamp,
                status: item.status
            };
        }
        if (table === 'employees') {
            return {
                id: normalizedId,
                matricula: item.matricula,
                nome: item.nome,
                cargo: item.cargo,
                departamento: item.departamento,
                adicional: item.adicional,
                vale_alimentacao: item.valeAlimentacao || item.vale_alimentacao || null,
                vale_transporte: item.valeTransporte || item.vale_transporte || null,
                cpf: item.cpf,
                email: item.email,
                admissao: item.admissao,
                telefone: item.telefone,
                endereco: item.endereco,
                status: item.status
            };
        }
        
        return { ...item, id: normalizedId };
    }

    // ===== CARREGAR DADOS LOCAIS =====
    function getLocalData(table) {
        const config = TABLES[table];
        if (!config) return [];
        
        try {
            const stored = localStorage.getItem(config.localStorage);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error(`❌ Erro ao ler ${table} do localStorage:`, e);
            return [];
        }
    }

    // ===== SALVAR DADOS LOCAIS =====
    function setLocalData(table, data) {
        const config = TABLES[table];
        if (!config) return;
        
        localStorage.setItem(config.localStorage, JSON.stringify(data));
        window[table] = data;

        // Garantir que o cache em memória dos funcionários seja atualizado
        if (table === 'employees' && typeof window.refreshEmployeesCache === 'function') {
            window.refreshEmployeesCache(data);
        }
    }

    // ===== MERGE INTELIGENTE (NÃO PERDE DADOS) =====
    function mergeData(localData, remoteData) {
        // Criar mapa de IDs remotos
        const remoteMap = new Map();
        for (const item of remoteData) {
            remoteMap.set(String(item.id), item);
        }
        
        const merged = [];
        const processedIds = new Set();
        
        // Primeiro, processar itens locais
        for (const localItem of localData) {
            const localId = String(localItem.id);
            const remoteItem = remoteMap.get(localId);
            
            if (remoteItem) {
                // Item existe em ambos - usar versão remota (mais recente)
                merged.push(remoteItem);
            } else {
                // Item só existe local - manter
                merged.push(localItem);
            }
            processedIds.add(localId);
        }
        
        // Depois, adicionar itens remotos que não existem local
        for (const remoteItem of remoteData) {
            if (!processedIds.has(String(remoteItem.id))) {
                merged.push(remoteItem);
            }
        }
        
        return merged;
    }

    // ===== UPLOAD DE DADOS LOCAIS PARA SUPABASE =====
    async function uploadLocalData() {
        console.log('📤 Enviando dados locais para Supabase...');
        
        for (const [table, config] of Object.entries(TABLES)) {
            const local = getLocalData(table);
            
            if (local.length === 0) {
                console.log(`📭 ${table}: nenhum dado local`);
                continue;
            }
            
            console.log(`📤 ${table}: enviando ${local.length} registros...`);
            
            let updated = false;
            for (let i = 0; i < local.length; i++) {
                const item = local[i];
                try {
                    const normalized = normalizeToSupabase(table, item);
                    
                    // Atualizar o ID local se foi convertido para UUID
                    if (normalized.id !== item.id) {
                        local[i].id = normalized.id;
                        updated = true;
                    }
                    
                    await apiRequest('POST', table, normalized);
                } catch (e) {
                    console.error(`❌ Erro ao enviar ${table}:`, e);
                }
            }
            
            // Salvar com IDs atualizados
            if (updated) {
                setLocalData(table, local);
            }
        }
        
        console.log('✅ Upload concluído!');
    }

    // ===== DOWNLOAD DE DADOS DO SUPABASE (COM MERGE) =====
    async function downloadAndMerge() {
        console.log('📥 Baixando dados do Supabase...');
        
        for (const [table, config] of Object.entries(TABLES)) {
            try {
                console.log(`   📥 Baixando ${table}...`);
                const remoteData = await apiRequest('GET', table);
                
                if (remoteData === null) {
                    console.log(`   ⚠️ ${table}: falha ao baixar`);
                    continue;
                }
                
                console.log(`   📦 ${table}: ${remoteData.length} registros do servidor`);
                
                const normalized = normalizeFromSupabase(table, remoteData);
                const localData = getLocalData(table);
                
                // Se o servidor tem dados e o local está vazio, usar dados do servidor
                let finalData;
                if (remoteData.length > 0 && localData.length === 0) {
                    finalData = normalized;
                    console.log(`   ✅ ${table}: usando ${normalized.length} registros do servidor`);
                } else {
                    // MERGE: Juntar dados locais + remotos
                    finalData = mergeData(localData, normalized);
                    console.log(`   ✅ ${table}: merge = ${finalData.length} (local: ${localData.length}, remoto: ${normalized.length})`);
                }
                
                // Salvar no localStorage
                setLocalData(table, finalData);
                
                // Verificar se salvou
                const verification = getLocalData(table);
                console.log(`   💾 ${table}: verificação = ${verification.length} registros salvos`);
                
            } catch (error) {
                console.error(`   ❌ Erro ao baixar ${table}:`, error);
            }
        }
        
        console.log('✅ Download concluído!');
    }

    // ===== DOWNLOAD FORÇADO (SUBSTITUI LOCAL) =====
    async function forceDownload() {
        console.log('📥 Download forçado do Supabase (substitui local)...');
        
        for (const [table, config] of Object.entries(TABLES)) {
            try {
                const remoteData = await apiRequest('GET', table);
                
                if (remoteData !== null) {
                    const normalized = normalizeFromSupabase(table, remoteData);
                    setLocalData(table, normalized);
                    console.log(`✅ ${table}: ${normalized.length} registros`);
                }
            } catch (error) {
                console.error(`❌ Erro ao baixar ${table}:`, error);
            }
        }
        
        updateAllUI();
    }

    // ===== ATUALIZAR UI =====
    function updateAllUI() {
        for (const [table, config] of Object.entries(TABLES)) {
            if (typeof window[config.render] === 'function') {
                try {
                    window[config.render]();
                } catch (e) {
                    // Função pode não estar disponível em todas as páginas
                }
            }
        }
        
        // Atualizar métricas do dashboard se disponível
        if (window.navigationSystem && typeof window.navigationSystem.updateDashboardMetrics === 'function') {
            setTimeout(() => {
                try {
                    window.navigationSystem.updateDashboardMetrics();
                } catch (e) {}
            }, 100);
        }
    }

    function updateTableUI(table) {
        const config = TABLES[table];
        if (config && typeof window[config.render] === 'function') {
            try {
                window[config.render]();
            } catch (e) {
                // Ignorar erros se a função não estiver disponível
            }
        }
    }

    // ===== WEBSOCKET REALTIME =====
    function connectRealtime() {
        const wsUrl = `${SUPABASE_URL.replace('https://', 'wss://')}/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
        
        console.log('🔌 Conectando ao Realtime...');
        
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log('✅ WebSocket conectado!');
            isConnected = true;
            
            sendHeartbeat();
            subscribeToAllTables();
            setInterval(sendHeartbeat, 30000);
        };
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleRealtimeMessage(message);
            } catch (e) {}
        };
        
        ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            isConnected = false;
        };
        
        ws.onclose = () => {
            console.log('🔌 WebSocket desconectado. Reconectando em 5s...');
            isConnected = false;
            setTimeout(connectRealtime, 5000);
        };
    }

    function sendHeartbeat() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                topic: 'phoenix',
                event: 'heartbeat',
                payload: {},
                ref: Date.now().toString()
            }));
        }
    }

    function subscribeToAllTables() {
        for (const table of Object.keys(TABLES)) {
            subscribeToTable(table);
        }
    }

    function subscribeToTable(table) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            const joinMessage = {
                topic: `realtime:public:${table}`,
                event: 'phx_join',
                payload: {
                    config: {
                        broadcast: { self: false },
                        presence: { key: '' },
                        postgres_changes: [
                            { event: '*', schema: 'public', table: table }
                        ]
                    }
                },
                ref: Date.now().toString()
            };
            
            ws.send(JSON.stringify(joinMessage));
            console.log(`📡 Inscrito em: ${table}`);
        }
    }

    function handleRealtimeMessage(message) {
        if (message.event === 'phx_reply' || message.event === 'heartbeat') {
            return;
        }
        
        if (message.event === 'postgres_changes' || message.payload?.type) {
            const payload = message.payload;
            const eventType = payload.type || payload.eventType;
            const table = payload.table || message.topic?.replace('realtime:public:', '');
            
            if (!table || !TABLES[table]) return;
            
            console.log(`🔔 Realtime: ${eventType} em ${table}`);
            
            // Recarregar a tabela afetada
            reloadTable(table);
        }
    }

    async function reloadTable(table) {
        const config = TABLES[table];
        if (!config) return;
        
        try {
            const data = await apiRequest('GET', table);
            if (data !== null) {
                const normalized = normalizeFromSupabase(table, data);
                const localData = getLocalData(table);
                
                // Fazer merge para não perder dados locais pendentes
                const merged = mergeData(localData, normalized);
                setLocalData(table, merged);
                updateTableUI(table);
                console.log(`🔄 ${table} atualizado: ${merged.length} registros`);
            }
        } catch (error) {
            console.error(`❌ Erro ao recarregar ${table}:`, error);
        }
    }

    // ===== OPERAÇÕES CRUD =====
    
    // INSERT
    async function insert(table, data) {
        const normalized = normalizeToSupabase(table, data);
        const result = await apiRequest('POST', table, normalized);
        
        if (result) {
            // Atualizar local imediatamente
            const local = getLocalData(table);
            const normalizedResult = normalizeFromSupabase(table, result);
            
            // Evitar duplicação
            const exists = local.find(item => String(item.id) === String(normalized.id));
            if (!exists) {
                local.push(...normalizedResult);
                setLocalData(table, local);
            }
            
            updateTableUI(table);
            console.log(`✅ Inserido em ${table}`);
            return result;
        }
        return null;
    }

    // UPDATE
    async function update(table, id, data) {
        const normalized = normalizeToSupabase(table, { ...data, id });
        const result = await apiRequest('PATCH', table, normalized, `id=eq.${id}`);
        
        if (result) {
            const local = getLocalData(table);
            const index = local.findIndex(item => String(item.id) === String(id));
            
            if (index !== -1) {
                const normalizedResult = normalizeFromSupabase(table, result);
                local[index] = normalizedResult[0] || { ...local[index], ...data };
                setLocalData(table, local);
            }
            
            updateTableUI(table);
            console.log(`✅ Atualizado em ${table}: ${id}`);
            return result;
        }
        return null;
    }

    // DELETE
    async function remove(table, id) {
        await apiRequest('DELETE', table, null, `id=eq.${id}`);
        
        // Atualizar local
        const local = getLocalData(table);
        const filtered = local.filter(item => String(item.id) !== String(id));
        setLocalData(table, filtered);
        
        updateTableUI(table);
        console.log(`🗑️ Removido de ${table}: ${id}`);
        return true;
    }

    // ===== SYNC COMPLETO =====
    async function syncAll() {
        if (syncInProgress) {
            console.log('⏳ Sincronização já em andamento...');
            return;
        }
        
        syncInProgress = true;
        console.log('🔄 Sincronização completa...');
        showSyncStatus('Sincronizando...', 'info');
        
        try {
            // 1. Upload dados locais primeiro
            await uploadLocalData();
            
            // 2. Download e merge
            await downloadAndMerge();
            
            showSyncStatus('Sincronizado!', 'success');
            console.log('✅ Sincronização completa!');
        } catch (e) {
            console.error('❌ Erro na sincronização:', e);
            showSyncStatus('Erro na sincronização', 'error');
        } finally {
            syncInProgress = false;
        }
    }

    // ===== LIMPAR TUDO =====
    async function clearAll() {
        if (!confirm('⚠️ ATENÇÃO: Isso vai apagar TODOS os dados locais e do servidor. Continuar?')) {
            return;
        }
        
        console.log('🗑️ Limpando todos os dados...');
        
        for (const [table, config] of Object.entries(TABLES)) {
            // Limpar Supabase
            await apiRequest('DELETE', table, null, 'id=neq.00000000-0000-0000-0000-000000000000');
            
            // Limpar localStorage
            localStorage.setItem(config.localStorage, '[]');
            window[table] = [];
            
            console.log(`🧹 ${table} limpo`);
        }
        
        updateAllUI();
        showSyncStatus('Tudo limpo!', 'success');
    }

    // ===== VERIFICAR CONEXÃO =====
    async function checkConnection() {
        try {
            const result = await apiRequest('GET', 'employees', null, 'limit=1');
            isConnected = result !== null;
            return isConnected;
        } catch {
            isConnected = false;
            return false;
        }
    }

    // ===== MOSTRAR STATUS =====
    function showSyncStatus(message, type = 'info') {
        const existingToast = document.getElementById('sync-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.id = 'sync-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideIn 0.3s ease;
            ${type === 'success' ? 'background: #10b981; color: white;' : ''}
            ${type === 'info' ? 'background: #3b82f6; color: white;' : ''}
            ${type === 'error' ? 'background: #ef4444; color: white;' : ''}
        `;
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '🔄';
        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        
        if (!document.getElementById('sync-toast-style')) {
            const style = document.createElement('style');
            style.id = 'sync-toast-style';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), type === 'success' ? 4000 : 3000);
    }

    // ===== EXPOR API GLOBAL =====
    window.supabaseRealtime = {
        insert,
        update,
        remove,
        sync: syncAll,
        reload: downloadAndMerge,
        forceDownload,
        reloadTable,
        clearAll,
        checkConnection,
        getStatus: () => ({ connected: isConnected, wsState: ws ? ws.readyState : -1, syncing: syncInProgress })
    };

    // Compatibilidade
    window.supabaseSync = window.supabaseRealtime;

    // ===== INICIALIZAÇÃO =====
    async function init() {
        console.log('%c🚀 Supabase Realtime v2.1 - Iniciando...', 'color: #3498db; font-size: 16px; font-weight: bold;');
        
        // PASSO 1: Carregar dados do localStorage PRIMEIRO
        console.log('📂 PASSO 1: Carregando dados locais...');
        for (const [table, config] of Object.entries(TABLES)) {
            const local = getLocalData(table);
            window[table] = local;
            console.log(`   📂 ${table}: ${local.length} registros locais`);
        }
        
        // PASSO 2: Verificar conexão com Supabase
        console.log('🔌 PASSO 2: Verificando conexão com Supabase...');
        showSyncStatus('Conectando ao servidor...', 'info');
        const connected = await checkConnection();
        console.log(`   🔌 Conexão: ${connected ? 'OK ✅' : 'FALHOU ❌'}`);
        
        if (connected) {
            // PASSO 3: Download dados do Supabase (PRIORIDADE!)
            console.log('📥 PASSO 3: Baixando dados do Supabase...');
            await downloadAndMerge();
            
            // PASSO 4: Upload dados locais que não existem no servidor
            console.log('📤 PASSO 4: Enviando dados locais pendentes...');
            await uploadLocalData();
            
            // PASSO 5: Conectar WebSocket para atualizações em tempo real
            console.log('📡 PASSO 5: Conectando WebSocket...');
            connectRealtime();
            
            // PASSO 6: Atualizar UI
            console.log('🎨 PASSO 6: Atualizando interface...');
            updateAllUI();
            
            showSyncStatus('Sincronizado! Dados carregados.', 'success');
            console.log('%c✅ Supabase Realtime v2.1 ATIVO!', 'color: #27ae60; font-size: 14px; font-weight: bold;');
        } else {
            showSyncStatus('Offline - usando dados locais', 'error');
            console.log('⚠️ Sem conexão com Supabase. Usando apenas dados locais.');
            updateAllUI();
            
            // Tentar reconectar a cada 15 segundos
            setInterval(async () => {
                if (!isConnected && !syncInProgress) {
                    console.log('🔄 Tentando reconectar...');
                    const reconnected = await checkConnection();
                    if (reconnected) {
                        showSyncStatus('Reconectado! Sincronizando...', 'info');
                        await downloadAndMerge();
                        await uploadLocalData();
                        connectRealtime();
                        updateAllUI();
                        showSyncStatus('Reconectado!', 'success');
                    }
                }
            }, 15000);
        }
    }

    // Inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('✅ Supabase Realtime v2 carregado!');
    console.log('📌 API: supabaseRealtime.insert(), update(), remove(), sync(), clearAll()');

})();
