// ==========================================
// SUPABASE REALTIME v3 - ARQUITETURA SIMPLIFICADA
// ==========================================
// Foco: Supabase como única fonte da verdade.
// Remove a complexidade de merge com localStorage para evitar loops e travamentos.

(function() {
    'use strict';
    
    console.log('🚀 Supabase Realtime v3 - Iniciando...');

    // ===== CONFIGURAÇÃO =====
    const SUPABASE_URL = 'https://szwqezafiilwxgpyukxq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3FlemFmaWlsd3hncHl1a3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTExNjAsImV4cCI6MjA4MDQyNzE2MH0.eENe9npKaeN9dCWTn019a04Ekl9EjXKaYJd-aGYuNt0';
    
    const TABLES = [
        'employees', 'departments', 'punches', 'cargos', 
        'afastamentos', 'ausencias', 'users', 'notifications', 
        'configuracoes', 'cargos_departamento'
    ];

    const RENDER_MAP = {
        employees: 'renderEmployeeList',
        departments: 'renderDepartments',
        punches: 'renderPunches',
        cargos: 'renderCargos',
        afastamentos: 'renderAfastamentos',
        ausencias: 'renderAusencias',
        users: 'renderUsers',
        cargos_departamento: 'renderCargosDepartamento',
        // notifications e configuracoes não possuem renderização de lista principal
    };

    let supabaseClient = null;
    let realtimeChannel = null;
    let isConnected = false;
    let isInitialized = false;

    // Objeto global para armazenar os dados em cache
    const dataCache = {};
    TABLES.forEach(table => dataCache[table] = []);

    // ===== API GLOBAL =====
    window.supabaseRealtime = {
        insert: (table, data) => handleOperation(table, () => supabaseClient.from(table).insert(data).select()),
        update: (table, id, data) => handleOperation(table, () => supabaseClient.from(table).update(data).eq('id', id).select()),
        remove: (table, id) => handleOperation(table, () => supabaseClient.from(table).delete().eq('id', id)),
        data: dataCache, // Expõe o cache de dados
        getStatus: () => ({ connected: isConnected, initialized: isInitialized }),
        forceReload: fetchAllData,
    };

    // ===== INICIALIZAÇÃO =====
    function initialize() {
        if (isInitialized) return;
        console.log('%c🚀 Supabase Realtime v3 - Inicializando...', 'color: #3498db; font-size: 16px; font-weight: bold;');
        
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Cliente Supabase criado.');
            
            showStatus('Conectando ao servidor...', 'info');
            
            fetchAllData().then(() => {
                setupRealtimeSubscriptions();
                isInitialized = true;
                isConnected = true;
                showStatus('Sincronizado!', 'success');
                console.log('%c✅ Supabase Realtime v3 ATIVO!', 'color: #27ae60; font-size: 14px; font-weight: bold;');
            }).catch(error => {
                console.error('❌ Falha na inicialização:', error);
                showStatus('Erro ao carregar dados', 'error');
            });

        } catch (error) {
            console.error('❌ Erro crítico ao criar cliente Supabase:', error);
            showStatus('Falha na configuração', 'error');
        }
    }

    // ===== BUSCAR DADOS INICIAIS =====
    async function fetchAllData() {
        console.log('📥 Baixando todos os dados do Supabase...');
        
        const dataPromises = TABLES.map(async (table) => {
            const { data, error } = await supabaseClient.from(table).select('*');
            if (error) {
                console.error(`❌ Erro ao buscar dados da tabela ${table}:`, error);
                return;
            }
            dataCache[table] = data || [];
            console.log(`   📦 ${table}: ${dataCache[table].length} registros carregados.`);
        });

        await Promise.all(dataPromises);
        
        console.log('🎨 Renderizando UI inicial...');
        updateAllUI();
    }

    // ===== CONFIGURAR REALTIME =====
    function setupRealtimeSubscriptions() {
        console.log('📡 Configurando inscrições em tempo real...');
        
        const channel = supabaseClient.channel('public-schema', {
            config: {
                broadcast: { self: false } // Não receber eventos que o próprio cliente envia
            }
        });

        channel
            .on('postgres_changes', { event: '*', schema: 'public' }, handleRealtimeChange)
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Inscrito para receber alterações em tempo real.');
                } else {
                    console.warn(`⚠️ Status da inscrição: ${status}`);
                }
            });
        
        realtimeChannel = channel;
    }

    // ===== MANIPULAR MUDANÇAS EM TEMPO REAL =====
    function handleRealtimeChange(payload) {
        const { eventType, table, new: newRecord, old: oldRecord } = payload;
        console.log(`🔔 Realtime Event: ${eventType} na tabela ${table}`);

        if (!dataCache[table]) return;

        switch (eventType) {
            case 'INSERT':
                dataCache[table].push(newRecord);
                break;
            case 'UPDATE':
                const indexToUpdate = dataCache[table].findIndex(item => item.id === newRecord.id);
                if (indexToUpdate !== -1) {
                    dataCache[table][indexToUpdate] = newRecord;
                }
                break;
            case 'DELETE':
                const idToDelete = oldRecord.id;
                dataCache[table] = dataCache[table].filter(item => item.id !== idToDelete);
                break;
        }
        
        // Atualiza a UI específica da tabela
        updateTableUI(table);
        // Sempre atualiza as métricas do dashboard
        updateDashboardMetrics();
    }

    // ===== MANIPULADOR DE OPERAÇÕES (INSERT, UPDATE, DELETE) =====
    async function handleOperation(table, operation) {
        try {
            const { data, error } = await operation();
            if (error) {
                console.error(`❌ Erro na operação em ${table}:`, error);
                showStatus(`Erro ao salvar em ${table}`, 'error');
                return null;
            }
            
            console.log(`✅ Operação em ${table} bem-sucedida.`);
            // A atualização da UI será feita pelo evento de realtime,
            // garantindo consistência e evitando renderização dupla.
            return data;
        } catch (err) {
            console.error(`❌ Erro inesperado na operação em ${table}:`, err);
            showStatus('Erro de rede', 'error');
            return null;
        }
    }

    // ===== FUNÇÕES DE RENDERIZAÇÃO =====
    function updateAllUI() {
        for (const table of TABLES) {
            updateTableUI(table);
        }
        updateDashboardMetrics();
    }

    function updateTableUI(table) {
        const renderFunction = RENDER_MAP[table];
        if (renderFunction && typeof window[renderFunction] === 'function') {
            try {
                window[renderFunction]();
            } catch (e) {
                console.warn(`⚠️ Erro ao renderizar ${table}:`, e.message);
            }
        }
    }

    function updateDashboardMetrics() {
        if (window.navigationSystem && typeof window.navigationSystem.updateDashboardMetrics === 'function') {
            try {
                window.navigationSystem.updateDashboardMetrics();
            } catch (e) {
                console.warn('⚠️ Erro ao atualizar métricas do dashboard:', e.message);
            }
        }
    }

    // ===== UTILITÁRIO DE STATUS VISUAL =====
    function showStatus(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // ===== INICIALIZAR QUANDO O CLIENTE SUPABASE ESTIVER DISPONÍVEL =====
    // O cliente é carregado por um <script> em index.html
    const checkSupabaseClient = setInterval(() => {
        if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
            clearInterval(checkSupabaseClient);
            initialize();
        }
    }, 100);

})();
