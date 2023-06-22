FROM node:20-alpine
WORKDIR /var/www/5scontrol
COPY package.json .
RUN npm i
COPY . .
ENTRYPOINT ["node", "algorithm.js"]