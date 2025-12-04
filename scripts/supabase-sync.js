// ==========================================
// SUPABASE SYNC - Sincroniza dados com Supabase
// ==========================================

(function(){
    console.log('🔄 Supabase Sync carregado');

    // ===== CONFIGURAÇÕES SUPABASE =====
    const SUPABASE_URL = 'https://szwqezafiilwxgpyukxq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3FlemFmaWlsd3hncHl1a3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTExNjAsImV4cCI6MjA4MDQyNzE2MH0.eENe9npKaeN9dCWTn019a04Ekl9EjXKaYJd-aGYuNt0';

    // ===== ESTADO =====
    let isConnected = false;
    let syncInProgress = false;
    let lastSync = 0;
    const SYNC_INTERVAL = 30000; // Sincronizar a cada 30s

    // ===== LOGGING =====
    const Log = {
        info: (msg) => {}, // Desabilitado
        success: (msg) => {}, // Desabilitado
        warn: (msg) => {}, // Desabilitado
        error: (msg) => console.error(`%c[SUPABASE] ${msg}`, 'color: #ef4444; font-weight: bold;'), // Apenas erros
    };

    // ===== FUNÇÕES AUXILIARES =====

    /**
     * Faz requisição ao Supabase
     */
    async function supabaseRequest(method, table, data = null, filter = null) {
        try {
            let url = `${SUPABASE_URL}/rest/v1/${table}`;
            
            // Adicionar filtro se existir
            if (filter) {
                url += `?${filter}`;
            }

            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Prefer': 'return=representation'
                }
            };

            if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`${response.status}: ${error.message || 'Unknown error'}`);
            }

            return await response.json();
        } catch (e) {
            Log.error(`Erro na requisição ${method} ${table}: ${e.message}`);
            throw e;
        }
    }

    /**
     * Verifica conexão com Supabase
     */
    async function checkConnection() {
        try {
            await supabaseRequest('GET', 'employees?limit=1');
            isConnected = true;
            Log.success('✅ Conectado ao Supabase');
            return true;
        } catch (e) {
            isConnected = false;
            Log.error('❌ Falha na conexão com Supabase');
            return false;
        }
    }

    // ===== SINCRONIZAÇÃO DE DADOS =====

    /**
     * Sincroniza Employees
     */
    async function syncEmployees() {
        try {
            const localEmployees = window.employees || [];
            if (localEmployees.length === 0) return;

            // Buscar employees remotos
            const remoteEmployees = await supabaseRequest('GET', 'employees');
            const remoteIds = new Set(remoteEmployees.map(e => e.id));

            // Inserir novos ou atualizar existentes
            for (const emp of localEmployees) {
                if (remoteIds.has(emp.id)) {
                    // Atualizar
                    await supabaseRequest('PATCH', 'employees', emp, `id=eq.${emp.id}`);
                } else {
                    // Inserir
                    await supabaseRequest('POST', 'employees', emp);
                }
            }

            Log.success(`✅ ${localEmployees.length} funcionários sincronizados`);
            return true;
        } catch (e) {
            Log.error(`Erro ao sincronizar employees: ${e.message}`);
            return false;
        }
    }

    /**
     * Sincroniza Punches
     */
    async function syncPunches() {
        try {
            const localPunches = window.punches || [];
            if (localPunches.length === 0) return;

            // Buscar punches remotos
            const remotePunches = await supabaseRequest('GET', 'punches');
            const remoteIds = new Set(remotePunches.map(p => p.id));

            // Inserir novos ou atualizar existentes
            for (const punch of localPunches) {
                if (remoteIds.has(punch.id)) {
                    await supabaseRequest('PATCH', 'punches', punch, `id=eq.${punch.id}`);
                } else {
                    await supabaseRequest('POST', 'punches', punch);
                }
            }

            Log.success(`✅ ${localPunches.length} pontos sincronizados`);
            return true;
        } catch (e) {
            Log.error(`Erro ao sincronizar punches: ${e.message}`);
            return false;
        }
    }

    /**
     * Sincroniza Afastamentos
     */
    async function syncAfastamentos() {
        try {
            const localAfastamentos = window.afastamentos || [];
            if (localAfastamentos.length === 0) return;

            // Buscar afastamentos remotos
            const remoteAfastamentos = await supabaseRequest('GET', 'afastamentos');
            const remoteIds = new Set(remoteAfastamentos.map(a => a.id));

            // Inserir novos ou atualizar existentes
            for (const afastamento of localAfastamentos) {
                if (remoteIds.has(afastamento.id)) {
                    await supabaseRequest('PATCH', 'afastamentos', afastamento, `id=eq.${afastamento.id}`);
                } else {
                    await supabaseRequest('POST', 'afastamentos', afastamento);
                }
            }

            Log.success(`✅ ${localAfastamentos.length} afastamentos sincronizados`);
            return true;
        } catch (e) {
            Log.error(`Erro ao sincronizar afastamentos: ${e.message}`);
            return false;
        }
    }

    /**
     * Sincroniza Departamentos
     */
    async function syncDepartamentos() {
        try {
            const localDepts = window.departamentos || [];
            if (localDepts.length === 0) return;

            // Buscar departamentos remotos
            const remoteDepts = await supabaseRequest('GET', 'departamentos');
            const remoteIds = new Set(remoteDepts.map(d => d.id));

            // Inserir novos ou atualizar existentes
            for (const dept of localDepts) {
                if (remoteIds.has(dept.id)) {
                    await supabaseRequest('PATCH', 'departamentos', dept, `id=eq.${dept.id}`);
                } else {
                    await supabaseRequest('POST', 'departamentos', dept);
                }
            }

            Log.success(`✅ ${localDepts.length} departamentos sincronizados`);
            return true;
        } catch (e) {
            Log.error(`Erro ao sincronizar departamentos: ${e.message}`);
            return false;
        }
    }

    /**
     * Sincroniza tudo
     */
    async function syncAllData() {
        if (syncInProgress || !isConnected) return;
        
        syncInProgress = true;
        try {
            Log.info('🔄 Iniciando sincronização com Supabase...');
            
            const start = performance.now();
            let successCount = 0;

            if (await syncDepartamentos()) successCount++;
            if (await syncEmployees()) successCount++;
            if (await syncPunches()) successCount++;
            if (await syncAfastamentos()) successCount++;

            const duration = (performance.now() - start).toFixed(2);
            lastSync = Date.now();

            Log.success(`✅ Sincronização completa em ${duration}ms (${successCount}/4 módulos)`);
            
            if (typeof window.showToast === 'function') {
                window.showToast('✅ Dados sincronizados com Supabase!', 'success');
            }

            return true;
        } catch (e) {
            Log.error(`Erro crítico na sincronização: ${e.message}`);
            if (typeof window.showToast === 'function') {
                window.showToast('⚠️ Erro ao sincronizar. Verifique console.', 'warning');
            }
            return false;
        } finally {
            syncInProgress = false;
        }
    }

    /**
     * Baixa dados do Supabase para local (para recuperação)
     */
    async function downloadFromSupabase() {
        if (!isConnected) {
            Log.warn('Não conectado ao Supabase');
            return false;
        }

        try {
            Log.info('📥 Baixando dados do Supabase...');

            // Baixar todos os módulos
            const [employees, punches, afastamentos, departamentos] = await Promise.all([
                supabaseRequest('GET', 'employees'),
                supabaseRequest('GET', 'punches'),
                supabaseRequest('GET', 'afastamentos'),
                supabaseRequest('GET', 'departamentos')
            ]);

            // Salvar localmente
            window.employees = employees || [];
            window.punches = punches || [];
            window.afastamentos = afastamentos || [];
            window.departamentos = departamentos || [];

            // Disparar evento para atualizar UI
            window.dispatchEvent(new Event('dataChanged'));

            Log.success('✅ Dados baixados com sucesso');
            if (typeof window.showToast === 'function') {
                window.showToast('✅ Dados recuperados do Supabase!', 'success');
            }

            return true;
        } catch (e) {
            Log.error(`Erro ao baixar dados: ${e.message}`);
            if (typeof window.showToast === 'function') {
                window.showToast('❌ Erro ao baixar dados do Supabase', 'error');
            }
            return false;
        }
    }

    // ===== EVENT LISTENERS =====

    // Sincronizar quando dados mudam localmente
    window.addEventListener('dataChanged', () => {
        if (isConnected && !syncInProgress) {
            // Debounce: só sincronizar se passou 5s desde último sync
            if (Date.now() - lastSync > 5000) {
                syncAllData();
            }
        }
    });

    // Sincronizar periodicamente
    setInterval(() => {
        if (isConnected && !syncInProgress && Date.now() - lastSync > SYNC_INTERVAL) {
            syncAllData();
        }
    }, SYNC_INTERVAL);

    // Sincronizar ao sair da página
    window.addEventListener('beforeunload', () => {
        if (isConnected) {
            Log.info('📤 Sincronizando antes de sair...');
            syncAllData();
        }
    });

    // ===== FUNÇÕES EXPOSTAS =====
    window.supabaseSync = {
        checkConnection,
        syncAllData,
        downloadFromSupabase,
        getStatus: () => ({
            connected: isConnected,
            lastSync: new Date(lastSync).toLocaleString(),
            syncInProgress
        })
    };

    // ===== INICIALIZAÇÃO =====
    (async () => {
        // Verificar conexão após 1s (para garantir que window.employees já existe)
        setTimeout(async () => {
            const connected = await checkConnection();
            if (connected) {
                Log.success('🚀 Sistema de sincronização Supabase pronto');
                // Sincronizar imediatamente na primeira carga
                setTimeout(() => syncAllData(), 2000);
            } else {
                Log.warn('⚠️ Usando apenas localStorage (Supabase indisponível)');
            }
        }, 1000);
    })();
})();
