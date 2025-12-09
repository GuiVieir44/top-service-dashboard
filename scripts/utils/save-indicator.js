// ==========================================
// INDICADOR VISUAL DE SALVAMENTO
// Mostra feedback visual quando dados são salvos
// ==========================================

(function() {
    console.log('Save Indicator Module carregado');

    // ===== ELEMENTO DO INDICADOR =====
    let indicator = null;
    let hideTimeout = null;

    /**
     * Cria o indicador visual HTML
     */
    function createIndicator() {
        const div = document.createElement('div');
        div.id = 'save-indicator';
        div.className = 'save-indicator save-indicator--hidden';
        div.innerHTML = `
            <div class="save-indicator__content">
                <span class="save-indicator__icon">💾</span>
                <span class="save-indicator__text">Salvando...</span>
            </div>
        `;
        document.body.appendChild(div);
        return div;
    }

    /**
     * Inicializa o indicador
     */
    function init() {
        if (!indicator) {
            indicator = createIndicator();
            addStyles();
        }
    }

    /**
     * Adiciona estilos CSS
     */
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .save-indicator {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
                color: white;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                font-size: 13px;
                font-weight: 500;
                opacity: 1;
                transform: translateY(0);
                transition: all 0.3s ease-in-out;
            }

            .save-indicator--hidden {
                opacity: 0;
                transform: translateY(20px);
                pointer-events: none;
            }

            .save-indicator--warning {
                background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
            }

            .save-indicator--error {
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            }

            .save-indicator__content {
                display: flex;
                align-items: center;
                gap: 8px;
                animation: pulse 0.6s ease-in-out;
            }

            .save-indicator__icon {
                font-size: 16px;
                animation: spin 0.6s ease-in-out;
            }

            .save-indicator--error .save-indicator__icon {
                animation: shake 0.4s ease-in-out;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                50% { transform: rotate(-10deg); }
                100% { transform: rotate(0deg); }
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-2px); }
                75% { transform: translateX(2px); }
            }

            @keyframes pulse {
                0% { scale: 0.8; opacity: 0.5; }
                50% { scale: 1; opacity: 1; }
                100% { scale: 1; opacity: 1; }
            }

            /* Responsivo */
            @media (max-width: 640px) {
                .save-indicator {
                    bottom: 10px;
                    right: 10px;
                    padding: 8px 12px;
                    font-size: 12px;
                }

                .save-indicator__icon {
                    font-size: 14px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Mostra o indicador com status
     */
    function show(success = true, type = 'success') {
        init();

        // Limpar timeout anterior
        if (hideTimeout) clearTimeout(hideTimeout);

        // Atualizar classes
        indicator.classList.remove('save-indicator--hidden', 'save-indicator--warning', 'save-indicator--error');
        
        if (type === 'warning') {
            indicator.classList.add('save-indicator--warning');
            indicator.querySelector('.save-indicator__text').textContent = '⚠️ Aviso ao salvar';
            indicator.querySelector('.save-indicator__icon').textContent = '⚠️';
        } else if (type === 'error') {
            indicator.classList.add('save-indicator--error');
            indicator.querySelector('.save-indicator__text').textContent = '❌ Erro ao salvar';
            indicator.querySelector('.save-indicator__icon').textContent = '❌';
        } else {
            indicator.querySelector('.save-indicator__text').textContent = '✅ Dados salvos';
            indicator.querySelector('.save-indicator__icon').textContent = '✅';
        }

        // Esconder após 2-3 segundos
        const duration = type === 'success' ? 2000 : 3000;
        hideTimeout = setTimeout(() => {
            hide();
        }, duration);
    }

    /**
     * Esconde o indicador
     */
    function hide() {
        if (indicator) {
            indicator.classList.add('save-indicator--hidden');
        }
    }

    /**
     * Mostra mensagem de salvamento em progresso
     */
    function showSaving() {
        init();
        
        indicator.classList.remove('save-indicator--hidden', 'save-indicator--warning', 'save-indicator--error');
        indicator.querySelector('.save-indicator__text').textContent = 'Salvando...';
        indicator.querySelector('.save-indicator__icon').textContent = '💾';
    }

    // ===== INTEGRAÇÃO COM PERSISTENCE.js =====
    window.showSaveIndicator = function(success, type = 'success') {
        if (success) {
            show(true, type);
        } else {
            show(false, type);
        }
    };

    window.showSavingIndicator = showSaving;

    // ===== INICIALIZAÇÃO =====
    document.addEventListener('DOMContentLoaded', () => {
        init();
        console.log('✅ Save Indicator inicializado');
    });

})();
