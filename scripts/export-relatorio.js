// ==========================================
// MÓDULO DE EXPORTAÇÃO DE RELATÓRIOS
// ==========================================
// Exporta relatórios em PDF e Excel

console.log('📥 Módulo de exportação carregado');

/**
 * Exporta relatório de fechamento para PDF
 */
function exportRelatorioFechamentoPDF(departmentName, startDate, endDate) {
    try {
        console.log('📄 Gerando PDF do relatório de fechamento...');
        
        // Gerar HTML do relatório
        const html = generateClosingReportHTML(departmentName, startDate, endDate);
        
        // Criar elemento temporário
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '1200px';
        document.body.appendChild(tempDiv);
        
        // Converter para PDF
        html2canvas(tempDiv, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
        }).then(canvas => {
            const { jsPDF } = window.jspdf;
            const imgData = canvas.toDataURL('image/png');
            
            // Criar PDF
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Adicionar título
            pdf.setFontSize(16);
            pdf.text(`Relatório de Fechamento - ${departmentName}`, pageWidth / 2, 15, { align: 'center' });
            
            // Adicionar período
            pdf.setFontSize(11);
            pdf.text(`Período: ${startDate} até ${endDate}`, pageWidth / 2, 22, { align: 'center' });
            
            // Adicionar imagem
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
            
            // Salvar PDF
            const filename = `relatorio-fechamento-${departmentName}-${new Date().getTime()}.pdf`;
            pdf.save(filename);
            
            console.log('✅ PDF gerado com sucesso:', filename);
            showToast(`PDF baixado: ${filename}`, 'success');
            
            // Limpar elemento temporário
            document.body.removeChild(tempDiv);
        }).catch(err => {
            console.error('❌ Erro ao gerar PDF:', err);
            showToast('Erro ao gerar PDF', 'error');
            document.body.removeChild(tempDiv);
        });
        
    } catch (e) {
        console.error('❌ Erro na exportação para PDF:', e);
        showToast('Erro ao exportar para PDF: ' + e.message, 'error');
    }
}

/**
 * Exporta relatório de fechamento para Excel CORPORATIVO de alta qualidade
 */
