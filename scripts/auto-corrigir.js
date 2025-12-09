// ==========================================
// AUTO-CORREÇÃO: REMOVER PUNCHES DUPLICADOS
// ==========================================
// Executa automaticamente ao carregar

console.log('🚀 INICIANDO AUTO-CORREÇÃO DE PUNCHES...\n');

(async function autoCorrigir() {
    try {
        const employees = (window.supabaseRealtime && window.supabaseRealtime.data.employees) || [];
        let punches = (window.supabaseRealtime && window.supabaseRealtime.data.punches) || [];
        
        const originalCount = punches.length;
        console.log(`📊 Total de punches antes: ${originalCount}\n`);
        
        // Agrupar por dia/funcionário
        const punchesPorDiaFunc = {};
        
        punches.forEach(p => {
            const day = p.timestamp.split('T')[0];
            const key = `${p.employeeId}-${day}`;
            
            if (!punchesPorDiaFunc[key]) {
                punchesPorDiaFunc[key] = [];
            }
            punchesPorDiaFunc[key].push(p);
        });
        
        console.log('🔍 ENCONTRANDO PROBLEMAS:\n');
        
        const punchesARemover = [];
        const problematicos = [];
        
        // Para cada dia/funcionário
        for (const [key, dayPunches] of Object.entries(punchesPorDiaFunc)) {
            if (dayPunches.length > 2) {
                const [empId, day] = key.split('-');
                const emp = employees.find(e => String(e.id) === empId);
                const empInfo = emp ? `${emp.matricula} - ${emp.nome}` : `ID ${empId}`;
                
                problematicos.push({
                    dia: day,
                    funcionario: empInfo,
                    problemas: dayPunches.length,
                    removidos: dayPunches.length - 2
                });
                
                console.log(`⚠️ ${day} | ${empInfo}`);
                console.log(`   ${dayPunches.length} punches encontrados (esperado: 2)\n`);
                
                // Lógica de correção: manter a primeira entrada e a última saída
                const entradas = dayPunches.filter(p => p.type === 'Entrada').sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                const saidas = dayPunches.filter(p => p.type === 'Saída').sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                if (entradas.length > 1) {
                    punchesARemover.push(...entradas.slice(1));
                }
                if (saidas.length > 1) {
                    punchesARemover.push(...saidas.slice(0, -1));
                }
            }
        }
        
        if (punchesARemover.length > 0) {
            console.log('🔥 PUNCHES A SEREM REMOVIDOS:\n');
            console.table(problematicos);
            
            console.log(`\nTotal de punches a remover: ${punchesARemover.length}`);
            
            // Usar a função `removePunch` assíncrona
            for (const punch of punchesARemover) {
                // Assumindo que `removePunch(punch.id)` existe e foi refatorada
                if (typeof removePunch === 'function') {
                    await removePunch(punch.id);
                } else {
                    console.error('Função `removePunch` não encontrada. Não foi possível remover o punch:', punch.id);
                }
            }

            console.log(`\n✅ ${punchesARemover.length} punches duplicados foram removidos.`);
            showToast(`Auto-correção: ${punchesARemover.length} pontos corrigidos.`, 'success');
            
            // Atualizar a interface
            if (typeof refreshPunchTable === 'function') {
                setTimeout(refreshPunchTable, 500);
            }
            
        } else {
            console.log('✅ Nenhum punch duplicado encontrado. Tudo certo!');
        }
        
    } catch (e) {
        console.error('❌ Erro na auto-correção:', e);
    }
})();

console.log('='.repeat(60));
