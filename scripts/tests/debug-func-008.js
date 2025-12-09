// ==========================================
// DEBUG: ANÁLISE DE HORAS EXTRAS - FUNCIONÁRIO 008
// ==========================================
// Investiga por que funcionário 008 tem 70 horas extras

console.log('🔍 INICIANDO DEBUG DE HORAS EXTRAS - FUNCIONÁRIO 008');

/**
 * Analisa todas as jornadas de um funcionário
 */
function debugFuncionario008() {
    try {
        // Carregar dados
        const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
        
        // Encontrar funcionário 008
        const emp008 = employees.find(e => e.matricula === '008');
        if (!emp008) {
            console.error('❌ Funcionário 008 não encontrado');
            return;
        }
        
        console.log(`\n👤 FUNCIONÁRIO: ${emp008.nome} (Matrícula: ${emp008.matricula})`);
        console.log(`📋 ID: ${emp008.id}`);
        
        // Filtrar punches de novembro
        const novembroPunches = punches.filter(p => {
            const date = new Date(p.timestamp);
            return date.getMonth() === 10 && date.getFullYear() === 2025 && String(p.employeeId) === String(emp008.id);
        });
        
        console.log(`\n📊 Total de punches em novembro: ${novembroPunches.length}`);
        
        // Ordenar por timestamp
        const sortedPunches = novembroPunches.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        // Mostrar todos os punches
        console.log('\n📝 TODOS OS PUNCHES:');
        sortedPunches.forEach((p, i) => {
            const date = new Date(p.timestamp);
            console.log(`  ${i+1}. [${date.toLocaleString('pt-BR')}] ${p.type} (ID: ${p.id})`);
        });
        
        // Construir jornadas (como faz na correção)
        console.log('\n🔨 CONSTRUINDO JORNADAS:');
        const journeys = [];
        for (let i = 0; i < sortedPunches.length; i++) {
            if (sortedPunches[i].type === 'Entrada') {
                let saida = null;
                for (let j = i + 1; j < sortedPunches.length; j++) {
                    if (sortedPunches[j].type === 'Saída') {
                        saida = sortedPunches[j];
                        break;
                    }
                }
                if (saida) {
                    journeys.push({
                        entrada: new Date(sortedPunches[i].timestamp),
                        saida: new Date(saida.timestamp),
                        entradaDay: sortedPunches[i].timestamp.split('T')[0]
                    });
                }
            }
        }
        
        console.log(`Total de jornadas encontradas: ${journeys.length}`);
        
        // Calcular horas
        let totalHoras = 0;
        let totalExtra = 0;
        
        console.log('\n⏰ DETALHES POR JORNADA:');
        journeys.forEach((j, idx) => {
            const horas = (j.saida - j.entrada) / (1000 * 60 * 60);
            const horasAjustadas = Math.max(0, horas - 1); // Desconta 1h intervalo
            totalHoras += horasAjustadas;
            
            console.log(`\n  Jornada ${idx + 1}:`);
            console.log(`    Entrada: ${j.entrada.toLocaleString('pt-BR')}`);
            console.log(`    Saída: ${j.saida.toLocaleString('pt-BR')}`);
            console.log(`    Duração bruta: ${horas.toFixed(2)}h`);
            console.log(`    Duração ajustada (- 1h intervalo): ${horasAjustadas.toFixed(2)}h`);
        });
        
        // Calcular extras (baseado em 8h por dia, 5 dias semana)
        const diasTrabalhados = journeys.length;
        const horasEsperadas = 8;
        totalExtra = totalHoras - (horasEsperadas * diasTrabalhados);
        
        console.log(`\n📊 RESUMO FINAL:`);
        console.log(`  Total de horas trabalhadas: ${totalHoras.toFixed(2)}h`);
        console.log(`  Dias trabalhados: ${diasTrabalhados}`);
        console.log(`  Horas esperadas (8h x ${diasTrabalhados}): ${(horasEsperadas * diasTrabalhados).toFixed(2)}h`);
        console.log(`  HORAS EXTRAS: ${Math.max(0, totalExtra).toFixed(2)}h`);
        
        // Verificar se há problemas
        console.log(`\n⚠️ DIAGNÓSTICO:`);
        if (journeys.length === 0) {
            console.log('  ❌ PROBLEMA: Nenhuma jornada encontrada!');
        } else if (totalExtra > 20) {
            console.log('  ⚠️ ALERTA: Muitas horas extras (> 20h)');
            console.log('  Possíveis causas:');
            console.log('    1. Pontos com horários muito distantes (falta intervalo)');
            console.log('    2. Múltiplas entradas sem saída correspondente');
            console.log('    3. Dados inconsistentes');
        } else if (totalExtra < 0) {
            console.log('  ✅ Funcionário tem menos horas que o esperado');
        } else {
            console.log('  ✅ Horas extras parecem normais');
        }
        
        return {
            funcionario: emp008.nome,
            matricula: emp008.matricula,
            totalPunches: novembroPunches.length,
            totalJornadas: journeys.length,
            totalHoras: totalHoras,
            horasEsperadas: horasEsperadas * diasTrabalhados,
            horasExtras: Math.max(0, totalExtra),
            jornadas: journeys
        };
        
    } catch (e) {
        console.error('❌ Erro no debug:', e);
    }
}

