# Dockerfile para o Front-end do Jogo de Xadrez

FROM nginx:1.27-alpine-slim

COPY ./app /usr/share/nginx/html

EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]