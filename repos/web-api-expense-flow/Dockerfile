# ==============================================================================
# server
# ==============================================================================
# using alpine node as base image
FROM cliftonlarsonallen.azurecr.io/library/node:20-alpine as base

# set node environment defaulting to production
ARG NODE_ENV=development
ENV NODE_ENV $NODE_ENV

# set log level defaulting to info
ARG LOG_LEVEL=info
ENV LOG_LEVEL $LOG_LEVEL

ARG NPM_TOKEN
ENV NPM_TOKEN $NPM_TOKEN

# Install essential dependencies only
RUN apk add --no-cache \
    git \
    curl \
    bash

# install dependencies as the "node" unprivileged account for security
RUN npm update -g npm
RUN mkdir /opt/cla \
  && chown node:node /opt/cla
WORKDIR /opt/cla
USER node
COPY --chown=node:node package.json .npmrc ./
RUN npm install \
  && npm cache clean --force
ENV PATH /opt/cla/node_modules/.bin:$PATH

# copy files while setting ownership
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./test ./test

# ==============================================================================
# development
# ==============================================================================
FROM base as development

# Create Azure config directory and setup scripts for development only
RUN mkdir -p /home/node/.azure && \
    chown -R node:node /home/node/.azure

# Copy and setup Azure scripts for development
COPY --chown=node:node scripts/ ./scripts/
RUN chmod +x ./scripts/azure-auth.sh

USER node

CMD [ "./scripts/azure-auth.sh", "npm", "run", "dev" ]
#CMD exec /bin/sh -c "trap : TERM INT; (while true; do sleep 1000; done) & wait"

# ==============================================================================
# builder
# ==============================================================================
FROM base as builder

# build library for production
ENV NODE_ENV production
RUN [ "npm", "run", "build" ]

# ==============================================================================
# production
# ==============================================================================
FROM base as production

# Copy built application from builder stage
COPY --from=builder --chown=node:node /opt/cla/dist ./dist

# Run the production application
CMD [ "npm", "start" ]