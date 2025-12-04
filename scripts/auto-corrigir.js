// ==========================================
// AUTO-CORREÇÃO: REMOVER PUNCHES DUPLICADOS
// ==========================================
// Executa automaticamente ao carregar

console.log('🚀 INICIANDO AUTO-CORREÇÃO DE PUNCHES...\n');

(function autoCorrigir() {
    try {
        const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        let punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
        
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
        
        const punchesAManter = [];
        let remover = 0;
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
                
                // Separar e manter apenas primeira entrada e última saída
                const entradas = dayPunches.filter(p => p.type === 'Entrada')
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                const saidas = dayPunches.filter(p => p.type === 'Saída')
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                
                if (entradas.length > 0) {
                    punchesAManter.push(entradas[0]); // Primeira entrada
                    remover += entradas.length - 1;
                }
                
                if (saidas.length > 0) {
                    punchesAManter.push(saidas[saidas.length - 1]); // Última saída
                    remover += saidas.length - 1;
                }
            } else {
                // Normal: manter todos
                punchesAManter.push(...dayPunches);
            }
        }
        
        // Atualizar localStorage
        localStorage.setItem('topservice_punches_v1', JSON.stringify(punchesAManter));
        window.punches = punchesAManter;
        
        console.log('\n✅ RESUMO DA CORREÇÃO:\n');
        console.log(`   📊 Punches antes: ${originalCount}`);
        console.log(`   🗑️ Duplicados removidos: ${remover}`);
        console.log(`   📊 Punches depois: ${punchesAManter.length}`);
        
        if (problematicos.length > 0) {
            console.log(`\n⚠️ PROBLEMAS CORRIGIDOS:\n`);
            console.table(problematicos);
        }
        
        // Notificar persistência
        if (typeof window.scheduleDebouncedsave === 'function') {
            window.scheduleDebouncedsave();
        }
        
        console.log('\n✨ CORREÇÃO CONCLUÍDA COM SUCESSO!\n');
        
        // Mostrar notificação no UI
        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast(`✅ ${remover} punches duplicados removidos!`, 'success');
            }
            
            // Atualizar tabelas
            if (typeof refreshPunchTable === 'function') {
                refreshPunchTable();
            }
        }, 1000);
        
    } catch (e) {
        console.error('❌ ERRO NA CORREÇÃO:', e);
        if (typeof showToast === 'function') {
            showToast('❌ Erro ao corrigir punches!', 'error');
        }
    }
})();

console.log('='.repeat(60));
