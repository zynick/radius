FROM node:7-alpine

RUN apk add --no-cache make gcc g++ python

WORKDIR /app
ADD . .
RUN rm -rf node_modules/
RUN npm install

RUN npm uninstall -g npm
RUN apk del make gcc g++ python
RUN rm -rf /var/cache/apk/*

EXPOSE 3001 1812 1813

CMD [ "node", "webServer", "&&", "node", "authServer", "&&", "node", "acctServer" ]
