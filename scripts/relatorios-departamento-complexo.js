// ==========================================
// MÓDULO DE RELATÓRIOS COMPLEXOS POR DEPARTAMENTO
// ==========================================

/**
 * Preenche o select de departamentos
 */
function preencherDepartamentosRelatorioDept() {
    const select = document.getElementById('relatorio-departamento-select');
    if (!select || typeof loadDepartments !== 'function') {
        console.warn('Select de departamentos não encontrado');
        return;
    }
    
    const departamentos = loadDepartments();
    const options = departamentos.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');
    select.innerHTML = '<option value="">Selecione um departamento</option>' + options;
}

/**
 * Calcula dados complexos de um funcionário
 */
function calcularDadosFuncionario(employeeId, departamentoId) {
    try {
        const employees = typeof getEmployees === 'function' ? getEmployees() : [];
        const punches = typeof loadPunches === 'function' ? loadPunches() : [];
        const afastamentos = typeof loadAfastamentos === 'function' ? loadAfastamentos() : [];
        
        const employee = employees.find(e => String(e.id) === String(employeeId));
        if (!employee) return null;
        
        // Ponto: Total de registros
        const pontosFuncionario = punches.filter(p => String(p.employeeId) === String(employeeId));
        const totalPontos = pontosFuncionario.length;
        
        // Entradas e Saídas
        const entradas = pontosFuncionario.filter(p => p.type === 'Entrada').length;
        const saidas = pontosFuncionario.filter(p => p.type === 'Saída').length;
        
        // Afastamentos
        const afastFuncionario = afastamentos.filter(a => String(a.employeeId) === String(employeeId));
        const totalAfastamentos = afastFuncionario.length;
        
        // ====== ATRASOS e ADIANTAMENTOS ======
        let atrasoMinutos = 0;
        let adiantamentoMinutos = 0; // Novidade: rastrear adiantamentos
        
        // Obter horário de início do cargo do funcionário
        const horaInicioStr = employee.horaInicio || '08:00'; // Fallback para 08:00
        const horaFimStr = employee.horaFim || '17:00'; // Fallback para 17:00
        
        const [horaInicio, minInicio] = horaInicioStr.split(':').map(Number);
        const [horaFim, minFim] = horaFimStr.split(':').map(Number);
        
        const horarioEsperadoMsInicio = horaInicio * 60 * 60 * 1000 + minInicio * 60 * 1000;
        const horarioEsperadoMsFim = horaFim * 60 * 60 * 1000 + minFim * 60 * 1000;
        
        // ===== CORREÇÃO PARA JORNADAS NOTURNAS =====
        // Agrupar pontos em JORNADAS completas (entrada até saída)
        // Não apenas por dia, pois jornada pode cruzar meia-noite
        
        // Ordenar todos os pontos por timestamp
        const pontosSorted = pontosFuncionario.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Construir jornadas (entrada + saída)
        const jornadas = [];
        let entradaAtual = null;
        
        pontosSorted.forEach(ponto => {
            if (ponto.type === 'Entrada' && !entradaAtual) {
                entradaAtual = ponto;
            } else if (ponto.type === 'Saída' && entradaAtual) {
                jornadas.push({
                    entrada: new Date(entradaAtual.timestamp),
                    saida: new Date(ponto.timestamp),
                    entradaDia: entradaAtual.timestamp.split('T')[0]
                });
                entradaAtual = null;
            }
        });
        
        // Calcular atrasos e adiantamentos baseado na PRIMEIRA entrada de cada jornada
        jornadas.forEach(jornada => {
            const horaEntrada = jornada.entrada.getHours();
            const minEntrada = jornada.entrada.getMinutes();
            const horaEntradaMs = horaEntrada * 60 * 60 * 1000 + minEntrada * 60 * 1000;
            
            // NOVO: Verificar se entrou ANTES da hora (adiantamento)
            if (horaEntradaMs < horarioEsperadoMsInicio) {
                const diffMs = horarioEsperadoMsInicio - horaEntradaMs;
                const diffMinutos = Math.round(diffMs / (60 * 1000));
                adiantamentoMinutos += diffMinutos;
                
                console.log(`[ADIANTAMENTO] ${employee.nome} - ${jornada.entradaDia}: +${diffMinutos} min`);
            }
            // Verificar se entrou APÓS a hora (atraso)
            else if (horaEntradaMs > horarioEsperadoMsInicio) {
                const diffMs = horaEntradaMs - horarioEsperadoMsInicio;
                const diffMinutos = Math.round(diffMs / (60 * 1000));
                atrasoMinutos += diffMinutos;
                
                console.log(`[ATRASO] ${employee.nome} - ${jornada.entradaDia}: ${diffMinutos} min`);
            }
        });
        
        // Converter minutos para horas.minutos
        const horasAtraso = Math.floor(atrasoMinutos / 60);
        const minutosRestantes = atrasoMinutos % 60;
        const atrasoFormatado = `${horasAtraso}h${minutosRestantes}m`;
        
        // ⚠️ IMPORTANTE: Adiantamento NÃO é hora extra!
        // Adiantamento é quando chega cedo, não é trabalho extra
        // Apenas contar como extra o que foi trabalhado ALÉM do esperado
        let horasExtras = 0; // Será calculado baseado em horas trabalhadas - esperadas
        
        // Calcular tempo trabalhado por jornada, descontando intervalo (padrão 1h)
        let totalHorasTrabalhadas = 0;
        let totalIntervaloCedido = 0;
        const INTERVALO_PADRAO = 1; // 1 hora de intervalo
        
        jornadas.forEach(jornada => {
            // Calcular tempo total da jornada
            const diffMs = jornada.saida - jornada.entrada;
            const diffHoras = diffMs / (1000 * 60 * 60);
            
            // Descontar intervalo
            const horasAjustadas = Math.max(0, diffHoras - INTERVALO_PADRAO);
            totalHorasTrabalhadas += horasAjustadas;
            
            console.log(`[JORNADA] ${employee.nome} - ${jornada.entradaDia}: ${diffHoras.toFixed(2)}h (${horasAjustadas.toFixed(2)}h após intervalo)`);
        });
        
        // ✅ NOVO: Detectar se é jornada NOTURNA (uma única jornada que cruza meia-noite)
        let ehNoturna = false;
        if (jornadas.length === 1) {
            const entrada = jornadas[0].entrada.getHours();
            const saida = jornadas[0].saida.getHours();
            
            // Noturna = UMA jornada que entra >= 19h E sai <= 07h
            if (entrada >= 19 && saida <= 7) {
                ehNoturna = true;
            }
        }
        
        // Horas esperadas (por jornada trabalhada)
        // ✅ Se for noturno, esperado é 11h; senão, 8h
        let horasEsperadas = 8;
        if (employee.horasDia) horasEsperadas = employee.horasDia;
        if (ehNoturna) horasEsperadas = 11;
        
        // Calcular extra: total de horas trabalhadas - (horas esperadas * número de jornadas)
        const totalHorasEsperadas = horasEsperadas * jornadas.length;
        const extraTrabalhado = Math.max(0, totalHorasTrabalhadas - totalHorasEsperadas);
        
        // Somar ao total (já inclui adiantamentos)
        horasExtras += extraTrabalhado;
        
        console.log(`[SUMMARY] ${employee.nome}: ${totalHorasTrabalhadas.toFixed(2)}h trabalhadas vs ${totalHorasEsperadas.toFixed(2)}h esperadas = ${horasExtras.toFixed(2)}h extras`);
        
        return {
            id: employee.id,
            matricula: employee.matricula,
            nome: employee.nome,
            cargo: employee.cargo || '-',
            totalPontos,
            entradas,
            saidas,
            atrasos: atrasoFormatado,
            atrasoMinutos: atrasoMinutos,
            adiantamentoMinutos: adiantamentoMinutos, // Novo campo
            horasExtras: horasExtras.toFixed(2),
            afastamentos: totalAfastamentos
        };
    } catch (e) {
        console.error('Erro ao calcular dados do funcionário:', e);
        return null;
    }
}

