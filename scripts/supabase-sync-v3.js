// ==========================================
// SUPABASE SYNC V3 - VERSÃO LIMPA E SIMPLES
// ==========================================

(function(){
    console.log('🔄 Supabase Sync V3 - Versão Limpa');

    const SUPABASE_URL = 'https://szwqezafiilwxgpyukxq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3FlemFmaWlsd3hncHl1a3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTExNjAsImV4cCI6MjA4MDQyNzE2MH0.eENe9npKaeN9dCWTn019a04Ekl9EjXKaYJd-aGYuNt0';
    
    let isConnected = false;
    let isSyncing = false;

    // ===== REQUEST SIMPLES =====
    async function request(method, table, data = null, filter = null) {
        let url = `${SUPABASE_URL}/rest/v1/${table}`;
        if (filter) url += `?${filter}`;

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': method === 'POST' ? 'return=representation,resolution=merge-duplicates' : 'return=representation'
            }
        };

        if (data) options.body = JSON.stringify(data);

        const response = await fetch(url, options);
        if (!response.ok) {
            const err = await response.text();
            console.error(`❌ ${method} ${table}: ${err}`);
            return null;
        }
        return response.json();
    }

    // ===== UPLOAD: Local → Supabase =====
    async function uploadAll() {
        if (isSyncing) return;
        isSyncing = true;
        console.log('⬆️ Enviando dados para Supabase...');

        try {
            // EMPLOYEES
            const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
            for (const emp of employees) {
                if (emp.id) await request('POST', 'employees', emp);
            }
            console.log(`✅ ${employees.length} employees enviados`);

            // DEPARTAMENTOS
            const deptos = JSON.parse(localStorage.getItem('topservice_departamentos_v1') || '[]');
            for (const d of deptos) {
                if (d.id) {
                    const toSend = { id: d.id, name: d.nome || d.name || '', description: d.description || '' };
                    await request('POST', 'departamentos', toSend);
                }
            }
            console.log(`✅ ${deptos.length} departamentos enviados`);

            // PUNCHES
            const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
            for (const p of punches) {
                if (p.id) {
                    const toSend = { id: p.id, employeeid: p.employeeId || p.employeeid, type: p.type, timestamp: p.timestamp, status: p.status };
                    await request('POST', 'punches', toSend);
                }
            }
            console.log(`✅ ${punches.length} punches enviados`);

        } catch (e) {
            console.error('Erro no upload:', e);
        }
        isSyncing = false;
    }

    // ===== DOWNLOAD: Supabase → Local (SUBSTITUI, não duplica) =====
    async function downloadAll() {
        if (isSyncing) return;
        isSyncing = true;

        try {
            // EMPLOYEES - SUBSTITUI completamente
            const employees = await request('GET', 'employees');
            if (employees) {
                localStorage.setItem('topservice_employees_v1', JSON.stringify(employees));
                window.employees = employees;
            }

            // DEPARTAMENTOS - SUBSTITUI completamente
            const deptos = await request('GET', 'departamentos');
            if (deptos) {
                const normalized = deptos.map(d => ({
                    id: d.id,
                    nome: d.name || d.nome || '',
                    name: d.name || d.nome || '',
                    description: d.description || ''
                }));
                localStorage.setItem('topservice_departamentos_v1', JSON.stringify(normalized));
                window.departamentos = normalized;
            }

            // PUNCHES - SUBSTITUI completamente
            const punches = await request('GET', 'punches');
            if (punches) {
                const normalized = punches.map(p => ({
                    ...p,
                    employeeId: p.employeeid || p.employeeId
                }));
                localStorage.setItem('topservice_punches_v1', JSON.stringify(normalized));
                window.punches = normalized;
            }

            // Atualizar UI
            if (typeof renderEmployeeList === 'function') renderEmployeeList();
            if (typeof renderDepartments === 'function') renderDepartments();
            if (typeof renderPunches === 'function') renderPunches();

            console.log('⬇️ Dados sincronizados do Supabase');

        } catch (e) {
            console.error('Erro no download:', e);
        }
        isSyncing = false;
    }

    // ===== SYNC BIDIRECIONAL =====
    async function sync() {
        await uploadAll();
    }

    // ===== CONEXÃO =====
    async function checkConnection() {
        try {
            const result = await request('GET', 'employees', null, 'limit=1');
            isConnected = result !== null;
            console.log(isConnected ? '✅ Conectado ao Supabase' : '❌ Sem conexão');
            return isConnected;
        } catch {
            isConnected = false;
            return false;
        }
    }

    // ===== EXPOR API =====
    window.supabaseSync = {
        upload: uploadAll,
        download: downloadAll,
        sync,
        checkConnection,
        getStatus: () => ({ connected: isConnected, syncing: isSyncing })
    };

    // ===== INICIALIZAÇÃO =====
    setTimeout(async () => {
        await checkConnection();
        if (isConnected) {
            // Baixar dados na inicialização
            await downloadAll();
            
            // Auto-sync a cada 5 segundos (upload + download)
            setInterval(async () => {
                await uploadAll();
                await downloadAll();
            }, 5000);
        }
    }, 2000);

    console.log('✅ Supabase Sync V3 pronto!');
    console.log('📌 Comandos: supabaseSync.upload(), supabaseSync.download(), supabaseSync.sync()');
})();