function exportRelatorioFechamentoExcel(departmentName, startDate, endDate) {
    try {
        console.log('📊 Gerando Excel corporativo de fechamento...');
        
        const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        const deptEmployees = employees.filter(e => e.departamento === departmentName && e.status !== 'Inativo');
        
        if (deptEmployees.length === 0) {
            showToast('Nenhum funcionário encontrado neste departamento', 'warning');
            return;
        }
        
        // ==================== SHEET 1: RELATÓRIO PRINCIPAL ====================
        const dados = [];
        
        // Linhas 1-5: CABEÇALHO CORPORATIVO
        dados.push(['TOP SERVICE - SISTEMA DE GESTÃO DE PONTO']);
        dados.push(['RELATÓRIO DE FECHAMENTO MENSAL']);
        dados.push([]);
        dados.push([`DEPARTAMENTO: ${departmentName}`]);
        dados.push([`PERÍODO: ${startDate} à ${endDate}`]);
        dados.push([`DATA DE GERAÇÃO: ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR')}`]);
        dados.push([]);
        
        // Linha 8: CABEÇALHOS DA TABELA
        dados.push([
            'FUNCIONÁRIO',
            'CARGO',
            'AFASTAMENTO\n(DIAS)',
            'FALTAS',
            'FERIADOS',
            'ADICIONAL\nNOTURNO',
            'HORAS EXTRAS',
            'ATRASOS',
            'VALE REFEIÇÃO',
            'VALE TRANSPORTE'
        ]);
        
        // Totalizadores
        let totalAfastamento = 0, totalFaltas = 0, totalFeriados = 0;
        let totalExtraHoras = 0, totalExtraMinutos = 0;
        let totalAtrasoHoras = 0, totalAtrasoMinutos = 0;
        let totalValeAlimentacao = 0, totalValeTransporte = 0;
        let totalAdicional = 0;
        
        // Dados dos funcionários
        deptEmployees.forEach(emp => {
            try {
                // Chamar funções com segurança
                const balance = (typeof calculateEmployeeBalance === 'function') 
                    ? calculateEmployeeBalance(emp.id, startDate, endDate) 
                    : { horaExtraHoras: 0, horaExtraMinutos: 0, atrasoHoras: 0, atrasoMinutos: 0 };
                
                const absences = (typeof countAbsences === 'function') 
                    ? countAbsences(emp.id, startDate, endDate) 
                    : { faltas: 0, feriados: 0 };
                
                const afastamento = (typeof countAfastamentos === 'function') 
                    ? countAfastamentos(emp.id, startDate, endDate) 
                    : 0;
                
                const valeAlimCalc = (typeof calculateValeAlimentacao === 'function') 
                    ? calculateValeAlimentacao(emp.id, startDate, endDate, emp.valeAlimentacao) 
                    : { total: 0 };
                
                const horaExtraStr = balance.horaExtraHoras > 0 
                    ? `${balance.horaExtraHoras}h${balance.horaExtraMinutos}m` 
                    : '—';
                const atrasoStr = balance.atrasoHoras > 0 
                    ? `${balance.atrasoHoras}h${balance.atrasoMinutos}m` 
                    : '—';
                
                const valeAlim = valeAlimCalc.total > 0 ? valeAlimCalc.total : 0;
                const valeTransp = emp.valeTransporte ? parseFloat(emp.valeTransporte) : 0;
                const adicionalVal = emp.adicional ? parseFloat(emp.adicional) : 0;
            
            dados.push([
                emp.nome,
                emp.cargo || '—',
                afastamento,
                absences.faltas,
                absences.feriados,
                adicionalVal,
                horaExtraStr,
                atrasoStr,
                valeAlim,
                valeTransp
            ]);
            
            totalAfastamento += afastamento;
            totalFaltas += absences.faltas;
            totalFeriados += absences.feriados;
            totalExtraHoras += balance.horaExtraHoras;
            totalExtraMinutos += balance.horaExtraMinutos;
            totalAtrasoHoras += balance.atrasoHoras;
            totalAtrasoMinutos += balance.atrasoMinutos;
            totalValeAlimentacao += valeAlim;
            totalValeTransporte += valeTransp;
            totalAdicional += adicionalVal;
        });
        
        // Converter minutos em horas
        totalExtraHoras += Math.floor(totalExtraMinutos / 60);
        totalExtraMinutos = totalExtraMinutos % 60;
        totalAtrasoHoras += Math.floor(totalAtrasoMinutos / 60);
        totalAtrasoMinutos = totalAtrasoMinutos % 60;
        
        const totalExtraStr = totalExtraHoras > 0 ? `${totalExtraHoras}h${totalExtraMinutos}m` : '—';
        const totalAtrasoStr = totalAtrasoHoras > 0 ? `${totalAtrasoHoras}h${totalAtrasoMinutos}m` : '—';
        
        // Linha de TOTAIS
        dados.push([
            '═ TOTAIS ═',
            '',
            totalAfastamento,
            totalFaltas,
            totalFeriados,
            totalAdicional,
            totalExtraStr,
            totalAtrasoStr,
            totalValeAlimentacao,
            totalValeTransporte
        ]);
        
        // Criar worksheet
        const ws = XLSX.utils.aoa_to_sheet(dados);
        
        // ==================== CONFIGURAÇÃO DE COLUNAS ====================
        ws['!cols'] = [
            { wch: 32 },  // Funcionário
            { wch: 20 },  // Cargo
            { wch: 16 },  // Afastamento
            { wch: 12 },  // Faltas
            { wch: 12 },  // Feriados
            { wch: 16 },  // Adicional
            { wch: 16 },  // Hora Extra
            { wch: 14 },  // Atraso
            { wch: 18 },  // Vale Refeição
            { wch: 18 }   // Vale Transporte
        ];
        
        // ==================== CONFIGURAÇÃO DE LINHAS ====================
        ws['!rows'] = [
            { hpx: 26 }, // Linha 1 - Empresa
            { hpx: 22 }, // Linha 2 - Título
            { hpx: 5 },  // Linha 3 - Espaço
            { hpx: 18 }, // Linha 4 - Departamento
            { hpx: 18 }, // Linha 5 - Período
            { hpx: 18 }, // Linha 6 - Data
            { hpx: 5 },  // Linha 7 - Espaço
            { hpx: 26 }  // Linha 8 - Cabeçalhos
        ];
        
        if (!ws['!merges']) ws['!merges'] = [];
        
        // ==================== ESTILOS - SEÇÃO CABEÇALHO ====================
        
        // Linha 1: Nome Empresa (Fundo escuro, texto branco, grande)
        for (let c = 0; c < 10; c++) {
            const cellRef = XLSX.utils.encode_cell({ r: 0, c: c });
            if (ws[cellRef]) {
                ws[cellRef].s = {
                    font: { bold: true, size: 16, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
                    fill: { fgColor: { rgb: '0D3B66' } },
                    alignment: { horizontal: 'center', vertical: 'center' }
                };
            }
        }
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } });
        
        // Linha 2: Título Relatório (Fundo gradiente, azul médio)
        for (let c = 0; c < 10; c++) {
            const cellRef = XLSX.utils.encode_cell({ r: 1, c: c });
            if (ws[cellRef]) {
                ws[cellRef].s = {
                    font: { bold: true, size: 14, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
                    fill: { fgColor: { rgb: '2E5984' } },
                    alignment: { horizontal: 'center', vertical: 'center' }
                };
            }
        }
        ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 9 } });
        
        // Linhas 3-6: Informações (Fundo azul muito claro)
        for (let r = 3; r <= 5; r++) {
            for (let c = 0; c < 10; c++) {
                const cellRef = XLSX.utils.encode_cell({ r: r, c: c });
                if (ws[cellRef]) {
                    ws[cellRef].s = {
                        font: { bold: true, size: 11, color: { rgb: '0D3B66' }, name: 'Calibri' },
                        fill: { fgColor: { rgb: 'E3F2FD' } },
                        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
                        border: {
                            left: { style: 'thin', color: { rgb: 'B0BEC5' } },
                            right: { style: 'thin', color: { rgb: 'B0BEC5' } },
                            top: { style: 'thin', color: { rgb: 'B0BEC5' } },
                            bottom: { style: 'thin', color: { rgb: 'B0BEC5' } }
                        }
                    };
                }
            }
            ws['!merges'].push({ s: { r: r, c: 0 }, e: { r: r, c: 9 } });
        }
        
        // ==================== ESTILOS - CABEÇALHOS DA TABELA ====================
        const headerRowIdx = 7;
        const headerColors = [
            '0D3B66', '0D3B66', '1565C0', '1E88E5', '1E88E5',
            '7B1FA2', '2E7D32', 'C62828', '0097A7', '0097A7'
        ];
        
        for (let c = 0; c < 10; c++) {
            const cellRef = XLSX.utils.encode_cell({ r: headerRowIdx, c: c });
            if (ws[cellRef]) {
                ws[cellRef].s = {
                    font: { bold: true, size: 11, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
                    fill: { fgColor: { rgb: headerColors[c] } },
                    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                    border: {
                        left: { style: 'medium', color: { rgb: '000000' } },
                        right: { style: 'medium', color: { rgb: '000000' } },
                        top: { style: 'medium', color: { rgb: '000000' } },
                        bottom: { style: 'medium', color: { rgb: '000000' } }
                    }
                };
            }
        }
        
        // ==================== ESTILOS - LINHAS DE DADOS ====================
        const dataStartRow = 8;
        const dataEndRow = 7 + deptEmployees.length;
        
        for (let r = dataStartRow; r < dataEndRow; r++) {
            for (let c = 0; c < 10; c++) {
                const cellRef = XLSX.utils.encode_cell({ r: r, c: c });
                if (ws[cellRef]) {
                    // Cores alternadas mais suaves
                    const bgColor = r % 2 === 0 ? 'FFFFFF' : 'F5F5F5';
                    const borderColor = 'D0D0D0';
                    
                    ws[cellRef].s = {
                        font: { size: 10, color: { rgb: '212121' }, name: 'Calibri' },
                        fill: { fgColor: { rgb: bgColor } },
                        alignment: { horizontal: c <= 1 ? 'left' : 'center', vertical: 'center' },
                        border: {
                            left: { style: 'thin', color: { rgb: borderColor } },
                            right: { style: 'thin', color: { rgb: borderColor } },
                            top: { style: 'thin', color: { rgb: borderColor } },
                            bottom: { style: 'thin', color: { rgb: borderColor } }
                        }
                    };
                    
                    // Formatação de números
                    if (c === 2 || c === 3 || c === 4) { // Afastamento, Faltas, Feriados
                        ws[cellRef].z = '0';
                    } else if (c === 5) { // Adicional
                        ws[cellRef].z = '"R$ "#,##0.00';
                    } else if (c === 8 || c === 9) { // Vale Refeição, Vale Transporte
                        ws[cellRef].z = '"R$ "#,##0.00';
                    }
                }
            }
        }
        
        // ==================== ESTILO - LINHA DE TOTAIS ====================
        const totalRowIdx = dataEndRow;
        for (let c = 0; c < 10; c++) {
            const cellRef = XLSX.utils.encode_cell({ r: totalRowIdx, c: c });
            if (ws[cellRef]) {
                ws[cellRef].s = {
                    font: { bold: true, size: 11, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
                    fill: { fgColor: { rgb: '1B5E20' } },
                    alignment: { horizontal: c <= 1 ? 'left' : 'center', vertical: 'center' },
                    border: {
                        left: { style: 'medium', color: { rgb: '000000' } },
                        right: { style: 'medium', color: { rgb: '000000' } },
                        top: { style: 'medium', color: { rgb: '000000' } },
                        bottom: { style: 'medium', color: { rgb: '000000' } }
                    }
                };
                
                // Formatação de números na linha de totais
                if (c === 2 || c === 3 || c === 4) {
                    ws[cellRef].z = '0';
                } else if (c === 5) {
                    ws[cellRef].z = '"R$ "#,##0.00';
                } else if (c === 8 || c === 9) {
                    ws[cellRef].z = '"R$ "#,##0.00';
                }
            }
        }
        
        // ==================== CONGELAMENTO E CONFIGURAÇÕES FINAIS ====================
        ws['!freeze'] = { xSplit: 1, ySplit: 8 };
        
        // Criar workbook profissional
        const wb = XLSX.utils.book_new();
        wb.props = {
            title: `Relatório de Fechamento - ${departmentName}`,
            subject: 'Relatório Mensal de Gestão de Ponto',
            author: 'Top Service System',
            manager: 'RH',
            company: 'Top Service',
            category: 'Relatório',
            keywords: 'ponto,fechamento,departamento',
            comments: `Relatório gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}`
        };
        
        XLSX.utils.book_append_sheet(wb, ws, 'Fechamento');
        
        // ==================== SALVAR ARQUIVO ====================
        const timestamp = new Date().getTime();
        const sanitizedDept = departmentName.replace(/[\/\\:*?"<>|]/g, '_');
        const filename = `Relatorio_Fechamento_${sanitizedDept}_${timestamp}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        console.log('✅ Excel CORPORATIVO gerado com sucesso:', filename);
        showToast(`📊 Relatório corporativo baixado: ${filename}`, 'success');
        
    } catch (e) {
        console.error('❌ Erro na exportação para Excel:', e);
        showToast('Erro ao exportar: ' + e.message, 'error');
    }
}

/**
 * Adiciona botões de exportação ao relatório
 */
function addExportButtonsToReport(departmentName, startDate, endDate) {
    // Verificar se os botões já existem
    if (document.getElementById('export-buttons-container')) {
        document.getElementById('export-buttons-container').remove();
    }
    
    // Tentar encontrar container de relatórios (múltiplas opções)
    let container = document.getElementById('closing-report-result');
    
    if (!container) {
        container = document.getElementById('relatorios-content');
    }
    
    if (!container) {
        console.warn('⚠️ Container não encontrado. Procurando alternativas...');
        return;
    }
    
    // Criar container de botões
    const buttonsDiv = document.createElement('div');
    buttonsDiv.id = 'export-buttons-container';
    buttonsDiv.style.cssText = `
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        padding: 15px;
        background: var(--bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
    `;
    
    // Botão PDF
    const pdfBtn = document.createElement('button');
    pdfBtn.textContent = '📄 Baixar PDF';
    pdfBtn.style.cssText = `
        padding: 10px 16px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9em;
        transition: background 0.3s;
    `;
    pdfBtn.onmouseover = () => pdfBtn.style.background = '#c0392b';
    pdfBtn.onmouseout = () => pdfBtn.style.background = '#e74c3c';
    pdfBtn.onclick = () => exportRelatorioFechamentoPDF(departmentName, startDate, endDate);
    
    // Botão Excel
    const excelBtn = document.createElement('button');
    excelBtn.textContent = '📊 Baixar Excel';
    excelBtn.style.cssText = `
        padding: 10px 16px;
        background: #27ae60;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9em;
        transition: background 0.3s;
    `;
    excelBtn.onmouseover = () => excelBtn.style.background = '#229954';
    excelBtn.onmouseout = () => excelBtn.style.background = '#27ae60';
    excelBtn.onclick = () => exportRelatorioFechamentoExcel(departmentName, startDate, endDate);
    
    buttonsDiv.appendChild(pdfBtn);
    buttonsDiv.appendChild(excelBtn);
    
    // Inserir no topo do container (antes do conteúdo)
    container.insertBefore(buttonsDiv, container.firstChild);
    
    console.log('✅ Botões de exportação adicionados ao container:', container.id);
}

// Exportar funções globalmente
window.addExportButtonsToReport = addExportButtonsToReport;
window.exportRelatorioFechamentoPDF = exportRelatorioFechamentoPDF;
window.exportRelatorioFechamentoExcel = exportRelatorioFechamentoExcel;
