// ==========================================
// SUPABASE SYNC V2 - Sistema Robusto e Completo
// Suporta: CREATE, UPDATE, DELETE, AUTO-SYNC, UNDO/REDO
// ==========================================

(function(){
    console.log('🔄 Supabase Sync V2 carregado - Production Ready');

    // ===== CONFIG =====
    const SUPABASE_URL = 'https://szwqezafiilwxgpyukxq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3FlemFmaWlsd3hncHl1a3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTExNjAsImV4cCI6MjA4MDQyNzE2MH0.eENe9npKaeN9dCWTn019a04Ekl9EjXKaYJd-aGYuNt0';
    const ENABLE_AUTO_SYNC = true; // Ativar sincronização automática
    const AUTO_SYNC_INTERVAL = 3000; // 3 segundos
    const MAX_UNDO_HISTORY = 50; // Máximo de ações no histórico

    // ===== ESTADO =====
    let isConnected = false;
    let syncInProgress = false;
    let lastSync = 0;
    let autoSyncTimer = null;
    let undoHistory = [];
    let redoHistory = [];
    let lastLocalSnapshot = {}; // Snapshot anterior para detectar mudanças

    // ===== REQUEST =====
    async function supabaseRequest(method, table, data = null, filter = null) {
        try {
            let url = `${SUPABASE_URL}/rest/v1/${table}`;
            if (filter) url += `?${filter}`;

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
                const customError = new Error(`${response.status}: ${error.message || 'Unknown error'}`);
                customError.status = response.status;
                throw customError;
            }

            return await response.json();
        } catch (e) {
            console.error(`❌ [${method}] ${table}: ${e.message}`);
            throw e;
        }
    }

    // ===== HISTÓRICO UNDO/REDO =====
    function recordAction(action) {
        undoHistory.push(action);
        redoHistory = []; // Limpar redo ao fazer nova ação
        if (undoHistory.length > MAX_UNDO_HISTORY) {
            undoHistory.shift();
        }
    }

    async function undo() {
        if (undoHistory.length === 0) {
            console.log('❌ Nada para desfazer');
            return false;
        }

        const action = undoHistory.pop();
        redoHistory.push(action);
        
        console.log(`↩️ Desfazendo: ${action.type} ${action.table}`);
        
        try {
            if (action.type === 'CREATE') {
                await supabaseRequest('DELETE', action.table, null, `id=eq.${action.id}`);
            } else if (action.type === 'UPDATE') {
                await supabaseRequest('PATCH', action.table, action.oldValue, `id=eq.${action.id}`);
            } else if (action.type === 'DELETE') {
                await supabaseRequest('POST', action.table, action.deletedValue);
            }
            return true;
        } catch (e) {
            undoHistory.push(action);
            redoHistory.pop();
            console.error(`Erro ao desfazer: ${e.message}`);
            return false;
        }
    }

    async function redo() {
        if (redoHistory.length === 0) {
            console.log('❌ Nada para refazer');
            return false;
        }

        const action = redoHistory.pop();
        undoHistory.push(action);
        
        console.log(`↪️ Refazendo: ${action.type} ${action.table}`);
        
        try {
            if (action.type === 'CREATE') {
                await supabaseRequest('POST', action.table, action.newValue);
            } else if (action.type === 'UPDATE') {
                await supabaseRequest('PATCH', action.table, action.newValue, `id=eq.${action.id}`);
            } else if (action.type === 'DELETE') {
                await supabaseRequest('DELETE', action.table, null, `id=eq.${action.id}`);
            }
            return true;
        } catch (e) {
            redoHistory.push(action);
            undoHistory.pop();
            console.error(`Erro ao refazer: ${e.message}`);
            return false;
        }
    }

    // ===== SINCRONIZAÇÃO INTELIGENTE =====
    async function smartSync(tableName, localData, allowedFields) {
        if (!localData || localData.length === 0) return true;

        try {
            const remoteData = await supabaseRequest('GET', tableName);
            const remoteMap = new Map(remoteData.map(r => [r.id, r]));
            const localMap = new Map(localData.map(l => [l.id, l]));

            let created = 0, updated = 0, deleted = 0;

            // ===== CREATE: Novos locais que não existem remotamente =====
            for (const local of localData) {
                if (!remoteMap.has(local.id)) {
                    try {
                        const cleanItem = {};
                        allowedFields.forEach(field => {
                            if (field in local) cleanItem[field] = local[field];
                        });
                        
                        const hasData = Object.values(cleanItem).some(v => v != null && v !== '');
                        if (hasData) {
                            await supabaseRequest('POST', tableName, cleanItem);
                            recordAction({ type: 'CREATE', table: tableName, id: local.id, newValue: cleanItem });
                            created++;
                        }
                    } catch (e) {
                        if (e.status !== 409) console.error(`Erro ao criar ${tableName}: ${e.message}`);
                    }
                }
            }

            // ===== UPDATE: Itens que existem mas mudaram =====
            for (const [id, remote] of remoteMap) {
                if (localMap.has(id)) {
                    const local = localMap.get(id);
                    let needsUpdate = false;
                    const updates = {};

                    for (const field of allowedFields) {
                        if (field in local && JSON.stringify(local[field]) !== JSON.stringify(remote[field])) {
                            updates[field] = local[field];
                            needsUpdate = true;
                        }
                    }

                    if (needsUpdate) {
                        try {
                            updates.id = id;
                            await supabaseRequest('PATCH', tableName, updates, `id=eq.${id}`);
                            recordAction({ type: 'UPDATE', table: tableName, id, oldValue: remote, newValue: updates });
                            updated++;
                        } catch (e) {
                            console.error(`Erro ao atualizar ${tableName}: ${e.message}`);
                        }
                    }
                }
            }

            // ===== DELETE: Itens que estão no remoto mas não no local =====
            for (const [id, remote] of remoteMap) {
                if (!localMap.has(id)) {
                    try {
                        await supabaseRequest('DELETE', tableName, null, `id=eq.${id}`);
                        recordAction({ type: 'DELETE', table: tableName, id, deletedValue: remote });
                        deleted++;
                    } catch (e) {
                        console.error(`Erro ao deletar ${tableName}: ${e.message}`);
                    }
                }
            }

            console.log(`✅ ${tableName}: +${created} criados, ↻${updated} atualizados, -${deleted} deletados`);
            return true;
        } catch (e) {
            console.error(`Erro ao sincronizar ${tableName}: ${e.message}`);
            return false;
        }
    }

    // ===== SYNC COMPLETO (13 TABELAS) =====
    async function syncAllData() {
        if (syncInProgress || !isConnected) {
            console.log('⏳ Sync já em andamento ou não conectado');
            return false;
        }

        syncInProgress = true;
        console.log('🔄 Iniciando sincronização completa de 13 tabelas...');

        try {
            // ===== 1. EMPLOYEES =====
            const employees = window.employees || [];
            await smartSync('employees', employees, 
                ['id', 'matricula', 'nome', 'cargo', 'departamento', 'adicional', 'vale_alimentacao', 'vale_transporte', 'cpf', 'email', 'admissao', 'telefone', 'endereco', 'status']);

            // ===== 2. PUNCHES =====
            const punches = (window.punches || []).map(p => ({
                id: p.id,
                employeeid: p.employeeId || p.employeeid,
                type: p.type,
                timestamp: p.timestamp,
                status: p.status || 'active'
            }));
            await smartSync('punches', punches, ['id', 'employeeid', 'type', 'timestamp', 'status']);

            // ===== 3. AFASTAMENTOS =====
            const afastamentos = (window.afastamentos || []).map(a => ({
                id: a.id,
                employeeid: a.employeeId || a.employeeid,
                start_date: a.startDate || a.start_date,
                end_date: a.endDate || a.end_date,
                days: a.days,
                type: a.type
            }));
            await smartSync('afastamentos', afastamentos, ['id', 'employeeid', 'start_date', 'end_date', 'days', 'type']);

            // ===== 4. DEPARTAMENTOS =====
            const departamentos = window.departamentos || [];
            await smartSync('departamentos', departamentos, ['id', 'name', 'description']);

            // ===== 5. CARGOS =====
            const cargos = JSON.parse(localStorage.getItem('topservice_cargos_v1') || '[]');
            await smartSync('cargos', cargos, ['id', 'nome']);

            // ===== 6. AUSENCIAS =====
            const ausenciasRaw = JSON.parse(localStorage.getItem('topservice_absences_v1') || '[]');
            const ausencias = ausenciasRaw.map(a => ({
                id: a.id,
                employeeid: a.employeeId || a.employeeid,
                data: a.data,
                tipo: a.tipo,
                observacoes: a.observacoes
            }));
            await smartSync('ausencias', ausencias, ['id', 'employeeid', 'data', 'tipo', 'observacoes']);

            // ===== 7. USERS =====
            const users = JSON.parse(localStorage.getItem('topservice_users_v1') || '[]');
            await smartSync('users', users, ['id', 'nome', 'email', 'senha', 'role', 'ativo']);

            // ===== 8. CONFIGURACOES =====
            const configuracoes = JSON.parse(localStorage.getItem('topservice_configuracoes_v1') || '[]');
            await smartSync('configuracoes', configuracoes, ['id', 'chave', 'valor', 'tipo']);

            // ===== 9. BANCO_HORAS =====
            const bancoHoras = JSON.parse(localStorage.getItem('topservice_banco_horas_v1') || '[]');
            const bancoHorasNorm = (bancoHoras || []).map(b => ({
                id: b.id,
                employeeid: b.employeeId || b.employeeid,
                data: b.data,
                horas: b.horas,
                tipo: b.tipo
            }));
            await smartSync('banco_horas', bancoHorasNorm, ['id', 'employeeid', 'data', 'horas', 'tipo']);

            // ===== 10. ADIANTAMENTOS =====
            const adiantamentos = JSON.parse(localStorage.getItem('topservice_adiantamentos_v1') || '[]');
            const adiantamentosNorm = (adiantamentos || []).map(ad => ({
                id: ad.id,
                employeeid: ad.employeeId || ad.employeeid,
                data: ad.data,
                valor: ad.valor,
                status: ad.status
            }));
            await smartSync('adiantamentos', adiantamentosNorm, ['id', 'employeeid', 'data', 'valor', 'status']);

            // ===== 11. FERIAS =====
            const ferias = JSON.parse(localStorage.getItem('topservice_ferias_v1') || '[]');
            const feriasNorm = (ferias || []).map(f => ({
                id: f.id,
                employeeid: f.employeeId || f.employeeid,
                data_inicio: f.dataInicio || f.data_inicio,
                data_fim: f.dataFim || f.data_fim,
                dias: f.dias,
                ano: f.ano
            }));
            await smartSync('ferias', feriasNorm, ['id', 'employeeid', 'data_inicio', 'data_fim', 'dias', 'ano']);

            // ===== 12. RELATORIOS =====
            const relatorios = JSON.parse(localStorage.getItem('topservice_relatorios_v1') || '[]');
            const relatoriosNorm = (relatorios || []).map(r => ({
                id: r.id,
                tipo: r.tipo,
                employeeid: r.employeeId || r.employeeid,
                mes: r.mes,
                ano: r.ano,
                dados: typeof r.dados === 'string' ? r.dados : JSON.stringify(r.dados)
            }));
            await smartSync('relatorios', relatoriosNorm, ['id', 'tipo', 'employeeid', 'mes', 'ano', 'dados']);

            // ===== 13. CARGO_DEPARTAMENTO =====
            const cargoDepartamento = JSON.parse(localStorage.getItem('topservice_cargo_departamento_v1') || '[]');
            await smartSync('cargo_departamento', cargoDepartamento, ['id', 'departamento', 'cargo']);

            lastSync = Date.now();
            console.log('✅ Sincronização completa de 13 tabelas finalizada!');
            return true;
        } catch (e) {
            console.error(`❌ Erro na sincronização: ${e.message}`);
            return false;
        } finally {
            syncInProgress = false;
        }
    }

    // ===== DOWNLOAD (MULTI-DISPOSITIVO) =====
    async function downloadAllData() {
        if (!isConnected) return false;

        try {
            const [employees, punches, afastamentos, departamentos, cargos, ausencias, users] = await Promise.all([
                supabaseRequest('GET', 'employees'),
                supabaseRequest('GET', 'punches'),
                supabaseRequest('GET', 'afastamentos'),
                supabaseRequest('GET', 'departamentos'),
                supabaseRequest('GET', 'cargos'),
                supabaseRequest('GET', 'ausencias'),
                supabaseRequest('GET', 'users')
            ]);

            // Normalizar e mesclar
            if (employees && employees.length > 0) {
                const localIds = new Set((window.employees || []).map(e => e.id));
                const newItems = employees.filter(e => !localIds.has(e.id));
                if (newItems.length > 0) {
                    window.employees = [...(window.employees || []), ...newItems];
                    console.log(`⬇️ ${newItems.length} employees baixados`);
                }
            }

            if (punches && punches.length > 0) {
                const localIds = new Set((window.punches || []).map(p => p.id));
                const newItems = punches.filter(p => !localIds.has(p.id));
                if (newItems.length > 0) {
                    const normalized = newItems.map(p => ({...p, employeeId: p.employeeid}));
                    window.punches = [...(window.punches || []), ...normalized];
                    console.log(`⬇️ ${newItems.length} punches baixados`);
                }
            }

            window.dispatchEvent(new Event('dataChanged'));
            return true;
        } catch (e) {
            console.error(`Erro ao baixar dados: ${e.message}`);
            return false;
        }
    }

    // ===== CONEXÃO =====
    async function checkConnection() {
        try {
            await supabaseRequest('GET', 'employees');
            isConnected = true;
            console.log('✅ Conectado ao Supabase');
            return true;
        } catch (e) {
            isConnected = false;
            console.log('❌ Falha na conexão com Supabase');
            return false;
        }
    }

    // ===== AUTO-SYNC =====
    function startAutoSync() {
        if (ENABLE_AUTO_SYNC && !autoSyncTimer) {
            autoSyncTimer = setInterval(syncAllData, AUTO_SYNC_INTERVAL);
            console.log(`🔄 Auto-sync ativado (${AUTO_SYNC_INTERVAL}ms)`);
        }
    }

    function stopAutoSync() {
        if (autoSyncTimer) {
            clearInterval(autoSyncTimer);
            autoSyncTimer = null;
            console.log('⏹️ Auto-sync desativado');
        }
    }

    // ===== EXPOSIÇÃO =====
    window.supabaseSync = {
        syncAllData,
        downloadAllData,
        checkConnection,
        startAutoSync,
        stopAutoSync,
        undo,
        redo,
        getStatus: () => ({
            connected: isConnected,
            lastSync: new Date(lastSync).toLocaleString(),
            syncInProgress,
            undoCount: undoHistory.length,
            redoCount: redoHistory.length
        })
    };

    // ===== INICIALIZAÇÃO =====
    setTimeout(async () => {
        const connected = await checkConnection();
        if (connected) {
            await downloadAllData();
            startAutoSync();
            // Primeira sincronização após 3s
            setTimeout(() => syncAllData(), 3000);
        }
    }, 1000);

    console.log('✅ Sistema de sync production-ready iniciado!');
})();
