// ==========================================
// CORRIGIR HORAS EXTRAS - PADRÃO DO 008
// ==========================================
// Identifica e corrige o padrão de erro do funcionário 008
// em TODOS os funcionários

console.log('🔧 SISTEMA DE CORREÇÃO DE HORAS EXTRAS\n');

/**
 * Diagnostica o problema específico do funcionário 008
 */
function diagnosticar008() {
    console.log('🔍 DIAGNÓSTICO FUNCIONÁRIO 008:\n');
    
    try {
        const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
        
        const emp008 = employees.find(e => e.matricula === '008');
        if (!emp008) {
            console.error('❌ Funcionário 008 não encontrado');
            return null;
        }
        
        // Filtrar punches de novembro
        const emp008Punches = punches.filter(p => {
            const date = new Date(p.timestamp);
            return date.getMonth() === 10 && 
                   date.getFullYear() === 2025 && 
                   String(p.employeeId) === String(emp008.id);
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        console.log(`Funcionário: ${emp008.nome}`);
        console.log(`Total de punches: ${emp008Punches.length}`);
        
        // Agrupar por dia
        const byDay = {};
        emp008Punches.forEach(p => {
            const day = p.timestamp.split('T')[0];
            if (!byDay[day]) byDay[day] = [];
            byDay[day].push(p);
        });
        
        console.log(`\nDias com pontos: ${Object.keys(byDay).length}`);
        
        // Analisar problemas
        let diagnostico = {
            duplicadas: 0,
            doisEntradas: 0,
            doisSaidas: 0,
            sEmParPonches: 0,
            pontosTotal: emp008Punches.length,
            dias: Object.keys(byDay).length
        };
        
        console.log('\n📋 ANÁLISE POR DIA:\n');
        
        for (const [day, dayPunches] of Object.entries(byDay)) {
            if (dayPunches.length > 2) {
                console.log(`  ${day}: ${dayPunches.length} punches (⚠️ ANORMAL - esperado 2)`);
                dayPunches.forEach((p, i) => {
                    console.log(`    ${i+1}. ${new Date(p.timestamp).toLocaleTimeString('pt-BR')} - ${p.type}`);
                });
                
                // Contar problemas
                if (dayPunches.filter(p => p.type === 'Entrada').length > 1) {
                    diagnostico.doisEntradas++;
                }
                if (dayPunches.filter(p => p.type === 'Saída').length > 1) {
                    diagnostico.doisSaidas++;
                }
            } else if (dayPunches.length === 1) {
                console.log(`  ${day}: ${dayPunches.length} punch (⚠️ SEM PAR - ${dayPunches[0].type})`);
                diagnostico.sEmParPonches++;
            }
        }
        
        console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
        console.log(diagnostico);
        
        return diagnostico;
        
    } catch (e) {
        console.error('❌ Erro:', e);
    }
}

/**
 * Encontra TODOS os funcionários com o MESMO padrão de erro do 008
 */
function encontrarComMesmoPadrao() {
    console.log('\n🔎 PROCURANDO POR MESMO PADRÃO EM OUTROS FUNCIONÁRIOS:\n');
    
    try {
        const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
        
        // Primeiro, diagnosticar 008
        const diag008 = diagnosticar008();
        
        if (!diag008) return [];
        
        console.log('\n🔍 PROCURANDO PADRÃO...\n');
        
        const problematicos = [];
        
        for (const emp of employees) {
            const empPunches = punches.filter(p => {
                const date = new Date(p.timestamp);
                return date.getMonth() === 10 && 
                       date.getFullYear() === 2025 && 
                       String(p.employeeId) === String(emp.id);
            }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            if (empPunches.length === 0) continue;
            
            // Agrupar por dia
            const byDay = {};
            empPunches.forEach(p => {
                const day = p.timestamp.split('T')[0];
                if (!byDay[day]) byDay[day] = [];
                byDay[day].push(p);
            });
            
            // Verificar se tem dias com mais de 2 punches (PADRÃO DO 008)
            let diasAnormais = 0;
            for (const dayPunches of Object.values(byDay)) {
                if (dayPunches.length > 2) {
                    diasAnormais++;
                }
            }
            
            // Se tem dias anormais, é o mesmo padrão
            if (diasAnormais > 0) {
                problematicos.push({
                    matricula: emp.matricula,
                    nome: emp.nome,
                    totalPunches: empPunches.length,
                    diasComAnomalia: diasAnormais,
                    diasTotal: Object.keys(byDay).length
                });
            }
        }
        
        console.log(`⚠️ FUNCIONÁRIOS COM MESMO PADRÃO:\n`);
        if (problematicos.length === 0) {
            console.log('  ✅ Nenhum outro funcionário com este padrão encontrado');
        } else {
            console.table(problematicos);
        }
        
        return problematicos;
        
    } catch (e) {
        console.error('❌ Erro:', e);
    }
}

/**
 * CORRIGE punches duplicados/malformados
 * Remove punches extra que causam horas extras incorretas
 */
function corrigirPunchesProblematicos() {
    console.log('\n🔧 CORRIGINDO PUNCHES DUPLICADOS/MALFORMADOS:\n');
    
    try {
        const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        let punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
        
        const originalCount = punches.length;
        
        // Estratégia: Para cada dia, cada funcionário deve ter no máximo 2 punches (entrada + saída)
        // Se tiver mais, remover os duplicados
        
        const punchesPorDiaFunc = {};
        const punchesAManter = [];
        
        punches.forEach(p => {
            const day = p.timestamp.split('T')[0];
            const key = `${p.employeeId}-${day}`;
            
            if (!punchesPorDiaFunc[key]) {
                punchesPorDiaFunc[key] = [];
            }
            
            punchesPorDiaFunc[key].push(p);
        });
        
        console.log('📋 Analisando ponches...\n');
        
        let remover = 0;
        
        // Para cada dia/funcionário
        for (const [key, dayPunches] of Object.entries(punchesPorDiaFunc)) {
            if (dayPunches.length > 2) {
                console.log(`⚠️ ${key}: ${dayPunches.length} punches encontrados`);
                
                // Separar entradas e saídas
                const entradas = dayPunches.filter(p => p.type === 'Entrada');
                const saidas = dayPunches.filter(p => p.type === 'Saída');
                
                console.log(`   - ${entradas.length} Entradas`);
                console.log(`   - ${saidas.length} Saídas`);
                
                // Estratégia: manter apenas a PRIMEIRA entrada e a ÚLTIMA saída
                if (entradas.length > 1) {
                    // Ordenar por timestamp e manter apenas a primeira
                    const entradasOrdenadas = entradas.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                    punchesAManter.push(entradasOrdenadas[0]);
                    console.log(`   ✅ Mantendo entrada: ${new Date(entradasOrdenadas[0].timestamp).toLocaleString('pt-BR')}`);
                    
                    // Adicionar as outras para remover
                    for (let i = 1; i < entradasOrdenadas.length; i++) {
                        console.log(`   🗑️ Removendo entrada duplicada: ${new Date(entradasOrdenadas[i].timestamp).toLocaleString('pt-BR')}`);
                        remover++;
                    }
                } else if (entradas.length === 1) {
                    punchesAManter.push(entradas[0]);
                }
                
                if (saidas.length > 1) {
                    // Ordenar por timestamp e manter apenas a última
                    const saidasOrdenadas = saidas.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                    punchesAManter.push(saidasOrdenadas[saidasOrdenadas.length - 1]);
                    console.log(`   ✅ Mantendo saída: ${new Date(saidasOrdenadas[saidasOrdenadas.length - 1].timestamp).toLocaleString('pt-BR')}`);
                    
                    // Adicionar as outras para remover
                    for (let i = 0; i < saidasOrdenadas.length - 1; i++) {
                        console.log(`   🗑️ Removendo saída duplicada: ${new Date(saidasOrdenadas[i].timestamp).toLocaleString('pt-BR')}`);
                        remover++;
                    }
                } else if (saidas.length === 1) {
                    punchesAManter.push(saidas[0]);
                }
            } else {
                // Normal: manter todos
                punchesAManter.push(...dayPunches);
            }
        }
        
        // Atualizar localStorage
        localStorage.setItem('topservice_punches_v1', JSON.stringify(punchesAManter));
        
        console.log(`\n✅ CORREÇÃO CONCLUÍDA:`);
        console.log(`   Ponches antes: ${originalCount}`);
        console.log(`   Ponches removidos: ${remover}`);
        console.log(`   Ponches após: ${punchesAManter.length}`);
        
        // Atualizar global
        window.punches = punchesAManter;
        
        // Notificar persistência
        if (typeof window.scheduleDebouncedsave === 'function') {
            window.scheduleDebouncedsave();
        }
        
        // Atualizar UI
        if (typeof refreshPunchTable === 'function') {
            setTimeout(() => refreshPunchTable(), 500);
        }
        
        showToast(`✅ ${remover} ponches duplicados removidos!`, 'success');
        
        return {
            sucesso: true,
            antes: originalCount,
            removidos: remover,
            depois: punchesAManter.length
        };
        
    } catch (e) {
        console.error('❌ Erro na correção:', e);
        showToast('❌ Erro ao corrigir punches!', 'error');
        return {
            sucesso: false,
            erro: e.message
        };
    }
}

// ===== EXECUTAR =====
console.log('='.repeat(60));
diagnosticar008();
console.log('='.repeat(60));

console.log('\n📌 INSTRUÇÕES:\n');
console.log('1. Execute: encontrarComMesmoPadrao()');
console.log('   → Vai listar todos os funcionários com mesmo padrão\n');
console.log('2. Execute: corrigirPunchesProblematicos()');
console.log('   → Vai remover punches duplicados/malformados\n');
console.log('3. Atualize o dashboard para ver as horas corretas');
