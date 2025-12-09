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

async function loadUsers() {
    if (window.supabaseRealtime && window.supabaseRealtime.data.users) {
        return window.supabaseRealtime.data.users;
    }
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

async function createUser(username, password, role, name) {
    const users = await loadUsers();
    if (users.find(u => u.username === username)) {
        showToast('Este nome de usuário já existe.', 'error');
        return null;
    }
    
    const newUser = {
        // id is usually handled by the database, but let's create one for fallback
        id: 'user_' + Date.now(), 
        username, 
        password, // Em um app real, isso seria um hash
        role: role || 'user', 
        name: name || username 
    };

    if (window.supabaseRealtime && window.supabaseRealtime.insert) {
        try {
            const result = await window.supabaseRealtime.insert('users', newUser);
            initUsersModule(); // Re-render
            return result;
        } catch (err) {
            console.error('❌ Erro ao criar usuário via Supabase:', err);
            throw err;
        }
    } else {
        // Fallback
        users.push(newUser);
        localStorage.setItem(USER_KEY, JSON.stringify(users));
        initUsersModule(); // Re-render
        return newUser;
    }
}

async function authenticate(username, password) {
    const users = await loadUsers();
    const u = users.find(x => x.username === username && x.password === password);
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

async function initUsersModule() {
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
        if (btn) btn.addEventListener('click', async function(){
            var u = document.getElementById('login-username').value;
            var p = document.getElementById('login-password').value;
            if (await authenticate(u,p)) {
                showToast('✅ Login bem-sucedido!', 'success');
                location.reload();
            } else showToast('❌ Credenciais inválidas', 'error');
        });
        return;
    }

    // session exist -> show admin panel if admin or manage users for admin
    var users = await loadUsers();
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
            `<td class="actions"><button class="btn-delete" onclick="deleteUser('${u.id}')">🗑️ Excluir</button></td>` +
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
        createUser(un,pw,rl,nm).catch(err => {
            showToast('❌ Erro ao criar usuário.', 'error');
        });
    });

    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

function deleteUser(id) {
async function deleteUser(id) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    if (window.supabaseRealtime && window.supabaseRealtime.remove) {
        try {
            await window.supabaseRealtime.remove('users', id);
            initUsersModule(); // Re-render
        } catch (err) {
            console.error('❌ Erro ao excluir usuário via Supabase:', err);
            showToast('❌ Erro ao excluir usuário.', 'error');
        }
    } else {
        // Fallback
        const users = await loadUsers();
        const filtered = users.filter(u => u.id !== id);
        localStorage.setItem(USER_KEY, JSON.stringify(filtered));
        initUsersModule(); // Re-render
    }
}