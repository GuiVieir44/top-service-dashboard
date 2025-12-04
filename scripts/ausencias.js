// ==========================================
// MÓDULO DE AUSÊNCIAS - TOP SERVICE
// ==========================================
// Gerencia faltas e feriados dos funcionários

console.log('📋 Arquivo ausencias.js carregado!');

/**
 * Salva ausência (falta ou feriado)
 */
function saveAbsence(employeeId, date, type) {
    // type: 'falta' ou 'feriado'
    const absences = JSON.parse(localStorage.getItem('topservice_absences_v1') || '[]');
    
    // Remover se já existe
    const filtered = absences.filter(a => !(a.employeeId == employeeId && a.date === date));
    
    // Adicionar nova ausência
    filtered.push({
        id: Date.now(),
        employeeId: Number(employeeId),
        date: date,
        type: type // 'falta' ou 'feriado'
    });
    
    localStorage.setItem('topservice_absences_v1', JSON.stringify(filtered));
    console.log(`✅ Ausência salva: ${type} para funcionário ${employeeId} em ${date}`);
}

/**
 * Remove ausência
 */
function removeAbsence(employeeId, date) {
    const absences = JSON.parse(localStorage.getItem('topservice_absences_v1') || '[]');
    const filtered = absences.filter(a => !(a.employeeId == employeeId && a.date === date));
    localStorage.setItem('topservice_absences_v1', JSON.stringify(filtered));
    console.log(`🗑️ Ausência removida para funcionário ${employeeId} em ${date}`);
}

/**
 * Obtém ausência de um dia específico
 */
function getAbsenceForDay(employeeId, date) {
    const absences = JSON.parse(localStorage.getItem('topservice_absences_v1') || '[]');
    return absences.find(a => a.employeeId == employeeId && a.date === date);
}

/**
 * Obtém todas as ausências de um funcionário
 */
function getAbsencesByEmployee(employeeId, startDate = null, endDate = null) {
    const absences = JSON.parse(localStorage.getItem('topservice_absences_v1') || '[]');
    let filtered = absences.filter(a => a.employeeId == employeeId);
    
    if (startDate && endDate) {
        filtered = filtered.filter(a => a.date >= startDate && a.date <= endDate);
    }
    
    return filtered;
}

/**
 * Conta faltas em um período
 */
function countAbsencesByType(employeeId, type, startDate, endDate) {
    const absences = getAbsencesByEmployee(employeeId, startDate, endDate);
    return absences.filter(a => a.type === type).length;
}

/**
 * Marca ausência rapidamente (falta, feriado ou folga) sem abrir modal
 */
function markAbsenceQuick(employeeId, date, type, currentAbsenceType = '') {
    // Se já existe a mesma ausência, remover
    if (currentAbsenceType === type) {
        removeAbsence(employeeId, date);
        const typeLabel = type === 'falta' ? 'Falta' : type === 'feriado' ? 'Feriado' : 'Folga';
        showToast(`${typeLabel} removida com sucesso!`, 'success');
    } else {
        // Salvar nova ausência
        saveAbsence(employeeId, date, type);
        const typeLabel = type === 'falta' ? 'Falta' : type === 'feriado' ? 'Feriado' : 'Folga';
        showToast(`${typeLabel} marcada com sucesso!`, 'success');
    }
    
    // Atualizar tabela
    if (typeof refreshPunchTable === 'function') {
        refreshPunchTable();
    }
}

/**
 * Abre modal para marcar falta/feriado
 */
function openMarkAbsenceModal(employeeId, dateStr, currentAbsence = null) {
    const modalId = 'mark-absence-modal-' + Date.now();
    
    const dateParts = dateStr.split('-');
    const displayDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('pt-BR');
    
    // Buscar nome do funcionário
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    const emp = employees.find(e => e.id == employeeId);
    const empName = emp ? emp.nome : `Funcionário ${employeeId}`;
    
    let html = `
        <div id="${modalId}" style="display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 8px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.3); padding: 30px;">
                <h2 style="margin: 0 0 10px 0; color: #333; font-size: 1.2em; font-weight: 600;">Marcar Ausência</h2>
                <p style="margin: 0 0 20px 0; color: #666; font-size: 0.95em;">
                    <strong>${empName}</strong><br>
                    <span style="color: #999;">${displayDate}</span>
                </p>
                
                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                    <button type="button" class="btn-falta" style="flex: 1; padding: 15px; background: #f39c12; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1em; transition: all 0.3s;">
                        ⚠️ Falta
                    </button>
                    <button type="button" class="btn-feriado" style="flex: 1; padding: 15px; background: #9b59b6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1em; transition: all 0.3s;">
                        🎉 Feriado
                    </button>
                </div>
                
                ${currentAbsence ? `
                    <button type="button" class="btn-remove" style="width: 100%; padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-bottom: 10px; transition: all 0.3s;">
                        🗑️ Remover ${currentAbsence.type === 'falta' ? 'Falta' : 'Feriado'}
                    </button>
                ` : ''}
                
                <button type="button" class="btn-cancel" style="width: 100%; padding: 10px; background: #ecf0f1; color: #333; border: 1px solid #bdc3c7; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    const modal = modalDiv.firstElementChild;
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.btn-falta').addEventListener('click', () => {
        saveAbsence(employeeId, dateStr, 'falta');
        modal.remove();
        showToast('Falta marcada com sucesso!', 'success');
        refreshPunchTable();
    });
    
    modal.querySelector('.btn-feriado').addEventListener('click', () => {
        saveAbsence(employeeId, dateStr, 'feriado');
        modal.remove();
        showToast('Feriado marcado com sucesso!', 'success');
        refreshPunchTable();
    });
    
    modal.querySelector('.btn-cancel').addEventListener('click', () => {
        modal.remove();
    });
    
    if (currentAbsence) {
        modal.querySelector('.btn-remove').addEventListener('click', () => {
            removeAbsence(employeeId, dateStr);
            modal.remove();
            showToast(`${currentAbsence.type === 'falta' ? 'Falta' : 'Feriado'} removida com sucesso!`, 'success');
            refreshPunchTable();
        });
    }
    
    // Fechar ao clicar no overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

console.log('✅ Módulo de ausências carregado');
