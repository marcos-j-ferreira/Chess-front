FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY c-server.js .

RUN npm install ws

EXPOSE 8080

CMD ["node", "c-server.js"]