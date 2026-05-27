# ==============================================================================
# base
# ==============================================================================
# using node as base image
FROM cliftonlarsonallen.azurecr.io/library/node:20-alpine as base

# set node environment to development
ARG NODE_ENV=development
ENV NODE_ENV $NODE_ENV

EXPOSE 3000

ARG NPM_TOKEN
ENV NPM_TOKEN $NPM_TOKEN

# Install system dependencies for Playwright (as root)
USER root
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Create writable directories for test reports
RUN mkdir -p /opt/cla/test-reports /opt/cla/coverage \
    && chown -R node:node /opt/cla

# install dependencies as the "node" unprivileged account for security
RUN npm update -g npm
WORKDIR /opt/cla
USER node

COPY --chown=node:node package.json .npmrc ./

RUN npm config set legacy-peer-deps true
RUN npm install \
  && npm cache clean --force

# Set Playwright to use system chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PATH /opt/cla/node_modules/.bin:$PATH

# copy files while setting ownership
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node tsconfig.app.json ./
COPY --chown=node:node tsconfig.node.json ./
COPY --chown=node:node vite.config.ts ./
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./test ./test
COPY --chown=node:node ./.storybook ./.storybook
COPY --chown=node:node ./public ./public
COPY --chown=node:node ./index.html ./
COPY --chown=node:node ./setupTests.ts ./

# start development server
CMD [ "npm", "run", "dev" ]

# ==============================================================================
# builder
# ==============================================================================
FROM base as builder

# build library for production
ENV NODE_ENV production
RUN [ "npm", "run", "build" ]

# ==============================================================================
# server
# ==============================================================================
# using nginx as a content server
FROM cliftonlarsonallen.azurecr.io/base-dynatrace-oneagent:latest

# copy static files from builder
COPY --from=builder /opt/cla/dist /usr/share/nginx/html

# update nginx configuration to support SPA
RUN sed -i \
  's/index  index.html index.htm/try_files $uri $uri\/ $uri.html \/index.html/'\
  /etc/nginx/conf.d/default.conf

# no CMD override, default from nginx is sufficient