# 📖 GUIA PASSO A PASSO - Verificar se Campo Departamento Funciona

## ⏱️ Tempo Estimado: 5 minutos

---

## 🚀 Passo 1: Abrir o Aplicativo

1. Abra seu navegador (Chrome, Firefox, Edge, Safari)
2. Vá para `index.html` do seu projeto
3. O aplicativo deve carregar normalmente

---

## 🎯 Passo 2: Navegar para o Formulário

1. Localize o menu **"Funcionários"** (à esquerda ou no topo)
2. Clique em **"Cadastrar Novo"** (ou "Adicionar Novo")
3. Um formulário deve aparecer na tela

---

## 👀 Passo 3: Procurar pelo Campo Departamento

Procure no formulário que apareceu:
- Um campo com a label **"Departamento"**
- Deve parecer um `<select>` (caixa dropdown)
- Pode estar vazio ou com uma lista de opções

### ✅ Se o campo aparece:
```
Parabéns! Campo encontrado ✅

Próximo passo: Abrir Console
```

### ❌ Se o campo NÃO aparece:
```
Campo não está visível ❌

Próximo passo: Abrir Console para investigar
```

---

## 🔍 Passo 4: Abrir o Console do Navegador

### Windows/Linux:
- Pressione **F12**
- OU: Ctrl + Shift + I
- OU: Clique direito na página → "Inspecionar"

### Mac:
- Pressione **Cmd + Option + I**

### Resultado:
Uma janela preta deve abrir no pé da tela (Developer Tools)

---

## 📋 Passo 5: Procurar pelas Mensagens de Diagnóstico

Na aba **"Console"** (deve ser a padrão), procure por mensagens começando com:

### 🟦 Mensagens Azuis:
```
[NAV] Inicializando página funcionarios-novo
[NAV] Botões encontrados: { submit: true, cancel: true }
[NAV] Novo cadastro - limpando formulário
```

### 🟩 Mensagens Verdes:
```
[EMP] === DIAGNÓSTICO POPULATEPARTMENTSELECT ===
[EMP] ✅ Select encontrado
[EMP] ✅ SUCCESS - Departamentos adicionados ao select: 5 itens
```

### 🟨 Mensagens de Aviso (amarelas):
```
[EMP] ⚠️  AVISO - Nenhum departamento carregado
```

### 🟥 Mensagens de Erro (vermelhas):
```
[EMP] ❌ ERRO CRÍTICO: Select de departamento NÃO ENCONTRADO!
```

---

## 📊 Passo 6: Interpretar os Resultados

### ✅ Cenário 1: Tudo Verde (Sucesso)
```
[NAV] Inicializando página funcionarios-novo
[EMP] ✅ Select encontrado
[EMP] ✅ SUCCESS - Departamentos adicionados ao select: 5 itens
```

**Campo Departamento**: ✅ **Aparece e funciona**
**Ação**: Teste selecionando um departamento e salvando

---

### ⚠️ Cenário 2: Campo Aparece, mas Sem Opções
```
[NAV] Inicializando página funcionarios-novo
[EMP] ✅ Select encontrado
[EMP] ⚠️  AVISO - Nenhum departamento carregado
```

**Problema**: Nenhum departamento foi cadastrado
**Solução**: 
1. Vá para **"Departamentos"**
2. Clique em **"Adicionar Novo"**
3. Cadastre pelo menos um departamento
4. Volte ao formulário de funcionários e recarregue (F5)

---

### ❌ Cenário 3: Select Não Encontrado
```
[NAV] Inicializando página funcionarios-novo
[EMP] ❌ ERRO CRÍTICO: Select de departamento NÃO ENCONTRADO!
[EMP] IDs disponíveis no DOM: [lista de IDs]
```

**Problema**: DOM renderização lenta
**Solução**: Contate suporte com estas informações:
- Seu navegador e versão
- Esta mensagem do console
- O que está em "IDs disponíveis"

---

### 🔴 Cenário 4: Nenhuma Mensagem Aparece
```
(Nada de [NAV] ou [EMP] no console)
```

**Problema**: Scripts não estão carregando
**Solução**:
1. Recarregue a página (F5)
2. Abra Console **antes** de clicar em "Cadastrar Novo"
3. Procure por mensagens de erro em vermelho

---

## 🧪 Passo 7: Teste Funcional (Opcional)

Se o campo aparece, teste se funciona:

1. Clique no select de Departamento
2. Uma lista de opções deve aparecer
3. Selecione um departamento
4. Preencha os outros campos (Nome, Email, etc)
5. Clique em "Salvar" ou "Confirmar"
6. Verifique se dados foram salvos

---

## 📝 Passo 8: Reportar o Resultado

Copie as respostas e compartilhe:

### Pergunta 1: Campo Departamento aparece?
- [ ] Sim, com opções
- [ ] Sim, mas vazio
- [ ] Não aparece

### Pergunta 2: Qual primeira mensagem [NAV] ou [EMP] aparece?
```
Copie a linha aqui:
_________________________________
```

### Pergunta 3: O campo funciona?
- [ ] Sim, consigo selecionar
- [ ] Não, está disabled
- [ ] Não sei

---

## 🆘 Se Não Souber Fazer

### Teste Automático (Mais Fácil)
1. Abra o arquivo `DIAGNOSTICO_COMPLETO.html`
2. Clique nos botões
3. Veja os resultados coloridos

---

## 🎓 Dicas de Navegação

### Para Limpar o Console:
```javascript
Clique com botão direito no console
Selecione "Clear Console"
OU execute: console.clear()
```

### Para Ver Apenas Mensagens do App:
```javascript
No filtro do Console, escreva: [EMP]
Isso mostra apenas mensagens relacionadas
```

### Para Copiar Mensagens:
```
1. Selecione o texto no console
2. Ctrl+C para copiar
3. Ctrl+V em documento/email
```

---

## ✅ Checklist Final

- [ ] Abri o arquivo index.html
- [ ] Cliquei em "Funcionários" → "Cadastrar Novo"
- [ ] Abri o Console (F12)
- [ ] Vi mensagens com [NAV] ou [EMP]
- [ ] Identifiquei o cenário (1, 2, 3 ou 4)
- [ ] Reportei o resultado

**Parabéns! Você completou o teste!** 🎉

---

## 📞 Problemas?

Se encontrar problemas durante o teste:

1. **Verifique se é problema de navegador**:
   - Tente em Chrome, Firefox ou Edge
   - Limpe cache (Ctrl+Shift+Delete)

2. **Verifique dados**:
   - Vá para "Departamentos" e cadastre um
   - Volte e recarregue (F5)

3. **Reporte com detalhes**:
   - Seu navegador
   - Sistema operacional
   - Mensagens do console completas
   - Screenshots (se possível)

---

**Data da Correção**: 2024
**Versão**: 1.0
**Status**: ✅ Pronto para teste
