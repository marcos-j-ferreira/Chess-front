# Chess Online - Estudo de Deploy na AWS EC2

## Sobre o Projeto

Este projeto implementa um jogo de xadrez online para dois jogadores com comunicação em tempo real via WebSockets.

O foco não está na complexidade da lógica do xadrez, mas sim em servir como um laboratório prático para estudo de **infraestrutura e deployment na nuvem**, demonstrando o processo de empacotar uma aplicação full-stack com Docker, orquestrar os serviços com Docker Compose e implantá-la em uma instância **AWS EC2** com Nginx como proxy reverso.

## Arquitetura da Aplicação

A aplicação é dividida em dois serviços principais:

* **Front-end:** Servido via Nginx, responsável por entregar os arquivos estáticos (HTML, CSS e JavaScript).
* **Back-end:** Servidor Node.js que gerencia a lógica do jogo e a comunicação em tempo real via WebSockets.

O Nginx atua como ponto de entrada (porta 80), entregando o front-end e encaminhando conexões WebSocket para o back-end.

## Tecnologias Utilizadas

* **Front-end:** HTML5, CSS3, JavaScript.
* **Back-end:** Node.js com `ws` (WebSockets).
* **Servidor Web / Proxy:** Nginx.
* **Conteinerização:** Docker e Docker Compose.
* **Hospedagem:** AWS EC2 (Ubuntu).
* **Automação de Deploy:** Shell Script.

## Executando Localmente

1. **Clonar o repositório:**

   ```bash
   git clone https://github.com/seu-usuario/seu-jogo.git
   cd seu-jogo
   ```

2. **Subir os contêineres com Docker Compose:**

   ```bash
   docker-compose up --build
   ```

3. **Acessar a aplicação:**

   * **Front-end:** `http://localhost`
   * **WebSocket:** Porta `8080` (o front-end se conecta automaticamente)

## Deploy na AWS EC2

O deploy é feito por um script (`deploy.sh`) que instala dependências, clona o repositório e executa a aplicação.

**Pré-requisitos:**

* Instância EC2 com Ubuntu.
* Security Group liberando portas `22` (SSH) e `80` (HTTP).

**Passos básicos:**

1. Conectar via SSH à instância.
2. Clonar o repositório.
3. Dar permissão e executar o script:

   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Estrutura de Arquivos

```
/
├── app/                  # Front-end (HTML, CSS, JS)
├── server/               # Back-end Node.js
├── Dockerfile            # Front-end (Nginx)
├── docker-compose.yml    # Orquestração dos contêineres
├── deploy.sh             # Script de deploy na EC2
└── README.md
```

## Possíveis Melhorias

* Adicionar HTTPS com Let's Encrypt.
* Criar pipeline CI/CD (GitHub Actions).
* Integrar banco de dados (ex: PostgreSQL ou AWS RDS).
* Monitorar métricas e recursos da aplicação.

