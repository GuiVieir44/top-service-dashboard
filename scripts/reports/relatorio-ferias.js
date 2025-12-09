// ==========================================
// RELATÓRIO DE PROGRAMAÇÃO DE FÉRIAS
// ==========================================

console.log('📅 Relatório de Férias carregado!');

/**
 * Calcula dados de férias para um funcionário
 */
function calculateVacationData(employee) {
    const admissaoDate = new Date(employee.admissao);
    const today = new Date();
    
    // Meses trabalhados
    let mesesTrabalhados = (today.getFullYear() - admissaoDate.getFullYear()) * 12 + 
                           (today.getMonth() - admissaoDate.getMonth());
    
    // Férias são adquiridas após 12 meses
    let diasFeriasAdquiridos = 0;
    let anosCompletos = Math.floor(mesesTrabalhados / 12);
    
    // Cálculo padrão: 20 dias por ano para maioria das categorias
    diasFeriasAdquiridos = anosCompletos * 20;
    
    // Se ainda não completou 12 meses, nenhuma féria
    if (anosCompletos === 0) {
        diasFeriasAdquiridos = 0;
    }
    
    // Próxima data de vencimento (1 ano após data de admissão)
    const proximoVencimento = new Date(admissaoDate);
    proximoVencimento.setFullYear(proximoVencimento.getFullYear() + anosCompletos + 1);
    
    // Limite para gozo (11 meses após vencimento)
    const limiteGozo = new Date(proximoVencimento);
    limiteGozo.setMonth(limiteGozo.getMonth() + 11);
    
    // Calcular dias utilizados
    const afastamentos = JSON.parse(localStorage.getItem('topservice_afastamentos_v1') || '[]');
    const feriasFuncionario = afastamentos.filter(a => 
        a.funcionarioId === employee.id && a.tipo === 'Férias'
    );
    
    let diasUtilizados = 0;
    feriasFuncionario.forEach(ferias => {
        const dataInicio = new Date(ferias.dataInicio);
        const dataFim = new Date(ferias.dataFim);
        const dias = Math.floor((dataFim - dataInicio) / (1000 * 60 * 60 * 24)) + 1;
        diasUtilizados += dias;
    });
    
    // Saldo disponível
    const diasDisponiveis = diasFeriasAdquiridos - diasUtilizados;
    
    // Status
    let status = 'Não elegível';
    if (anosCompletos > 0) {
        if (diasDisponiveis === 0) status = 'Sem saldo';
        else if (diasDisponiveis < 0) status = 'Em débito';
        else status = 'Disponível';
    }
    
    return {
        anosCompletos,
        diasFeriasAdquiridos,
        diasUtilizados,
        diasDisponiveis,
        proximoVencimento,
        limiteGozo,
        status
    };
}

/**
 * Formata data para padrão brasileiro
 */
function formatarDataBR(data) {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
}

/**
 * Gera o relatório de férias em HTML
 */