/**
 * Mostra problemas potenciais nos pontos
 */
function verificarProblemasFunc008() {
    console.log('\n🔎 VERIFICANDO PROBLEMAS NOS PONTOS:');
    
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const emp008 = employees.find(e => e.matricula === '008');
    
    if (!emp008) return;
    
    const emp008Punches = punches.filter(p => 
        new Date(p.timestamp).getMonth() === 10 && 
        String(p.employeeId) === String(emp008.id)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    console.log('\n📍 Verificando sequência de Entrada/Saída:');
    
    let issues = 0;
    for (let i = 0; i < emp008Punches.length - 1; i++) {
        const current = emp008Punches[i];
        const next = emp008Punches[i + 1];
        
        // Verificar se há duas entradas seguidas
        if (current.type === 'Entrada' && next.type === 'Entrada') {
            issues++;
            console.log(`  ⚠️ PROBLEMA ${issues}: Duas entradas seguidas!`);
            console.log(`     - ${new Date(current.timestamp).toLocaleString('pt-BR')} (Entrada)`);
            console.log(`     - ${new Date(next.timestamp).toLocaleString('pt-BR')} (Entrada)`);
        }
        
        // Verificar se há duas saídas seguidas
        if (current.type === 'Saída' && next.type === 'Saída') {
            issues++;
            console.log(`  ⚠️ PROBLEMA ${issues}: Duas saídas seguidas!`);
            console.log(`     - ${new Date(current.timestamp).toLocaleString('pt-BR')} (Saída)`);
            console.log(`     - ${new Date(next.timestamp).toLocaleString('pt-BR')} (Saída)`);
        }
        
        // Verificar intervalos muito grandes
        if (current.type === 'Entrada' && next.type === 'Saída') {
            const diff = (new Date(next.timestamp) - new Date(current.timestamp)) / (1000 * 60 * 60);
            if (diff > 14) {
                issues++;
                console.log(`  ⚠️ PROBLEMA ${issues}: Jornada muito longa (${diff.toFixed(2)}h)!`);
                console.log(`     - Entrada: ${new Date(current.timestamp).toLocaleString('pt-BR')}`);
                console.log(`     - Saída: ${new Date(next.timestamp).toLocaleString('pt-BR')}`);
            }
        }
    }
    
    if (issues === 0) {
        console.log('  ✅ Nenhum problema óbvio encontrado na sequência');
    } else {
        console.log(`\n  🔴 Total de problemas encontrados: ${issues}`);
    }
}

/**
 * Função para limpar pontos problemáticos (se necessário)
 */
function fixarFunc008Punches() {
    console.log('\n🔧 TENTANDO CORRIGIR PROBLEMAS:');
    
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    let punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const emp008 = employees.find(e => e.matricula === '008');
    
    if (!emp008) {
        console.error('Funcionário 008 não encontrado');
        return;
    }
    
    const originalCount = punches.length;
    
    // Remover punches duplicados de 008
    const emp008Punches = punches.filter(p => String(p.employeeId) === String(emp008.id));
    console.log(`Punches do 008: ${emp008Punches.length}`);
    
    // Filtrar para remover duplicatas
    const uniquePunches = [];
    const seen = new Set();
    
    for (const p of punches) {
        const key = `${p.employeeId}-${p.timestamp}-${p.type}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniquePunches.push(p);
        }
    }
    
    punches = uniquePunches;
    
    if (originalCount !== punches.length) {
        console.log(`✅ Removidas ${originalCount - punches.length} duplicatas`);
        localStorage.setItem('topservice_punches_v1', JSON.stringify(punches));
    } else {
        console.log('ℹ️ Nenhuma duplicata encontrada');
    }
}

// ===== EXECUTAR DEBUG AUTOMÁTICO =====
console.log('\n' + '='.repeat(50));
const resultado = debugFuncionario008();
verificarProblemasFunc008();
console.log('='.repeat(50) + '\n');

console.log('📌 Funções disponíveis:');
console.log('  - debugFuncionario008() : Debug completo');
console.log('  - verificarProblemasFunc008() : Verificar problemas');
console.log('  - fixarFunc008Punches() : Remover duplicatas');
