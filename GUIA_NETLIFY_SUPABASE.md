# 🚀 Guia Completo: Netlify + Supabase

## PARTE 1: PREPARAR PARA NETLIFY

### 1.1 - Criar arquivo `.gitignore`
Crie na raiz do projeto:
```
node_modules/
.env
.env.local
*.log
.DS_Store
```

### 1.2 - Criar arquivo `netlify.toml`
Crie na raiz do projeto:
```toml
[build]
publish = "."
command = "echo 'Site está pronto'"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

### 1.3 - Criar arquivo `.env.example`
Para documentar variáveis necessárias:
```
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

---

## PARTE 2: CRIAR BANCO NO SUPABASE

### 2.1 - Acessar Supabase
1. Vá para https://supabase.com
2. Clique em "Start your project"
3. Faça login com GitHub ou email

### 2.2 - Criar novo projeto
1. Clique em "New Project"
2. Nome: `top-service`
3. Senha: Salve em local seguro
4. Região: São Paulo (us-east-1)
5. Clique "Create new project" e aguarde (5-10 min)

### 2.3 - Copiar credenciais
1. Vá para **Project Settings** → **API**
2. Copie:
   - **Project URL** (vai em VITE_SUPABASE_URL)
   - **anon public** key (vai em VITE_SUPABASE_ANON_KEY)

---

## PARTE 3: CRIAR TABELAS NO SUPABASE

### 3.1 - Acessar SQL Editor
1. No painel Supabase, vá para **SQL Editor**
2. Clique em **New Query**
3. Cole este SQL completo:

```sql
-- ==========================================
-- TABELAS TOP SERVICE
-- ==========================================

-- Funcionários
CREATE TABLE IF NOT EXISTS employees (
    id BIGSERIAL PRIMARY KEY,
    matricula TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    cargo TEXT,
    departamento TEXT,
    cpf TEXT,
    email TEXT UNIQUE,
    telefone TEXT,
    endereco TEXT,
    admissao DATE,
    status TEXT DEFAULT 'Ativo',
    horaInicio TEXT,
    horaFim TEXT,
    adicional TEXT,
    valeAlimentacao NUMERIC,
    valeTransporte TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pontos (Entradas/Saídas)
CREATE TABLE IF NOT EXISTS punches (
    id BIGSERIAL PRIMARY KEY,
    employeeId BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    rf TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cargos
CREATE TABLE IF NOT EXISTS cargos (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    horasDia INTEGER,
    bancoHoras NUMERIC DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departamentos
CREATE TABLE IF NOT EXISTS departamentos (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cargos por Departamento
CREATE TABLE IF NOT EXISTS cargos_departamento (
    id BIGSERIAL PRIMARY KEY,
    departmentId BIGINT REFERENCES departamentos(id) ON DELETE CASCADE,
    cargoId BIGINT REFERENCES cargos(id) ON DELETE CASCADE,
    cargoNome TEXT,
    horaInicio TEXT,
    horaFim TEXT,
    intervaloAlmoco INTEGER,
    horasEfetivas NUMERIC,
    bancoHoras NUMERIC DEFAULT 0,
    dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ausências (Faltas, Feriados, Folgas)
CREATE TABLE IF NOT EXISTS absences (
    id BIGSERIAL PRIMARY KEY,
    employeeId BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Afastamentos
CREATE TABLE IF NOT EXISTS afastamentos (
    id BIGSERIAL PRIMARY KEY,
    employeeId BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    type TEXT,
    start TEXT,
    end TEXT,
    dataInicio TEXT,
    dataFim TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX idx_punches_employeeId ON punches(employeeId);
CREATE INDEX idx_punches_timestamp ON punches(timestamp);
CREATE INDEX idx_absences_employeeId ON absences(employeeId);
CREATE INDEX idx_absences_date ON absences(date);
CREATE INDEX idx_afastamentos_employeeId ON afastamentos(employeeId);
```

4. Clique em **Run** e aguarde

### 3.2 - Habilitar Realtime
1. Clique em **Realtime** na tabela `punches`
2. Ative as checkboxes: INSERT, UPDATE, DELETE
3. Faça o mesmo para `absences`, `afastamentos`, `employees`

---

## PARTE 4: INTEGRAR COM SUPABASE

### 4.1 - Instalar biblioteca Supabase
Na pasta do projeto:
```bash
npm install @supabase/supabase-js
```

### 4.2 - Criar arquivo `scripts/supabase-client.js`
```javascript
// ==========================================
// CLIENTE SUPABASE
// ==========================================

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url')
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_key')

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

console.log('✅ Cliente Supabase inicializado')
```

### 4.3 - Sincronizar dados no HTML
Adicione este script no `index.html` antes do `</body>`:

