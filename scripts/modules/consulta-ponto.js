// ==========================================
// MÓDULO DE CONSULTA DE PONTO - TOP SERVICE
// ==========================================
// Visualiza histórico de pontos do mês por funcionário ou departamento

console.log('📄 Arquivo consulta-ponto.js carregado!');

/**
 * Obtém pontos do mês atual
 */
function getPunchesCurrentMonth() {
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return punches.filter(p => {
        const pDate = new Date(p.timestamp);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Obtém pontos dentro de um período de datas
 */
function getPunchesByDateRange(startDate, endDate) {
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Incluir todo o dia final
    
    return punches.filter(p => {
        const pDate = new Date(p.timestamp);
        return pDate >= start && pDate <= end;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Filtra punches por funcionário dentro de um período
 */
function getPunchesByEmployee(employeeId, startDate = null, endDate = null) {
    let punches;
    if (startDate && endDate) {
        punches = getPunchesByDateRange(startDate, endDate);
    } else {
        punches = getPunchesCurrentMonth();
    }
    
    const empIdNum = Number(employeeId);
    console.log(`🔍 getPunchesByEmployee: filtrando por ID ${empIdNum} em ${punches.length} punches`);
    
    const filtered = punches.filter(p => {
        const match = Number(p.employeeId) === empIdNum;
        if (match) console.log(`  ✅ Encontrado ponto para funcionário ${empIdNum}:`, p);
        return match;
    });
    
    console.log(`📊 Resultado: ${filtered.length} punches`);
    return filtered;
}

/**
 * Filtra punches por departamento dentro de um período
 */
function getPunchesByDepartment(departmentName, startDate = null, endDate = null) {
    let punches;
    if (startDate && endDate) {
        punches = getPunchesByDateRange(startDate, endDate);
    } else {
        punches = getPunchesCurrentMonth();
    }
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    
    // departmentName é o NOME do departamento, não o ID
    const empIds = employees
        .filter(e => e.departamento == departmentName)
        .map(e => e.id);
    
    console.log(`🔍 Filtrando por departamento: ${departmentName}, Funcionários encontrados: ${empIds.length}`, empIds);
    return punches.filter(p => empIds.includes(p.employeeId));
}

/**
 * Formata data/hora para display
 */
function formatPunchDateTime(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return iso;
    }
}

/**
 * Obtém punches com base nos filtros aplicados
 */
function getFilteredPunches() {
    const empSelect = document.getElementById('punch-query-employee-select');
    const dateStartInput = document.getElementById('punch-query-date-start');
    const dateEndInput = document.getElementById('punch-query-date-end');
    
    const employeeId = empSelect?.value;
    const startDate = dateStartInput?.value;
    const endDate = dateEndInput?.value;
    
    if (!employeeId) {
        console.log('🔍 Nenhum funcionário selecionado');
        return [];
    }
    
    const empIdNum = Number(employeeId);
    console.log(`🔎 Filtrando: Funcionário ID=${empIdNum} (type: ${typeof empIdNum}), Período=${startDate} a ${endDate}`);
    
    // Debug: mostrar todos os punches
    const allPunches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    console.log(`📊 Total de punches no localStorage: ${allPunches.length}`);
    if (allPunches.length > 0) {
        console.log('📋 Primeiro ponto:', allPunches[0]);
        console.log('   employeeId do primeiro ponto:', allPunches[0].employeeId, `(type: ${typeof allPunches[0].employeeId})`);
    }
    
    const filtered = getPunchesByEmployee(empIdNum, startDate, endDate);
    console.log(`✅ Punches filtrados: ${filtered.length}`, filtered);
    
    return filtered;
}

/**
 * Renderiza tabela com base nos filtros atualizados
 */
function refreshPunchTable() {
    console.log('🔄 Atualizando tabela de pontos...');
    
    const empSelect = document.getElementById('punch-query-employee-select');
    const dateStartInput = document.getElementById('punch-query-date-start');
    const dateEndInput = document.getElementById('punch-query-date-end');
    
    const empId = empSelect?.value;
    const startDate = dateStartInput?.value;
    const endDate = dateEndInput?.value;
    
    if (!empId) {
        console.warn('❌ Nenhum funcionário selecionado');
        return;
    }
    
    console.log(`🔎 Buscando pontos: Funcionário ${empId}, Período ${startDate} a ${endDate}`);
    
    // Buscar todos os pontos
    const allPunches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    console.log(`📊 Total de pontos no localStorage: ${allPunches.length}`);
    
    // Filtrar por funcionário e período
    const filtered = allPunches.filter(p => {
        const empMatch = String(p.employeeId) === String(empId);
        const punchDate = p.timestamp.split('T')[0];
        const dateMatch = punchDate >= startDate && punchDate <= endDate;
        return empMatch && dateMatch;
    });
    
    // Buscar informações de afastamento do funcionário
    const afastamentos = JSON.parse(localStorage.getItem('topservice_afastamentos_v1') || '[]');
    const empAfastamentos = afastamentos.filter(a => String(a.employeeId) === String(empId));
    
    console.log(`✅ Encontrados ${filtered.length} pontos para o funcionário ${empId} no período ${startDate} a ${endDate}`);
    console.log(`📋 Afastamentos do funcionário: ${empAfastamentos.length}`);
    
    renderPunchTable(filtered, empAfastamentos, startDate, endDate, 'punch-query-table', empId);
}
/**
 * Renderiza tabela de pontos agrupada por dia
 */
function renderPunchTable(punches, empAfastamentos, startDate, endDate, containerId, employeeId = null) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`⚠️ Container ${containerId} não encontrado`);
        return;
    }
    
    console.log(`📋 Renderizando ${punches.length} pontos no container ${containerId}`);
    
    // Se employeeId não foi passado, tentar obter do select
    if (!employeeId) {
        const empSelect = document.getElementById('punch-query-employee-select');
        employeeId = empSelect?.value;
    }
    
    // Criar entrada para cada dia do período
    const byDay = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        byDay[dateStr] = [];
    }
    
    // Adicionar pontos aos dias correspondentes
    punches.forEach(p => {
        const date = p.timestamp.split('T')[0];
        if (byDay[date]) {
            byDay[date].push(p);
        }
    });
    
    // Ordenar datas (decrescente)
    const dates = Object.keys(byDay).sort().reverse();
    
    // Construir tabela
    let html = `
        <table style="width: 100%; border-collapse: collapse; border: 1px solid var(--border-color); font-size: 0.85em;">
            <thead>
                <tr style="background: var(--bg-secondary);">
                    <th style="padding: 10px; text-align: left; border: 1px solid var(--border-color); font-weight: 600;">Data</th>
                    <th style="padding: 10px; text-align: left; border: 1px solid var(--border-color); font-weight: 600;">Dia</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Status</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Horários</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">Ações</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    dates.forEach(date => {
        const dayPunches = byDay[date];
        const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
        const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' });
        
        // Verificar se há ausência neste dia
        const absence = employeeId ? getAbsenceForDay(employeeId, date) : null;
        
        // Verificar se há afastamento neste dia
        let afastadoNeste = null;
        for (let afastamento of empAfastamentos) {
            const dataInicio = afastamento.dataInicio || afastamento.start;
            const dataFim = afastamento.dataFim || afastamento.end;
            if (date >= dataInicio && date <= dataFim) {
                afastadoNeste = afastamento;
                break;
            }
        }
        
        // Determinar cor de fundo da linha
        let rowBgColor = 'transparent';
        if (afastadoNeste && !absence) {
            rowBgColor = 'rgba(231, 76, 60, 0.1)'; // vermelho claro para afastamento
        } else if (absence) {
            if (absence.type === 'falta') {
                rowBgColor = 'rgba(243, 156, 18, 0.1)'; // laranja claro
            } else if (absence.type === 'feriado') {
                rowBgColor = 'rgba(155, 89, 182, 0.1)'; // roxo claro
            } else if (absence.type === 'folga') {
                rowBgColor = 'rgba(52, 152, 219, 0.1)'; // azul claro
            }
        }
        
        html += `<tr style="border-bottom: 1px solid var(--border-color); background: ${rowBgColor};">`;
        html += `<td style="padding: 10px; border: 1px solid var(--border-color); font-weight: 500;">${displayDate}</td>`;
        html += `<td style="padding: 10px; border: 1px solid var(--border-color);">${dayOfWeek}</td>`;
        
        // Status (Afastamento/Falta/Feriado/Folga/Normal)
        if (afastadoNeste && !absence) {
            html += `<td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">
                <span style="background: #e74c3c; color: white; padding: 4px 8px; border-radius: 3px; font-size: 0.8em; font-weight: 600; cursor: help;" title="Afastado: ${afastadoNeste.type || afastadoNeste.motivo || 'Motivo não especificado'}">
                    🚫 AFASTADO
                </span>
            </td>`;
        } else if (absence) {
            let statusColor = '#f39c12';
            let statusText = '⚠️ FALTA';
            
            if (absence.type === 'falta') {
                statusColor = '#f39c12';
                statusText = '⚠️ FALTA';
            } else if (absence.type === 'feriado') {
                statusColor = '#9b59b6';
                statusText = '🎉 FERIADO';
            } else if (absence.type === 'folga') {
                statusColor = '#3498db';
                statusText = '🌴 FOLGA';
            }
            
            html += `<td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">
                <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 0.8em; font-weight: 600;">
                    ${statusText}
                </span>
            </td>`;
        } else {
            html += `<td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">
                <span style="background: #2ecc71; color: white; padding: 4px 8px; border-radius: 3px; font-size: 0.8em; font-weight: 600;">
                    ✓ Normal
                </span>
            </td>`;
        }
        
        if (dayPunches.length === 0) {
            if (afastadoNeste && !absence) {
                html += `<td colspan="2" style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">
                    <span style="color: var(--text-secondary); font-size: 0.85em;">
                        ${afastadoNeste.type || afastadoNeste.motivo || 'Afastado'}
                    </span>
                </td>`;
            } else if (!absence) {
                html += `<td colspan="2" style="padding: 10px; border: 1px solid var(--border-color); text-align: center; color: var(--text-secondary); font-size: 0.85em;">
                    Nenhum ponto
                </td>`;
            } else {
                let absenceLabel = 'falta';
                if (absence.type === 'falta') {
                    absenceLabel = 'falta';
                } else if (absence.type === 'feriado') {
                    absenceLabel = 'feriado';
                } else if (absence.type === 'folga') {
                    absenceLabel = 'folga';
                }
                html += `<td colspan="2" style="padding: 10px; border: 1px solid var(--border-color); text-align: center; color: var(--text-secondary); font-size: 0.85em;">
                    Marcado como ${absenceLabel}
                </td>`;
            }
        } else {
            // Criar linha com horários lado a lado (horizontal)
            let punchesHtml = '<div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">';
            dayPunches.forEach(p => {
                const time = new Date(p.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                punchesHtml += `
                    <span style="color: var(--text-primary); font-size: 0.9em; font-weight: 500; padding: 4px 8px; border-radius: 3px; background: var(--bg-tertiary); border: 1px solid var(--border-color);">
                        ${time}
                    </span>
                `;
            });
            punchesHtml += '</div>';
            
            html += `<td style="padding: 10px; border: 1px solid var(--border-color); text-align: center;">${punchesHtml}</td>`;
        }
        
        // Ações - COLUNA FIXA À DIREITA
        const punchIds = dayPunches.map(p => p.id).join(',');
        let acoesHtml = '<div style="display: flex; gap: 6px; justify-content: center; align-items: center; flex-direction: row; white-space: nowrap;">';
        
        if (dayPunches.length > 0) {
            acoesHtml += `<button onclick="openEditDayPunchesModal('${punchIds}', '${date}')" title="Editar horários" style="padding: 6px 10px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8em; font-weight: 600;">✏️</button>`;
        }
        
        if (employeeId) {
            const absenceType = absence ? absence.type : '';
            acoesHtml += `<button onclick="markAbsenceQuick(${employeeId}, '${date}', 'falta', '${absenceType}')" title="Marcar falta" style="padding: 6px 10px; background: #f39c12; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8em; font-weight: 600;">⚠️</button>`;
            acoesHtml += `<button onclick="markAbsenceQuick(${employeeId}, '${date}', 'feriado', '${absenceType}')" title="Marcar feriado" style="padding: 6px 10px; background: #9b59b6; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8em; font-weight: 600;">🎉</button>`;
            acoesHtml += `<button onclick="markAbsenceQuick(${employeeId}, '${date}', 'folga', '${absenceType}')" title="Marcar folga" style="padding: 6px 10px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8em; font-weight: 600;">🌴</button>`;
            
            // Botão de desfazer apenas se houver algo marcado
            if (absence) {
                acoesHtml += `<button onclick="removeAbsence(${employeeId}, '${date}'); refreshPunchTable();" title="Desfazer" style="padding: 6px 10px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8em; font-weight: 600;">↩️</button>`;
            }
        }
        
        acoesHtml += '</div>';
        html += `<td style="padding: 10px; border: 1px solid var(--border-color); text-align: center; vertical-align: middle;">${acoesHtml}</td>`;
        
        html += `</tr>`;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
    console.log('✅ Tabela renderizada com sucesso');
}

/**
 * Abre modal para editar pontos de um dia
 */
function openEditDayPunchesModal(punchIds, dateStr) {
    console.log('Abrindo modal com punchIds:', punchIds, 'dateStr:', dateStr);
    
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const punchIdArray = punchIds.toString().split(',').map(id => parseInt(id));
    const dayPunches = punches.filter(p => punchIdArray.includes(p.id));
    
    if (dayPunches.length === 0) {
        alert('Nenhum ponto encontrado para editar');
        return;
    }
    
    // Corrigir parse da data
    const dateParts = dateStr.split('-');
    const displayDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('pt-BR', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    console.log('displayDate:', displayDate);
    
    const modalId = 'edit-day-punches-modal-' + Date.now();
    
    // Criar tabela com pontos
    let tableRows = dayPunches.map((p, index) => {
        const time = new Date(p.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const inputId = `punch-type-${p.id}`;
        const timeInputId = `punch-time-${p.id}`;
        return `
            <tr style="background: white; border-bottom: 1px solid #eee;">
                <td style="padding: 12px; color: #333; font-weight: 600;">${p.type}</td>
                <td style="padding: 12px; color: #666;">
                    <input type="time" id="${timeInputId}" value="${time}" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; width: 100px;">
                </td>
                <td style="padding: 12px; text-align: center;">
                    <select id="${inputId}" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9em; background: white; color: #333; cursor: pointer; width: 130px;">
                        <option value="Entrada" ${p.type === 'Entrada' ? 'selected' : ''}>Entrada</option>
                        <option value="Saída" ${p.type === 'Saída' ? 'selected' : ''}>Saída</option>
                        <option value="Rf1" ${p.type === 'Rf1' ? 'selected' : ''}>Rf1</option>
                        <option value="Rf2" ${p.type === 'Rf2' ? 'selected' : ''}>Rf2</option>
                    </select>
                </td>
                <td style="padding: 12px; text-align: center;">
                    <button type="button" data-punch-id="${p.id}" class="delete-punch-btn" style="padding: 8px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.9em;">Deletar</button>
                </td>
            </tr>
        `;
    }).join('');
    
    const html = `
        <div id="${modalId}" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 8px; max-width: 900px; width: 90%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <div style="padding: 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; background: #f5f5f5;">
                    <h2 style="margin: 0; color: #333; font-size: 1.2em; font-weight: 600;">Editar Pontos do Dia</h2>
                    <button type="button" class="modal-close-btn" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #666; padding: 0; width: 30px; height: 30px;">×</button>
                </div>
                
                <div style="padding: 15px 20px; background: #f9f9f9; border-bottom: 1px solid #ddd; text-align: center;">
                    <span style="color: #333; font-weight: 600; font-size: 1em;">${displayDate}</span>
                </div>
                
                <div style="padding: 20px; overflow-y: auto; flex: 1;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f0f0f0; border-bottom: 2px solid #ddd;">
                                <th style="padding: 12px; text-align: left; color: #333; font-weight: 600; width: 20%;">Tipo</th>
                                <th style="padding: 12px; text-align: left; color: #333; font-weight: 600; width: 30%;">Horário</th>
                                <th style="padding: 12px; text-align: center; color: #333; font-weight: 600; width: 25%;">Alterar Para</th>
                                <th style="padding: 12px; text-align: center; color: #333; font-weight: 600; width: 25%;">Deletar</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
                
                <div style="padding: 16px 20px; border-top: 1px solid #ddd; display: flex; gap: 12px; justify-content: flex-end; background: #f5f5f5;">
                    <button type="button" class="modal-cancel-btn" style="padding: 10px 20px; background: #f0f0f0; color: #333; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-weight: 600;">Cancelar</button>
                    <button type="button" class="modal-save-btn" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Salvar Alterações</button>
                </div>
            </div>
        </div>
    `;
    
    // Criar elemento
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    const modal = modalDiv.firstElementChild;
    document.body.appendChild(modal);
    
    // Mostrar modal
    modal.style.display = 'flex';
    
    // Event listeners
    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('.modal-cancel-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('.modal-save-btn').addEventListener('click', () => {
        saveDayPunchesEdit(modal, punchIdArray);
    });
    
    // Deletar ponto
    modal.querySelectorAll('.delete-punch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const punchId = parseInt(btn.dataset.punchId);
            if (confirm('Tem certeza que deseja deletar este ponto?')) {
                deletePunchFromModal(punchId, modal);
            }
        });
    });
    
    // Fechar ao clicar no overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Edita o horário do ponto
 */
function editTime(timeInputId) {
    const input = document.getElementById(timeInputId);
    if (input) {
        input.style.display = 'inline-block';
        input.focus();
        document.getElementById(`time-display-${timeInputId.split('-')[2]}`).style.display = 'none';
    }
}

/**
 * Salva a edição do horário
 */
function saveTimeEdit(timeInputId, displayId) {
    const input = document.getElementById(timeInputId);
    const display = document.getElementById(displayId);
    
    if (input && display) {
        if (input.value) {
            display.textContent = input.value;
        }
        input.style.display = 'none';
        display.style.display = 'inline-block';
    }
}

/**
 * Deleta ponto dentro do modal
 */
function deletePunchFromModal(punchId, modal) {
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    // Comparar como string para garantir compatibilidade
    const filtered = punches.filter(p => String(p.id) !== String(punchId));
    localStorage.setItem('topservice_punches_v1', JSON.stringify(filtered));
    
    console.log(`🗑️ Ponto ${punchId} deletado`);
    
    // Fechar modal e atualizar
    modal.remove();
    
    showToast('Ponto deletado com sucesso!', 'success');
    refreshPunchTable();
}

/**
 * Salva as edições dos pontos do dia
 */
function saveDayPunchesEdit(modal, punchIdArray) {
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    
    // Atualizar cada ponto com o novo tipo e horário
    punchIdArray.forEach(punchId => {
        // Comparar como string para garantir compatibilidade
        const punch = punches.find(p => String(p.id) === String(punchId));
        if (punch) {
            // Atualizar tipo
            const selectElement = modal.querySelector(`#punch-type-${punchId}`);
            if (selectElement) {
                punch.type = selectElement.value;
            }
            
            // Atualizar horário
            const timeInputElement = modal.querySelector(`#punch-time-${punchId}`);
            if (timeInputElement && timeInputElement.value) {
                const newTime = timeInputElement.value;
                const currentDate = punch.timestamp.split('T')[0];
                punch.timestamp = `${currentDate}T${newTime}:00`;
            }
        } else {
            console.warn(`⚠️ Ponto ${punchId} não encontrado. IDs disponíveis:`, punches.map(p => p.id));
        }
    });
    
    localStorage.setItem('topservice_punches_v1', JSON.stringify(punches));
    
    // Fechar modal
    modal.remove();
    
    console.log(`✅ ${punchIdArray.length} ponto(s) editado(s) com sucesso`);
    showToast('Pontos editados com sucesso!', 'success');
    
    // Atualizar exibição
    refreshPunchTable();
}

