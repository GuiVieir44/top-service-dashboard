// ==========================================
// MÓDULO DE DADOS DEMO - TOP SERVICE
// ==========================================
// Gera dados de exemplo para testes

console.log('🔧 Módulo de dados demo carregado');

/**
 * Cria dados de exemplo para teste
 * Inclui: funcionários, cargos, pontos, afastamentos
 */
window.createDemoData = function() {
    console.log('📝 Criando dados de demo...');
    
    // 1. Criar funcionários
    if (typeof addEmployee === 'function') {
        const emps = [
            { matricula: '001', nome: 'João Silva', cargo: 'Desenvolvedor', departamento: 'TI', cpf: '123.456.789-10', email: 'joao@top.com', admissao: '2023-01-15', telefone: '11999999999', endereco: 'Rua A, 100', status: 'Ativo' },
            { matricula: '002', nome: 'Maria Santos', cargo: 'Analista', departamento: 'TI', cpf: '234.567.890-11', email: 'maria@top.com', admissao: '2023-02-20', telefone: '11988888888', endereco: 'Rua B, 200', status: 'Ativo' },
            { matricula: '003', nome: 'Pedro Costa', cargo: 'Gerente', departamento: 'RH', cpf: '345.678.901-12', email: 'pedro@top.com', admissao: '2022-06-10', telefone: '11977777777', endereco: 'Rua C, 300', status: 'Ativo' },
        ];

        emps.forEach(emp => {
            // Verifica se já existe
            const existing = typeof getEmployees === 'function' ? getEmployees().find(e => e.matricula === emp.matricula) : null;
            if (!existing) {
                addEmployee(emp);
                console.log('✅ Funcionário criado:', emp.nome);
            }
        });
    }

    // 2. Criar cargos com banco de horas
    if (typeof addCargo === 'function') {
        const cargosDemo = [
            { nome: 'Desenvolvedor', horasDia: 8 },
            { nome: 'Analista', horasDia: 8 },
            { nome: 'Gerente', horasDia: 9 },
        ];

        cargosDemo.forEach(cargo => {
            const existing = typeof getCargoByName === 'function' ? getCargoByName(cargo.nome) : null;
            if (!existing) {
                addCargo(cargo.nome, cargo.horasDia);
                console.log('✅ Cargo criado:', cargo.nome);
            }
        });
    }

    // 3. Criar pontos (hoje e últimos 10 dias úteis)
    if (typeof registerPunch === 'function') {
        const today = new Date();
        const punches = [];

        // Gerar pontos para os últimos 10 dias úteis
        for (let i = 0; i < 10; i++) {
            const punchDate = new Date(today);
            punchDate.setDate(punchDate.getDate() - i);

            // Pular fins de semana
            if (punchDate.getDay() === 0 || punchDate.getDay() === 6) {
                continue;
            }

            // Gerar pontos para cada funcionário
            for (let empId = 1; empId <= 3; empId++) {
                // Entrada às 8:00 (com variação aleatória)
                const entradaTime = new Date(punchDate);
                entradaTime.setHours(8, Math.floor(Math.random() * 30), 0);

                // Saída 9 horas depois (ou 8 horas conforme o cargo)
                const saidaTime = new Date(entradaTime);
                saidaTime.setHours(saidaTime.getHours() + 9, 0, 0);

                // Registrar entrada
                let entradaPunch = {
                    id: Date.now(),
                    employeeId: empId,
                    type: 'Entrada',
                    timestamp: entradaTime.toISOString(),
                    rf: 'RF -'
                };
                punches.push(entradaPunch);

                // Pequena pausa (RF 1 - saída para almoço)
                const rf1Time = new Date(entradaTime);
                rf1Time.setHours(12, 0, 0);

                let rf1Punch = {
                    id: Date.now() + 1,
                    employeeId: empId,
                    type: 'Saída',
                    timestamp: rf1Time.toISOString(),
                    rf: 'RF 1'
                };
                punches.push(rf1Punch);

                // Volta do almoço (RF 2)
                const rf2Time = new Date(entradaTime);
                rf2Time.setHours(13, 0, 0);

                let rf2Punch = {
                    id: Date.now() + 2,
                    employeeId: empId,
                    type: 'Entrada',
                    timestamp: rf2Time.toISOString(),
                    rf: 'RF 2'
                };
                punches.push(rf2Punch);

                // Registrar saída
                let saidaPunch = {
                    id: Date.now() + 3,
                    employeeId: empId,
                    type: 'Saída',
                    timestamp: saidaTime.toISOString(),
                    rf: 'RF -'
                };
                punches.push(saidaPunch);
            }
        }

        // Salvar todos os punches
        if (typeof savePunches === 'function') {
            savePunches(punches);
            console.log('✅ Pontos criados:', punches.length);
        }
    }

    // 4. Criar afastamentos
    if (typeof addAfastamento === 'function' || typeof createAbsence === 'function') {
        const absences = [
            { employeeId: 1, type: 'Doença', startDate: '2024-11-15', endDate: '2024-11-16', reason: 'Gripe' },
            { employeeId: 2, type: 'Férias', startDate: '2024-12-01', endDate: '2024-12-15', reason: 'Férias' },
        ];

        absences.forEach(abs => {
            if (typeof addAfastamento === 'function') {
                addAfastamento(abs.employeeId, abs.type, abs.startDate, abs.endDate, abs.reason);
                console.log('✅ Afastamento criado:', abs.type);
            }
        });
    }

    console.log('✅ Dados de demo criados com sucesso!');
    showToast('Dados de demo criados! Recarregue a página.', 'success');
};

/**
 * Limpa todos os dados e recria com demo
 */
window.resetWithDemoData = function() {
    if (!confirm('Tem certeza que deseja LIMPAR e recriar com dados de demo?')) {
        return;
    }

    // Limpar localStorage
    localStorage.clear();
    console.log('🗑️ localStorage limpo');

    // Reinicializar com dados demo
    window.createDemoData();
};

/**
 * Botão de debug para testes
 */
window.showDemoDataBtn = function() {
    // Procura por um botão de teste ou cria um
    let btn = document.getElementById('demo-data-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'demo-data-btn';
        btn.textContent = '📊 Gerar Dados Demo';
        btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;padding:10px 15px;background:#27ae60;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;';
        btn.onclick = window.createDemoData;
        document.body.appendChild(btn);

        const resetBtn = document.createElement('button');
        resetBtn.id = 'reset-demo-data-btn';
        resetBtn.textContent = '🔄 Resetar Dados';
        resetBtn.style.cssText = 'position:fixed;bottom:20px;right:160px;z-index:9999;padding:10px 15px;background:#e74c3c;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;';
        resetBtn.onclick = window.resetWithDemoData;
        document.body.appendChild(resetBtn);

        console.log('%c💡 Botões de demo criados!', 'color: #27ae60; font-weight: bold;');
    }
};

// Botões foram removidos - use diretamente as funções no console se necessário

console.log('✅ Módulo de dados demo pronto');
console.log('Funções disponíveis no console: window.createDemoData() ou window.resetWithDemoData()');
