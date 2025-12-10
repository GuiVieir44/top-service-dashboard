class NavigationSystem {
    constructor() {
        console.log('🎯 NavigationSystem.constructor() INICIANDO');
        this.currentPage = 'dashboard';
        this.pages = {
            dashboard: 'Dashboard Principal',
            ponto: 'Registro de Ponto',
            manual: 'Consulta de Ponto',
            funcionarios: 'Gestão de Funcionários',
            'funcionarios-novo': 'Cadastrar Funcionário',
            cargos: 'Cargos e Banco de Horas',
            departamentos: 'Departamentos',
            afastamentos: 'Controle de Afastamentos',
            relatorios: 'Relatórios e Analytics',
            usuarios: 'Usuários & Permissões',
            ia: 'Central IA',
            configuracoes: 'Configurações'
        };
        console.log('✅ this.pages configurado');

        // Map de inicializadores por módulo para evitar switch/case repetitivo
        this.moduleInitMap = {
            funcionarios: () => { if (typeof renderEmployeeList === 'function') renderEmployeeList(); if (typeof initEmployeeModule === 'function') initEmployeeModule(); },
            ponto: () => { if (typeof initPunchModule === 'function') initPunchModule(); },
            manual: () => { if (typeof initPunchQueryModule === 'function') initPunchQueryModule(); },
            cargos: () => { if (typeof initCargosModule === 'function') initCargosModule(); },
            'funcionarios-novo': () => {
                try {
                    // Popula departamentos e cargos do localStorage
                    const deptRaw = localStorage.getItem('topservice_departamentos_v1');
                    const cargoRaw = localStorage.getItem('topservice_cargos_v1');
                    
                    if (deptRaw) {
                        const depts = JSON.parse(deptRaw);
                        const deptSelect = document.getElementById('form-departamento');
                        if (deptSelect && depts.length > 0) {
                            deptSelect.innerHTML = '<option value="">Selecione um departamento</option>';
                            depts.forEach(d => {
                                const opt = document.createElement('option');
                                opt.value = d.id;
                                opt.text = d.nome;
                                deptSelect.appendChild(opt);
                            });
                        }
                    }
                    
                    if (cargoRaw) {
                        const cargos = JSON.parse(cargoRaw);
                        const cargoSelect = document.getElementById('form-cargo');
                        if (cargoSelect && cargos.length > 0) {
                            cargoSelect.innerHTML = '<option value="">Selecione um cargo</option>';
                            cargos.forEach(c => {
                                const opt = document.createElement('option');
                                opt.value = c.id;
                                opt.text = c.nome;
                                cargoSelect.appendChild(opt);
                            });
                        }
                    }
                    
                    const submitBtn = document.getElementById('form-submit-btn');
                    const cancelBtn = document.getElementById('form-cancel-btn');
                    
                    // Remover event listeners antigos antes de adicionar novos
                    if (submitBtn && typeof submitEmployeeForm === 'function') {
                        submitBtn.removeEventListener('click', submitEmployeeForm);
                        submitBtn.addEventListener('click', submitEmployeeForm);
                    }
                    if (cancelBtn && typeof cancelEmployeeForm === 'function') {
                        cancelBtn.removeEventListener('click', cancelEmployeeForm);
                        cancelBtn.addEventListener('click', cancelEmployeeForm);
                    }

                    // Popular o formulário (novo cadastro ou edição)
                    if (this.pendingParams && this.pendingParams.editId && typeof window.populateEmployeeForm === 'function') {
                        window.populateEmployeeForm(this.pendingParams.editId);
                    } else if (typeof window.populateEmployeeForm === 'function') {
                        // Para novo cadastro, chama populateEmployeeForm sem ID para popular os selects
                        window.populateEmployeeForm();
                    }
                    
                    // Garantir que departamentos sejam populados com delay
                    setTimeout(() => {
                        if (typeof populateDepartmentSelect === 'function') {
                            populateDepartmentSelect('form-departamento');
                        }
                        if (typeof populateCargoSelect === 'function') {
                            populateCargoSelect('form-cargo');
                        }
                    }, 100);
                    
                    // Inicializar listeners de formatação de campos
                    const cpfField = document.getElementById('form-cpf');
                    const telefoneField = document.getElementById('form-telefone');
                    const matriculaField = document.getElementById('form-matricula');
                    
                    if (cpfField) {
                        // Remover listener antigo
                        const newCpfField = cpfField.cloneNode(true);
                        cpfField.parentNode.replaceChild(newCpfField, cpfField);
                        newCpfField.addEventListener('input', (e) => {
                            e.target.value = formatCPF(e.target.value);
                        });
                    }
                    
                    if (telefoneField) {
                        // Remover listener antigo
                        const newTelefoneField = telefoneField.cloneNode(true);
                        telefoneField.parentNode.replaceChild(newTelefoneField, telefoneField);
                        newTelefoneField.addEventListener('input', (e) => {
                            e.target.value = formatPhone(e.target.value);
                        });
                    }
                    
                    if (matriculaField) {
                        // Remover listener antigo
                        const newMatriculaField = matriculaField.cloneNode(true);
                        matriculaField.parentNode.replaceChild(newMatriculaField, matriculaField);
                        newMatriculaField.addEventListener('blur', (e) => {
                            const matricula = e.target.value.trim();
                            if (matricula && isMatriculaDuplicate(matricula)) {
                                e.target.style.borderColor = '#e74c3c';
                                e.target.style.boxShadow = '0 0 0 2px rgba(231, 76, 60, 0.2)';
                                console.warn('⚠️ Matrícula duplicada:', matricula);
                            } else {
                                e.target.style.borderColor = '';
                                e.target.style.boxShadow = '';
                            }
                        });
                    }
                    
                    // Inicializar listeners do formulário
                    if (typeof window.initEmployeeFormListeners === 'function') {
                        window.initEmployeeFormListeners();
                    }
                    
                    console.log('%c[NAV] ✅ Página funcionarios-novo inicializada com sucesso', 'color: #27ae60;');
                } catch (e) { 
                    console.error('%c[NAV] ❌ Erro ao inicializar formulário funcionarios-novo:', 'color: #e74c3c;', e); 
                }
                this.pendingParams = null;
            },
            relatorios: () => { 
                if (typeof initReportModule === 'function') initReportModule();
                if (typeof initRelatorioDepartamentoModule === 'function') initRelatorioDepartamentoModule();
                if (typeof initClosingReportModule === 'function') initClosingReportModule();
                if (typeof initRelatorioFeriasModule === 'function') initRelatorioFeriasModule();
            },
            usuarios: () => { if (typeof initUsersModule === 'function') initUsersModule(); },
            departamentos: () => { if (typeof initDepartmentsModule === 'function') initDepartmentsModule(); },
            afastamentos: () => { if (typeof initAfastamentosModule === 'function') initAfastamentosModule(); if (typeof setupAfastamentosButtonHandler === 'function') setupAfastamentosButtonHandler(); },
            configuracoes: () => { if (typeof initSettingsModule === 'function') initSettingsModule(); }
        };
        console.log('✅ this.moduleInitMap configurado');

        console.log('🚀 Chamando this.init()');
        this.init();
        console.log('✅ constructor() COMPLETO');
    }

    init() {
        console.log('🎯 NavigationSystem.init() iniciando...');
        this.setupEventListeners();
        console.log('✅ Event listeners configurados');
        this.navigateTo('dashboard');
        console.log('✅ Dashboard inicial mostrado');
    }

    setupEventListeners() {
        console.log('🔧 setupEventListeners() INICIANDO');
        
        const navLinks = document.querySelector('.nav-links');
        console.log('   📍 navLinks encontrado?', !!navLinks);
        
        if (!navLinks) {
            console.error('❌ .nav-links NÃO ENCONTRADO!');
            return;
        }

        const buttons = navLinks.querySelectorAll('.nav-item');
        console.log(`   📍 Encontrados ${buttons.length} botões .nav-item`);
        buttons.forEach((btn, i) => {
            console.log(`      ${i}: data-page="${btn.dataset.page}"`);
        });

        // Adiciona um listener para cada botão individualmente
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ CLIQUE DETECTADO em .nav-item');
                const page = btn.dataset.page;
                console.log(`   📍 btn.dataset.page = "${page}"`);
                if (page) {
                    console.log(`   🎯 NAVEGANDO PARA: ${page}`);
                    this.navigateTo(page);
                }
            });
        });
        
        console.log('✅ setupEventListeners() COMPLETO');
    }

    navigateTo(pageId) {
        console.log(`\n📄 navigateTo INICIADO para: "${pageId}"`);

        // Não fazer nada se já estiver na página (exceto para formulários)
        if (this.currentPage === pageId && pageId !== 'funcionarios-novo') {
            console.log(`⏭️  Já está na página ${pageId}, ignorando.`);
            return;
        }

        // Verificar permissões de acesso
        if (typeof restrictPageAccess === 'function' && !restrictPageAccess(pageId)) {
            console.warn(`🚫 Acesso restrito à página: ${pageId}`);
            showToast('Você não tem permissão para acessar esta página.', 'error');
            return;
        }

        // Atualizar o estado visual do menu
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
        });
        
        const activeBtn = document.querySelector(`.nav-item[data-page="${pageId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-current', 'page');
        }

        // Mostrar o conteúdo da página
        this.showPageContent(pageId);

        // Atualizar a página atual
        this.currentPage = pageId;

        console.log(`✅ Navegação concluída para: ${pageId}\n`);
    }

    // Método legado para compatibilidade
    handleNavigation(pageId, clickedElement) {
        this.navigateTo(pageId);
    }

    showPageContent(pageId) {
        console.log(`📺 showPageContent chamado para: ${pageId}`);
        
        const mainContent = document.querySelector('.main-content');
        const dashboardContent = document.getElementById('dashboard-content');
        
        if (!mainContent) {
            console.error('❌ .main-content não encontrado!');
            return;
        }

        // Esconde todas as páginas (exceto o dashboard que tratamos separadamente)
        mainContent.querySelectorAll('.page').forEach(p => p.style.display = 'none');

        if (pageId === 'dashboard') {
            if (dashboardContent) {
                dashboardContent.style.display = 'block';
                this.updateHeaderTitle('Dashboard Principal');
                // Inicializar gráficos PRIMEIRO, depois atualizar métricas
                if (typeof initCharts === 'function') {
                    initCharts();
                    // Atualizar métricas DEPOIS que os gráficos foram criados
                    setTimeout(() => this.updateDashboardMetrics(), 300);
                } else {
                    this.updateDashboardMetrics();
                }
            }
            console.log('✅ Dashboard mostrado');
            return;
        }

        if (dashboardContent) dashboardContent.style.display = 'none';

        // Cria o conteúdo do módulo quando necessário
        let moduleContent = document.getElementById(`${pageId}-content`);
        if (!moduleContent) {
            console.log(`🔨 Criando conteúdo para: ${pageId}`);
            moduleContent = this.createModuleContent(pageId);
            mainContent.appendChild(moduleContent);
            console.log(`✅ Conteúdo criado e adicionado ao DOM para: ${pageId}`);
            if (pageId === 'relatorios') {
                console.log('📊 Página de relatórios renderizada');
                console.log('innerHTML:', moduleContent.innerHTML.substring(0, 200));
            }
        } else {
            console.log(`✅ Conteúdo já existe para: ${pageId}`);
        }

        // Garantir que moduleContent existe antes de tentar usá-lo
        if (!moduleContent) {
            console.error(`❌ ERRO: moduleContent é null para ${pageId}!`);
            return;
        }

        moduleContent.style.display = 'block';
        console.log(`✅ Módulo ${pageId} agora visível (display: block)`);
        console.log(`🔍 Verificação: ${pageId}-content tem display:`, moduleContent.style.display);
        this.updateHeaderTitle(this.pages[pageId] || pageId);

        // Chama o inicializador do módulo (se existir) de forma segura
        try {
            const initFn = this.moduleInitMap[pageId];
            if (typeof initFn === 'function') {
                console.log(`🚀 Inicializando módulo: ${pageId}`);
                // Inicializa imediatamente após criar o conteúdo
                try {
                    initFn();
                    if (pageId === 'departamentos' && typeof initDepartmentsModule === 'function') {
                        initDepartmentsModule();
                    }
                } catch (e) { console.error('Erro ao inicializar módulo', pageId, e); }
            }
        } catch (e) { console.error('Erro ao (re)inicializar módulo ao mostrar página:', e); }
    }

    createModuleContent(pageId) {
        console.log(`🏗️  createModuleContent para: ${pageId}`);
        
        const moduleDiv = document.createElement('div');
        moduleDiv.className = 'page';
        moduleDiv.id = `${pageId}-content`;

        const pageTitle = this.pages[pageId] || pageId;

    // Provide specific UIs for some modules (funcionarios, ponto)
    if (pageId === 'funcionarios') {
            moduleDiv.innerHTML = `
                <header class="header">
                    <div class="header-title">
                        <h1>${pageTitle}</h1>
                        <p>Gestão e controle de funcionários</p>
                    </div>
                    <div class="user-area">
                        <div class="user-info">
                            <div class="user-details">
                                <strong>Administrador</strong>
                                <span>admin@topservice.com</span>
                            </div>
                            <div class="user-avatar">TS</div>
                        </div>
                    </div>
                </header>

                <section class="status-section">
                    <div class="status-card">
                        <h2>👥 Lista de Funcionários</h2>
                        <div class="status-content">
                            <div class="module-actions">
                                <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
                                    <input id="employee-search" type="text" class="form-input" placeholder="🔍 Buscar por nome, matrícula ou email..." style="flex:1;min-width:250px;" />
                                    <button class="btn btn-primary" onclick="window.navigationSystem.showPage('funcionarios-novo')">Adicionar Novo</button>
                                </div>
                            </div>

                            <div style="overflow:auto;">
                                <table id="employee-list" class="table">
                                    <thead>
                                        <tr>
                                            <th>Matrícula</th>
                                            <th>Nome</th>
                                            <th>Cargo</th>
                                            <th>Departamento</th>
                                            <th>Adicional</th>
                                            <th>Vale Alimentação</th>
                                            <th>Vale Transporte</th>
                                            <th>CPF</th>
                                            <th>Status</th>
                                            <th>Admissão</th>
                                            <th class="actions">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="employee-list-body">
                                        <!-- linhas serão injetadas por renderEmployeeList() -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        } else if (pageId === 'ponto') {
            moduleDiv.innerHTML = `
                <header class="header">
                    <div class="header-title">
                        <h1>${pageTitle}</h1>
                        <p>Registro rápido de ponto</p>
                    </div>
                    <div class="user-area">
                        <div class="user-info">
                            <div class="user-details">
                                <strong>Administrador</strong>
                                <span>admin@topservice.com</span>
                            </div>
                            <div class="user-avatar">TS</div>
                        </div>
                    </div>
                </header>

                <section class="status-section">
                    <div class="status-card">
                        <h2>🕒 Registrar Ponto</h2>
                        <div class="status-content">
                            <div class="module-actions">
                                <div class="form-row">
                                    <label class="form-field">Funcionário
                                        <select id="punch-employee-select" class="form-select">
                                            <option>Carregando...</option>
                                        </select>
                                    </label>
                                </div>
                                <div class="form-row" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center;">
                                    <button id="punch-entrada-btn" class="btn btn-primary" style="flex:1;min-width:120px;">🔵 Entrada</button>
                                    <button id="punch-rf1-btn" class="btn btn-secondary" style="flex:1;min-width:120px;">🍽️ RF 1</button>
                                    <button id="punch-rf2-btn" class="btn btn-secondary" style="flex:1;min-width:120px;">🍽️ RF 2</button>
                                    <button id="punch-saida-btn" class="btn btn-primary" style="flex:1;min-width:120px;">🔴 Saída</button>
                                </div>
                                <div class="form-row" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center;margin-top:12px;">
                                    <button id="punch-folga-btn" class="btn btn-ghost" style="flex:1;min-width:120px;">🌴 Folga</button>
                                    <button id="punch-falta-btn" class="btn btn-ghost" style="flex:1;min-width:120px;">⚠️ Falta</button>
                                    <button id="punch-feriado-btn" class="btn btn-ghost" style="flex:1;min-width:120px;">🎉 Feriado</button>
                                </div>
                            </div>

                            <div style="overflow:auto;">
                                <table class="table">
                                    <thead style="background:#f7f7f7;">
                                        <tr>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Funcionário</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Tipo</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Status</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Horário</th>
                                            <th class="actions">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="punch-list-body">
                                        <!-- registros serão injetados por ponto.js -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        } else if (pageId === 'manual') {
            moduleDiv.innerHTML = `
                <header class="header">
                    <div class="header-title">
                        <h1>${pageTitle}</h1>
                        <p>Consulte o histórico de pontos do mês por funcionário ou condomínio</p>
                    </div>
                    <div class="user-area">
                        <div class="user-info">
                            <div class="user-details">
                                <strong>Administrador</strong>
                                <span>admin@topservice.com</span>
                            </div>
                            <div class="user-avatar">TS</div>
                        </div>
                    </div>
                </header>

                <section class="status-section">
                    <div class="status-card">
                        <h2>📊 Consulta de Ponto</h2>
                        <div class="status-content">
                            <div class="module-actions">
                                <div class="form-row">
                                    <label class="form-field" style="flex: 1;">Filtro de Departamento
                                        <select id="punch-query-department-filter" class="form-select">
                                            <option value="">-- Todos os departamentos --</option>
                                        </select>
                                    </label>
                                    <label class="form-field" style="flex: 1.5;">Selecione um Funcionário *
                                        <div style="display: flex; gap: 8px; align-items: center;">
                                            <select id="punch-query-employee-select" class="form-select" style="flex: 1;">
                                                <option value="">-- Selecione um funcionário --</option>
                                            </select>
                                            <button id="punch-query-prev-employee" class="btn btn-ghost" style="flex: 0; padding: 8px 12px; min-width: auto;" title="Funcionário anterior">←</button>
                                            <button id="punch-query-next-employee" class="btn btn-ghost" style="flex: 0; padding: 8px 12px; min-width: auto;" title="Próximo funcionário">→</button>
                                        </div>
                                    </label>
                                    <label class="form-field" style="flex: 1;">Data Inicial
                                        <input type="date" id="punch-query-date-start" class="form-input" />
                                    </label>
                                    <label class="form-field" style="flex: 1;">Data Final
                                        <input type="date" id="punch-query-date-end" class="form-input" />
                                    </label>
                                </div>
                                
                                <div class="form-row" style="margin-top: 15px; justify-content: flex-end; gap: 10px;">
                                    <button id="punch-query-search-btn" class="btn btn-primary">🔍 Consultar</button>
                                    <button id="punch-query-add-btn" class="btn btn-secondary">➕ Adicionar Ponto</button>
                                    <button id="punch-query-action-btn" class="btn btn-secondary" onclick="if(typeof openActionModal === 'function') openActionModal(); else alert('Função não carregada');">📋 Registrar Ação</button>
                                    <button id="punch-query-clear-btn" class="btn btn-ghost">Limpar</button>
                                </div>
                            </div>

                            <div id="punch-query-table" style="margin-top: 20px;">
                                <!-- Tabela será renderizada aqui -->
                            </div>
                        </div>
                    </div>
                </section>
            `;
        } else if (pageId === 'funcionarios-novo') {
            moduleDiv.innerHTML = `
                <header class="header">
                    <div class="header-title">
                        <h1>${pageTitle}</h1>
                        <p>Formulário de cadastro de funcionário</p>
                    </div>
                    <div class="user-area">
                        <div class="user-info">
                            <div class="user-details">
                                <strong>Administrador</strong>
                                <span>admin@topservice.com</span>
                            </div>
                            <div class="user-avatar">TS</div>
                        </div>
                    </div>
                </header>

                <section class="status-section">
                    <div class="status-card">
                        <h2>📝 Cadastrar Funcionário</h2>
                        <div class="status-content">
                            <div class="module-actions">
                                <!-- campo oculto para controlar edição -->
                                <input type="hidden" id="form-edit-id" />
                                <div class="form-row">
                                    <label class="form-field">Matrícula
                                        <input id="form-matricula" class="form-input" />
                                    </label>
                                    <label class="form-field">Nome
                                        <input id="form-nome" class="form-input" />
                                    </label>
                                </div>
                                <div class="form-row">
                                    <label class="form-field">Cargo
                                        <select id="form-cargo" data-cargo-select class="form-select">
                                            <option value="">Selecione um cargo</option>
                                        </select>
                                    </label>
                                    <label class="form-field">Departamento
                                        <select id="form-departamento" data-dept-select class="form-select" onchange="console.log('Departamento selecionado:', this.value)">
                                            <option value="">Carregando departamentos...</option>
                                        </select>
                                    </label>
                                    <label class="form-field">Adicional
                                        <select id="form-adicional" class="form-select">
                                            <option value="">Nenhum adicional</option>
                                            <option value="Adicional Noturno">Adicional Noturno</option>
                                            <option value="Insalubridade 20%">Insalubridade 20%</option>
                                            <option value="Insalubridade 40%">Insalubridade 40%</option>
                                        </select>
                                    </label>
                                </div>
                                <div class="form-row">
                                    <label class="form-field">Vale Alimentação (Diário)
                                        <div style="display:flex;align-items:center;gap:8px;">
                                            <span style="font-weight:bold;font-size:1.1rem;">R$</span>
                                            <input id="form-vale-alimentacao" class="form-input" type="number" step="0.01" min="0" placeholder="0.00" />
                                        </div>
                                    </label>
                                    <label class="form-field">Vale Transporte
                                        <select id="form-vale-transporte" class="form-select">
                                            <option value="">Não informado</option>
                                            <option value="Optante">Optante</option>
                                            <option value="Não Optante">Não Optante</option>
                                        </select>
                                    </label>
                                </div>
                                <div class="form-row">
                                    <label class="form-field">CPF
                                        <input id="form-cpf" class="form-input" />
                                    </label>
                                    <label class="form-field">Email
                                        <input id="form-email" class="form-input" />
                                    </label>
                                </div>
                                <div class="form-row">
                                    <label class="form-field">Admissão
                                        <input id="form-admissao" type="date" class="form-date" />
                                    </label>
                                    <label class="form-field">Telefone
                                        <input id="form-telefone" class="form-input" />
                                    </label>
                                </div>
                                <div class="form-row">
                                    <label class="form-field">Endereço
                                        <input id="form-endereco" class="form-input" />
                                    </label>
                                    <label class="form-field">Status
                                        <select id="form-status" class="form-select">
                                            <option>Ativo</option>
                                            <option>Desligado</option>
                                            <option>Férias</option>
                                            <option>Afastado</option>
                                        </select>
                                    </label>
                                </div>
                                <div style="display:flex;gap:10px;margin-top:12px;">
                                    <button id="form-submit-btn" class="btn btn-primary">Salvar</button>
                                    <button id="form-cancel-btn" class="btn btn-ghost">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        } else if (pageId === 'afastamentos') {
            moduleDiv.innerHTML = `
                <header class="header">
                    <div class="header-title">
                        <h1>${pageTitle}</h1>
                        <p>Controle de afastamentos</p>
                    </div>
                    <div class="user-area">
                        <div class="user-info">
                            <div class="user-details">
                                <strong>Administrador</strong>
                                <span>admin@topservice.com</span>
                            </div>
                            <div class="user-avatar">TS</div>
                        </div>
                    </div>
                </header>

                <section class="status-section">
                    <div class="status-card">
                        <h2>🏝️ Afastamentos</h2>
                        <div class="status-content">
                            <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
                                <label style="display:flex;flex-direction:column;flex:1;min-width:180px;">
                                    Funcionário
                                    <select id="afast-employee-select" style="padding:8px;border-radius:6px;border:1px solid #ddd;"></select>
                                </label>
                                <label style="display:flex;flex-direction:column;flex:1;min-width:150px;">
                                    Tipo
                                    <select id="afast-type" style="padding:8px;border-radius:6px;border:1px solid #ddd;">
                                        <option>Férias</option>
                                        <option>Licença Médica</option>
                                        <option>Licença Maternidade/Paternidade</option>
                                        <option>Outro</option>
                                    </select>
                                </label>
                                <label style="display:flex;flex-direction:column;flex:1;min-width:130px;">
                                    Data Inicial
                                    <input id="afast-start" type="date" style="padding:8px;border-radius:6px;border:1px solid #ddd;" />
                                </label>
                                <label style="display:flex;flex-direction:column;flex:0.6;min-width:90px;">
                                    Dias
                                    <input id="afast-days" type="number" min="1" value="1" style="padding:8px;border-radius:6px;border:1px solid #ddd;" placeholder="1" />
                                </label>
                                <label style="display:flex;flex-direction:column;flex:1;min-width:130px;">
                                    Data Final
                                    <input id="afast-end" type="date" style="padding:8px;border-radius:6px;border:1px solid #ddd;background:#f9f9f9;" readonly />
                                </label>
                                <button id="afast-add-btn" style="background:var(--dourado);border:none;padding:10px 14px;border-radius:6px;cursor:pointer;margin-top:24px;white-space:nowrap;">Adicionar</button>
                            </div>

                            <div style="overflow:auto;">
                                <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;">
                                    <thead style="background:#f7f7f7;">
                                        <tr>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Funcionário</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Tipo</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Início</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Fim</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="afast-list-body">
                                        <!-- afastamentos serão injetados -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        } else if (pageId === 'departamentos') {
            moduleDiv.innerHTML = `
                <header class="header">
                    <div class="header-title">
                        <h1>${pageTitle}</h1>
                        <p>Gestão de departamentos</p>
                    </div>
                    <div class="user-area">
                        <div class="user-info">
                            <div class="user-details">
                                <strong>Administrador</strong>
                                <span>admin@topservice.com</span>
                            </div>
                            <div class="user-avatar">TS</div>
                        </div>
                    </div>
                </header>

                <section class="status-section">
                    <div class="status-card">
                        <h2>🏢 Departamentos</h2>
                        <div class="status-content">
                            <div class="module-actions">
                                <div class="form-row">
                                    <label class="form-field">Nome
                                        <input id="dept-name" class="form-input" placeholder="Nome do departamento" />
                                    </label>
                                    <label class="form-field">Descrição
                                        <input id="dept-desc" class="form-input" placeholder="Descrição (opcional)" />
                                    </label>
                                </div>
                                <button id="dept-add-btn" class="btn btn-primary">Adicionar</button>
                            </div>

                            <div style="overflow:auto;">
                                <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;">
                                    <thead style="background:#f7f7f7;">
                                        <tr>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Nome</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Descrição</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:center;">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="dept-list-body">
                                        <!-- departamentos serão injetados -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        } else if (pageId === 'cargos') {
            moduleDiv.innerHTML = `
                <header class="header">
                    <div class="header-title">
                        <h1>${pageTitle}</h1>
                        <p>Gestão de cargos e banco de horas</p>
                    </div>
                    <div class="user-area">
                        <div class="user-info">
                            <div class="user-details">
                                <strong>Administrador</strong>
                                <span>admin@topservice.com</span>
                            </div>
                            <div class="user-avatar">TS</div>
                        </div>
                    </div>
                </header>

                <section class="status-section">
                    <div class="status-card">
                        <h2>💼 Cargos e Banco de Horas</h2>
                        <div class="status-content">
                            <div class="module-actions">
                                <div class="form-row">
                                    <label class="form-field">Nome do Cargo
                                        <input id="cargo-nome" class="form-input" placeholder="Ex: Gerente, Analista..." />
                                    </label>
                                    <label class="form-field">Horas por Dia
                                        <input id="cargo-horas" type="number" min="1" max="24" value="8" class="form-input" />
                                    </label>
                                </div>
                                <button id="cargo-add-btn" class="btn btn-primary">Adicionar Cargo</button>
                            </div>

                            <div style="overflow:auto;">
                                <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;">
                                    <thead style="background:#f7f7f7;">
                                        <tr>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Cargo</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:center;">Horas/Dia</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:center;">Banco de Horas</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:center;">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="cargo-list-body">
                                        <!-- cargos serão injetados -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        } else if (pageId === 'usuarios') {
            moduleDiv.innerHTML = `
                <header class="header">
                    <div class="header-title">
                        <h1>${pageTitle}</h1>
                        <p>Gerenciamento de usuários e permissões</p>
                    </div>
                    <div class="user-area">
                        <div class="user-info">
                            <div class="user-details">
                                <strong>Administrador</strong>
                                <span>admin@topservice.com</span>
                            </div>
                            <div class="user-avatar">TS</div>
                        </div>
                    </div>
                </header>

                <section class="status-section">
                    <div class="status-card">
                        <h2>🔐 Usuários</h2>
                        <div class="status-content">
                            <div id="users-module-container"></div>
                        </div>
                    </div>
                </section>
            `;
        } else if (pageId === 'relatorios') {
            moduleDiv.innerHTML = `
                <header class="header">
                    <div class="header-title">
                        <h1>${pageTitle}</h1>
                        <p>Relatórios e exportação</p>
                    </div>
                    <div class="user-area">
                        <div class="user-info">
                            <div class="user-details">
                                <strong>Administrador</strong>
                                <span>admin@topservice.com</span>
                            </div>
                            <div class="user-avatar">TS</div>
                        </div>
                    </div>
                </header>

                <section class="status-section">
                    <div class="status-card">
                        <h2>📄 Relatórios de Ponto</h2>
                        <div class="status-content">
                            <div class="module-actions">
                                <label class="form-field">Início
                                    <input id="report-start" type="date" class="form-date" />
                                </label>
                                <label class="form-field">Fim
                                    <input id="report-end" type="date" class="form-date" />
                                </label>
                                <label class="form-field">Funcionário
                                    <select id="report-employee-select" class="form-select"><option value="0">Todos</option></select>
                                </label>
                                <button id="report-generate-btn" class="btn btn-primary">Gerar</button>
                                <button id="report-export-btn" class="btn btn-success">Exportar CSV</button>
                                <div style="display:flex;gap:8px;margin-left:8px;">
                                    <button id="quick-today" class="btn btn-secondary">Hoje</button>
                                    <button id="quick-7days" class="btn btn-ghost">7 dias</button>
                                    <button id="quick-month" class="btn btn-ghost">Mês</button>
                                </div>
                            </div>

                            <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap;">
                                <div style="padding:12px;border-radius:8px;border:1px solid #eee;min-width:160px;">Total: <strong id="report-total">0</strong></div>
                                <div style="padding:12px;border-radius:8px;border:1px solid #eee;min-width:160px;">Entradas: <strong id="report-entries">0</strong></div>
                                <div style="padding:12px;border-radius:8px;border:1px solid #eee;min-width:160px;">Saídas: <strong id="report-exits">0</strong></div>
                            </div>

                            <div style="overflow:auto;">
                                <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;">
                                    <thead style="background:#f7f7f7;">
                                        <tr>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Funcionário</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Tipo</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Horário</th>
                                        </tr>
                                    </thead>
                                    <tbody id="report-list-body">
                                        <!-- registros do relatório -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- NOVO: Relatório Complexo por Departamentos -->
                <section class="status-section">
                    <div class="status-card">
                        <h2>🏢 Relatório por Departamentos</h2>
                        <div class="status-content">
                            <div class="module-actions">
                                <label class="form-field">Departamento
                                    <select id="relatorio-departamento-select" class="form-select">
                                        <option value="">Selecione um departamento</option>
                                    </select>
                                </label>
                                <button id="relatorio-departamento-gerar" class="btn btn-primary">Gerar Relatório</button>
                                <button id="relatorio-departamento-exportar" class="btn btn-success">📥 Exportar CSV</button>
                            </div>

                            <div id="relatorio-departamento-container" style="overflow-x:auto;">
                                <p style="text-align: center; color: #999; padding: 20px;">Selecione um departamento para visualizar o relatório detalhado</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- NOVO: Relatório de Fechamento por Departamento -->
                <section class="status-section">
                    <div class="status-card">
                        <h2>📊 Relatório de Fechamento</h2>
                        <div class="status-content">
                            <div id="relatorios-content">
                                <p style="text-align: center; color: #999; padding: 20px;">Carregando...</p>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        } else if (pageId === 'configuracoes') {
            moduleDiv.innerHTML = `
                <header class="header">
                    <div class="header-title">
                        <h1>${pageTitle}</h1>
                        <p>Configurações do sistema e preferências</p>
                    </div>
                    <div class="user-area">
                        <div class="user-info">
                            <div class="user-details">
                                <strong>Administrador</strong>
                                <span>admin@topservice.com</span>
                            </div>
                            <div class="user-avatar">TS</div>
                        </div>
                    </div>
                </header>

                <section class="status-section" style="padding: 30px;">
                    <div id="settings-module-container"></div>
                </section>
            `;
        } else {
            moduleDiv.innerHTML = `
                <header class="header">
                    <div class="header-title">
                        <h1>${pageTitle}</h1>
                        <p>Módulo do sistema Top Service</p>
                    </div>
                    <div class="user-area">
                        <div class="user-info">
                            <div class="user-details">
                                <strong>Administrador</strong>
                                <span>admin@topservice.com</span>
                            </div>
                            <div class="user-avatar">TS</div>
                        </div>
                    </div>
                </header>

                <section class="status-section">
                    <div class="status-card">
                        <h2>🚧 Módulo em Desenvolvimento</h2>
                        <div class="status-content">
                            <p>O sistema <strong>${pageTitle}</strong> está sendo implementado.</p>
                            <div class="system-info">
                                <div class="info-item">
                                    <span class="info-label">Status:</span>
                                    <span class="info-value">Em desenvolvimento</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Previsão:</span>
                                    <span class="info-value">Próxima fase</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        }

        return moduleDiv;
    }

    /**
     * Formata horas decimais em formato "xhymin"
     * Ex: 1.5 -> "1h30min", 0.75 -> "45min"
     */
    formatarTempo(horasDecimais) {
        if (!horasDecimais || horasDecimais === 0) return '0h';
        
        const horas = Math.floor(horasDecimais);
        const minutos = Math.round((horasDecimais - horas) * 60);
        
        if (horas === 0) {
            return minutos + 'min';
        } else if (minutos === 0) {
            return horas + 'h';
        } else {
            return horas + 'h' + minutos + 'min';
        }
    }

    updateHeaderTitle(title) {
        const headerTitle = document.querySelector('.header-title h1');
        if (headerTitle) headerTitle.textContent = title;
    }

    updateDashboardMetrics() {
        console.log('🔄 [DASHBOARD] Atualizando métricas do dashboard...');
        
        const totalElement = document.getElementById('total-funcionarios');
        const presentesElement = document.getElementById('presentes-hoje');
        const horasExtrasElement = document.getElementById('horas-extras-mes');
        const atrasosElement = document.getElementById('atrasos-mes');

        console.log('📋 [DASHBOARD] Elementos encontrados:', {
            total: !!totalElement,
            presentes: !!presentesElement,
            extras: !!horasExtrasElement,
            atrasos: !!atrasosElement
        });

        // Total de funcionários
        if (totalElement) {
            const total = typeof getTotalEmployees === 'function' ? getTotalEmployees() : 0;
            totalElement.textContent = total;
            console.log('✅ [DASHBOARD] Total funcionários:', total);
        }
        
        // Presentes hoje
        if (presentesElement) {
            try {
                const byStatus = typeof getEmployeesByStatus === 'function' ? getEmployeesByStatus() : {};
                const presentes = byStatus.ativo || byStatus['Ativo'] || 0;
                presentesElement.textContent = presentes;
                console.log('✅ [DASHBOARD] Presentes:', presentes);
            } catch (e) { 
                console.error('[DASHBOARD] Erro ao calcular presentes:', e);
                presentesElement.textContent = 0; 
            }
        }

        // Horas extras do mês
        if (horasExtrasElement) {
            try {
                console.log('⏱️ [DASHBOARD] Obtendo horas extras...');
                // Usar valor armazenado pelo gráfico
                const totalExtra = typeof lastOvertimeTotal !== 'undefined' ? lastOvertimeTotal : 0;
                const extraFormatado = this.formatarTempo(totalExtra);
                horasExtrasElement.textContent = extraFormatado;
                console.log('✅ [DASHBOARD] Horas extras:', extraFormatado);
            } catch (e) { 
                console.error('[DASHBOARD] Erro ao atualizar horas extras:', e);
                horasExtrasElement.textContent = '0h'; 
            }
        } else {
            console.warn('⚠️ [DASHBOARD] Elemento horas-extras-mes NÃO ENCONTRADO!');
        }

        // Atrasos do mês
        if (atrasosElement) {
            try {
                console.log('⏰ [DASHBOARD] Obtendo atrasos...');
                // Usar valor armazenado pelo gráfico
                const totalAtrasos = typeof lastDelayTotal !== 'undefined' ? lastDelayTotal : 0;
                const atrasosFormatado = this.formatarTempo(totalAtrasos);
                atrasosElement.textContent = atrasosFormatado;
                console.log('✅ [DASHBOARD] Atrasos:', atrasosFormatado);
            } catch (e) { 
                console.error('[DASHBOARD] Erro ao calcular atrasos:', e);
                atrasosElement.textContent = '0h'; 
            }
        }

        console.log('✅ [DASHBOARD] Dashboard metrics atualizadas com sucesso!');
    }

    showPage(pageId, params) {
        console.log('📍 showPage chamado:', pageId);
        // Store optional params (e.g., { editId: 3 }) so page init can use them
        this.pendingParams = params || null;
        this.navigateTo(pageId);
    }
}

// Monitorar TODOS os cliques no documento para debugar
console.log('🔍 Adicionando listener global de cliques para debugar');
document.addEventListener('click', (e) => {
    const target = e.target;
    const button = target.closest('button.nav-item');
    if (button) {
        console.log('🎯 CLIQUE GLOBAL DETECTADO em nav-item:', {
            tagName: button.tagName,
            className: button.className,
            dataPage: button.dataset.page,
            id: button.id
        });
    }
}, true); // Usar captura, não bubbling

// Tentar inicializar logo que o script carregar
console.log('📄 navigation.js carregado');
console.log('📄 document.readyState:', document.readyState);

// Se o DOM já está pronto, inicializar agora
if (document.readyState === 'loading') {
    console.log('⏳ DOM ainda está loading, aguardando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOMContentLoaded disparado - Iniciando NavigationSystem');
        if (!window.navigationSystem) {
            window.navigationSystem = new NavigationSystem();
            console.log('✅ NavigationSystem inicializado com sucesso!');
        }
    });
} else {
    console.log('✅ DOM já está pronto, inicializando NavigationSystem agora');
    // DOM já foi carregado, inicializar agora
    setTimeout(() => {
        if (!window.navigationSystem) {
            window.navigationSystem = new NavigationSystem();
            console.log('✅ NavigationSystem inicializado com sucesso!');
        }
    }, 0);
}