/**
 * Edita um ponto do registro
 */
function editPunchUI(punchId, currentType, currentTime) {
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    // Comparar como string para garantir compatibilidade
    const punch = punches.find(p => String(p.id) === String(punchId));
    
    if (!punch) {
        console.error(`❌ Ponto ${punchId} não encontrado. IDs disponíveis:`, punches.map(p => p.id));
        showToast('Ponto não encontrado!', 'error');
        return;
    }
    
    // Modal para editar
    const newType = prompt(`Editar tipo de ponto:\nAtual: ${currentType}\n\nEscolha: "Entrada" ou "Saída"`, punch.type);
    
    if (newType === null) return; // Cancelado
    
    if (newType !== 'Entrada' && newType !== 'Saída') {
        alert('❌ Tipo inválido! Use "Entrada" ou "Saída"');
        return;
    }
    
    // Atualizar tipo
    punch.type = newType;
    localStorage.setItem('topservice_punches_v1', JSON.stringify(punches));
    
    console.log(`✏️ Ponto ${punchId} editado: ${newType}`);
    refreshPunchTable();
    showToast('Ponto editado com sucesso!', 'success');
}

/**
 * Deleta um ponto
 */
function deletePunchUI(punchId) {
    if (!confirm('Tem certeza que deseja deletar este ponto?')) return;
    
    console.log(`🗑️ Deletando ponto ${punchId}`);
    
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    // Comparar como string para garantir compatibilidade
    const filtered = punches.filter(p => String(p.id) !== String(punchId));
    
    localStorage.setItem('topservice_punches_v1', JSON.stringify(filtered));
    console.log(`✅ Ponto deletado. Restam ${filtered.length} pontos`);
    
    // Atualizar exibição
    refreshPunchTable();
    showToast('Ponto deletado com sucesso!', 'success');
}