function gerarRelatarioFerias() {
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    
    if (employees.length === 0) {
        return '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">Nenhum funcionário cadastrado.</p>';
    }
    
    // Ordenar por departamento e nome
    const sortedEmployees = [...employees].sort((a, b) => {
        const deptCmp = (a.departamento || '').localeCompare(b.departamento || '');
        if (deptCmp !== 0) return deptCmp;
        return (a.nome || '').localeCompare(b.nome || '');
    });
    
    let html = `
        <div style="padding: 20px;">
            <h3 style="margin-top: 0; color: var(--text-primary); border-bottom: 2px solid var(--primary-color); padding-bottom: 10px;">📅 Programação de Férias</h3>
            
            <div style="margin-bottom: 20px; font-size: 0.9em; color: var(--text-secondary);">
                Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
            </div>
            
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85em; border: 1px solid var(--border-color);">
                    <thead>
                        <tr style="background: var(--bg-secondary);">
                            <th style="padding: 10px; text-align: left; border: 1px solid var(--border-color); font-weight: 600;">Funcionário</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid var(--border-color); font-weight: 600;">Departamento</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid var(--border-color); font-weight: 600;">Cargo</th>
                            <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Admissão</th>
                            <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Anos</th>
                            <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Adquiridos</th>
                            <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Utilizados</th>
                            <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Saldo</th>
                            <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Vencimento</th>
                            <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Limite Gozo</th>
                            <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    sortedEmployees.forEach(emp => {
        const vaca = calculateVacationData(emp);
        
        // Cores para status
        let statusColor = '#95a5a6'; // Cinza padrão
        let statusBgColor = 'transparent';
        let statusFontWeight = 'normal';
        
        if (vaca.status === 'Disponível') {
            statusColor = '#27ae60'; // Verde
            statusBgColor = 'rgba(39, 174, 96, 0.1)';
            statusFontWeight = '600';
        } else if (vaca.status === 'Em débito') {
            statusColor = '#e74c3c'; // Vermelho
            statusBgColor = 'rgba(231, 76, 60, 0.1)';
            statusFontWeight = '600';
        } else if (vaca.status === 'Sem saldo') {
            statusColor = '#f39c12'; // Laranja
            statusBgColor = 'rgba(243, 156, 18, 0.1)';
            statusFontWeight = '600';
        }
        
        const saldoColor = vaca.diasDisponiveis > 0 ? '#27ae60' : (vaca.diasDisponiveis < 0 ? '#e74c3c' : '#95a5a6');
        
        html += `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 10px; border: 1px solid var(--border-color);">${emp.nome || '-'}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color);">${emp.departamento || '-'}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color);">${emp.cargo || '-'}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">${formatarDataBR(emp.admissao)}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; font-weight: 600;">${vaca.anosCompletos}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">${vaca.diasFeriasAdquiridos}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">${vaca.diasUtilizados}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; font-weight: 600; color: ${saldoColor};">${vaca.diasDisponiveis}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; font-size: 0.9em;">${formatarDataBR(vaca.proximoVencimento)}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; font-size: 0.9em;">${formatarDataBR(vaca.limiteGozo)}</td>
                <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; background: ${statusBgColor}; color: ${statusColor}; font-weight: ${statusFontWeight}; border-radius: 3px;">
                    ${vaca.status}
                </td>
            </tr>
        `;
    });
    
    // Resumo geral
    let totalAdquiridos = 0;
    let totalUtilizados = 0;
    let totalDisponivel = 0;
    let countDisponivel = 0;
    let countSemSaldo = 0;
    let countEmDebito = 0;
    
    sortedEmployees.forEach(emp => {
        const vaca = calculateVacationData(emp);
        totalAdquiridos += vaca.diasFeriasAdquiridos;
        totalUtilizados += vaca.diasUtilizados;
        totalDisponivel += vaca.diasDisponiveis;
        
        if (vaca.status === 'Disponível') countDisponivel++;
        else if (vaca.status === 'Sem saldo') countSemSaldo++;
        else if (vaca.status === 'Em débito') countEmDebito++;
    });
    
    html += `
                    <tr style="background: var(--bg-secondary); font-weight: 600;">
                        <td style="padding: 10px; border: 1px solid var(--border-color);" colspan="5">TOTAIS</td>
                        <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">${totalAdquiridos}</td>
                        <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">${totalUtilizados}</td>
                        <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; color: ${totalDisponivel > 0 ? '#27ae60' : '#e74c3c'};">${totalDisponivel}</td>
                        <td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;" colspan="3">-</td>
                    </tr>
                </tbody>
                </table>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 150px; padding: 12px; background: rgba(39, 174, 96, 0.1); border-radius: 5px; border-left: 4px solid #27ae60;">
                    <div style="font-size: 0.85em; color: var(--text-secondary);">Com Saldo</div>
                    <div style="font-size: 1.5em; font-weight: 600; color: #27ae60;">${countDisponivel}</div>
                </div>
                <div style="flex: 1; min-width: 150px; padding: 12px; background: rgba(243, 156, 18, 0.1); border-radius: 5px; border-left: 4px solid #f39c12;">
                    <div style="font-size: 0.85em; color: var(--text-secondary);">Sem Saldo</div>
                    <div style="font-size: 1.5em; font-weight: 600; color: #f39c12;">${countSemSaldo}</div>
                </div>
                <div style="flex: 1; min-width: 150px; padding: 12px; background: rgba(231, 76, 60, 0.1); border-radius: 5px; border-left: 4px solid #e74c3c;">
                    <div style="font-size: 0.85em; color: var(--text-secondary);">Em Débito</div>
                    <div style="font-size: 1.5em; font-weight: 600; color: #e74c3c;">${countEmDebito}</div>
                </div>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button onclick="exportarFeriasParaPDF()" class="btn btn-primary" style="padding: 10px 15px; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                    📄 PDF
                </button>
                <button onclick="exportarFeriasParaExcel()" class="btn btn-primary" style="padding: 10px 15px; background-color: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                    📊 Excel
                </button>
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Exportar para PDF
 */
