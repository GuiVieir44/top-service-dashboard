class NavigationSystem {
    constructor() {
        this.currentPage = 'dashboard';
        this.pages = {
            'dashboard': 'Dashboard Principal',
            'ponto': 'Registro de Ponto',
            'manual': 'Marcação Manual',
            'funcionarios': 'Gestão de Funcionários',
            'funcionarios-novo': 'Cadastrar Funcionário',
            'departamentos': 'Departamentos',
            'afastamentos': 'Controle de Afastamentos',
            'relatorios': 'Relatórios e Analytics',
            'usuarios': 'Usuários & Permissões',
            'ia': 'Central IA',
            'configuracoes': 'Configurações'
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showPage('dashboard');
    }

    setupEventListeners() {
        // Delegated listener: captura cliques em qualquer filho de .nav-item
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.dataset.page) {
                e.preventDefault();
                this.handleNavigation(navItem.dataset.page, navItem);
            }
        });

        // Fallback: listener direto no container .nav-links para garantir
        // que cliques em áreas internas sejam capturados (melhora confiabilidade)
        const navLinksContainer = document.querySelector('.nav-links');
        if (navLinksContainer) {
            navLinksContainer.addEventListener('click', (e) => {
                const button = e.target.closest('button.nav-item');
                if (button && button.dataset.page) {
                    e.preventDefault();
                    this.handleNavigation(button.dataset.page, button);
                }
            });
        }

        // Para maior robustez (e acessibilidade), torne os itens focáveis
        // e adicione listeners diretos e suporte a teclado (Enter/Space).
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '0');

            // Listener direto como fallback caso delegação não capture
            item.addEventListener('click', (ev) => {
                ev.preventDefault();
                const page = item.dataset.page;
                if (page) this.handleNavigation(page, item);
            });

            // Suporte a teclado para ativar a aba com Enter/Space
            item.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    const page = item.dataset.page;
                    if (page) this.handleNavigation(page, item);
                }
            });
        });

        // Botão de toggle da sidebar (mobile)
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) sidebar.classList.toggle('collapsed');
            });
        }
    }

    handleNavigation(pageId, clickedElement) {
        if (this.currentPage === pageId) return;

        // Verificar permissões
        if (typeof restrictPageAccess === 'function' && !restrictPageAccess(pageId)) {
            return;
        }

        // debug: navegação para página
        this.updateMenuState(clickedElement);
        this.showPageContent(pageId);
        this.currentPage = pageId;
    }

    updateMenuState(activeElement) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
        });

        // activeElement may be null when navigation is triggered programmatically
        if (activeElement && activeElement.classList) {
            activeElement.classList.add('active');
            try {
                activeElement.setAttribute('aria-current', 'page');
                if (typeof activeElement.focus === 'function') activeElement.focus();
            } catch (e) { /* silent */ }
        }
    }

    showPageContent(pageId) {
        const mainContent = document.querySelector('.main-content');
        const dashboardContent = document.getElementById('dashboard-content');

        mainContent.querySelectorAll('.page').forEach(page => {
            if (page.id !== 'dashboard-content') {
                page.style.display = 'none';
            }
        });

        if (pageId === 'dashboard') {
            if (dashboardContent) dashboardContent.style.display = 'block';
            this.updateHeaderTitle('Dashboard Principal');
            this.updateDashboardMetrics();
            // Inicializar gráficos
            if (typeof initCharts === 'function') {
                setTimeout(() => { initCharts(); }, 200);
            }
        } else {
            if (dashboardContent) dashboardContent.style.display = 'none';
            let moduleContent = document.getElementById(`${pageId}-content`);
            if (!moduleContent) {
                moduleContent = this.createModuleContent(pageId);
                mainContent.appendChild(moduleContent);
                // If the module is the funcionários page, try to render the employee list
                if (pageId === 'funcionarios' && typeof renderEmployeeList === 'function') {
                    // ensure DOM insertion before rendering
                    setTimeout(() => {
                        try { renderEmployeeList(); } catch (e) { console.error('Erro ao renderizar funcionários:', e); }
                        try { if (typeof initEmployeeModule === 'function') initEmployeeModule(); } catch(e) { console.error('Erro ao inicializar employee module:', e); }
                    }, 0);
                }
                if (pageId === 'ponto' && typeof initPunchModule === 'function') {
                    // initialize the register-point module after it's inserted
                    setTimeout(() => {
                        try { initPunchModule(); } catch (e) { console.error('Erro ao inicializar módulo de ponto:', e); }
                    }, 0);
                }
                if (pageId === 'manual' && typeof initManualModule === 'function') {
                    setTimeout(() => { try { initManualModule(); } catch(e){ console.error('Erro ao inicializar marcação manual:', e); } }, 0);
                }
                if (pageId === 'funcionarios-novo') {
                    // attach form handlers and support edit-mode params
                    const navRef = this;
                    setTimeout(() => {
                        try {
                            var submitBtn = document.getElementById('form-submit-btn');
                            var cancelBtn = document.getElementById('form-cancel-btn');
                            if (submitBtn && typeof submitEmployeeForm === 'function') submitBtn.addEventListener('click', submitEmployeeForm);
                            if (cancelBtn && typeof cancelEmployeeForm === 'function') cancelBtn.addEventListener('click', cancelEmployeeForm);

                            // If navigation passed params (e.g., editId), populate the form
                            try {
                                if (navRef.pendingParams && navRef.pendingParams.editId && typeof window.populateEmployeeForm === 'function') {
                                    window.populateEmployeeForm(navRef.pendingParams.editId);
                                } else if (typeof window.clearEmployeeForm === 'function') {
                                    // ensure form is cleared when opening for a new employee
                                    window.clearEmployeeForm();
                                }
                            } catch (pe) { console.error('Erro ao popular formulário de funcionário:', pe); }

                            // Clear pending params after handling
                            navRef.pendingParams = null;
                        } catch (e) { console.error('Erro ao inicializar form de cadastro:', e); }
                    }, 0);
                }
                if (pageId === 'relatorios' && typeof initReportModule === 'function') {
                    // initialize the reports module after it's inserted
                    setTimeout(() => {
                        try { initReportModule(); } catch (e) { console.error('Erro ao inicializar módulo de relatórios:', e); }
                    }, 0);
                }
                if (pageId === 'usuarios' && typeof initUsersModule === 'function') {
                    setTimeout(() => {
                        try { initUsersModule(); } catch (e) { console.error('Erro ao inicializar módulo de usuários:', e); }
                    }, 0);
                }
                if (pageId === 'departamentos' && typeof initDepartmentsModule === 'function') {
                    setTimeout(() => { try { initDepartmentsModule(); } catch(e){ console.error('Erro ao inicializar departamentos:', e); } }, 0);
                }
            }
            moduleContent.style.display = 'block';
            this.updateHeaderTitle(this.pages[pageId]);

            // Always (re)initialize module behavior when the page is shown.
            // This ensures selects and lists are refreshed after data changes.
            try {
                switch (pageId) {
                    case 'funcionarios':
                        try { if (typeof renderEmployeeList === 'function') renderEmployeeList(); } catch(e){}
                        try { if (typeof initEmployeeModule === 'function') initEmployeeModule(); } catch(e){}
                        break;
                    case 'ponto':
                        try { if (typeof initPunchModule === 'function') initPunchModule(); } catch(e){}
                        break;
                    case 'manual':
                        try { if (typeof initManualModule === 'function') initManualModule(); } catch(e){}
                        break;
                    case 'funcionarios-novo':
                        // handled earlier when creating, but also call populate/clear again if needed
                        try {
                            if (this.pendingParams && this.pendingParams.editId && typeof window.populateEmployeeForm === 'function') {
                                window.populateEmployeeForm(this.pendingParams.editId);
                            } else if (typeof window.clearEmployeeForm === 'function') {
                                window.clearEmployeeForm();
                            }
                        } catch(e) { console.error('Erro ao preparar formulario funcionarios-novo:', e); }
                        break;
                    case 'relatorios':
                        try { if (typeof initReportModule === 'function') initReportModule(); } catch(e){}
                        break;
                    case 'afastamentos':
                        try { if (typeof initAfastamentosModule === 'function') initAfastamentosModule(); } catch(e){}
                        try { if (typeof setupAfastamentosButtonHandler === 'function') setupAfastamentosButtonHandler(); } catch(e){}
                        break;
                    case 'departamentos':
                        try { if (typeof initDepartmentsModule === 'function') initDepartmentsModule(); } catch(e){}
                        break;
                    case 'usuarios':
                        try { if (typeof initUsersModule === 'function') initUsersModule(); } catch(e){}
                        break;
                    case 'configuracoes':
                        try { if (typeof initSettingsModule === 'function') initSettingsModule(); } catch(e){}
                        break;
                    default:
                        break;
                }
            } catch (e) { console.error('Erro ao (re)inicializar módulo ao mostrar página:', e); }
        }
    }

    createModuleContent(pageId) {
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
                                    <button id="add-employee-btn" class="btn btn-primary">Adicionar Novo</button>
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
                                    <div class="form-field" style="flex-direction:row;display:flex;gap:8px;align-items:center;">
                                        <label><input type="radio" name="punch-type" value="Entrada" checked> Entrada</label>
                                        <label><input type="radio" name="punch-type" value="Saída"> Saída</label>
                                    </div>
                                </div>
                                <button id="punch-register-btn" class="btn btn-primary">Registrar Agora</button>
                            </div>

                            <div style="overflow:auto;">
                                <table class="table">
                                    <thead style="background:#f7f7f7;">
                                        <tr>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Funcionário</th>
                                            <th style="padding:10px;border:1px solid #e6e6e6;text-align:left;">Tipo</th>
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
                        <p>Registre pontos com data e hora customizadas</p>
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
                        <h2>✏️ Marcação Manual de Ponto</h2>
                        <div class="status-content">
                            <div class="module-actions">
                                <div class="form-row">
                                    <label class="form-field">Funcionário
                                        <select id="manual-employee-select" class="form-select">
                                            <option>Carregando...</option>
                                        </select>
                                    </label>
                                    <label class="form-field">Data
                                        <input id="manual-date" type="date" class="form-date" />
                                    </label>
                                    <label class="form-field">Hora
                                        <input id="manual-time" type="time" class="form-input" />
                                    </label>
                                </div>
                                <div class="form-row">
                                    <div class="form-field" style="flex-direction:row;display:flex;gap:8px;align-items:center;">
                                        <label><input type="radio" name="manual-type" value="Entrada" checked> Entrada</label>
                                        <label><input type="radio" name="manual-type" value="Saída"> Saída</label>
                                    </div>
                                </div>
                                <button id="manual-add-btn" class="btn btn-primary">Registrar</button>
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
                                        <input id="form-cargo" class="form-input" />
                                    </label>
                                    <label class="form-field">Departamento
                                        <input id="form-departamento" class="form-input" />
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
                                <label style="display:flex;flex-direction:column;">
                                    Funcionário
                                    <select id="afast-employee-select" style="padding:8px;border-radius:6px;border:1px solid #ddd;min-width:220px;"></select>
                                </label>
                                <label style="display:flex;flex-direction:column;">
                                    Tipo
                                    <select id="afast-type" style="padding:8px;border-radius:6px;border:1px solid #ddd;">
                                        <option>Férias</option>
                                        <option>Licença Médica</option>
                                        <option>Licença Maternidade/Paternidade</option>
                                        <option>Outro</option>
                                    </select>
                                </label>
                                <label style="display:flex;flex-direction:column;">
                                    Início
                                    <input id="afast-start" type="date" style="padding:8px;border-radius:6px;border:1px solid #ddd;" />
                                </label>
                                <label style="display:flex;flex-direction:column;">
                                    Fim
                                    <input id="afast-end" type="date" style="padding:8px;border-radius:6px;border:1px solid #ddd;" />
                                </label>
                                <button id="afast-add-btn" style="background:var(--dourado);border:none;padding:10px 14px;border-radius:6px;cursor:pointer;">Adicionar</button>
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

    updateHeaderTitle(title) {
        const headerTitle = document.querySelector('.header-title h1');
        if (headerTitle) headerTitle.textContent = title;
    }

    updateDashboardMetrics() {
        const totalElement = document.getElementById('total-funcionarios');
        const presentesElement = document.getElementById('presentes-hoje');

        if (totalElement) totalElement.textContent = getTotalEmployees ? getTotalEmployees() : 0;
        if (presentesElement) presentesElement.textContent = getEmployeesByStatus ? getEmployeesByStatus().ativo || 0 : 0;
    }

    showPage(pageId, params) {
        // Store optional params (e.g., { editId: 3 }) so page init can use them
        this.pendingParams = params || null;
        const navItem = document.querySelector(`[data-page="${pageId}"]`);
        // Call handleNavigation even if there's no matching nav item (programmatic navigation)
        this.handleNavigation(pageId, navItem || null);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.navigationSystem = new NavigationSystem();
});