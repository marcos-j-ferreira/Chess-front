# Etapa 1: build da aplicação
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: servir com Nginx
FROM nginx:1.27-alpine-slim
COPY --from=build /app/dist /usr/share/nginx/html
# Não precisa expor a porta 80 aqui, pois o proxy fará isso.