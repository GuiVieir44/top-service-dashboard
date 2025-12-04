# 🚀 Guia Passo a Passo: Netlify + Supabase

## ✅ RESUMO RÁPIDO (5 passos)

### 1️⃣ Criar conta Supabase
- Acesse https://supabase.com
- Crie novo projeto
- Guarde a URL e chave anon

### 2️⃣ Criar repositório GitHub
- Acesse https://github.com/new
- Nome: `top-service-dashboard`
- Faça push do seu código

### 3️⃣ Conectar ao Netlify
- Acesse https://app.netlify.com
- "New site from Git"
- Selecione repositório GitHub

### 4️⃣ Configurar variáveis
- Netlify → Environment
- `SUPABASE_URL` e `SUPABASE_ANON_KEY`

### 5️⃣ Deploy automático
- Netlify faz deploy sozinho ao fazer push
- Site fica online em minutos

---

## 🔧 CONFIGURAÇÃO TÉCNICA DETALHADA

### A. Git & GitHub (Local)

```bash
# Abrir terminal na pasta do projeto
cd "caminho/da/pasta"

# Inicializar git
git init

# Adicionar arquivos
git add .

# Commit inicial
git commit -m "Projeto inicial"

# Conectar com GitHub (substitua seu-usuario e repo)
git remote add origin https://github.com/seu-usuario/top-service-dashboard.git
git branch -M main
git push -u origin main
```

### B. Supabase (Online)

1. Criar projeto:
   - https://supabase.com → "New Project"
   - Nome: top-service
   - Region: São Paulo
   - Guardar senha!

2. Pegar credenciais:
   - Projeto → Settings → API
   - Copiar: Project URL e anon key

3. Criar tabelas (SQL Editor):

```sql
-- Employees
CREATE TABLE employees (
  id BIGINT PRIMARY KEY,
  nome TEXT NOT NULL,
  matricula TEXT UNIQUE,
  email TEXT,
  departamento TEXT,
  status TEXT DEFAULT 'Ativo',
  created_at TIMESTAMP DEFAULT now()
);

-- Punches
CREATE TABLE punches (
  id BIGINT PRIMARY KEY,
  employeeId BIGINT REFERENCES employees(id),
  type TEXT,
  timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Absences
CREATE TABLE absences (
  id BIGINT PRIMARY KEY,
  employeeId BIGINT REFERENCES employees(id),
  date TEXT,
  type TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

### C. Código (JavaScript)

Crie `scripts/supabase-integration.js`:

```javascript
// Inicializar Supabase
const SUPABASE_URL = 'https://seu-url.supabase.co';
const SUPABASE_KEY = 'sua-chave-anon';

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Sincronizar para Supabase
async function saveToSupabase(table, data) {
    try {
        const { error } = await db
            .from(table)
            .upsert(data, { onConflict: 'id' });
        
        if (error) throw error;
        console.log('✅ Salvo em Supabase');
        return true;
    } catch (e) {
        console.error('❌ Erro:', e.message);
        return false;
    }
}

// Carregar do Supabase
async function loadFromSupabase(table) {
    try {
        const { data, error } = await db.from(table).select('*');
        
        if (error) throw error;
        console.log('✅ Carregado do Supabase');
        return data;
    } catch (e) {
        console.error('❌ Erro:', e.message);
        return null;
    }
}

// Sincronizar a cada 5 minutos
setInterval(async () => {
    const employees = JSON.parse(localStorage.getItem('topservice_employees_v1') || '[]');
    for (const emp of employees) {
        await saveToSupabase('employees', emp);
    }
}, 5 * 60 * 1000);
```

Adicione no HTML antes do `</head>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="scripts/supabase-integration.js"></script>
```

### D. Netlify (Deploy)

1. Conectar GitHub:
   - https://app.netlify.com
   - "New site from Git"
   - Autorizar GitHub
   - Selecionar repositório

2. Configurar build (deixe padrão):
   - Build command: (deixe vazio)
   - Publish directory: . (raiz)

3. Adicionar variáveis:
   - Site settings → Environment
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

4. Deploy:
   - Clique em "Deploy site"
   - Aguarde (3-5 minutos)
   - URL fica pronta!

---

## 📱 USAR O SITE

**Local:**
- http://localhost (ou arquivo local)

**Online:**
- https://seu-site.netlify.app
- Acesse de qualquer lugar
- Edite dados pelo Supabase em tempo real

---

## 🎯 FLUXO DE TRABALHO

```
1. Você edita localmente
   ↓
2. Faz push para GitHub (git push)
   ↓
3. Netlify detecta mudança
   ↓
4. Faz deploy automático
   ↓
5. Site fica online em minutos
   ↓
6. Dados sincronizam com Supabase a cada 5min
```

---

## ✨ VANTAGENS

✅ Site online 24/7
✅ Dados sincronizados automaticamente
✅ Acesso de qualquer lugar
✅ Edição em tempo real pelo Supabase
✅ Backup automático
✅ Grátis para pequenos volumes
✅ Fácil colaboração em equipe

---

## 🚨 IMPORTANTE

- ⚠️ Nunca compartilhe `SUPABASE_ANON_KEY` em públicos
- 🔐 Use variáveis de ambiente no Netlify
- 📱 Teste em celular antes de usar
- 💾 Faça backup dos dados regularmente

---

## PRÓXIMAS ETAPAS

1. Crie conta Supabase
2. Configure as credenciais
3. Crie o arquivo de integração
4. Faça push para GitHub
5. Deploy no Netlify
6. Teste sincronização
7. Compartilhe link com sua equipe!
