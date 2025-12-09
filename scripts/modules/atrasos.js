// ==========================================
// MÓDULO DE ATRASOS - TOP SERVICE
// ==========================================
// Rastreia atrasos (entradas após a hora prevista)

var DELAYS_KEY = 'topservice_delays_v1';

/**
 * Calcula atrasos do mês
 * Atraso = quando funcionário entra após horaInicio do cargo
 */
function calculateMonthlyDelays() {
    const punches = (window.supabaseRealtime && window.supabaseRealtime.data.punches) || JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
    const employees = (window.supabaseRealtime && window.supabaseRealtime.data.employees) || JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    const cargosDept = (window.supabaseRealtime && window.supabaseRealtime.data.cargos_departamento) || JSON.parse(localStorage.getItem('topservice_cargos_departamento_v1') || '[]');
    const departamentos = (window.supabaseRealtime && window.supabaseRealtime.data.departamentos) || JSON.parse(localStorage.getItem('topservice_departamentos_v1') || '[]');
    const cargos = (window.supabaseRealtime && window.supabaseRealtime.data.cargos) || JSON.parse(localStorage.getItem('topservice_cargos_v1') || '[]');
    
    // Filtrar punches deste mês
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthPunches = punches.filter(p => {
        const pDate = new Date(p.timestamp);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });
    
    // Agrupar punches por funcionário e dia
    const dailyPunches = {};
    monthPunches.forEach(p => {
        const day = p.timestamp.split('T')[0];
        const key = `${p.employeeId}_${day}`;
        if (!dailyPunches[key]) {
            dailyPunches[key] = { employeeId: p.employeeId, day: day, punches: [] };
        }
        dailyPunches[key].punches.push(p);
    });
    
    const delaysByEmployee = {};
    const delayDetails = []; // Array com detalhes de cada atraso
    
    Object.values(dailyPunches).forEach(dayData => {
        const emp = employees.find(e => e.id == dayData.employeeId);
        if (!emp) return;
        
        // Buscar horário correto: departamento + cargo customizado
        let horaInicio = null;
        
        if (emp.departamento && emp.cargo) {
            // Buscar ID do departamento
            const dept = departamentos.find(d => d.nome === emp.departamento);
            if (dept) {
                // Buscar ID do cargo
                const cargo = cargos.find(c => c.nome === emp.cargo);
                if (cargo) {
                    // Buscar customização
                    const cargoCustomizado = cargosDept.find(cd => 
                        cd.departmentId === dept.id && cd.cargoId === cargo.id
                    );
                    if (cargoCustomizado) {
                        horaInicio = cargoCustomizado.horaInicio;
                    }
                }
            }
        }
        
        // Se não encontrou customizado, usa padrão
        if (!horaInicio) {
            horaInicio = '08:00'; // Fallback padrão
        }
        
        // Hora de início esperada (ex: "08:00")
        const [horaEsperadaH, horaEsperadaM] = horaInicio.split(':').map(Number);
        
        // ✅ NOVO: Pega PRIMEIRO PONTO do dia (qualquer tipo: Entrada, Saída, Rf1, Rf2, etc)
        const todosOsPontos = dayData.punches
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if (todosOsPontos.length === 0) return;
        
        const primeiroPonto = new Date(todosOsPontos[0].timestamp);
        const horaPontoH = primeiroPonto.getHours();
        const horaPontoM = primeiroPonto.getMinutes();
        
        // Converte para minutos
        const minutosEsperados = horaEsperadaH * 60 + horaEsperadaM;
        const minutosPonto = horaPontoH * 60 + horaPontoM;
        
        // Se o primeiro ponto foi DEPOIS da hora prevista (ATRASO)
        if (minutosPonto > minutosEsperados) {
            const minutosAtraso = minutosPonto - minutosEsperados;
            const horasAtraso = minutosAtraso / 60;
            
            if (!delaysByEmployee[dayData.employeeId]) {
                delaysByEmployee[dayData.employeeId] = {
                    name: emp.nome,
                    totalDelayMinutes: 0,
                    totalDelayDays: 0,
                    totalAdvanceMinutes: 0 // Novo: rastrear adiantamentos
                };
            }
            
            delaysByEmployee[dayData.employeeId].totalDelayMinutes += minutosAtraso;
            delaysByEmployee[dayData.employeeId].totalDelayDays += 1;
            
            // Registrar detalhe
            delayDetails.push({
                employeeId: dayData.employeeId,
                employeeName: emp.nome,
                date: dayData.day,
                expectedTime: horaInicio,
                actualTime: `${String(horaPontoH).padStart(2, '0')}:${String(horaPontoM).padStart(2, '0')}`,
                pointType: todosOsPontos[0].type,
                delayMinutes: minutosAtraso,
                type: 'atraso'
            });
        } 
        // ✅ NOVO: Se o primeiro ponto foi ANTES da hora prevista (ADIANTAMENTO = HORA EXTRA)
        else if (minutosPonto < minutosEsperados) {
            const minutosAdiantamento = minutosEsperados - minutosPonto;
            
            if (!delaysByEmployee[dayData.employeeId]) {
                delaysByEmployee[dayData.employeeId] = {
                    name: emp.nome,
                    totalDelayMinutes: 0,
                    totalDelayDays: 0,
                    totalAdvanceMinutes: 0
                };
            }
            
            // Novo: Adicionar adiantamento
            if (!delaysByEmployee[dayData.employeeId].totalAdvanceMinutes) {
                delaysByEmployee[dayData.employeeId].totalAdvanceMinutes = 0;
            }
            delaysByEmployee[dayData.employeeId].totalAdvanceMinutes += minutosAdiantamento;
            
            // Registrar detalhe de adiantamento
            delayDetails.push({
                employeeId: dayData.employeeId,
                employeeName: emp.nome,
                date: dayData.day,
                expectedTime: horaInicio,
                actualTime: `${String(horaPontoH).padStart(2, '0')}:${String(horaPontoM).padStart(2, '0')}`,
                pointType: todosOsPontos[0].type,
                advanceMinutes: minutosAdiantamento,
                type: 'adiantamento'
            });
            
            console.log(`[ADIANTAMENTO] ${emp.nome} - ${String(horaPontoH).padStart(2, '0')}:${String(horaPontoM).padStart(2, '0')} (esperado ${horaInicio}): +${minutosAdiantamento} min`);
        }
    });
    
    return {
        byEmployee: delaysByEmployee,
        details: delayDetails
    };
}

