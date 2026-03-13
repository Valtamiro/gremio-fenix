# Grêmio Fênix — Painel Administrativo

Painel administrativo interno do **Grêmio Estudantil Fênix**. Acesso restrito aos integrantes do grêmio.

---

## Como hospedar no GitHub Pages

### Passo 1 — Criar repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login.
2. Clique em **"New repository"**.
3. Defina o nome (ex: `gremio-fenix`).
4. Marque como **Private** (repositório privado).
5. Clique em **"Create repository"**.

### Passo 2 — Enviar os arquivos

Faça o upload de todos os arquivos desta pasta para o repositório:
- `index.html`
- `style.css`
- `app.js`
- `fenix_logo.png`
- `fenix_watermark.png`
- `.nojekyll`

### Passo 3 — Ativar o GitHub Pages

1. No repositório, vá em **Settings > Pages**.
2. Em **"Source"**, selecione **"Deploy from a branch"**.
3. Escolha a branch `main` e a pasta `/ (root)`.
4. Clique em **Save**.
5. Aguarde alguns minutos e o site estará disponível em:
   `https://seu-usuario.github.io/gremio-fenix/`

### Passo 4 — Compartilhar o link

Compartilhe o link apenas com os integrantes do grêmio via grupo privado (WhatsApp, Discord, etc.).

> **Nota:** O site possui a meta tag `noindex`, portanto **não aparecerá em pesquisas do Google**.

---

## Funcionalidades

| Seção | Funcionalidade |
|---|---|
| **Dashboard** | Visão geral: saldo, movimentações, membros, eventos |
| **Financeiro** | Registro de entradas e gastos, gráfico automático (Chart.js) |
| **Membros** | Cadastro e listagem de integrantes com avatar |
| **Agenda** | Registro de eventos com badge de data |
| **Sugestões** | Canal de sugestões dos estudantes |
| **Decisões** | Publicação oficial de decisões com data automática |
| **Backup** | Exportar/importar dados em JSON, limpar dados |

---

## Tecnologias

- **HTML5 + CSS3 + JavaScript** (puro, sem frameworks)
- **Chart.js** para gráficos financeiros
- **LocalStorage** para persistência de dados (funciona no GitHub Pages)
- **Google Fonts** (Inter + Cinzel)

---

## Identidade Visual

| Cor | Código |
|---|---|
| Preto Profundo | `#0A0A0A` |
| Laranja Fogo | `#FF6A00` |
| Laranja Intenso | `#FF8C00` |
| Dourado | `#FFD166` |
| Vermelho Fogo | `#C62828` |

---

*Grêmio Fênix — Painel Interno — Acesso Restrito*