/**
 * Abre modal para adicionar novo ponto manualmente
 */
function openAddPunchModal() {
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    
    // Obter o funcionário selecionado na consulta
    const empSelectCurrent = document.getElementById('punch-query-employee-select');
    const selectedEmpId = empSelectCurrent ? empSelectCurrent.value : '';
    
    const modalId = 'add-punch-modal-' + Date.now();
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Função para gerar campos de um ponto (hora e tipo)
    const generatePunchFields = (index) => `
        <div style="border: 1px solid var(--border-color); padding: 12px; border-radius: 6px; background: rgba(52, 152, 219, 0.05); display: grid; grid-template-columns: 1fr 1.5fr; gap: 12px; align-items: end;">
            <div>
                <label style="display:block;margin-bottom:4px;font-weight:600;font-size:0.9em;color:var(--text-primary);">Hora ${index + 1} *</label>
                <input type="time" id="add-punch-time-${index}" value="${index === 0 ? timeStr : ''}" class="form-input" style="width:100%;padding:8px;border:1px solid var(--border-color);border-radius:4px;font-size:0.9em;" />
            </div>
            
            <div>
                <label style="display:block;margin-bottom:4px;font-weight:600;font-size:0.85em;color:var(--text-primary);">Tipo *</label>
                <select id="add-punch-type-${index}" class="form-select" style="width:100%;padding:8px;border:1px solid var(--border-color);border-radius:4px;font-size:0.85em;">
                    <option value="">-- Selecione --</option>
                    <option value="Entrada" ${index === 0 ? 'selected' : ''}>Entrada</option>
                    <option value="RF 1">RF 1</option>
                    <option value="RF 2">RF 2</option>
                    <option value="Saída">Saída</option>
                </select>
            </div>
        </div>
    `;
    
    const html = `
        <div id="${modalId}" class="modal-overlay" onclick="if(event.target === this) document.getElementById('${modalId}').remove()">
            <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>➕ Adicionar Até 4 Pontos Manuais</h2>
                    <button class="modal-close-btn" onclick="document.getElementById('${modalId}').remove()">×</button>
                </div>
                
                <div style="padding: 20px; display: flex; flex-direction: column; gap: 18px;">
                    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 15px;">
                        <div>
                            <label style="display:block;margin-bottom:6px;font-weight:600;color:var(--text-primary);">Funcionário *</label>
                            <select id="add-punch-employee" class="form-select" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:4px;font-weight:500;">
                                <option value="">-- Selecione --</option>
                                ${employees.map(e => `<option value="${e.id}" ${e.id == selectedEmpId ? 'selected' : ''}>${e.matricula} - ${e.nome}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:6px;font-weight:600;color:var(--text-primary);">Data *</label>
                            <input type="date" id="add-punch-date-shared" value="${today}" class="form-input" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:4px;font-weight:500;" />
                        </div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <label style="font-weight:600;color:var(--text-primary);font-size:0.95em;">Horários e Tipos:</label>
                        ${[0, 1, 2, 3].map(i => generatePunchFields(i)).join('')}
                    </div>
                    
                    <div style="display:flex;gap:10px;">
                        <button class="btn btn-primary" onclick="saveMultiplePunches('${modalId}')" style="flex:1;padding:12px;font-weight:600;">✅ Adicionar Pontos</button>
                        <button class="btn btn-ghost" onclick="document.getElementById('${modalId}').remove()" style="flex:1;padding:12px;font-weight:600;">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
}

