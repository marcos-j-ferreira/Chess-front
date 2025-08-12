#!/bin/bash

# Fail fast (qualquer erro encerra o script)
set -e

# Caminho temporário ou pasta local do projeto
PROJ_DIR="ubuntu/chess-front"

echo "[INFO] Atualizando ou clonando repositório..."
if [ -d "$PROJ_DIR" ]; then
    cd "$PROJ_DIR"
    git reset --hard
    git pull origin main
else
    git clone https://github.com/marcos-j-ferreira/Chess-front.git "$PROJ_DIR"
    cd "$PROJ_DIR"
fi

echo "[INFO] Construindo e subindo containers..."
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d

echo "[INFO] Aplicação reconstruída e rodando!"
