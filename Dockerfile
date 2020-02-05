#TBD: use a FROM of our own image, already logged in to our private npm-repository
FROM node:lts-alpine AS nm
WORKDIR /app
COPY package*.json /app/
RUN npm install --production

FROM node:lts-alpine
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=nm /app/package*.json   /app/
COPY --from=nm /app/node_modules    /app/node_modules/
COPY ./*.md                         /app/
COPY ./bin                          /app/bin/
COPY ./config/default.* ./config/custom*.* /app/config/
COPY ./lib                          /app/lib/

CMD ["node", "bin/cli"]