/**
 * Gera relatório detalhado por departamento
 */
function gerarRelatorioDepartamentoCompleto() {
    try {
        const deptId = document.getElementById('relatorio-departamento-select').value;
        const container = document.getElementById('relatorio-departamento-container');
        
        if (!deptId) {
            container.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 20px;">⚠️ Selecione um departamento</p>';
            return;
        }
        
        const employees = typeof getEmployees === 'function' ? getEmployees() : [];
        const departamentos = typeof loadDepartments === 'function' ? loadDepartments() : [];
        
        // Busca nome do departamento
        const depto = departamentos.find(d => String(d.id) === String(deptId));
        const deptoNome = depto ? depto.nome : 'Departamento desconhecido';
        
        // Filtra funcionários do departamento (compara pelo NOME do departamento, não pelo ID)
        const funcionariosDept = employees.filter(e => String(e.departamento) === String(deptoNome));
        
        console.log('[RELATORIO DEPT] Filtro de departamentos:', {
            deptId: deptId,
            deptoNome: deptoNome,
            funcionariosFiltrados: funcionariosDept.length,
            amostra: funcionariosDept.slice(0, 3)
        });
        
        if (funcionariosDept.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">📭 Nenhum funcionário neste departamento</p>';
            return;
        }
        
        // Calcula dados de cada funcionário
        const dados = funcionariosDept.map(emp => calcularDadosFuncionario(emp.id, deptId)).filter(d => d !== null);
        
        if (dados.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">📭 Erro ao calcular dados dos funcionários</p>';
            return;
        }
        
        // Monta HTML da tabela
        let html = `
            <div style="margin-bottom: 20px; padding: 15px; background: #f0f7ff; border-radius: 8px; border-left: 4px solid #3498db;">
                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">🏢 ${deptoNome}</h3>
                <p style="margin: 0; color: #555; font-size: 0.9rem;">Total de funcionários: <strong>${dados.length}</strong></p>
            </div>
            
            <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;font-size:0.9rem;">
                <thead style="background:#3498db;color:white;">
                    <tr>
                        <th style="padding:12px;border:1px solid #3498db;text-align:left;">Matrícula</th>
                        <th style="padding:12px;border:1px solid #3498db;text-align:left;">Funcionário</th>
                        <th style="padding:12px;border:1px solid #3498db;text-align:left;">Cargo</th>
                        <th style="padding:12px;border:1px solid #3498db;text-align:center;">Pontos</th>
                        <th style="padding:12px;border:1px solid #3498db;text-align:center;">Entradas</th>
                        <th style="padding:12px;border:1px solid #3498db;text-align:center;">Saídas</th>
                        <th style="padding:12px;border:1px solid #3498db;text-align:center;">Atrasos</th>
                        <th style="padding:12px;border:1px solid #3498db;text-align:center;">Horas Extra</th>
                        <th style="padding:12px;border:1px solid #3498db;text-align:center;">Afastamentos</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let totalPontos = 0;
        let totalEntradas = 0;
        let totalSaidas = 0;
        let totalAtrasoMinutos = 0;
        let totalHorasExtras = 0;
        let totalAfastamentos = 0;
        
        dados.forEach(emp => {
            const rowColor = emp.atrasoMinutos > 0 ? '#fff3cd' : '#f8f9fa';
            
            html += `
                <tr style="background:${rowColor};border-bottom:1px solid #ddd;">
                    <td style="padding:10px;border:1px solid #ddd;font-weight:bold;">${emp.matricula}</td>
                    <td style="padding:10px;border:1px solid #ddd;">${emp.nome}</td>
                    <td style="padding:10px;border:1px solid #ddd;font-size:0.85rem;color:#555;">${emp.cargo}</td>
                    <td style="padding:10px;border:1px solid #ddd;text-align:center;">${emp.totalPontos}</td>
                    <td style="padding:10px;border:1px solid #ddd;text-align:center;color:#27ae60;font-weight:bold;">${emp.entradas}</td>
                    <td style="padding:10px;border:1px solid #ddd;text-align:center;color:#e74c3c;font-weight:bold;">${emp.saidas}</td>
                    <td style="padding:10px;border:1px solid #ddd;text-align:center;${emp.atrasoMinutos > 0 ? 'background:#fff3cd;' : ''}color:${emp.atrasoMinutos > 0 ? '#ff6b6b' : '#999'};font-weight:${emp.atrasoMinutos > 0 ? 'bold' : 'normal'};">${emp.atrasos}</td>
                    <td style="padding:10px;border:1px solid #ddd;text-align:center;color:#27ae60;font-weight:bold;">+${emp.horasExtras}h</td>
                    <td style="padding:10px;border:1px solid #ddd;text-align:center;${emp.afastamentos > 0 ? 'background:#ffe6e6;' : ''}color:${emp.afastamentos > 0 ? '#e74c3c' : '#999'};">${emp.afastamentos}</td>
                </tr>
            `;
            
            totalPontos += emp.totalPontos;
            totalEntradas += emp.entradas;
            totalSaidas += emp.saidas;
            totalAtrasoMinutos += emp.atrasoMinutos;
            totalHorasExtras += parseFloat(emp.horasExtras);
            totalAfastamentos += emp.afastamentos;
        });
        
        // Converter total de atrasos para formato horas:minutos
        const horasTotalAtraso = Math.floor(totalAtrasoMinutos / 60);
        const minutosTotalAtraso = totalAtrasoMinutos % 60;
        const atrasoTotalFormatado = `${horasTotalAtraso}h${minutosTotalAtraso}m`;
        
        // Linha de totais
        html += `
                <tr style="background:#2c3e50;color:white;font-weight:bold;">
                    <td colspan="3" style="padding:12px;border:1px solid #2c3e50;text-align:right;">TOTAL:</td>
                    <td style="padding:12px;border:1px solid #2c3e50;text-align:center;">${totalPontos}</td>
                    <td style="padding:12px;border:1px solid #2c3e50;text-align:center;">${totalEntradas}</td>
                    <td style="padding:12px;border:1px solid #2c3e50;text-align:center;">${totalSaidas}</td>
                    <td style="padding:12px;border:1px solid #2c3e50;text-align:center;">${atrasoTotalFormatado}</td>
                    <td style="padding:12px;border:1px solid #2c3e50;text-align:center;">+${totalHorasExtras.toFixed(2)}h</td>
                    <td style="padding:12px;border:1px solid #2c3e50;text-align:center;">${totalAfastamentos}</td>
                </tr>
            </tbody>
            </table>
        `;
        
        container.innerHTML = html;
        
        // Armazenar dados para exportação
        window.ultimoRelatorioDept = {
            depto: deptoNome,
            deptId: deptId,
            dados: dados,
            totais: {
                pontos: totalPontos,
                entradas: totalEntradas,
                saidas: totalSaidas,
                atrasoMinutos: totalAtrasoMinutos,
                atrasoFormatado: atrasoTotalFormatado,
                horasExtras: totalHorasExtras,
                afastamentos: totalAfastamentos
            }
        };
        
    } catch (e) {
        console.error('Erro ao gerar relatório de departamento:', e);
        const container = document.getElementById('relatorio-departamento-container');
        container.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 20px;">❌ Erro: ' + e.message + '</p>';
    }
}

/**
 * Exporta relatório para CSV
 */
function exportarRelatorioDepartamentoCSV() {
    try {
        if (!window.ultimoRelatorioDept) {
            console.warn('Nenhum relatório gerado para exportar');
            if (typeof showToast === 'function') {
                showToast('Gere um relatório primeiro.', 'warning');
            }
            return;
        }
        
        const { depto, dados, totais } = window.ultimoRelatorioDept;
        
        // Cabeçalho
        const rows = [
            ['RELATÓRIO POR DEPARTAMENTO'],
            ['Departamento: ' + depto],
            ['Data de Geração: ' + new Date().toLocaleString('pt-BR')],
            [],
            ['Matrícula', 'Funcionário', 'Cargo', 'Pontos', 'Entradas', 'Saídas', 'Atrasos', 'Horas Extra', 'Afastamentos']
        ];
        
        // Dados
        dados.forEach(emp => {
            rows.push([
                emp.matricula,
                emp.nome,
                emp.cargo,
                emp.totalPontos,
                emp.entradas,
                emp.saidas,
                emp.atrasos,
                emp.horasExtras + 'h',
                emp.afastamentos
            ]);
        });
        
        // Totais
        rows.push([]);
        rows.push([
            'TOTAL',
            '',
            '',
            totais.pontos,
            totais.entradas,
            totais.saidas,
            totais.atrasoFormatado,
            totais.horasExtras.toFixed(2) + 'h',
            totais.afastamentos
        ]);
        
        // Converter para CSV
        const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'relatorio_departamento_' + window.ultimoRelatorioDept.depto.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.csv';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
            link.remove();
        }, 1000);
        
        if (typeof showToast === 'function') {
            showToast('Relatório exportado com sucesso!', 'success');
        }
    } catch (e) {
        console.error('Erro ao exportar relatório:', e);
        if (typeof showToast === 'function') {
            showToast('Erro ao exportar relatório.', 'error');
        }
    }
}

/**
 * Inicializa o módulo de relatórios de departamento
 */
function initRelatorioDepartamentoModule() {
    console.log('[RELATORIO DEPT] Inicializando módulo de relatórios por departamento');
    
    // Preencher select de departamentos
    preencherDepartamentosRelatorioDept();
    
    // Adicionar listeners
    const selectDept = document.getElementById('relatorio-departamento-select');
    const btnGerar = document.getElementById('relatorio-departamento-gerar');
    const btnExportar = document.getElementById('relatorio-departamento-exportar');
    
    if (btnGerar) {
        btnGerar.addEventListener('click', gerarRelatorioDepartamentoCompleto);
    }
    
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarRelatorioDepartamentoCSV);
    }
    
    if (selectDept) {
        selectDept.addEventListener('change', function() {
            // Auto-gerar ao mudar departamento
            gerarRelatorioDepartamentoCompleto();
        });
    }
    
    console.log('[RELATORIO DEPT] Módulo inicializado com sucesso');
}
