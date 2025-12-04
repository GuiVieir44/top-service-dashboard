// ==========================================
// CENTRAL IA - ASSISTENTE VIRTUAL - TOP SERVICE
// ==========================================

console.log('🤖 Central IA carregado');

/**
 * Base de conhecimento da IA
 */
const knowlegeBase = {
    saudacao: {
        patterns: ['oi', 'olá', 'opa', 'e aí', 'tudo bem', 'oi ia', 'olá ia'],
        responses: [
            'Olá! 👋 Bem-vindo à Central IA. Como posso ajudá-lo?',
            'Oi! 😊 Estou aqui para ajudar com dúvidas sobre o sistema.',
            'Olá! 🤖 O que você gostaria de saber?'
        ]
    },
    ponto: {
        patterns: ['registrar ponto', 'como registro ponto', 'ponto', 'marcar ponto', 'entrada saída'],
        responses: [
            '📊 Para registrar seu ponto:\n1. Vá para "Registrar Ponto"\n2. Selecione seu nome\n3. Marque "Entrada" ou "Saída"\n4. Clique em "Registrar Agora"',
            '🕒 Você pode registrar seu ponto na aba "Registrar Ponto" ou "Marcação Manual" se precisar de uma data/hora diferente.'
        ]
    },
    relatorio: {
        patterns: ['relatório', 'relatorio', 'gerar relatório', 'ver meus pontos', 'exportar'],
        responses: [
            '📈 Para gerar um relatório:\n1. Acesse "Relatórios"\n2. Selecione o período (Início/Fim)\n3. Escolha um funcionário ou "Todos"\n4. Clique em "Gerar" ou "Exportar CSV"',
            '📊 Use os botões rápidos: Hoje, 7 dias, ou Mês para filtros pré-definidos!'
        ]
    },
    funcionarios: {
        patterns: ['funcionário', 'funcionario', 'adicionar funcionário', 'cadastrar funcionário', 'employee'],
        responses: [
            '👥 Para adicionar um funcionário:\n1. Vá para "Funcionários"\n2. Clique em "Adicionar Novo"\n3. Preencha os dados\n4. Salve o formulário',
            '📋 Você também pode editar ou excluir funcionários pela lista.'
        ]
    },
    afastamento: {
        patterns: ['afastamento', 'férias', 'licença', 'abono', 'saída remunerada'],
        responses: [
            '🏖️ Para registrar um afastamento:\n1. Acesse "Afastamentos"\n2. Selecione o funcionário\n3. Escolha o tipo (Férias, Licença, etc)\n4. Defina as datas\n5. Salve',
            '📅 Os afastamentos aparecem automaticamente nos relatórios!'
        ]
    },
    configuracao: {
        patterns: ['configuração', 'configuracao', 'temas', 'tema escuro', 'preferencias', 'backup'],
        responses: [
            '⚙️ Você pode:\n- Alterar o tema (escuro/claro)\n- Gerenciar suas preferências\n- Fazer backup/restauração de dados\n- Configurar horários de expediente',
            '💾 Sempre faça backups regulares de seus dados na seção "Configurações"!'
        ]
    },
    permissoes: {
        patterns: ['permissão', 'permissao', 'acesso', 'admin', 'usuário', 'usuario'],
        responses: [
            '🔐 Existem dois tipos de usuários:\n👨‍💼 Admin: Acesso completo a todos os recursos\n👤 Usuário: Acesso limitado (apenas seu próprio ponto e relatórios)',
            'Peça para um administrador criar uma conta para você!'
        ]
    },
    ajuda: {
        patterns: ['ajuda', 'help', 'socorro', 'não entendi', 'como usar', 'manual'],
        responses: [
            '📚 Comandos que posso ajudar:\n- "Como registrar ponto?"\n- "Como gerar relatório?"\n- "Como adicionar funcionário?"\n- "O que são afastamentos?"\n- "Como fazer backup?"\n- "Qual é meu perfil?"',
            '💡 Dica: Você também pode explorar o sistema através do menu lateral!'
        ]
    },
    grafico: {
        patterns: ['gráfico', 'grafico', 'chart', 'dados', 'análise', 'analise'],
        responses: [
            '📊 No dashboard você verá:\n- Pontos por funcionário\n- Presença hoje\n- Afastamentos por tipo\n- Horas extras do mês',
            '📈 Todos os gráficos são atualizados em tempo real!'
        ]
    },
    notificacao: {
        patterns: ['notificação', 'notificacao', 'alerta', 'aviso', 'lembrete'],
        responses: [
            '🔔 Você receberá notificações sobre:\n- Funcionários sem ponto\n- Afastamentos próximos\n- Situação geral do sistema',
            'Clique no botão 🔔 para ver todas as notificações!'
        ]
    },
    despedida: {
        patterns: ['tchau', 'adeus', 'até logo', 'até mais', 'flw'],
        responses: [
            'Até logo! 👋 Fico à disposição quando precisar!',
            'Bom trabalho! 😊 Estou sempre aqui se tiver dúvidas.',
            'Até mais! 🚀'
        ]
    }
};

/**
 * Encontra a melhor resposta para uma pergunta
 */
function findBestResponse(userMessage) {
    userMessage = userMessage.toLowerCase().trim();
    
    // Procurar por padrões
    for (let category in knowlegeBase) {
        const patterns = knowlegeBase[category].patterns;
        for (let pattern of patterns) {
            if (userMessage.includes(pattern)) {
                const responses = knowlegeBase[category].responses;
                return responses[Math.floor(Math.random() * responses.length)];
            }
        }
    }
    
    // Resposta padrão
    return '🤔 Desculpe, não entendi muito bem. Tente fazer uma pergunta sobre:\n- Registrar ponto\n- Relatórios\n- Funcionários\n- Afastamentos\n- Configurações\n- Ou digite "ajuda"';
}

