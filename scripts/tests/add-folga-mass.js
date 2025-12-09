// ==========================================
// SCRIPT PARA ADICIONAR FOLGA EM MASSA
// ==========================================
// Adiciona folga de 01/11 até 25/11 para todos os funcionários exceto matricula 001

console.log('🌴 Script de adição em massa de folgas carregado!');

/**
 * Adiciona folga para todos os funcionários (exceto matricula 001)
 * Data: 01/11 até 25/11
 */
async function addFolgaMassaNovoembro() {
    console.log('🌴 Iniciando adição em massa de folgas...');
    
    try {
        // Carregar funcionários
        const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        console.log(`👥 Total de funcionários: ${employees.length}`);
        
        // Filtrar (excluir matricula 001)
        const employeesForFolga = employees.filter(emp => emp.matricula !== '001');
        console.log(`✅ Funcionários que receberão folga: ${employeesForFolga.length}`);
        console.log(`❌ Funcionários excluídos (matricula 001): ${employees.length - employeesForFolga.length}`);
        
        // Datas: 01/11 até 25/11
        const startDate = new Date(2025, 10, 1); // 01/11/2025
        const endDate = new Date(2025, 10, 25);   // 25/11/2025
        
        let totalFolgas = 0;
        let folgasAdicionadas = [];
        
        // Para cada funcionário
        for (const emp of employeesForFolga) {
            // Para cada dia do período
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0]; // formato YYYY-MM-DD
                
                // Chamar a função para marcar folga
                saveAbsence(emp.id, dateStr, 'folga');
                totalFolgas++;
                
                folgasAdicionadas.push({
                    employeeId: emp.id,
                    nome: emp.nome,
                    matricula: emp.matricula,
                    date: dateStr
                });
            }
        }
        
        console.log(`✅ Total de folgas adicionadas: ${totalFolgas}`);
        console.log(`📊 Folgas por funcionário: ${totalFolgas / employeesForFolga.length} dias`);
        
        // Exibir resumo
        console.table(folgasAdicionadas.slice(0, 20)); // Mostrar primeiras 20
        
        // Exibir toast
        showToast(`✅ ${totalFolgas} folgas adicionadas com sucesso!`, 'success');
        
        // Atualizar tabela se estiver aberta
        if (typeof refreshPunchTable === 'function') {
            setTimeout(() => {
                refreshPunchTable();
            }, 500);
        }
        
        return {
            sucesso: true,
            totalFolgas: totalFolgas,
            funcionariosAfetados: employeesForFolga.length,
            periodo: `01/11/2025 até 25/11/2025`,
            excluidos: ['001']
        };
        
    } catch (error) {
        console.error('❌ Erro ao adicionar folgas:', error);
        showToast('Erro ao adicionar folgas em massa!', 'error');
        return {
            sucesso: false,
            erro: error.message
        };
    }
}

/**
 * Remove todas as folgas do período 01/11 até 25/11
 */
async function removeFolgaMassaNovembro() {
    console.log('🗑️ Removendo folgas...');
    
    try {
        const absences = JSON.parse(localStorage.getItem('topservice_absences_v1') || '[]');
        const startDate = '2025-11-01';
        const endDate = '2025-11-25';
        
        // Filtrar apenas folgas do período
        const novasList = absences.filter(a => 
            !(a.type === 'folga' && a.date >= startDate && a.date <= endDate)
        );
        
        const removidas = absences.length - novasList.length;
        
        localStorage.setItem('topservice_absences_v1', JSON.stringify(novasList));
        
        console.log(`✅ ${removidas} folgas removidas`);
        showToast(`✅ ${removidas} folgas removidas!`, 'success');
        
        if (typeof refreshPunchTable === 'function') {
            setTimeout(() => {
                refreshPunchTable();
            }, 500);
        }
        
        return {
            sucesso: true,
            folgasRemovidas: removidas
        };
        
    } catch (error) {
        console.error('❌ Erro ao remover folgas:', error);
        showToast('Erro ao remover folgas!', 'error');
        return {
            sucesso: false,
            erro: error.message
        };
    }
}

/**
 * Exibe relatório das folgas adicionadas
 */
function gerarRelatorioFolgas() {
    console.log('📋 Gerando relatório de folgas...');
    
    const absences = JSON.parse(localStorage.getItem('topservice_absences_v1') || '[]');
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    
    const folgasNovembro = absences.filter(a => 
        a.type === 'folga' && a.date >= '2025-11-01' && a.date <= '2025-11-25'
    );
    
    console.log(`📊 Total de folgas (01/11 até 25/11): ${folgasNovembro.length}`);
    
    // Agrupar por funcionário
    const folgasPorFunc = {};
    folgasNovembro.forEach(f => {
        if (!folgasPorFunc[f.employeeId]) {
            const emp = employees.find(e => e.id == f.employeeId);
            folgasPorFunc[f.employeeId] = {
                nome: emp?.nome || `Funcionário ${f.employeeId}`,
                matricula: emp?.matricula || '?',
                folgas: []
            };
        }
        folgasPorFunc[f.employeeId].folgas.push(f.date);
    });
    
    console.table(Object.entries(folgasPorFunc).map(([id, data]) => ({
        'Matrícula': data.matricula,
        'Nome': data.nome,
        'Total de Folgas': data.folgas.length,
        'Dias': data.folgas.join(', ').substring(0, 50) + '...'
    })));
    
    return folgasPorFunc;
}

/**
 * Exibe menu de controle
 */
function mostrarMenuFolgas() {
    const html = `
        <div style="position: fixed; bottom: 20px; right: 20px; background: white; border: 2px solid #3498db; border-radius: 10px; padding: 15px; z-index: 9000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: Arial, sans-serif;">
            <div style="font-weight: bold; margin-bottom: 10px; color: #333;">🌴 Controle de Folgas</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button onclick="addFolgaMassaNovoembro()" style="padding: 8px 12px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                    ✅ Adicionar Folgas
                </button>
                <button onclick="removeFolgaMassaNovembro()" style="padding: 8px 12px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                    🗑️ Remover Folgas
                </button>
                <button onclick="gerarRelatorioFolgas()" style="padding: 8px 12px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                    📋 Ver Relatório
                </button>
                <button onclick="this.parentElement.parentElement.remove()" style="padding: 8px 12px; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                    ❌ Fechar
                </button>
            </div>
        </div>
    `;
    
    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

console.log('✅ Funções disponíveis:');
console.log('  - addFolgaMassaNovoembro() : Adiciona folgas de 01/11 até 25/11');
console.log('  - removeFolgaMassaNovembro() : Remove as folgas');
console.log('  - gerarRelatorioFolgas() : Mostra relatório das folgas');
console.log('  - mostrarMenuFolgas() : Mostra menu de controle');
