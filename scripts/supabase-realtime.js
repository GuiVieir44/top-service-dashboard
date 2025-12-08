// ==========================================
// SUPABASE REALTIME - SINCRONIZAÇÃO EM TEMPO REAL
// ==========================================
// Usa WebSocket para receber atualizações instantâneas
// Quando alguém muda dados em um dispositivo, aparece imediatamente nos outros

(function() {
    'use strict';
    
    console.log('🚀 Supabase Realtime - Iniciando...');

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
    let realtimeChannel = null;
    let ws = null;

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
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API ${method} ${table}: ${errorText}`);
                return null;
            }
            
            const text = await response.text();
            return text ? JSON.parse(text) : [];
        } catch (error) {
            console.error(`❌ API Error:`, error);
            return null;
        }
    }

    // ===== NORMALIZAÇÃO DE DADOS =====
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
            return item;
        });
    }

    function normalizeToSupabase(table, item) {
        if (table === 'departamentos') {
            return {
                id: item.id,
                name: item.nome || item.name || '',
                description: item.description || ''
            };
        }
        if (table === 'punches') {
            return {
                id: item.id,
                employeeid: item.employeeId || item.employeeid,
                type: item.type,
                timestamp: item.timestamp,
                status: item.status
            };
        }
        return item;
    }

    // ===== CARREGAR DADOS INICIAIS =====
    async function loadInitialData() {
        console.log('📥 Carregando dados iniciais do Supabase...');
        
        for (const [table, config] of Object.entries(TABLES)) {
            try {
                const data = await apiRequest('GET', table);
                if (data !== null) {
                    const normalized = normalizeFromSupabase(table, data);
                    localStorage.setItem(config.localStorage, JSON.stringify(normalized));
                    window[table] = normalized;
                    console.log(`✅ ${table}: ${normalized.length} registros`);
                }
            } catch (error) {
                console.error(`❌ Erro ao carregar ${table}:`, error);
            }
        }
        
        // Atualizar UI
        updateAllUI();
        console.log('✅ Dados iniciais carregados!');
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
            
            // Enviar heartbeat inicial
            sendHeartbeat();
            
            // Inscrever em todas as tabelas
            subscribeToAllTables();
            
            // Heartbeat a cada 30 segundos para manter conexão
            setInterval(sendHeartbeat, 30000);
        };
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleRealtimeMessage(message);
            } catch (e) {
                // Ignorar mensagens que não são JSON
            }
        };
        
        ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            isConnected = false;
        };
        
        ws.onclose = () => {
            console.log('🔌 WebSocket desconectado. Reconectando em 3s...');
            isConnected = false;
            setTimeout(connectRealtime, 3000);
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
        // Ignorar heartbeats e replies
        if (message.event === 'phx_reply' || message.event === 'heartbeat') {
            return;
        }
        
        // Processar mudanças no banco
        if (message.event === 'postgres_changes' || message.payload?.type) {
            const payload = message.payload;
            const eventType = payload.type || payload.eventType;
            const table = payload.table || message.topic?.replace('realtime:public:', '');
            
            if (!table || !TABLES[table]) return;
            
            console.log(`🔔 Realtime: ${eventType} em ${table}`);
            
            // Recarregar dados da tabela afetada
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
                localStorage.setItem(config.localStorage, JSON.stringify(normalized));
                window[table] = normalized;
                updateTableUI(table);
                console.log(`🔄 ${table} atualizado: ${normalized.length} registros`);
            }
        } catch (error) {
            console.error(`❌ Erro ao recarregar ${table}:`, error);
        }
    }

    // ===== OPERAÇÕES CRUD =====
    
    // INSERT - Criar novo registro
    async function insert(table, data) {
        const normalized = normalizeToSupabase(table, data);
        const result = await apiRequest('POST', table, normalized);
        
        if (result) {
            // Atualizar local imediatamente
            const config = TABLES[table];
            const local = JSON.parse(localStorage.getItem(config.localStorage) || '[]');
            const normalizedResult = normalizeFromSupabase(table, result);
            
            // Evitar duplicação
            const exists = local.find(item => item.id === data.id);
            if (!exists) {
                local.push(...normalizedResult);
                localStorage.setItem(config.localStorage, JSON.stringify(local));
                window[table] = local;
            }
            
            updateTableUI(table);
            console.log(`✅ Inserido em ${table}`);
            return result;
        }
        return null;
    }

    // UPDATE - Atualizar registro
    async function update(table, id, data) {
        const normalized = normalizeToSupabase(table, { ...data, id });
        const result = await apiRequest('PATCH', table, normalized, `id=eq.${id}`);
        
        if (result) {
            // Atualizar local imediatamente
            const config = TABLES[table];
            const local = JSON.parse(localStorage.getItem(config.localStorage) || '[]');
            const index = local.findIndex(item => item.id === id);
            
            if (index !== -1) {
                const normalizedResult = normalizeFromSupabase(table, result);
                local[index] = normalizedResult[0] || { ...local[index], ...data };
                localStorage.setItem(config.localStorage, JSON.stringify(local));
                window[table] = local;
            }
            
            updateTableUI(table);
            console.log(`✅ Atualizado em ${table}: ${id}`);
            return result;
        }
        return null;
    }

    // DELETE - Remover registro
    async function remove(table, id) {
        const result = await apiRequest('DELETE', table, null, `id=eq.${id}`);
        
        // Atualizar local imediatamente (mesmo se API falhar, para UX)
        const config = TABLES[table];
        const local = JSON.parse(localStorage.getItem(config.localStorage) || '[]');
        const filtered = local.filter(item => item.id !== id);
        localStorage.setItem(config.localStorage, JSON.stringify(filtered));
        window[table] = filtered;
        
        updateTableUI(table);
        console.log(`🗑️ Removido de ${table}: ${id}`);
        return true;
    }

    // ===== SYNC MANUAL =====
    async function syncAll() {
        console.log('🔄 Sincronização manual...');
        
        // Upload dados locais para Supabase
        for (const [table, config] of Object.entries(TABLES)) {
            const local = JSON.parse(localStorage.getItem(config.localStorage) || '[]');
            
            for (const item of local) {
                if (item.id) {
                    const normalized = normalizeToSupabase(table, item);
                    await apiRequest('POST', table, normalized);
                }
            }
        }
        
        // Download dados do Supabase
        await loadInitialData();
        
        console.log('✅ Sincronização completa!');
    }

    // ===== LIMPAR TUDO =====
    async function clearAll() {
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
        console.log('✅ Tudo limpo! Recarregando...');
        setTimeout(() => location.reload(), 1000);
    }

    // ===== VERIFICAR CONEXÃO =====
    async function checkConnection() {
        try {
            const result = await apiRequest('GET', 'employees', null, 'limit=1');
            isConnected = result !== null;
            console.log(isConnected ? '✅ Conectado ao Supabase' : '❌ Sem conexão');
            return isConnected;
        } catch {
            isConnected = false;
            return false;
        }
    }

    // ===== EXPOR API GLOBAL =====
    window.supabaseRealtime = {
        // CRUD
        insert,
        update,
        remove,
        
        // Sync
        sync: syncAll,
        reload: loadInitialData,
        reloadTable,
        
        // Utilidades
        clearAll,
        checkConnection,
        getStatus: () => ({ 
            connected: isConnected, 
            wsState: ws ? ws.readyState : -1 
        })
    };

    // Manter compatibilidade com código antigo
    window.supabaseSync = {
        upload: syncAll,
        download: loadInitialData,
        sync: syncAll,
        limparTudo: clearAll,
        checkConnection,
        getStatus: () => ({ connected: isConnected, syncing: false })
    };

    // ===== INICIALIZAÇÃO =====
    async function init() {
        console.log('🚀 Iniciando Supabase Realtime...');
        
        // Verificar conexão
        const connected = await checkConnection();
        
        if (connected) {
            // Carregar dados iniciais
            await loadInitialData();
            
            // Conectar ao Realtime via WebSocket
            connectRealtime();
            
            console.log('✅ Supabase Realtime ativo!');
            console.log('📡 Atualizações em tempo real habilitadas');
        } else {
            console.log('⚠️ Sem conexão. Usando dados locais.');
            
            // Tentar reconectar a cada 10 segundos
            setInterval(async () => {
                if (!isConnected) {
                    const reconnected = await checkConnection();
                    if (reconnected) {
                        await loadInitialData();
                        connectRealtime();
                    }
                }
            }, 10000);
        }
    }

    // Aguardar DOM e inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
    } else {
        setTimeout(init, 1000);
    }

    console.log('✅ Supabase Realtime carregado!');
    console.log('📌 API: supabaseRealtime.insert(), update(), remove(), sync(), clearAll()');

})();
