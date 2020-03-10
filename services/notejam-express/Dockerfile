FROM nodesource/node:6.7

RUN node --version && npm --version

COPY . /app

WORKDIR /app

RUN rm -rf node_modules

# 25MB. Should be ok without caching.
RUN npm install
RUN npm test

ARG environment
ENV ENVIRONMENT=$environment
ARG dbuser
ENV DATABASE_USERNAME=$dbuser
ARG dbpass
ENV DATABASE_PASSWORD=$dbpass
ARG dbendpoint
ENV DATABASE_ENDPOINT=$dbendpoint
ARG dbschema
ENV DATABASE_SCHEMA=$dbschema

RUN node db.js

EXPOSE 3000

CMD npm start