```html
<script>
// ==========================================
// SINCRONIZAÇÃO SUPABASE
// ==========================================

const SUPABASE_URL = 'sua_url_supabase'
const SUPABASE_KEY = 'sua_chave_supabase'

async function initSupabaseSync() {
    console.log('🔄 Iniciando sincronização Supabase...')
    
    // 1. Sincronizar dados LOCAL → SUPABASE
    async function syncLocalToSupabase() {
        try {
            // Funcionários
            const emps = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]')
            if (emps.length > 0) {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/employees`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    },
                    body: JSON.stringify(emps)
                })
                console.log('✅ Funcionários sincronizados')
            }
            
            // Pontos
            const punches = JSON.parse(localStorage.getItem('topservice_punches_v1') || '[]')
            if (punches.length > 0) {
                await fetch(`${SUPABASE_URL}/rest/v1/punches`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    },
                    body: JSON.stringify(punches)
                })
                console.log('✅ Pontos sincronizados')
            }
            
        } catch (e) {
            console.error('❌ Erro ao sincronizar:', e)
        }
    }
    
    // 2. Sincronizar dados SUPABASE → LOCAL
    async function syncSupabaseToLocal() {
        try {
            // Buscar funcionários
            const respEmps = await fetch(
                `${SUPABASE_URL}/rest/v1/employees`,
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            )
            const emps = await respEmps.json()
            if (emps.length > 0) {
                localStorage.setItem('topservice_employees_v1', JSON.stringify(emps))
                console.log('✅ Funcionários atualizados do Supabase')
            }
            
            // Buscar pontos
            const respPunches = await fetch(
                `${SUPABASE_URL}/rest/v1/punches`,
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            )
            const punches = await respPunches.json()
            if (punches.length > 0) {
                localStorage.setItem('topservice_punches_v1', JSON.stringify(punches))
                console.log('✅ Pontos atualizados do Supabase')
            }
            
        } catch (e) {
            console.error('❌ Erro ao sincronizar do Supabase:', e)
        }
    }
    
    // Sincronizar ao carregar
    await syncSupabaseToLocal()
    
    // Sincronizar a cada 1 minuto
    setInterval(() => {
        syncLocalToSupabase()
        syncSupabaseToLocal()
    }, 60000)
}

// Iniciar quando document estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabaseSync)
} else {
    initSupabaseSync()
}
</script>
```

---

## PARTE 5: HOSPEDAR NO NETLIFY

### 5.1 - Preparar Git
```bash
# Inicializar git (se não tiver)
git init

# Adicionar arquivos
git add .

# Commit
git commit -m "Primeiro deploy"

# Criar repositório no GitHub (https://github.com/new)
# Copiar o comando para adicionar remote

git remote add origin https://github.com/USUARIO/top-service.git
git branch -M main
git push -u origin main
```

### 5.2 - Conectar Netlify
1. Vá para https://netlify.com
2. Faça login com sua conta
3. Clique em **Add new site** → **Import an existing project**
4. Escolha **GitHub**
5. Selecione o repositório `top-service`
6. Clique em **Deploy**

### 5.3 - Configurar variáveis de ambiente
1. No dashboard Netlify, vá para **Site settings** → **Build & deploy** → **Environment**
2. Clique em **Edit variables**
3. Adicione:
   - **Key**: `VITE_SUPABASE_URL` | **Value**: sua_url_supabase
   - **Key**: `VITE_SUPABASE_ANON_KEY` | **Value**: sua_chave_supabase

### 5.4 - Deploy automático
Agora, toda vez que você faz `git push`, o Netlify automaticamente redeploy!

---

## PARTE 6: EDITAR DADOS ONLINE

### 6.1 - Acessar painel Supabase
1. Vá para https://supabase.com/dashboard
2. Selecione o projeto `top-service`
3. Vá para **Table Editor**
4. Clique em qualquer tabela para editar dados

### 6.2 - Editar dados
- Clique em uma célula para editar
- Clique em "+" para adicionar novo registro
- Clique na lixeira para deletar

### 6.3 - Sincronizar com seu site
- Os dados são sincronizados a cada minuto
- Para sincronizar imediatamente, recarregue a página

---

## RESUMO - PASSOS RÁPIDOS

**1. GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/top-service
git push -u origin main
```

**2. Supabase**
- Criar projeto
- Copiar URL e chave
- Executar SQL das tabelas

**3. Netlify**
- Conectar GitHub
- Adicionar variáveis de ambiente
- Deploy automático!

**4. Editar dados**
- Vá para Supabase → Table Editor
- Edite os dados
- Recarregue o site para sincronizar

---

## 🎯 RESULTADO FINAL

✅ Site hospedado e acessível via URL Netlify
✅ Dados armazenados no Supabase
✅ Edição de dados online
✅ Sincronização automática
✅ Deploy automático ao fazer git push

---

## ⚠️ IMPORTANTE

1. **Não compartilhe a chave ANON KEY** publicamente
2. **Fazer backup regular** dos dados no Supabase
3. **Testar mudanças** em desenvolvimento antes de fazer push
4. **Monitorar** o uso do Supabase (tem limite gratuito)