async function exportarFeriasParaPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;
        
        const element = document.createElement('div');
        element.innerHTML = gerarRelatarioFerias();
        element.style.backgroundColor = '#fff';
        element.style.padding = '20px';
        
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true
        });
        
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        let heightLeft = imgHeight;
        let position = 0;
        
        const imgData = canvas.toDataURL('image/png');
        
        while (heightLeft > 0) {
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= 297; // A4 height in mm
            if (heightLeft > 0) pdf.addPage();
            position -= 297;
        }
        
        pdf.save('relatorio-ferias.pdf');
        showToast('PDF exportado com sucesso!', 'success');
    } catch (e) {
        console.error('Erro ao exportar PDF:', e);
        showToast('Erro ao exportar PDF', 'error');
    }
}

/**
 * Exportar para Excel
 */
function exportarFeriasParaExcel() {
    try {
        const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        
        if (employees.length === 0) {
            showToast('Nenhum funcionário para exportar', 'warning');
            return;
        }
        
        // Preparar dados
        const dados = [{
            'Matrícula': '',
            'Nome': '',
            'Departamento': '',
            'Cargo': '',
            'Data de Admissão': '',
            'Anos Completos': '',
            'Dias Adquiridos': '',
            'Dias Utilizados': '',
            'Saldo': '',
            'Próximo Vencimento': '',
            'Limite para Gozo': '',
            'Status': ''
        }];
        
        // Ordenar funcionários
        const sortedEmployees = [...employees].sort((a, b) => {
            const deptCmp = (a.departamento || '').localeCompare(b.departamento || '');
            if (deptCmp !== 0) return deptCmp;
            return (a.nome || '').localeCompare(b.nome || '');
        });
        
        sortedEmployees.forEach(emp => {
            const vaca = calculateVacationData(emp);
            dados.push({
                'Matrícula': emp.matricula || '-',
                'Nome': emp.nome || '-',
                'Departamento': emp.departamento || '-',
                'Cargo': emp.cargo || '-',
                'Data de Admissão': formatarDataBR(emp.admissao),
                'Anos Completos': vaca.anosCompletos,
                'Dias Adquiridos': vaca.diasFeriasAdquiridos,
                'Dias Utilizados': vaca.diasUtilizados,
                'Saldo': vaca.diasDisponiveis,
                'Próximo Vencimento': formatarDataBR(vaca.proximoVencimento),
                'Limite para Gozo': formatarDataBR(vaca.limiteGozo),
                'Status': vaca.status
            });
        });
        
        // Criar workbook
        const ws = XLSX.utils.json_to_sheet(dados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Férias');
        
        // Ajustar largura das colunas
        ws['!cols'] = [
            { wch: 12 },
            { wch: 25 },
            { wch: 20 },
            { wch: 20 },
            { wch: 15 },
            { wch: 12 },
            { wch: 14 },
            { wch: 14 },
            { wch: 10 },
            { wch: 16 },
            { wch: 16 },
            { wch: 13 }
        ];
        
        // Exportar
        XLSX.writeFile(wb, 'relatorio-ferias.xlsx');
        showToast('Excel exportado com sucesso!', 'success');
    } catch (e) {
        console.error('Erro ao exportar Excel:', e);
        showToast('Erro ao exportar Excel', 'error');
    }
}

/**
 * Inicializa módulo de relatório de férias
 */
function initRelatorioFeriasModule() {
    console.log('🚀 Inicializando módulo de Relatório de Férias');
    
    // Procurar container específico para férias
    let reportContent = document.getElementById('ferias-report-content');
    
    // Se não existir, criar dinamicamente
    if (!reportContent) {
        console.log('📝 Container de férias não encontrado, criando dinamicamente...');
        
        // Procurar por um container pai (relatorios-content ou semelhante)
        const parentContainer = document.getElementById('relatorios-content');
        
        if (parentContainer) {
            // Criar container dentro do container existente
            const feriasSection = document.createElement('div');
            feriasSection.id = 'ferias-report-content';
            feriasSection.style.marginTop = '40px';
            feriasSection.style.paddingTop = '40px';
            feriasSection.style.borderTop = '2px solid #3498db';
            parentContainer.appendChild(feriasSection);
            reportContent = feriasSection;
        } else {
            // Se não encontrar nenhum container, criar um novo
            reportContent = document.createElement('div');
            reportContent.id = 'ferias-report-content';
            document.body.appendChild(reportContent);
        }
    }
    
    reportContent.innerHTML = gerarRelatarioFerias();
    
    console.log('✅ Relatório de Férias renderizado com sucesso');
}

// Exportar para global
window.initRelatorioFeriasModule = initRelatorioFeriasModule;
window.exportarFeriasParaPDF = exportarFeriasParaPDF;
window.exportarFeriasParaExcel = exportarFeriasParaExcel;

console.log('✅ Módulo de Relatório de Férias carregado!');
