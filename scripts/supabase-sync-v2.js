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
    async function supabaseRequest(method, table, data = null, filter = null, upsert = false) {
        try {
            let url = `${SUPABASE_URL}/rest/v1/${table}`;
            if (filter) url += `?${filter}`;

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': 'return=representation'
            };

            // Se for UPSERT, adicionar header especial
            if (upsert && method === 'POST') {
                headers['Prefer'] = 'return=representation,resolution=merge-duplicates';
            }

            const options = {
                method: method,
                headers: headers
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

    // ===== SINCRONIZAÇÃO INTELIGENTE COM UPSERT =====
    async function smartSync(tableName, localData, allowedFields) {
        if (!localData || localData.length === 0) return true;

        try {
            const remoteData = await supabaseRequest('GET', tableName);
            const remoteMap = new Map(remoteData.map(r => [r.id, r]));
            const localMap = new Map(localData.map(l => [l.id, l]));

            let synced = 0, deleted = 0;

            // ===== UPSERT: Todos os itens locais (cria ou atualiza) =====
            for (const local of localData) {
                try {
                    const cleanItem = {};
                    allowedFields.forEach(field => {
                        if (field in local && local[field] != null && local[field] !== '') {
                            cleanItem[field] = local[field];
                        }
                    });
                    
                    // Garantir que tem ID
                    if (!cleanItem.id) continue;
                    
                    // Usar UPSERT (insere ou atualiza)
                    await supabaseRequest('POST', tableName, cleanItem, null, true);
                    synced++;
                } catch (e) {
                    // Ignorar erros 409 (já existe) e 400 (constraint)
                    if (e.status !== 409 && e.status !== 400) {
                        console.error(`Erro ao sincronizar ${tableName}/${local.id}: ${e.message}`);
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
                        // Ignorar erros de delete
                    }
                }
            }

            if (synced > 0 || deleted > 0) {
                console.log(`✅ ${tableName}: ${synced} sincronizados, -${deleted} deletados`);
            }
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

            // ===== 4. DEPARTAMENTOS (nome → name para Supabase) =====
            const departamentos = (window.supabaseRealtime && window.supabaseRealtime.data.departamentos) || [];
            const departamentosSync = departamentos.map(d => ({
                id: d.id,
                name: d.nome || d.name || '',  // JS usa 'nome', Supabase usa 'name'
                description: d.description || ''
            }));
            await smartSync('departamentos', departamentosSync, ['id', 'name', 'description']);

            // ===== 5. CARGOS =====
            const cargos = (window.supabaseRealtime && window.supabaseRealtime.data.cargos) || [];
            await smartSync('cargos', cargos, ['id', 'nome']);

            // ===== 6. AUSENCIAS =====
            const ausencias = (window.supabaseRealtime && window.supabaseRealtime.data.absences) || [];
            const ausenciasSync = ausencias.map(a => ({
                id: a.id,
                employeeid: a.employeeId || a.employeeid,
                data: a.data,
                tipo: a.tipo,
                observacoes: a.observacoes
            }));
            await smartSync('ausencias', ausenciasSync, ['id', 'employeeid', 'data', 'tipo', 'observacoes']);

            // ===== 7. USERS =====
            const users = (window.supabaseRealtime && window.supabaseRealtime.data.users) || [];
            await smartSync('users', users, ['id', 'nome', 'email', 'senha', 'role', 'ativo']);

            // ===== 8. CONFIGURACOES =====
            const configuracoes = (window.supabaseRealtime && window.supabaseRealtime.data.configuracoes) || [];
            await smartSync('configuracoes', configuracoes, ['id', 'chave', 'valor', 'tipo']);

            // ===== 9. BANCO_HORAS =====
            const bancoHoras = (window.supabaseRealtime && window.supabaseRealtime.data.banco_horas) || [];
            const bancoHorasNorm = (bancoHoras || []).map(b => ({
                id: b.id,
                employeeid: b.employeeId || b.employeeid,
                data: b.data,
                horas: b.horas,
                tipo: b.tipo
            }));
            await smartSync('banco_horas', bancoHorasNorm, ['id', 'employeeid', 'data', 'horas', 'tipo']);

            // ===== 10. ADIANTAMENTOS =====
            const adiantamentos = (window.supabaseRealtime && window.supabaseRealtime.data.adiantamentos) || [];
            const adiantamentosNorm = (adiantamentos || []).map(ad => ({
                id: ad.id,
                employeeid: ad.employeeId || ad.employeeid,
                data: ad.data,
                valor: ad.valor,
                status: ad.status
            }));
            await smartSync('adiantamentos', adiantamentosNorm, ['id', 'employeeid', 'data', 'valor', 'status']);

            // ===== 11. FERIAS =====
            const ferias = (window.supabaseRealtime && window.supabaseRealtime.data.ferias) || [];
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
            const relatorios = (window.supabaseRealtime && window.supabaseRealtime.data.relatorios) || [];
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
            const cargoDepartamento = (window.supabaseRealtime && window.supabaseRealtime.data.cargo_departamento) || [];
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

    // ===== DOWNLOAD (MULTI-DISPOSITIVO) - VERSÃO CORRIGIDA =====
    async function downloadAllData() {
        if (!isConnected) return false;

        console.log('⬇️ Baixando dados do Supabase...');

        try {
            const [employees, punches, afastamentos, departamentos, cargos, ausencias, users, configuracoes, bancoHoras, adiantamentos, ferias] = await Promise.all([
                supabaseRequest('GET', 'employees'),
                supabaseRequest('GET', 'punches'),
                supabaseRequest('GET', 'afastamentos'),
                supabaseRequest('GET', 'departamentos'),
                supabaseRequest('GET', 'cargos'),
                supabaseRequest('GET', 'ausencias'),
                supabaseRequest('GET', 'users'),
                supabaseRequest('GET', 'configuracoes'),
                supabaseRequest('GET', 'banco_horas'),
                supabaseRequest('GET', 'adiantamentos'),
                supabaseRequest('GET', 'ferias')
            ]);

            // Função auxiliar para merge inteligente (sem duplicar)
            function smartMerge(local, remote, normalize = item => item) {
                const map = new Map();
                // Primeiro adiciona locais
                local.forEach(item => map.set(item.id, item));
                // Depois adiciona/atualiza com remotos (normalizado)
                remote.forEach(item => {
                    const normalized = normalize(item);
                    if (!map.has(normalized.id)) {
                        map.set(normalized.id, normalized);
                    }
                });
                return Array.from(map.values());
            }

            // ===== EMPLOYEES =====
            if (employees && employees.length > 0) {
                const local = (window.supabaseRealtime && window.supabaseRealtime.data.employees) || [];
                const merged = smartMerge(local, employees);
                localStorage.setItem('topservice_employees_v1', JSON.stringify(merged));
                window.employees = merged;
                console.log(`⬇️ employees: ${merged.length} total`);
            }

            // ===== PUNCHES =====
            if (punches && punches.length > 0) {
                const local = (window.supabaseRealtime && window.supabaseRealtime.data.punches) || [];
                const merged = smartMerge(local, punches, p => ({
                    ...p, 
                    employeeId: p.employeeid || p.employeeId
                }));
                localStorage.setItem('topservice_punches_v1', JSON.stringify(merged));
                window.punches = merged;
                console.log(`⬇️ punches: ${merged.length} total`);
            }

            // ===== DEPARTAMENTOS (nome ↔ name) =====
            if (departamentos && departamentos.length > 0) {
                const local = (window.supabaseRealtime && window.supabaseRealtime.data.departamentos) || [];
                const merged = smartMerge(local, departamentos, d => ({
                    id: d.id,
                    nome: d.nome || d.name || '',  // Supabase usa 'name', JS usa 'nome'
                    name: d.name || d.nome || '',
                    description: d.description || ''
                }));
                localStorage.setItem('topservice_departamentos_v1', JSON.stringify(merged));
                window.departamentos = merged;
                console.log(`⬇️ departamentos: ${merged.length} total`);
            }

            // ===== CARGOS =====
            if (cargos && cargos.length > 0) {
                const local = (window.supabaseRealtime && window.supabaseRealtime.data.cargos) || [];
                const merged = smartMerge(local, cargos);
                localStorage.setItem('topservice_cargos_v1', JSON.stringify(merged));
                console.log(`⬇️ cargos: ${merged.length} total`);
            }

            // ===== AFASTAMENTOS =====
            if (afastamentos && afastamentos.length > 0) {
                const local = (window.supabaseRealtime && window.supabaseRealtime.data.afastamentos) || [];
                const merged = smartMerge(local, afastamentos, a => ({
                    ...a,
                    employeeId: a.employeeid || a.employeeId,
                    startDate: a.start_date || a.startDate,
                    endDate: a.end_date || a.endDate
                }));
                localStorage.setItem('topservice_afastamentos_v1', JSON.stringify(merged));
                window.afastamentos = merged;
                console.log(`⬇️ afastamentos: ${merged.length} total`);
            }

            // ===== AUSENCIAS =====
            if (ausencias && ausencias.length > 0) {
                const local = (window.supabaseRealtime && window.supabaseRealtime.data.absences) || [];
                const merged = smartMerge(local, ausencias, a => ({
                    ...a,
                    employeeId: a.employeeid || a.employeeId
                }));
                localStorage.setItem('topservice_absences_v1', JSON.stringify(merged));
                console.log(`⬇️ ausencias: ${merged.length} total`);
            }

            // ===== USERS =====
            if (users && users.length > 0) {
                const local = (window.supabaseRealtime && window.supabaseRealtime.data.users) || [];
                const merged = smartMerge(local, users);
                localStorage.setItem('topservice_users_v1', JSON.stringify(merged));
                console.log(`⬇️ users: ${merged.length} total`);
            }

            // ===== CONFIGURACOES =====
            if (configuracoes && configuracoes.length > 0) {
                const local = (window.supabaseRealtime && window.supabaseRealtime.data.configuracoes) || [];
                const merged = smartMerge(local, configuracoes);
                localStorage.setItem('topservice_configuracoes_v1', JSON.stringify(merged));
                console.log(`⬇️ configuracoes: ${merged.length} total`);
            }

            // ===== BANCO HORAS =====
            if (bancoHoras && bancoHoras.length > 0) {
                const local = (window.supabaseRealtime && window.supabaseRealtime.data.banco_horas) || [];
                const merged = smartMerge(local, bancoHoras, b => ({
                    ...b,
                    employeeId: b.employeeid || b.employeeId
                }));
                localStorage.setItem('topservice_banco_horas_v1', JSON.stringify(merged));
                console.log(`⬇️ banco_horas: ${merged.length} total`);
            }

            // ===== ADIANTAMENTOS =====
            if (adiantamentos && adiantamentos.length > 0) {
                const local = (window.supabaseRealtime && window.supabaseRealtime.data.adiantamentos) || [];
                const merged = smartMerge(local, adiantamentos, a => ({
                    ...a,
                    employeeId: a.employeeid || a.employeeId
                }));
                localStorage.setItem('topservice_adiantamentos_v1', JSON.stringify(merged));
                console.log(`⬇️ adiantamentos: ${merged.length} total`);
            }

            // ===== FERIAS =====
            if (ferias && ferias.length > 0) {
                const local = (window.supabaseRealtime && window.supabaseRealtime.data.ferias) || [];
                const merged = smartMerge(local, ferias, f => ({
                    ...f,
                    employeeId: f.employeeid || f.employeeId,
                    dataInicio: f.data_inicio || f.dataInicio,
                    dataFim: f.data_fim || f.dataFim
                }));
                localStorage.setItem('topservice_ferias_v1', JSON.stringify(merged));
                console.log(`⬇️ ferias: ${merged.length} total`);
            }

            // Disparar evento para atualizar UI
            window.dispatchEvent(new Event('dataChanged'));
            window.dispatchEvent(new Event('storageUpdated'));
            
            // Tentar renderizar se funções existirem
            if (typeof renderEmployeeList === 'function') renderEmployeeList();
            if (typeof renderDepartments === 'function') renderDepartments();
            if (typeof renderPunches === 'function') renderPunches();
            
            console.log('✅ Download completo!');
            return true;
        } catch (e) {
            console.error(`❌ Erro ao baixar dados: ${e.message}`);
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
