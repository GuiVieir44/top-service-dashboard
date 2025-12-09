// ==========================================
// MÓDULO DE USUÁRIOS (LOGIN / ADM) - TOP SERVICE
// ==========================================

var USER_KEY = 'topservice_users_v1';
var SESSION_KEY = 'topservice_session_v1';

// default users: one admin for first run
var defaultUsers = [
    { id: 1, username: 'admin', password: 'admin', role: 'admin', name: 'Administrador' }
];

// ===== DEBOUNCING =====
let saveUsersTimeout = null;
const USER_SAVE_DELAY = 300; // ms

/**
 * Agenda salvamento de usuários com debounce
 */
function scheduleSaveUsers(users) {
    if (saveUsersTimeout) {
        clearTimeout(saveUsersTimeout);
    }
    
    saveUsersTimeout = setTimeout(() => {
        performSaveUsers(users);
    }, USER_SAVE_DELAY);
}

/**
 * Executa salvamento real de usuários
 */
function performSaveUsers(users) {
    try {
        localStorage.setItem(USER_KEY, JSON.stringify(users));
        window.users = users; // Sincronizar global
        console.log('✅ Usuários salvos com debounce -', users.length, 'registros');
    } catch (e) {
        console.error('Erro ao salvar usuários:', e);
    }
}

function loadUsers() {
    try {
        var stored = localStorage.getItem(USER_KEY);
        if (stored) return JSON.parse(stored);
        localStorage.setItem(USER_KEY, JSON.stringify(defaultUsers));
        return defaultUsers;
    } catch (e) {
        console.error('Erro ao carregar usuários:', e);
        return defaultUsers;
    }
}

function saveUsers(users) {
    // Usar debounce
    scheduleSaveUsers(users);
}

function createUser(username, password, role, name) {
    var users = loadUsers();
    if (users.find(u => u.username === username)) return null;
    var id = users.length > 0 ? Math.max(...users.map(u=>u.id)) + 1 : 1;
    var u = { id: id, username: username, password: password, role: role || 'user', name: name || username };
    users.push(u);
    saveUsers(users);
    return u;
}

function authenticate(username, password) {
    var users = loadUsers();
    var u = users.find(x => x.username === username && x.password === password);
    if (u) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: u.id, username: u.username, role: u.role }));
        return true;
    }
    return false;
}

function getCurrentSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; }
}

function logout() {
    localStorage.removeItem(SESSION_KEY);
    // reload to update UI
    location.reload();
}

function initUsersModule() {
    var container = document.getElementById('users-module-container');
    if (!container) return;

    var session = getCurrentSession();
    if (!session) {
        container.innerHTML = `
            <div class="form-container" style="max-width: 450px; margin: 40px auto;">
                <h2>🔐 Fazer Login</h2>
                
                <div class="form-section">
                    <div class="form-group full">
                        <label class="form-label">Usuário</label>
                        <input id="login-username" class="form-input" placeholder="Digite seu usuário" />
                    </div>
                    <div class="form-group full">
                        <label class="form-label">Senha</label>
                        <input id="login-password" type="password" class="form-input" placeholder="Digite sua senha" />
                    </div>
                </div>

                <div class="form-actions" style="flex-direction: column;">
                    <button id="login-btn" class="btn btn-primary" style="width: 100%;">🔓 Entrar</button>
                </div>

                <div style="margin-top: 20px; padding: 15px; background: #e8f4f8; border-radius: 8px; border-left: 4px solid #3498db;">
                    <p style="color: #1a5276; font-weight: 600; margin-bottom: 8px;">📝 Credenciais Padrão:</p>
                    <p style="color: #2c3e50; font-size: 0.9rem;">
                        <strong>Usuário:</strong> admin<br>
                        <strong>Senha:</strong> admin
                    </p>
                </div>
            </div>
        `;
        var btn = document.getElementById('login-btn');
        if (btn) btn.addEventListener('click', function(){
            var u = document.getElementById('login-username').value;
            var p = document.getElementById('login-password').value;
            if (authenticate(u,p)) {
                showToast('✅ Login bem-sucedido!', 'success');
                location.reload();
            } else showToast('❌ Credenciais inválidas', 'error');
        });
        return;
    }

    // session exist -> show admin panel if admin or manage users for admin
    var users = loadUsers();
    var html = `
        <div class="form-container">
            <h2>👥 Gerenciar Usuários</h2>
            
            <div class="form-section">
                <h3>➕ Adicionar Novo Usuário</h3>
                
                <div class="form-group">
                    <div>
                        <label class="form-label">Usuário</label>
                        <input id="new-username" class="form-input" placeholder="Nome de usuário único" />
                    </div>
                    <div>
                        <label class="form-label">Senha</label>
                        <input id="new-password" class="form-input" type="password" placeholder="Senha segura" />
                    </div>
                </div>

                <div class="form-group">
                    <div>
                        <label class="form-label">Nome Completo</label>
                        <input id="new-name" class="form-input" placeholder="Nome exibido no sistema" />
                    </div>
                    <div>
                        <label class="form-label">Perfil</label>
                        <select id="new-role" class="form-input">
                            <option value="user">👤 Usuário</option>
                            <option value="admin">👨‍💼 Administrador</option>
                        </select>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; margin-top: 15px;">
                    <button id="create-user-btn" class="btn btn-success" style="flex: 1;">➕ Criar Usuário</button>
                    <button id="logout-btn" class="btn btn-danger" style="flex: 1;">🚪 Sair</button>
                </div>
            </div>

            <div class="form-section">
                <h3>📋 Lista de Usuários</h3>
                <div style="overflow-x: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>👤 Usuário</th>
                                <th>📝 Nome</th>
                                <th>🔑 Perfil</th>
                                <th class="actions">⚙️ Ações</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    users.forEach(function(u){ 
        const profileBadge = u.role === 'admin' ? 
            '<span style="background: linear-gradient(135deg, var(--dourado) 0%, var(--dourado-escuro) 100%); color: var(--preto); padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">👨‍💼 Administrador</span>' : 
            '<span style="background: #3498db; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">👤 Usuário</span>';
        
        html += '<tr>' +
            '<td><strong>' + u.username + '</strong></td>' +
            '<td>' + u.name + '</td>' +
            '<td>' + profileBadge + '</td>' +
            '<td class="actions"><button class="btn-delete" onclick="deleteUser(' + u.id + ')">🗑️ Excluir</button></td>' +
        '</tr>'; 
    });
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;

    var createBtn = document.getElementById('create-user-btn');
    if (createBtn) createBtn.addEventListener('click', function(){
        var un = document.getElementById('new-username').value;
        var pw = document.getElementById('new-password').value;
        var rl = document.getElementById('new-role').value;
        var nm = document.getElementById('new-name').value;
        if (!un || !pw) { showToast('⚠️ Usuário e senha são obrigatórios', 'warning'); return; }
        var created = createUser(un,pw,rl,nm);
        if (!created) { showToast('❌ Esse usuário já existe', 'error'); return; }
        showToast('✅ Usuário criado: ' + created.username, 'success');
        initUsersModule();
    });

    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

function deleteUser(id) {
    var users = loadUsers();
    var filtered = users.filter(function(u){ return u.id !== id; });
    saveUsers(filtered);
    initUsersModule();
}
