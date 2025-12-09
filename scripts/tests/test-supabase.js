// ==========================================
// TESTE DE INTEGRAÇÃO SUPABASE
// Abra o console e execute: testSupabaseIntegration()
// ==========================================

window.testSupabaseIntegration = async function() {
    console.clear();
    console.log('%c🧪 TESTE DE INTEGRAÇÃO SUPABASE', 'color: #3b82f6; font-weight: bold; font-size: 16px;');
    console.log('=' .repeat(50));

    // ===== TESTE 1: Verificar se script foi carregado =====
    console.log('\n1️⃣ Verificando se Supabase Sync foi carregado...');
    if (typeof window.supabaseSync === 'object') {
        console.log('%c✅ window.supabaseSync carregado com sucesso!', 'color: #10b981; font-weight: bold;');
        console.log('Métodos disponíveis:', Object.keys(window.supabaseSync));
    } else {
        console.error('%c❌ window.supabaseSync NÃO foi carregado!', 'color: #ef4444; font-weight: bold;');
        return;
    }

    // ===== TESTE 2: Verificar conexão com Supabase =====
    console.log('\n2️⃣ Testando conexão com Supabase...');
    const connected = await window.supabaseSync.checkConnection();
    if (connected) {
        console.log('%c✅ Conectado ao Supabase!', 'color: #10b981; font-weight: bold;');
    } else {
        console.error('%c❌ Falha ao conectar ao Supabase!', 'color: #ef4444; font-weight: bold;');
        return;
    }

    // ===== TESTE 3: Verificar dados locais =====
    console.log('\n3️⃣ Verificando dados locais...');
    console.log(`   📦 Employees: ${(window.employees || []).length} registros`);
    console.log(`   ⏰ Punches: ${(window.punches || []).length} registros`);
    console.log(`   🏖️ Afastamentos: ${(window.afastamentos || []).length} registros`);
    console.log(`   🏢 Departamentos: ${(window.departamentos || []).length} registros`);

    // ===== TESTE 4: Sincronizar dados =====
    console.log('\n4️⃣ Sincronizando com Supabase...');
    const syncResult = await window.supabaseSync.syncAllData();
    if (syncResult) {
        console.log('%c✅ Sincronização concluída!', 'color: #10b981; font-weight: bold;');
    } else {
        console.error('%c⚠️ Sincronização teve erros. Verifique console acima.', 'color: #f59e0b; font-weight: bold;');
    }

    // ===== TESTE 5: Status =====
    console.log('\n5️⃣ Status do sistema:');
    const status = window.supabaseSync.getStatus();
    console.table(status);

    console.log('\n' + '='.repeat(50));
    console.log('%c✅ Teste concluído!', 'color: #3b82f6; font-weight: bold; font-size: 14px;');
    console.log('💡 Dica: Use supabaseSync.syncAllData() para sincronizar manualmente');
    console.log('💡 Dica: Use supabaseSync.downloadFromSupabase() para baixar dados do servidor');
};

// ===== TESTE RÁPIDO DE CONECTIVIDADE =====
window.testSupabaseConnection = async function() {
    console.log('%c🔌 Testando conexão Supabase...', 'color: #3b82f6; font-weight: bold;');
    
    try {
        const response = await fetch('https://szwqezafiilwxgpyukxq.supabase.co/rest/v1/employees?limit=1', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3FlemFmaWlsd3hncHl1a3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTExNjAsImV4cCI6MjA4MDQyNzE2MH0.eENe9npKaeN9dCWTn019a04Ekl9EjXKaYJd-aGYuNt0',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3FlemFmaWlsd3hncHl1a3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTExNjAsImV4cCI6MjA4MDQyNzE2MH0.eENe9npKaeN9dCWTn019a04Ekl9EjXKaYJd-aGYuNt0'
            }
        });

        if (response.ok) {
            console.log('%c✅ Conexão bem-sucedida!', 'color: #10b981; font-weight: bold;');
            console.log('Resposta da API:', await response.json());
        } else {
            console.error(`%c❌ Erro ${response.status}: ${response.statusText}`, 'color: #ef4444; font-weight: bold;');
        }
    } catch (e) {
        console.error('%c❌ Erro de conectividade:', 'color: #ef4444; font-weight: bold;', e.message);
    }
};

// Desabilitado para evitar spam no console
// console.log('%c✅ Script de teste carregado!', 'color: #10b981; font-weight: bold;');
// console.log('Execute no console: testSupabaseIntegration() ou testSupabaseConnection()');
