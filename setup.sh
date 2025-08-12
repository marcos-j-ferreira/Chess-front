#!/bin/bash

# ===================================================================================
# Script de Deploy Automatizado para Aplicação de Xadrez com Docker
# ===================================================================================
#
# Autor: Seu Assistente Gemini
# Data: 11/08/2025
#
# Este script prepara uma instância Ubuntu (EC2) e faz o deploy da aplicação.
#
# Pré-requisitos:
# 1. Uma instância EC2 com Ubuntu.
# 2. Security Group liberando as portas 22 (SSH), 80 (HTTP) e 443 (HTTPS).
#
# ===================================================================================


# --- CONFIGURAÇÃO ---
# !! IMPORTANTE !! Altere esta linha para a URL SSH ou HTTPS do seu repositório.
GIT_REPO_URL="https://github.com/marcos-j-ferreira/Chess-front.git"

# Nome da pasta que o 'git clone' criará. Geralmente é o nome do repositório.
PROJECT_DIR="xadrez-online"


# --- INÍCIO DA EXECUÇÃO ---

# Garante que o script pare imediatamente se qualquer comando falhar.
set -e

echo "==============================================="
echo " PASSO 1: ATUALIZANDO O SISTEMA DE PACOTES"
echo "==============================================="
sudo apt-get update -y
sudo apt-get upgrade -y

echo "==============================================="
echo " PASSO 2: INSTALANDO DEPENDÊNCIAS ESSENCIAIS"
echo "==============================================="
echo "--- Instalando Git, Docker e Docker Compose... ---"
sudo apt-get install -y git docker.io docker-compose

#echo "--- Habilitando e iniciando o serviço do Docker para que ele sempre inicie com a máquina ---"
#sudo systemctl enable docker
#sudo systemctl start docker

echo "--- (Opcional) Adicionando usuário atual ao grupo 'docker' para evitar usar 'sudo' no futuro ---"
# Nota: Você precisará sair e logar novamente para que esta permissão tenha efeito.
 O '|| true' previne um erro caso o usuário já esteja no grupo.
sudo usermod -aG docker ${USER} || true

echo "==============================================="
echo " PASSO 3: CLONANDO OU ATUALIZANDO O REPOSITÓRIO"
echo "==============================================="

# Verifica se a pasta do projeto já existe
if [ -d "$PROJECT_DIR" ] ; then
  echo "--- O diretório do projeto '$PROJECT_DIR' já existe. Atualizando com 'git pull'... ---"
  cd "$PROJECT_DIR"
  git pull origin main # ou a branch que você usa
else
  echo "--- Clonando o repositório de $GIT_REPO_URL... ---"
  git clone "$GIT_REPO_URL"
  cd "$PROJECT_DIR"
fi

echo "==============================================="
echo " PASSO 4: INICIANDO A APLICAÇÃO COM DOCKER COMPOSE"
echo "==============================================="
echo "--- Construindo as imagens e subindo os contêineres em modo detached... ---"

# Usamos 'sudo' aqui para garantir que o script funcione na primeira execução,
# antes do usuário fazer login novamente para a permissão do grupo Docker ter efeito.
sudo docker-compose up --build -d

echo "==============================================="
echo "          DEPLOYMENT CONCLUÍDO COM SUCESSO!     "
echo "==============================================="
echo ""
echo "Sua aplicação de xadrez deve estar no ar!"
echo "Para verificar os contêineres em execução, use o comando: sudo docker ps"
echo "Para ver os logs da aplicação, navegue até a pasta do projeto e use: sudo docker-compose logs -f"
echo ""