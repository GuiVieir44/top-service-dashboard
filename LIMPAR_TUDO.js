// ==========================================
// SCRIPT PARA LIMPAR TODOS OS DADOS
// Cole este código no Console do navegador (F12)
// ==========================================

(async function limparTudo() {
    const SUPABASE_URL = 'https://szwqezafiilwxgpyukxq.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3FlemFmaWlsd3hncHl1a3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTExNjAsImV4cCI6MjA4MDQyNzE2MH0.eENe9npKaeN9dCWTn019a04Ekl9EjXKaYJd-aGYuNt0';

    const tabelas = ['employees', 'departamentos', 'punches', 'afastamentos', 'cargos', 'ausencias', 'banco_horas', 'adiantamentos', 'ferias'];

    console.log('🗑️ INICIANDO LIMPEZA COMPLETA...');

    // 1. Limpar Supabase
    for (const tabela of tabelas) {
        try {
            // Deletar TODOS os registros (neq.0 = todos)
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?id=neq.00000000-0000-0000-0000-000000000000`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'apikey': SUPABASE_KEY,
                    'Prefer': 'return=representation'
                }
            });
            
            if (response.ok) {
                const deleted = await response.json();
                console.log(`✅ ${tabela}: ${deleted.length} registros deletados do Supabase`);
            } else {
                console.log(`⚠️ ${tabela}: ${response.status}`);
            }
        } catch(e) {
            console.log(`❌ ${tabela}: ${e.message}`);
        }
    }

    // 2. Limpar localStorage
    const keys = [
        'topservice_employees_v1',
        'topservice_departamentos_v1',
        'topservice_punches_v1',
        'topservice_afastamentos_v1',
        'topservice_cargos_v1',
        'topservice_ausencias_v1',
        'topservice_banco_horas_v1',
        'topservice_adiantamentos_v1',
        'topservice_ferias_v1'
    ];

    keys.forEach(key => {
        localStorage.setItem(key, '[]');
        console.log(`🧹 localStorage ${key} limpo`);
    });

    console.log('');
    console.log('✅ LIMPEZA COMPLETA!');
    console.log('🔄 Recarregue a página (F5) para ver as mudanças');
    
    // Recarregar automaticamente após 2 segundos
    setTimeout(() => location.reload(), 2000);
})();
