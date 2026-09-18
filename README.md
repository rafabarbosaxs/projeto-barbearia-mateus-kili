# 💈 Barbearia Mateus Kili

Sistema web desenvolvido para a **Barbearia Mateus Kili**, com o objetivo de facilitar o processo de agendamento e melhorar a organização da agenda do estabelecimento.

O projeto é composto por uma interface para clientes, um painel administrativo e uma API responsável pelo processamento dos dados e comunicação com o banco de dados.

---

## 📌 Sobre o Projeto

O sistema foi desenvolvido para modernizar o processo de agendamento da barbearia, permitindo que os clientes realizem solicitações de forma prática através de uma interface web.

A aplicação também conta com um painel administrativo para auxiliar no gerenciamento dos agendamentos e uma API responsável pelas regras de negócio e comunicação com o banco de dados.

---

## ✨ Funcionalidades

### 👤 Área do Cliente

* Interface web para realização de agendamentos
* Consulta de disponibilidade
* Seleção de data e horário
* Confirmação do agendamento
* Integração com WhatsApp
* Interface responsiva para dispositivos móveis

### 🔐 Área Administrativa

* Login administrativo
* Acesso ao painel de gerenciamento
* Visualização dos agendamentos
* Gerenciamento da agenda
* Controle das informações do sistema

### ⚙️ API

* API REST
* Gerenciamento de agendamentos
* Controle de disponibilidade
* Validação de conflitos de horários
* Autenticação administrativa
* Integração com banco de dados
* Controle de horários bloqueados

---

## 🛠️ Tecnologias Utilizadas

### Front-end

* HTML5
* CSS3
* JavaScript

### Back-end

* Node.js
* TypeScript
* Express
* Prisma ORM

### Banco de Dados

* PostgreSQL

### Ferramentas

* Docker
* Git
* GitHub
* npm
* Vercel

---

## 📂 Estrutura do Projeto

```text
Projeto Barbearia/
│
├── README.md
│
├── barbearia-mateus-kili-api/
│   │
│   ├── .gitignore
│   │
│   └── barbearia-api/
│       ├── prisma/
│       │   ├── migrations/
│       │   └── schema.prisma
│       │
│       ├── src/
│       │   ├── modules/
│       │   │   ├── appointments/
│       │   │   ├── availability/
│       │   │   ├── auth/
│       │   │   ├── services/
│       │   │   └── admin/
│       │   │
│       │   └── server.ts
│       │
│       ├── .env
│       ├── .env.example
│       ├── docker-compose.yml
│       ├── package.json
│       ├── package-lock.json
│       ├── tsconfig.json
│       └── README.md
│
├── frontend/
│   ├── admin.html/
│   │   └── mateus-kili-admin.html
│   │
│   └── index.html/
│       └── mateus-kili-agendamento.html
│
└── package-lock.json
```

---

## 🚀 Instalação

### Pré-requisitos

Para executar o projeto localmente, é necessário ter:

* Node.js
* npm
* Docker
* Git
* PostgreSQL, caso não utilize o banco através do Docker

### 1. Clonar o projeto

```bash
git clone git@github.com:rafabarbosaxs/projeto-barbearia-mateus-kili.git
```

Entre na pasta:

```bash
cd projeto-barbearia-mateus-kili
```

### 2. Instalar as dependências

Entre na pasta da API:

```bash
cd barbearia-mateus-kili-api/barbearia-api
```

Instale as dependências:

```bash
npm install
```

### 3. Configurar o ambiente

Crie o arquivo `.env` na pasta da API e configure as variáveis necessárias para o funcionamento do sistema.

As informações sensíveis, como senhas, chaves e dados de conexão, devem permanecer no `.env`.

O arquivo `.env` não deve ser enviado para o GitHub.

### 4. Executar o banco de dados

Caso esteja utilizando Docker:

```bash
docker compose up -d
```

Execute as migrações:

```bash
npx prisma migrate deploy
```

### 5. Executar a API

```bash
npm run dev
```

A API será executada localmente na porta configurada no projeto.

---

## 🔄 Funcionamento do Sistema

O funcionamento geral da aplicação segue o fluxo:

```text
Cliente
   ↓
Site de Agendamento
   ↓
Consulta de Disponibilidade
   ↓
Escolha do Horário
   ↓
Criação do Agendamento
   ↓
Confirmação pelo WhatsApp
```

O gerenciamento administrativo funciona através de:

```text
Administrador
   ↓
Login
   ↓
Painel Administrativo
   ↓
Gerenciamento dos Agendamentos
```

---

## 🗄️ Banco de Dados

O projeto utiliza **PostgreSQL** como banco de dados e **Prisma ORM** para gerenciamento e comunicação com a aplicação.

Principais modelos utilizados:

* `Service`
* `Appointment`
* `BusinessHours`
* `BlockedSlot`

O banco possui regras para auxiliar no controle dos agendamentos e evitar conflitos de horários.

---

## 🔐 Segurança

O sistema utiliza diferentes mecanismos para proteção das informações:

* Variáveis sensíveis armazenadas no `.env`
* Senhas administrativas protegidas por hash
* Autenticação utilizando JWT
* Controle de acesso ao painel administrativo
* Validação dos agendamentos
* Controle de conflitos de horários
* `.env` protegido pelo `.gitignore`

---

## 🧪 Testes

Durante o desenvolvimento foram realizados testes para verificar o funcionamento das principais funcionalidades do sistema, incluindo:

* Comunicação entre front-end e API
* Consulta de disponibilidade
* Criação de agendamentos
* Validação de conflitos
* Login administrativo
* Funcionamento do painel administrativo
* Comunicação com o banco de dados

---

## 🌐 Deploy

O projeto foi estruturado para possibilitar a publicação da aplicação em serviços de hospedagem como a **Vercel**.

As variáveis de ambiente necessárias para o funcionamento da API devem ser configuradas diretamente no ambiente de hospedagem.

Informações sensíveis não devem ser armazenadas no código-fonte ou no repositório.

---

## 📌 Status do Projeto

**Em desenvolvimento e implantação.**

O projeto possui a estrutura de front-end, back-end, API, banco de dados e painel administrativo.

---

## 👨‍💻 Autor

**Rafaela Barbosa**

Projeto desenvolvido para a **Barbearia Mateus Kili**, utilizando tecnologias de desenvolvimento web, APIs, banco de dados e autenticação.

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos e de apresentação.
