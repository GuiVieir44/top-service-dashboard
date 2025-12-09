// ==========================================
// SUPABASE SYNC COMPLETO - Sincroniza TODOS os dados
// ==========================================

(function(){
    console.log('🔄 Supabase Sync Completo carregado');

    // ===== CONFIGURAÇÕES SUPABASE =====
    const SUPABASE_URL = 'https://szwqezafiilwxgpyukxq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3FlemFmaWlsd3hncHl1a3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTExNjAsImV4cCI6MjA4MDQyNzE2MH0.eENe9npKaeN9dCWTn019a04Ekl9EjXKaYJd-aGYuNt0';

    // ===== ESTADO =====
    let isConnected = false;
    let syncInProgress = false;
    let lastSync = 0;
    let lastRemoteIds = {
        employees: new Set(),
        punches: new Set(),
        afastamentos: new Set(),
        departamentos: new Set(),
        cargos: new Set(),
        ausencias: new Set(),
        configuracoes: new Set(),
        users: new Set()
    };

    // ===== LOGGING =====
    const Log = {
        error: (msg) => console.error(`%c[SUPABASE] ${msg}`, 'color: #ef4444; font-weight: bold;'),
    };

    // ===== FUNÇÕES AUXILIARES =====

    /**
     * Faz requisição ao Supabase
     */
    async function supabaseRequest(method, table, data = null, filter = null) {
        try {
            let url = `${SUPABASE_URL}/rest/v1/${table}`;
            
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

            console.log(`🌐 ${method} ${table}`, data ? `→ ${JSON.stringify(data).substring(0, 100)}...` : '');

            const response = await fetch(url, options);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: response.statusText }));
                const errorMsg = `${response.status}: ${error.message || 'Unknown error'}`;
                console.error(`❌ ${response.status} ${table}: ${error.message || response.statusText}`);
                const customError = new Error(errorMsg);
                customError.status = response.status;
                throw customError;
            }

            const result = await response.json();
            console.log(`✅ ${method} ${table} OK`);
            return result;
        } catch (e) {
            console.error(`🔴 Erro na requisição ${method} ${table}: ${e.message}`);
            throw e;
        }
    }

    /**
     * Sincroniza uma tabela genérica
     */
    async function syncTable(tableName, localData, allowedFields) {
        if (!localData || localData.length === 0) {
            console.log(`📭 Tabela ${tableName} vazia localmente, pulando`);
            return true;
        }

        console.log(`📤 Iniciando sync de ${tableName} com ${localData.length} registros`);

        try {
            let remoteData = [];
            try {
                remoteData = await supabaseRequest('GET', tableName);
                console.log(`🔍 Encontrados ${remoteData.length} registros remotos em ${tableName}`);
            } catch (e) {
                console.log(`⚠️ Erro ao buscar dados remotos de ${tableName}, assumindo tabela vazia: ${e.message}`);
                remoteData = [];
            }

            const remoteIds = new Set(remoteData.map(r => r.id));
            let insertedCount = 0;
            let skippedCount = 0;

            for (const item of localData) {
                try {
                    // Pular se já existe
                    if (remoteIds.has(item.id)) {
                        skippedCount++;
                        continue;
                    }

                    // Limpar dados para campos permitidos apenas
                    const cleanItem = {};
                    allowedFields.forEach(field => {
                        if (field in item) cleanItem[field] = item[field];
                    });

                    // Validar que tem dados válidos - pular se vazio
                    const hasValidData = Object.values(cleanItem).some(v => v != null && v !== '');
                    if (!hasValidData) {
                        skippedCount++;
                        continue;
                    }

                    // INSERT
                    console.log(`➕ Enviando ${tableName} id=${item.id}`);
                    await supabaseRequest('POST', tableName, cleanItem);
                    insertedCount++;
                } catch (e) {
                    if (e.status === 409 || e.status === 400) {
                        // Duplicado ou dados inválidos - pular
                        skippedCount++;
                        console.log(`⏭️ Pulando ${tableName} id=${item.id}: ${e.message}`);
                        continue;
                    } else {
                        Log.error(`Erro ao processar ${tableName} ${item.id}: ${e.message}`);
                    }
                }
            }

            console.log(`✅ Sync ${tableName}: ${insertedCount} inseridos, ${skippedCount} pulados`);
            return true;
        } catch (e) {
            Log.error(`Erro ao sincronizar ${tableName}: ${e.message}`);
            return false;
        }
    }

    /**
     * Sincroniza deleções (apaga do Supabase o que foi deletado localmente)
     */
    async function syncDeletions(tableName, localIds) {
        try {
            const remoteData = await supabaseRequest('GET', tableName);
            const remoteIds = new Set(remoteData.map(r => r.id));
            const currentLocalIds = new Set(localIds);

            // Encontrar IDs que estão no remoto mas não estão no local (foram deletados)
            const idsToDelete = [...remoteIds].filter(id => !currentLocalIds.has(id));

            if (idsToDelete.length === 0) {
                return;
            }

            console.log(`🗑️ Deletando ${idsToDelete.length} registros de ${tableName}`);

            for (const id of idsToDelete) {
                try {
                    await supabaseRequest('DELETE', tableName, null, `id=eq.${id}`);
                    console.log(`✅ Deletado ${tableName} id=${id}`);
                } catch (e) {
                    console.log(`⚠️ Erro ao deletar ${tableName} id=${id}: ${e.message}`);
                }
            }
        } catch (e) {
            console.error(`Erro ao sincronizar deleções de ${tableName}: ${e.message}`);
        }
    }

    /**
     * Sincroniza TODOS os dados + deleções
     */
    async function syncAllDataComplete() {
        if (syncInProgress || !isConnected) return;
        
        syncInProgress = true;
        try {
            let successCount = 0;

            // 1. EMPLOYEES
            const employees = window.employees || [];
            if (await syncTable('employees', employees, 
                ['id', 'matricula', 'nome', 'cargo', 'departamento', 'adicional', 'vale_alimentacao', 'vale_transporte', 'cpf', 'email', 'admissao', 'telefone', 'endereco', 'status'])) {
                successCount++;
            }
            await syncDeletions('employees', employees.map(e => e.id));

            // 2. PUNCHES
            const punches = (window.punches || []).map(p => ({
                id: p.id,
                employeeid: p.employeeId || p.employeeid,
                type: p.type,
                timestamp: p.timestamp,
                status: p.status || 'active'
            }));
            if (await syncTable('punches', punches, ['id', 'employeeid', 'type', 'timestamp', 'status'])) {
                successCount++;
            }
            await syncDeletions('punches', punches.map(p => p.id));

            // 3. AFASTAMENTOS
            const afastamentos = (window.afastamentos || []).map(a => ({
                id: a.id,
                employeeid: a.employeeId || a.employeeid,
                start_date: a.startDate || a.start_date,
                end_date: a.endDate || a.end_date,
                days: a.days,
                type: a.type
            }));
            if (await syncTable('afastamentos', afastamentos,
                ['id', 'employeeid', 'start_date', 'end_date', 'days', 'type'])) {
                successCount++;
            }
            await syncDeletions('afastamentos', afastamentos.map(a => a.id));

            // 4. DEPARTAMENTOS
            const departamentos = window.departamentos || [];
            if (await syncTable('departamentos', departamentos, ['id', 'name', 'description'])) {
                successCount++;
            }
            await syncDeletions('departamentos', departamentos.map(d => d.id));

            // 5. CARGOS
            const cargos = JSON.parse(localStorage.getItem('topservice_cargos_v1') || '[]');
            if (await syncTable('cargos', cargos, ['id', 'nome'])) {
                successCount++;
            }
            await syncDeletions('cargos', cargos.map(c => c.id));

            // 6. AUSENCIAS
            const ausenciasRaw = JSON.parse(localStorage.getItem('topservice_absences_v1') || '[]');
            const ausencias = ausenciasRaw.map(a => ({
                id: a.id,
                employeeid: a.employeeId || a.employeeid,
                data: a.data,
                tipo: a.tipo,
                observacoes: a.observacoes
            }));
            if (await syncTable('ausencias', ausencias, ['id', 'employeeid', 'data', 'tipo', 'observacoes'])) {
                successCount++;
            }
            await syncDeletions('ausencias', ausencias.map(a => a.id));

            // 7. CONFIGURACOES (SETTINGS)
            const settings = JSON.parse(localStorage.getItem('SETTINGS_KEY') || '{}');
            const settingsArray = Object.entries(settings).map(([key, value], idx) => ({
                id: `setting_${idx}`,
                chave: key,
                valor: JSON.stringify(value),
                tipo: typeof value
            }));
            if (await syncTable('configuracoes', settingsArray, ['id', 'chave', 'valor', 'tipo'])) {
                successCount++;
            }

            // 8. USERS
            const users = JSON.parse(localStorage.getItem('topservice_users_v1') || '[]');
            if (await syncTable('users', users, ['id', 'nome', 'email', 'senha', 'role', 'ativo'])) {
                successCount++;
            }
            await syncDeletions('users', users.map(u => u.id));

            lastSync = Date.now();
            return true;
        } catch (e) {
            Log.error(`Erro crítico na sincronização: ${e.message}`);
            return false;
        } finally {
            syncInProgress = false;
        }
    }

    /**
     * Baixa TODOS os dados do Supabase
     */
    async function downloadAllDataComplete() {
        if (!isConnected) {
            Log.warn('Não conectado ao Supabase');
            return false;
        }

        try {
            const [employees, punches, afastamentos, departamentos, cargos, ausencias, configuracoes, users] = await Promise.all([
                supabaseRequest('GET', 'employees'),
                supabaseRequest('GET', 'punches'),
                supabaseRequest('GET', 'afastamentos'),
                supabaseRequest('GET', 'departamentos'),
                supabaseRequest('GET', 'cargos'),
                supabaseRequest('GET', 'ausencias'),
                supabaseRequest('GET', 'configuracoes'),
                supabaseRequest('GET', 'users')
            ]);

            // Merge com dados locais (com normalização snake_case → camelCase)
            if (employees && employees.length > 0) {
                const localIds = new Set((window.employees || []).map(e => e.id));
                const newItems = employees
                    .filter(e => !localIds.has(e.id))
                    .map(e => ({
                        ...e,
                        valeAlimentacao: e.vale_alimentacao,  // Normalizar
                        valeTransporte: e.vale_transporte     // Normalizar
                    }));
                window.employees = [...(window.employees || []), ...newItems];
            }

            if (punches && punches.length > 0) {
                const localIds = new Set((window.punches || []).map(p => p.id));
                const newItems = punches
                    .filter(p => !localIds.has(p.id))
                    .map(p => ({
                        ...p,
                        employeeId: p.employeeid  // Normalizar para camelCase
                    }));
                window.punches = [...(window.punches || []), ...newItems];
            }

            if (afastamentos && afastamentos.length > 0) {
                const localIds = new Set((window.afastamentos || []).map(a => a.id));
                const newItems = afastamentos
                    .filter(a => !localIds.has(a.id))
                    .map(a => ({
                        ...a,
                        employeeId: a.employeeid,  // Normalizar
                        startDate: a.start_date,   // Normalizar
                        endDate: a.end_date        // Normalizar
                    }));
                window.afastamentos = [...(window.afastamentos || []), ...newItems];
            }

            if (departamentos && departamentos.length > 0) {
                const localIds = new Set((window.departamentos || []).map(d => d.id));
                const newItems = departamentos.filter(d => !localIds.has(d.id));
                window.departamentos = [...(window.departamentos || []), ...newItems];
            }

            if (cargos && cargos.length > 0) {
                localStorage.setItem('topservice_cargos_v1', JSON.stringify(cargos));
            }

            if (ausencias && ausencias.length > 0) {
                localStorage.setItem('topservice_absences_v1', JSON.stringify(ausencias));
            }

            if (users && users.length > 0) {
                localStorage.setItem('topservice_users_v1', JSON.stringify(users));
            }

            window.dispatchEvent(new Event('dataChanged'));
            return true;
        } catch (e) {
            Log.error(`Erro ao baixar dados: ${e.message}`);
            return false;
        }
    }

    /**
     * Verifica conexão
     */
    async function checkConnection() {
        try {
            await supabaseRequest('GET', 'employees?limit=1');
            isConnected = true;
            return true;
        } catch (e) {
            isConnected = false;
            Log.error('❌ Falha na conexão com Supabase');
            return false;
        }
    }

    // ===== EXPOSIÇÃO DE FUNÇÕES =====
    window.supabaseSync = {
        checkConnection,
        syncAllData: syncAllDataComplete,
        downloadFromSupabase: downloadAllDataComplete,
        getStatus: () => ({
            connected: isConnected,
            lastSync: new Date(lastSync).toLocaleString(),
            syncInProgress
        })
    };

    // ===== INICIALIZAÇÃO =====
    setTimeout(async () => {
        const connected = await checkConnection();
        if (connected) {
            console.log('🔄 Iniciando sincronização: UPLOAD primeiro, depois DOWNLOAD');
            // Upload primeiro (enviar dados locais para Supabase), depois download
            setTimeout(async () => {
                await syncAllDataComplete();
                setTimeout(() => downloadAllDataComplete(), 1000);
            }, 2000);
        }
    }, 1000);
})();
