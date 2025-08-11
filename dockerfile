
FROM node:20

WORKDIR /usr/src/app

# Copiar a pasta do front inteira
COPY app ./app

# Copiar somente o servidor WebSocket
COPY server/c-server.js ./c-server.js

# Instalar dependências necessárias
RUN npm install http-server concurrently

# Expor portas:
EXPOSE 3000 8080

# Usar formato shell para rodar os dois comandos
CMD npx concurrently node c-server.js npx http-server app -p 3000

