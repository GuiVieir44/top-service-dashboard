// ==========================================
// SISTEMA DE NAVEGAÇÃO TOP SERVICE
// ==========================================

class NavigationSystem {
    constructor() {
        this.currentPage = 'dashboard';
        this.pages = {
            'dashboard': 'Dashboard Principal',
            'ponto': 'Registro de Ponto', 
            'manual': 'Marcação Manual',
            'funcionarios': 'Gestão de Funcionários',
            'departamentos': 'Departamentos',
            'afastamentos': 'Controle de Afastamentos',
            'relatorios': 'Relatórios e Analytics',
            'ia': 'Central IA',
            'configuracoes': 'Configurações'
        };
        this.init();
    }
    init() {
        console.log('🚀 Sistema de navegação inicializado');
        this.setupEventListeners();
        this.showPage('dashboard');
    }

    setupEventListeners() {
        // Event delegation para o menu
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            
            if (navItem && navItem.dataset.page) {
                e.preventDefault();
                this.handleNavigation(navItem.dataset.page, navItem);
            }
        });
    }
    handleNavigation(pageId, clickedElement) {
        console.log(`🔄 Navegando para: ${pageId}`);
        
        if (this.currentPage === pageId) return;
        
        this.updateMenuState(clickedElement);
        this.showPageContent(pageId);
        this.currentPage = pageId;
    }

    updateMenuState(activeElement) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        activeElement.classList.add('active');
    }

    showPageContent(pageId) {
        const mainContent = document.querySelector('.main-content');
        
        if (pageId === 'dashboard') {
            this.showDashboardContent();
        } else {
            this.showModuleContent(pageId, mainContent);
        }
    }

    showDashboardContent() {
        const mainContent = document.querySelector('.main-content');
        mainContent.style.display = 'block';
        this.updateHeaderTitle('Dashboard Principal');
    }
    showModuleContent(pageId, container) {
        const pageTitle = this.pages[pageId] || pageId;
        
        container.innerHTML = `
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
                        <div class="user-avatar">
                            TS
                        </div>
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

    updateHeaderTitle(title) {
        const headerTitle = document.querySelector('.header-title h1');
        if (headerTitle) headerTitle.textContent = title;
    }

    navigateTo(pageId) {
        const navItem = document.querySelector(`[data-page="${pageId}"]`);
        if (navItem) {
            this.handleNavigation(pageId, navItem);
            return true;
        }
        return false;
    }
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
    window.navigationSystem = new NavigationSystem();
});