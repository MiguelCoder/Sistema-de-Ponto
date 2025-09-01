# Sistema de Ponto - Dashboard e Administração

Um sistema de ponto de funcionários com login, dashboard, histórico de horas e painel administrativo. Desenvolvido com **Node.js**, **Express**, **SQLite** e **Bootstrap 5**, totalmente responsivo e com tema escuro.

---

## Funcionalidades

### Usuário
- Login e logout seguro com sessão.
- Bater ponto rapidamente.
- Visualizar dashboard com:
  - Horas totais trabalhadas.
  - Horas do mês atual.
  - Horas do dia.
  - Gráficos de horas por dia e por mês.
- Alterar usuário e senha.
- Visualizar histórico completo de pontos.

### Administrador
- Acesso a painel administrativo (`admin.html`).
- Criar novos usuários (com senha e role).
- Atualizar usuários existentes (nome, senha e role).
- Deletar usuários.
- Visualizar lista completa de usuários.
- Atualizar ou deletar horários de ponto de qualquer usuário.
- Layout responsivo e elegante com suporte a mobile.

---

## Tecnologias Utilizadas

- **Backend:** Node.js, Express, SQLite
- **Frontend:** HTML, CSS, Bootstrap 5, JavaScript, Chart.js
- **Sessões:** express-session
- **Banco de dados:** SQLite (`database.sqlite`)

---

## Estrutura de Pastas

ponto-system/
│
├─ public/
│ ├─ ponto.html
│ ├─ historico.html
│ ├─ alterar.html
│ ├─ admin.html
│ └─ favicon.png
│
├─ server.js
└─ database.sqlite

---

## Pré-requisitos

- Node.js (v18 ou superior)
- npm
- Navegador moderno (Chrome, Firefox, Edge, etc.)

---

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/SeuUsuario/ponto-system.git
cd ponto-system
---
```

## Dependências
```bash
npm install express sqlite3 body-parser express-session