/**
 * Salva novo ponto
 */
function saveNewPunch(modalId) {
    const empSelect = document.getElementById('add-punch-employee');
    const dateInput = document.getElementById('add-punch-date');
    const timeInput = document.getElementById('add-punch-time');
    const typeRadio = document.querySelector('input[name="add-punch-type"]:checked');
    const rfRadio = document.querySelector('input[name="add-punch-rf"]:checked');
    
    if (!empSelect.value || !dateInput.value || !timeInput.value) {
        showToast('Preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    const newDateTime = new Date(`${dateInput.value}T${timeInput.value}`);
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    
    const newPunch = {
        id: Date.now(),
        employeeId: Number(empSelect.value),
        type: typeRadio.value,
        timestamp: newDateTime.toISOString(),
        rf: rfRadio.value
    };
    
    punches.push(newPunch);
    localStorage.setItem('topservice_punches_v1', JSON.stringify(punches));
    
    // Salvar a seleção atual antes de fechar o modal
    const empSelectCurrent = document.getElementById('punch-query-employee-select');
    const dateStartCurrent = document.getElementById('punch-query-date-start');
    const dateEndCurrent = document.getElementById('punch-query-date-end');
    
    const selectedEmpId = empSelectCurrent ? empSelectCurrent.value : '';
    const selectedStartDate = dateStartCurrent ? dateStartCurrent.value : '';
    const selectedEndDate = dateEndCurrent ? dateEndCurrent.value : '';
    
    document.getElementById(modalId).remove();
    
    // Recarregar apenas a tabela de pontos, mantendo as seleções
    refreshPunchQuery(selectedEmpId, selectedStartDate, selectedEndDate);
    
    showToast('Ponto adicionado com sucesso!', 'success');
}

/**
 * Salva múltiplos pontos (até 4)
 */
function saveMultiplePunches(modalId) {
    const empSelect = document.getElementById('add-punch-employee');
    const dateInput = document.getElementById('add-punch-date-shared');
    
    if (!empSelect.value) {
        showToast('Selecione um funcionário', 'warning');
        return;
    }
    
    if (!dateInput.value) {
        showToast('Selecione uma data', 'warning');
        return;
    }
    
    const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    let punchesAdded = 0;
    
    // Processar cada um dos 4 campos de ponto
    for (let i = 0; i < 4; i++) {
        const timeInput = document.getElementById(`add-punch-time-${i}`);
        const typeSelect = document.getElementById(`add-punch-type-${i}`);
        
        // Se houver hora e tipo preenchidos, adicionar o ponto
        if (timeInput.value && typeSelect.value) {
            const newDateTime = new Date(`${dateInput.value}T${timeInput.value}`);
            
            const newPunch = {
                id: Date.now() + i, // Garantir IDs únicos
                employeeId: Number(empSelect.value),
                type: typeSelect.value,
                timestamp: newDateTime.toISOString()
            };
            
            punches.push(newPunch);
            punchesAdded++;
        }
    }
    
    if (punchesAdded === 0) {
        showToast('Preencha pelo menos um horário e tipo', 'warning');
        return;
    }
    
    localStorage.setItem('topservice_punches_v1', JSON.stringify(punches));
    
    // Salvar a seleção atual antes de fechar o modal
    const empSelectCurrent = document.getElementById('punch-query-employee-select');
    const dateStartCurrent = document.getElementById('punch-query-date-start');
    const dateEndCurrent = document.getElementById('punch-query-date-end');
    
    const selectedEmpId = empSelectCurrent ? empSelectCurrent.value : '';
    const selectedStartDate = dateStartCurrent ? dateStartCurrent.value : '';
    const selectedEndDate = dateEndCurrent ? dateEndCurrent.value : '';
    
    document.getElementById(modalId).remove();
    
    // Recarregar apenas a tabela de pontos, mantendo as seleções
    refreshPunchQuery(selectedEmpId, selectedStartDate, selectedEndDate);
    
    showToast(`✅ ${punchesAdded} ponto(s) adicionado(s) com sucesso!`, 'success');
}

/**
 * Atualiza a consulta de ponto mantendo as seleções atuais
 */
function refreshPunchQuery(selectedEmpId, selectedStartDate, selectedEndDate) {
    console.log('🔄 Atualizando consulta de ponto mantendo seleções...');
    
    // Se houver seleção de funcionário, atualizar a tabela
    if (selectedEmpId) {
        const empSelect = document.getElementById('punch-query-employee-select');
        if (empSelect) {
            empSelect.value = selectedEmpId;
        }
        
        const dateStartInput = document.getElementById('punch-query-date-start');
        const dateEndInput = document.getElementById('punch-query-date-end');
        
        if (dateStartInput && selectedStartDate) dateStartInput.value = selectedStartDate;
        if (dateEndInput && selectedEndDate) dateEndInput.value = selectedEndDate;
        
        // Executar a busca
        const searchBtn = document.getElementById('punch-query-search-btn');
        if (searchBtn) {
            searchBtn.click();
        }
    }
}

/**
 * Inicializa módulo de consulta de ponto
 */
function initPunchQueryModule() {
    console.log('🚀 initPunchQueryModule INICIANDO...');
    
    // Aguardar um pouco para garantir que os elementos estão no DOM
    setTimeout(() => {
        // Elementos do select
        const empSelect = document.getElementById('punch-query-employee-select');
        const deptFilter = document.getElementById('punch-query-department-filter');
        
        console.log('🔍 Procurando elementos...');
        console.log('✓ punch-query-employee-select encontrado:', !!empSelect);
        console.log('✓ punch-query-department-filter encontrado:', !!deptFilter);
        
        if (!empSelect || !deptFilter) {
            console.error('❌ ERRO: Elementos não encontrados!');
            console.error('   - punch-query-employee-select:', empSelect);
            console.error('   - punch-query-department-filter:', deptFilter);
            return;
        }
        
        // Dados de funcionários
        let employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        console.log('📦 Funcionários no localStorage:', employees.length);
        
        if (employees.length === 0 && typeof employeesData !== 'undefined') {
            console.log('📥 Usando employeesData padrão');
            employees = employeesData;
            localStorage.setItem('topservice_employees_v1', JSON.stringify(employees));
        }
        
        console.log('👥 Total de funcionários:', employees.length);
        
        if (employees.length === 0) {
            console.error('❌ Nenhum funcionário disponível!');
            empSelect.innerHTML = '<option>-- Nenhum funcionário cadastrado --</option>';
            deptFilter.innerHTML = '<option>-- Nenhum departamento --</option>';
            return;
        }
        
        // Extrair departamentos únicos
        const depts = [...new Set(employees.map(e => e.departamento || e.department).filter(Boolean))].sort();
        console.log('🏢 Departamentos encontrados:', depts);
        
        // Popular select de departamentos
        deptFilter.innerHTML = '<option value="">-- Todos os departamentos --</option>';
        depts.forEach(d => {
            deptFilter.innerHTML += `<option value="${d}">${d}</option>`;
        });
        console.log('✅ Departamentos preenchidos:', deptFilter.options.length);
        
        // Popular select de funcionários
        empSelect.innerHTML = '<option value="">-- Selecione um funcionário --</option>';
        employees.forEach(e => {
            empSelect.innerHTML += `<option value="${e.id}">${e.matricula} - ${e.nome}</option>`;
        });
        console.log('✅ Funcionários preenchidos:', empSelect.options.length);
        
        // Evento de filtro de departamento
        deptFilter.onchange = function() {
            filterEmployeesByDepartment(this.value);
        };
        
        // Datas padrão
        const dateStart = document.getElementById('punch-query-date-start');
        const dateEnd = document.getElementById('punch-query-date-end');
        if (dateStart || dateEnd) {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            if (dateStart) dateStart.value = firstDay.toISOString().split('T')[0];
            if (dateEnd) dateEnd.value = now.toISOString().split('T')[0];
        }
        
        // Botão Consultar
        const searchBtn = document.getElementById('punch-query-search-btn');
        if (searchBtn) {
            searchBtn.onclick = function() {
                if (!empSelect.value) {
                    showToast('Selecione um funcionário', 'warning');
                    return;
                }
                refreshPunchTable();
            };
        }
        
        // Botão Adicionar
        const addBtn = document.getElementById('punch-query-add-btn');
        if (addBtn) addBtn.onclick = openAddPunchModal;
        
        // Botão Limpar
        const clearBtn = document.getElementById('punch-query-clear-btn');
        if (clearBtn) {
            clearBtn.onclick = function() {
                empSelect.value = '';
                if (dateStart) {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                    dateStart.value = firstDay.toISOString().split('T')[0];
                }
                if (dateEnd) dateEnd.value = new Date().toISOString().split('T')[0];
                const table = document.getElementById('punch-query-table');
                if (table) table.innerHTML = '';
            };
        }
        
        // Botão Anterior
        const prevBtn = document.getElementById('punch-query-prev-employee');
        if (prevBtn) prevBtn.onclick = previousEmployee;
        
        // Botão Próximo
        const nextBtn = document.getElementById('punch-query-next-employee');
        if (nextBtn) nextBtn.onclick = nextEmployee;
        
        console.log('✅✅✅ CONSULTA DE PONTO INICIALIZADA COM SUCESSO');
        console.log('📊 Departamentos:', depts);
        console.log('👥 Funcionários:', employees.length);
    }, 150);
}

/**
 * Filtra funcionários por departamento
 */
function filterEmployeesByDepartment(departmentName) {
    const empSelect = document.getElementById('punch-query-employee-select');
    if (!empSelect) return;
    
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    
    let filtered = employees;
    if (departmentName) {
        filtered = employees.filter(e => (e.departamento || e.department) === departmentName);
    }
    
    // Preservar seleção atual se possível
    const currentValue = empSelect.value;
    
    // Repovoar o select
    empSelect.innerHTML = '<option value="">-- Selecione um funcionário --</option>' +
        filtered.map(e => `<option value="${e.id}">${e.matricula} - ${e.nome}</option>`).join('');
    
    // Tentar restaurar seleção
    if (currentValue && filtered.some(e => e.id == currentValue)) {
        empSelect.value = currentValue;
    }
    
    console.log(`🔍 Funcionários filtrados por departamento "${departmentName}": ${filtered.length} funcionários`);
}

/**
 * Navega para o funcionário anterior na lista filtrada
 */
function previousEmployee() {
    const empSelect = document.getElementById('punch-query-employee-select');
    if (!empSelect || empSelect.options.length === 0) return;
    
    let currentIndex = empSelect.selectedIndex;
    
    // Pular a opção "--Selecione--"
    if (currentIndex <= 1) {
        currentIndex = empSelect.options.length - 1;
    } else {
        currentIndex--;
    }
    
    empSelect.selectedIndex = currentIndex;
    empSelect.dispatchEvent(new Event('change'));
    console.log(`⬅️ Navegando para funcionário anterior: ${empSelect.options[currentIndex].text}`);
}

/**
 * Navega para o próximo funcionário na lista filtrada
 */
function nextEmployee() {
    const empSelect = document.getElementById('punch-query-employee-select');
    if (!empSelect || empSelect.options.length === 0) return;
    
    let currentIndex = empSelect.selectedIndex;
    
    // Se está em "--Selecione--", ir para o primeiro
    if (currentIndex === 0 || currentIndex === empSelect.options.length - 1) {
        currentIndex = 1;
    } else {
        currentIndex++;
    }
    
    if (currentIndex >= empSelect.options.length) {
        currentIndex = 1; // Voltar ao primeiro (pulando "--Selecione--")
    }
    
    empSelect.selectedIndex = currentIndex;
    empSelect.dispatchEvent(new Event('change'));
    console.log(`➡️ Navegando para próximo funcionário: ${empSelect.options[currentIndex].text}`);
}

/**
 * Abre modal de registrar ações
 */
function openActionModal() {
    console.log('🎯 openActionModal CHAMADO');
    
    const empSelect = document.getElementById('punch-query-employee-select');
    if (!empSelect?.value) {
        showToast('Selecione um funcionário primeiro', 'warning');
        return;
    }
    
    console.log('✅ Funcionário selecionado:', empSelect.value);
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'action-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); width: 90%; max-width: 500px; max-height: 85vh; display: flex; flex-direction: column; padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 1.5em; color: #333;">📋 Registrar Ação</h2>
                <button onclick="document.getElementById('action-modal').remove();" style="background: none; border: none; font-size: 32px; cursor: pointer; color: #999; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">×</button>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 18px; overflow-y: auto; flex: 1; padding-right: 8px;">
                <!-- Seleção do tipo de ação -->
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333; font-size: 0.95em;">Tipo de Ação *</label>
                    <select id="modal-action-type-select" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 1em; cursor: pointer; background: white; color: #333;">
                        <option value="">-- Selecione uma ação --</option>
                        <option value="folga">🌴 Folga</option>
                        <option value="feriado">🎉 Feriado</option>
                        <option value="falta">⚠️ Falta</option>
                    </select>
                </div>

                <!-- Modo de seleção de datas -->
                <div>
                    <label style="display: block; margin-bottom: 12px; font-weight: 600; color: #333; font-size: 0.95em;">Como deseja selecionar as datas? *</label>
                    <div style="display: flex; gap: 16px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1;">
                            <input type="radio" name="modal-selection-mode" value="interval" checked style="cursor: pointer; width: 18px; height: 18px; accent-color: #3498db;" />
                            <span style="font-size: 0.95em;">Intervalo</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1;">
                            <input type="radio" name="modal-selection-mode" value="multiple" style="cursor: pointer; width: 18px; height: 18px; accent-color: #3498db;" />
                            <span style="font-size: 0.95em;">Datas específicas</span>
                        </label>
                    </div>
                </div>

                <!-- Modo Intervalo de datas -->
                <div id="modal-interval-mode">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333; font-size: 0.9em;">Data Inicial *</label>
                            <input type="date" id="modal-action-date-start" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 0.95em;" />
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333; font-size: 0.9em;">Data Final *</label>
                            <input type="date" id="modal-action-date-end" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 0.95em;" />
                        </div>
                    </div>
                </div>

                <!-- Modo Seleção de datas específicas -->
                <div id="modal-multiple-mode" style="display: none;">
                    <label style="display: block; margin-bottom: 12px; font-weight: 600; color: #333; font-size: 0.9em;">Selecione as datas no calendário abaixo *</label>
                    <div id="modal-calendar-wrapper" style="border: 2px solid #ddd; border-radius: 6px; padding: 12px; background: #f9f9f9; max-height: 300px; overflow-y: auto;"></div>
                    <div id="modal-selected-dates" style="display: flex; gap: 8px; margin-top: 12px; overflow-x: auto; padding-bottom: 8px;"></div>
                </div>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button id="modal-action-clear-btn" style="flex: 1; padding: 12px; background: #f0f0f0; color: #333; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95em;">Limpar</button>
                <button onclick="document.getElementById('action-modal').remove();" style="flex: 1; padding: 12px; background: #f0f0f0; color: #333; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95em;">Cancelar</button>
                <button id="modal-action-register-btn" style="flex: 1; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95em;">✅ Registrar</button>
            </div>
        </div>
    `;
    
    console.log('✅ Modal HTML criado');
    document.body.appendChild(modal);
    
    console.log('🔧 Inicializando eventos do modal...');
    initModalActionPanel();
    
    console.log('✅ Modal de ações aberto com sucesso');
}

/**
 * Inicializa o painel de ações do modal
 */
function initModalActionPanel() {
    console.log('🎯 Inicializando painel de ações do modal...');
    
    // Radios de modo de seleção
    const intervalRadio = document.querySelector('input[name="modal-selection-mode"][value="interval"]');
    const multipleRadio = document.querySelector('input[name="modal-selection-mode"][value="multiple"]');
    const intervalMode = document.getElementById('modal-interval-mode');
    const multipleMode = document.getElementById('modal-multiple-mode');
    
    if (intervalRadio) {
        intervalRadio.onchange = function() {
            if (this.checked) {
                intervalMode.style.display = 'block';
                multipleMode.style.display = 'none';
            }
        };
    }
    
    if (multipleRadio) {
        multipleRadio.onchange = function() {
            if (this.checked) {
                intervalMode.style.display = 'none';
                multipleMode.style.display = 'block';
                renderCalendarPicker();
            }
        };
    }
    
    // Inicializar calendário se modo múltiplo está ativo
    if (multipleRadio && multipleRadio.checked) {
        setTimeout(() => renderCalendarPicker(), 100);
    }
    
    // Armazenar referência das datas selecionadas e mês do calendário
    window.modalSelectedDates = window.modalSelectedDates || [];
    window.modalCalendarMonth = window.modalCalendarMonth !== undefined ? window.modalCalendarMonth : new Date().getMonth();
    window.modalCalendarYear = window.modalCalendarYear !== undefined ? window.modalCalendarYear : new Date().getFullYear();
    
    // Botão Registrar Ação
    const registerBtn = document.getElementById('modal-action-register-btn');
    if (registerBtn) {
        registerBtn.onclick = registerModalAction;
    }
    
    // Botão Limpar Ação
    const clearBtn = document.getElementById('modal-action-clear-btn');
    if (clearBtn) {
        clearBtn.onclick = clearModalActionForm;
    }
    
    console.log('✅ Painel de ações do modal inicializado');
}

/**
 * Renderiza calendário interativo que permanece aberto
 */
function renderCalendarPicker() {
    const calendarWrapper = document.getElementById('modal-calendar-wrapper');
    if (!calendarWrapper) return;
    
    // Inicializar variáveis globais se não existirem
    if (window.modalCalendarMonth === undefined) {
        window.modalCalendarMonth = new Date().getMonth();
        window.modalCalendarYear = new Date().getFullYear();
    }
    
    const calendarContainer = document.createElement('div');
    calendarContainer.id = 'modal-calendar-container';
    calendarContainer.style.cssText = `
        padding: 0;
        margin: 0;
    `;
    
    // Remover calendário anterior se existir
    const existingCalendar = document.getElementById('modal-calendar-container');
    if (existingCalendar) {
        existingCalendar.remove();
    }
    
    // Header com navegação de mês/ano
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    `;
    
    const monthYearSpan = document.createElement('span');
    monthYearSpan.id = 'modal-month-year';
    monthYearSpan.style.cssText = 'font-weight: 600; font-size: 1em; color: #333;';
    
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '◀';
    prevBtn.style.cssText = `
        background: #3498db;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
    `;
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '▶';
    nextBtn.style.cssText = `
        background: #3498db;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
    `;
    
    header.appendChild(prevBtn);
    header.appendChild(monthYearSpan);
    header.appendChild(nextBtn);
    
    // Tabela de calendário
    const calendarTable = document.createElement('table');
    calendarTable.id = 'modal-calendar-table';
    calendarTable.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
    `;
    
    // Renderizar calendário
    const renderMonth = (year, month) => {
        // Armazenar o mês/ano selecionado globalmente
        window.modalCalendarMonth = month;
        window.modalCalendarYear = year;
        
        monthYearSpan.textContent = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        calendarTable.innerHTML = '';
        
        // Cabeçalho com dias da semana
        const headerRow = document.createElement('tr');
        const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        daysOfWeek.forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            th.style.cssText = 'padding: 8px; font-weight: 600; color: #333; border-bottom: 2px solid #ddd; font-size: 0.9em;';
            headerRow.appendChild(th);
        });
        calendarTable.appendChild(headerRow);
        
        // Linhas com dias
        let currentRow = document.createElement('tr');
        
        // Preencher dias vazios antes do primeiro dia do mês
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('td');
            emptyCell.style.cssText = 'padding: 8px; text-align: center;';
            currentRow.appendChild(emptyCell);
        }
        
        // Preencher dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
            if (currentRow.children.length === 7) {
                calendarTable.appendChild(currentRow);
                currentRow = document.createElement('tr');
            }
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = window.modalSelectedDates.includes(dateStr);
            
            const cell = document.createElement('td');
            const button = document.createElement('button');
            button.textContent = day;
            button.style.cssText = `
                width: 100%;
                padding: 8px;
                border: 2px solid #ddd;
                background: ${isSelected ? '#27ae60' : 'white'};
                color: ${isSelected ? 'white' : '#333'};
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.9em;
                transition: all 0.2s;
            `;
            
            button.onmouseover = function() {
                if (!isSelected) {
                    this.style.background = '#e8f4f8';
                }
            };
            button.onmouseout = function() {
                if (!isSelected) {
                    this.style.background = 'white';
                }
            };
            
            button.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (window.modalSelectedDates.includes(dateStr)) {
                    window.modalSelectedDates = window.modalSelectedDates.filter(d => d !== dateStr);
                } else {
                    window.modalSelectedDates.push(dateStr);
                    window.modalSelectedDates.sort();
                }
                
                // Apenas atualizar tags e tabela, não toda a renderização
                renderSelectedDatesTags();
                updateCalendarTable(window.modalCalendarYear, window.modalCalendarMonth);
            };
            
            cell.style.cssText = 'padding: 4px; text-align: center;';
            cell.appendChild(button);
            currentRow.appendChild(cell);
        }
        
        // Preencher células vazias do final
        while (currentRow.children.length < 7) {
            const emptyCell = document.createElement('td');
            emptyCell.style.cssText = 'padding: 8px; text-align: center;';
            currentRow.appendChild(emptyCell);
        }
        
        calendarTable.appendChild(currentRow);
    };
    
    // Eventos de navegação
    prevBtn.onclick = function(e) {
        e.preventDefault();
        let month = window.modalCalendarMonth - 1;
        let year = window.modalCalendarYear;
        if (month < 0) {
            month = 11;
            year--;
        }
        renderMonth(year, month);
    };
    
    nextBtn.onclick = function(e) {
        e.preventDefault();
        let month = window.modalCalendarMonth + 1;
        let year = window.modalCalendarYear;
        if (month > 11) {
            month = 0;
            year++;
        }
        renderMonth(year, month);
    };
    
    // Renderizar mês armazenado globalmente
    renderMonth(window.modalCalendarYear, window.modalCalendarMonth);
    
    calendarContainer.appendChild(header);
    calendarContainer.appendChild(calendarTable);
    
    // Adicionar ao wrapper do calendário
    calendarWrapper.innerHTML = '';
    calendarWrapper.appendChild(calendarContainer);
    
    renderSelectedDatesTags();
}

/**
 * Atualiza apenas a tabela do calendário sem perder o mês/navegação
 */
function updateCalendarTable(year, month) {
    const calendarTable = document.getElementById('modal-calendar-table');
    if (!calendarTable) return;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    calendarTable.innerHTML = '';
    
    // Cabeçalho com dias da semana
    const headerRow = document.createElement('tr');
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    daysOfWeek.forEach(day => {
        const th = document.createElement('th');
        th.textContent = day;
        th.style.cssText = 'padding: 8px; font-weight: 600; color: #333; border-bottom: 2px solid #ddd; font-size: 0.9em;';
        headerRow.appendChild(th);
    });
    calendarTable.appendChild(headerRow);
    
    // Linhas com dias
    let currentRow = document.createElement('tr');
    
    // Preencher dias vazios antes do primeiro dia do mês
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('td');
        emptyCell.style.cssText = 'padding: 8px; text-align: center;';
        currentRow.appendChild(emptyCell);
    }
    
    // Preencher dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
        if (currentRow.children.length === 7) {
            calendarTable.appendChild(currentRow);
            currentRow = document.createElement('tr');
        }
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isSelected = window.modalSelectedDates.includes(dateStr);
        
        const cell = document.createElement('td');
        const button = document.createElement('button');
        button.textContent = day;
        button.style.cssText = `
            width: 100%;
            padding: 8px;
            border: 2px solid #ddd;
            background: ${isSelected ? '#27ae60' : 'white'};
            color: ${isSelected ? 'white' : '#333'};
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9em;
            transition: all 0.2s;
        `;
        
        button.onmouseover = function() {
            if (!isSelected) {
                this.style.background = '#e8f4f8';
            }
        };
        button.onmouseout = function() {
            if (!isSelected) {
                this.style.background = 'white';
            }
        };
        
        button.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.modalSelectedDates.includes(dateStr)) {
                window.modalSelectedDates = window.modalSelectedDates.filter(d => d !== dateStr);
            } else {
                window.modalSelectedDates.push(dateStr);
                window.modalSelectedDates.sort();
            }
            
            // Apenas atualizar tags e tabela, não toda a renderização
            renderSelectedDatesTags();
            updateCalendarTable(year, month);
        };
        
        cell.style.cssText = 'padding: 4px; text-align: center;';
        cell.appendChild(button);
        currentRow.appendChild(cell);
    }
    
    // Preencher células vazias do final
    while (currentRow.children.length < 7) {
        const emptyCell = document.createElement('td');
        emptyCell.style.cssText = 'padding: 8px; text-align: center;';
        currentRow.appendChild(emptyCell);
    }
    
    calendarTable.appendChild(currentRow);
}

/**
 * Renderiza as tags das datas selecionadas
 */
function renderSelectedDatesTags() {
    const selectedDatesDiv = document.getElementById('modal-selected-dates');
    if (!selectedDatesDiv) return;
    
    selectedDatesDiv.innerHTML = '';
    
    if (window.modalSelectedDates.length === 0) {
        selectedDatesDiv.innerHTML = '<p style="color: #999; font-size: 0.9em; margin: 0; flex-shrink: 0;">Nenhuma data selecionada</p>';
        return;
    }
    
    window.modalSelectedDates.forEach((date, index) => {
        const dateObj = new Date(date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('pt-BR');
        
        const tag = document.createElement('div');
        tag.style.cssText = `
            background: #27ae60;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
            flex-shrink: 0;
        `;
        tag.innerHTML = `
            ${formattedDate}
            <button type="button" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.1em; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">×</button>
        `;
        
        const removeBtn = tag.querySelector('button');
        removeBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.modalSelectedDates.splice(index, 1);
            renderCalendarPicker();
        };
        
        selectedDatesDiv.appendChild(tag);
    });
}

/**
 * Registra ação (Folga/Feriado/Falta) via modal
 */
function registerModalAction() {
    const empSelect = document.getElementById('punch-query-employee-select');
    const actionType = document.getElementById('modal-action-type-select');
    const selectionMode = document.querySelector('input[name="modal-selection-mode"]:checked').value;
    
    if (!empSelect?.value) {
        showToast('Selecione um funcionário', 'warning');
        return;
    }
    
    if (!actionType?.value) {
        showToast('Selecione um tipo de ação', 'warning');
        return;
    }
    
    const employeeId = Number(empSelect.value);
    const type = actionType.value;
    let datesToRegister = [];
    
    // Coletar datas baseado no modo de seleção
    if (selectionMode === 'interval') {
        const startDate = document.getElementById('modal-action-date-start').value;
        const endDate = document.getElementById('modal-action-date-end').value;
        
        if (!startDate || !endDate) {
            showToast('Preencha as datas inicial e final', 'warning');
            return;
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            datesToRegister.push(d.toISOString().split('T')[0]);
        }
    } else {
        // Modo múltiplo - usar as datas selecionadas armazenadas
        if (!window.modalSelectedDates || window.modalSelectedDates.length === 0) {
            showToast('Selecione pelo menos uma data', 'warning');
            return;
        }
        datesToRegister = [...window.modalSelectedDates];
    }
    
    // Carregar ausências
    let absences = JSON.parse(localStorage.getItem('topservice_absences_v1') || '[]');
    
    // Registrar cada data
    let registered = 0;
    datesToRegister.forEach(date => {
        // Verificar se já existe
        const existing = absences.find(a => a.employeeId === employeeId && a.date === date && a.type === type);
        
        if (!existing) {
            absences.push({
                id: Date.now() + Math.random(),
                employeeId,
                date,
                type
            });
            registered++;
        }
    });
    
    if (registered === 0) {
        showToast('Todas essas datas já estão registradas', 'info');
        return;
    }
    
    // Salvar
    localStorage.setItem('topservice_absences_v1', JSON.stringify(absences));
    
    // Mensagem de sucesso
    const actionEmoji = type === 'folga' ? '🌴' : type === 'feriado' ? '🎉' : '⚠️';
    showToast(`${actionEmoji} ${registered} dia(s) registrado(s) com sucesso!`, 'success');
    
    // MANTER MODAL ABERTO - apenas limpar os dados para nova seleção
    window.modalSelectedDates = [];
    
    // Limpar campos de seleção
    clearModalActionForm();
    
    // Atualizar tabela se houver consulta ativa
    const empId = empSelect.value;
    if (empId) {
        refreshPunchTable();
    }
    
    console.log(`✅ ${registered} dia(s) registrado(s) como ${type} para funcionário ${employeeId}`);
}

/**
 * Limpa o formulário de ações do modal
 */
function clearModalActionForm() {
    // Limpar tipo de ação
    const typeSelect = document.getElementById('modal-action-type-select');
    if (typeSelect) typeSelect.value = '';
    
    // Limpar datas do intervalo
    const dateStart = document.getElementById('modal-action-date-start');
    const dateEnd = document.getElementById('modal-action-date-end');
    if (dateStart) dateStart.value = '';
    if (dateEnd) dateEnd.value = '';
    
    // Limpar datas selecionadas no modo múltiplo
    window.modalSelectedDates = [];
    
    // Resetar calendário para o mês atual
    window.modalCalendarMonth = new Date().getMonth();
    window.modalCalendarYear = new Date().getFullYear();
    
    // Re-renderizar o calendário e tags
    const multipleRadio = document.querySelector('input[name="modal-selection-mode"][value="multiple"]');
    if (multipleRadio && multipleRadio.checked) {
        renderCalendarPicker();
    }
    
    console.log('🧹 Formulário de ações do modal limpo');
}

console.log('✅ Módulo de consulta de ponto carregado');
