# Sistema de Ponto - Node.js + SQLite

Sistema simples de **marcação de ponto** desenvolvido com **Node.js**, **Express**, **SQLite** e tecnologias front-end padrão (HTML/CSS/Bootstrap/JavaScript).  

Permite que usuários façam login, registrem pontos de entrada/saída e consultem o histórico de horas trabalhadas.

---

## Funcionalidades

- Login seguro com sessão
- Bater ponto (entrada/saída)
- Histórico de pontos registrados
- Cálculo do total de horas e minutos trabalhados
- Alterar nome de usuário e senha
- Logout
- Proteção das páginas HTML, só acessível após login
- Favicon incluído

---

## Estrutura do projeto


---

## Tecnologias e dependências utilizadas

### Backend

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/) → Servidor HTTP e rotas
- [express-session](https://www.npmjs.com/package/express-session) → Gerenciamento de sessões
- [body-parser](https://www.npmjs.com/package/body-parser) → Processamento de formulários e JSON
- [sqlite3](https://www.npmjs.com/package/sqlite3) → Banco de dados SQLite
- [path](https://nodejs.org/api/path.html) → Gerenciamento de caminhos de arquivos

### Frontend

- HTML5
- CSS3
- [Bootstrap 5](https://getbootstrap.com/) → Estilização e componentes prontos
- JavaScript puro (fetch, DOM)

---

## Instalação e execução

1. Clone o repositório:

```bash
git clone https://github.com/MiguelCoder/Sistema-de-Ponto.git
cd Sistema-de-Ponto
```
2 Instale o NPM:
Antes de tudo instalar o npm:
```bash
npm install
```
E execute: 
```bash
node server.js
```
Usuário padrão: User
Senha: 123