/**
 * Formata minutos em formato legível (ex: 45min ou 1h 30min)
 */
function formatMinutesToString(minutes) {
    if (minutes < 60) {
        return `${Math.round(minutes)}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${Math.round(mins)}min`;
}

/**
 * Obtém lista de atrasos formatada
 */
function getFormattedDelays() {
    const data = calculateMonthlyDelays();
    return Object.values(data.byEmployee)
        .map(d => ({
            name: d.name,
            delayMinutes: d.totalDelayMinutes,
            delayString: formatMinutesToString(d.totalDelayMinutes),
            delayDays: d.totalDelayDays
        }))
        .filter(d => d.delayMinutes > 0)
        .sort((a, b) => b.delayMinutes - a.delayMinutes);
}

/**
 * Obtém detalhes de todos os atrasos do mês
 */
function getDelayDetails() {
    const data = calculateMonthlyDelays();
    return data.details.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Obtém total de horas em atrasos do mês (em horas)
 */
function getTotalMonthlyDelayHours() {
    try {
        const punches = (window.supabaseRealtime && window.supabaseRealtime.data.punches) || JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]');
        const employees = (window.supabaseRealtime && window.supabaseRealtime.data.employees) || JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
        const cargosDept = (window.supabaseRealtime && window.supabaseRealtime.data.cargos_departamento) || JSON.parse(localStorage.getItem('topservice_cargos_departamento_v1') || '[]');
        
        // Filtrar punches deste mês
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthPunches = punches.filter(p => {
            const pDate = new Date(p.timestamp);
            return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
        });
        
        // Agrupar punches por funcionário e dia
        const dailyPunches = {};
        monthPunches.forEach(p => {
            const day = p.timestamp.split('T')[0];
            const key = `${p.employeeId}_${day}`;
            if (!dailyPunches[key]) {
                dailyPunches[key] = { employeeId: p.employeeId, day: day, punches: [] };
            }
            dailyPunches[key].punches.push(p);
        });
        
        let totalDelayMinutes = 0;
        
        Object.values(dailyPunches).forEach(dayData => {
            const emp = employees.find(e => e.id == dayData.employeeId);
            if (!emp) return; // Não filtrar por status, contar todos
            
            // Obter cargo do funcionário para saber horaInicio esperada
            const cargoCustomizado = cargosDept.find(cd => cd.departmentId == emp.departamento);
            if (!cargoCustomizado) return; // Sem cargo customizado, não calcula atraso
            
            // Hora de início esperada (ex: "08:00")
            const [horaEsperadaH, horaEsperadaM] = cargoCustomizado.horaInicio.split(':').map(Number);
            
            // ✅ NOVO: Pega PRIMEIRO PONTO do dia (qualquer tipo)
            const todosOsPontos = dayData.punches
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            if (todosOsPontos.length === 0) return;
            
            const primeiroPonto = new Date(todosOsPontos[0].timestamp);
            const horaPontoH = primeiroPonto.getHours();
            const horaPontoM = primeiroPonto.getMinutes();
            
            // Converte para minutos
            const minutosEsperados = horaEsperadaH * 60 + horaEsperadaM;
            const minutosPonto = horaPontoH * 60 + horaPontoM;
            
            // Se o primeiro ponto foi depois da hora prevista
            if (minutosPonto > minutosEsperados) {
                const minutosAtraso = minutosPonto - minutosEsperados;
                totalDelayMinutes += minutosAtraso;
            }
        });
        
        const totalDelayHours = Math.round((totalDelayMinutes / 60) * 100) / 100;
        console.log('⏰ Atrasos calculados:', totalDelayHours, 'h');
        return totalDelayHours;
    } catch (e) {
        console.error('❌ Erro ao calcular atrasos:', e);
        return 0;
    }
}

console.log('✅ Módulo de atrasos carregado');
