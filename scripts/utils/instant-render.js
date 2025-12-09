// ==========================================
// INSTANT RENDER - Renderizar tudo instantaneamente após salvar
// ==========================================

console.log('🚀 Instant Render System carregado');

// Interceptar todos os saves para disparar renderização
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    
    // Disparar evento de salva
    window.dispatchEvent(new CustomEvent('instantSave', { detail: { key, value } }));
    
    // Renderizar baseado na chave
    renderInstantlyForKey(key);
};

/**
 * Renderiza tela instantaneamente baseado na chave salva
 */
function renderInstantlyForKey(key) {
    console.log(`🔄 Renderizando para ${key}`);
    
    // EMPLOYEES
    if (key.includes('employee') || key === 'topservice_employees_v1') {
        if (typeof renderEmployeeList === 'function') {
            setTimeout(() => renderEmployeeList(), 10);
        }
    }
    
    // PUNCHES
    if (key.includes('punch') || key === 'topservice_punches_v1') {
        if (typeof renderPunches === 'function') {
            setTimeout(() => renderPunches(), 10);
        }
        if (typeof loadTableData === 'function') {
            setTimeout(() => loadTableData(), 10);
        }
    }
    
    // AFASTAMENTOS
    if (key.includes('afastamento') || key === 'topservice_afastamentos_v1') {
        if (typeof renderAfastamentos === 'function') {
            setTimeout(() => renderAfastamentos(), 10);
        }
    }
    
    // AUSÊNCIAS
    if (key.includes('absence') || key === 'topservice_absences_v1') {
        if (typeof renderAbsences === 'function') {
            setTimeout(() => renderAbsences(), 10);
        }
    }
    
    // DEPARTAMENTOS
    if (key.includes('departamento') || key === 'topservice_departamentos_v1') {
        if (typeof renderDepartments === 'function') {
            setTimeout(() => renderDepartments(), 10);
        }
    }
    
    // CARGOS
    if (key.includes('cargo') || key === 'topservice_cargos_v1') {
        if (typeof renderCargos === 'function') {
            setTimeout(() => renderCargos(), 10);
        }
    }
    
    // USUÁRIOS
    if (key.includes('user') || key === 'topservice_users_v1') {
        if (typeof renderUsers === 'function') {
            setTimeout(() => renderUsers(), 10);
        }
    }
    
    // ADIANTAMENTOS
    if (key.includes('adiantamento') || key === 'topservice_adiantamentos_v1') {
        if (typeof renderAdiantamentos === 'function') {
            setTimeout(() => renderAdiantamentos(), 10);
        }
    }
    
    // FÉRIAS
    if (key.includes('feria') || key === 'topservice_ferias_v1') {
        if (typeof renderFerias === 'function') {
            setTimeout(() => renderFerias(), 10);
        }
    }
    
    // BANCO DE HORAS
    if (key.includes('banco_horas') || key === 'topservice_banco_horas_v1') {
        if (typeof renderBancoHoras === 'function') {
            setTimeout(() => renderBancoHoras(), 10);
        }
    }

    // RELATORIOS
    if (key.includes('relatorio') || key === 'topservice_relatorios_v1') {
        if (typeof renderRelatorios === 'function') {
            setTimeout(() => renderRelatorios(), 10);
        }
        if (typeof loadRelatorioDepartamento === 'function') {
            setTimeout(() => loadRelatorioDepartamento(), 10);
        }
        if (typeof loadRelatorioFechamento === 'function') {
            setTimeout(() => loadRelatorioFechamento(), 10);
        }
        if (typeof loadRelatorioFerias === 'function') {
            setTimeout(() => loadRelatorioFerias(), 10);
        }
    }

    // CONFIGURAÇÕES
    if (key.includes('configuracao') || key === 'topservice_configuracoes_v1') {
        if (typeof renderConfiguracoes === 'function') {
            setTimeout(() => renderConfiguracoes(), 10);
        }
        if (typeof loadSettings === 'function') {
            setTimeout(() => loadSettings(), 10);
        }
    }

    // CARGO_DEPARTAMENTO
    if (key.includes('cargo_departamento') || key === 'topservice_cargo_departamento_v1') {
        if (typeof renderCargoDepartamento === 'function') {
            setTimeout(() => renderCargoDepartamento(), 10);
        }
    }
    
    // DASHBOARD / GRÁFICOS
    if (key.includes('employee') || key.includes('punch') || key.includes('extra') || key.includes('atraso')) {
        if (typeof updateDashboard === 'function') {
            setTimeout(() => updateDashboard(), 50);
        }
        if (typeof updateOverTimeCardWithAdvancements === 'function') {
            setTimeout(() => updateOverTimeCardWithAdvancements(), 50);
        }
    }
}

console.log('✅ Sistema de Instant Render ativado - todas as alterações aparecerão imediatamente!');
