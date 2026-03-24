FROM node:22-alpine
WORKDIR /app
COPY server-http.js .
COPY package.json .
EXPOSE 3000
CMD ["node", "server-http.js"]