/**
 * Cria a janela do chat
 */
function createChatWindow() {
    if (document.getElementById('ia-chat-window')) {
        document.getElementById('ia-chat-window').style.display = 'block';
        return;
    }
    
    const html = `
        <div id="ia-chat-window" style="
            position: fixed;
            bottom: 90px;
            right: 30px;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 5px 40px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            z-index: 9997;
            border: 2px solid var(--dourado);
            animation: slideUp 0.3s ease;
        ">
            <!-- Header -->
            <div style="
                background: linear-gradient(135deg, var(--dourado) 0%, var(--dourado-escuro) 100%);
                color: black;
                padding: 15px;
                border-radius: 10px 10px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: bold;
            ">
                <span>🤖 Assistente IA</span>
                <button onclick="document.getElementById('ia-chat-window').style.display='none'" style="
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    font-size: 1.2rem;
                    color: black;
                ">✕</button>
            </div>
            
            <!-- Messages Area -->
            <div id="ia-chat-messages" style="
                flex: 1;
                overflow-y: auto;
                padding: 15px;
                background: #f9f9f9;
                display: flex;
                flex-direction: column;
                gap: 10px;
            "></div>
            
            <!-- Input Area -->
            <div style="
                padding: 12px;
                border-top: 1px solid #eee;
                display: flex;
                gap: 8px;
                background: white;
            ">
                <input id="ia-chat-input" type="text" placeholder="Faça uma pergunta..." style="
                    flex: 1;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    padding: 8px 12px;
                    font-size: 0.9rem;
                " />
                <button id="ia-send-btn" style="
                    background: linear-gradient(135deg, var(--dourado) 0%, var(--dourado-escuro) 100%);
                    color: black;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 12px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                ">📤</button>
            </div>
        </div>
        
        <style>
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            #ia-chat-messages::-webkit-scrollbar {
                width: 6px;
            }
            
            #ia-chat-messages::-webkit-scrollbar-track {
                background: #f1f1f1;
            }
            
            #ia-chat-messages::-webkit-scrollbar-thumb {
                background: var(--dourado);
                border-radius: 3px;
            }
        </style>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container.firstElementChild);
    
    // Setup event listeners
    const input = document.getElementById('ia-chat-input');
    const sendBtn = document.getElementById('ia-send-btn');
    
    const sendMessage = () => {
        const message = input.value.trim();
        if (!message) return;
        
        // Adicionar mensagem do usuário
        addMessageToChat(message, 'user');
        input.value = '';
        
        // Simular delay de resposta
        setTimeout(() => {
            const response = findBestResponse(message);
            addMessageToChat(response, 'ia');
        }, 300);
    };
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Mensagem inicial
    addMessageToChat('Olá! 👋 Sou o assistente IA. Como posso ajudá-lo?', 'ia');
}

/**
 * Adiciona mensagem ao chat
 */
function addMessageToChat(message, sender) {
    const messagesDiv = document.getElementById('ia-chat-messages');
    if (!messagesDiv) return;
    
    const messageElement = document.createElement('div');
    messageElement.style.display = 'flex';
    messageElement.style.justifyContent = sender === 'user' ? 'flex-end' : 'flex-start';
    messageElement.style.animation = 'slideUp 0.2s ease';
    
    const bubble = document.createElement('div');
    bubble.style.maxWidth = '80%';
    bubble.style.padding = '10px 12px';
    bubble.style.borderRadius = '8px';
    bubble.style.wordWrap = 'break-word';
    bubble.style.whiteSpace = 'pre-wrap';
    bubble.style.fontSize = '0.9rem';
    bubble.style.lineHeight = '1.4';
    
    if (sender === 'user') {
        bubble.style.background = 'linear-gradient(135deg, var(--dourado) 0%, var(--dourado-escuro) 100%)';
        bubble.style.color = 'black';
        bubble.style.borderBottomRightRadius = '2px';
    } else {
        bubble.style.background = '#e8e8e8';
        bubble.style.color = '#333';
        bubble.style.borderBottomLeftRadius = '2px';
    }
    
    bubble.textContent = message;
    messageElement.appendChild(bubble);
    messagesDiv.appendChild(messageElement);
    
    // Scroll para baixo
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * Cria botão de chat flutuante
 */
function createChatButton() {
    if (document.getElementById('ia-chat-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'ia-chat-btn';
    btn.innerHTML = '🤖';
    btn.style.position = 'fixed';
    btn.style.bottom = '30px';
    btn.style.left = '30px';
    btn.style.width = '60px';
    btn.style.height = '60px';
    btn.style.borderRadius = '50%';
    btn.style.background = 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)';
    btn.style.border = '3px solid white';
    btn.style.color = 'white';
    btn.style.fontSize = '1.8rem';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    btn.style.transition = 'all 0.3s ease';
    btn.style.zIndex = '9996';
    btn.title = 'Abrir assistente IA';
    
    btn.addEventListener('click', createChatWindow);
    btn.addEventListener('mouseover', () => {
        btn.style.transform = 'scale(1.1)';
    });
    btn.addEventListener('mouseout', () => {
        btn.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(btn);
}

/**
 * Inicializa a Central IA
 */
function initAI() {
    createChatButton();
    console.log('✅ Central IA ativada');
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initAI, 500);
});
