FROM node:20-alpine AS plugin-builder

WORKDIR /build/n8n-nodes-maltiverse

COPY package.json tsconfig.json gulpfile.js ./
COPY credentials ./credentials
COPY nodes ./nodes

RUN npm install
RUN npm run build


FROM docker.n8n.io/n8nio/n8n:latest

ENV N8N_CUSTOM_EXTENSIONS=/opt/n8n/custom

USER root

RUN mkdir -p /opt/n8n/custom/n8n-nodes-maltiverse

COPY --from=plugin-builder /build/n8n-nodes-maltiverse/package.json /opt/n8n/custom/n8n-nodes-maltiverse/package.json
COPY --from=plugin-builder /build/n8n-nodes-maltiverse/dist /opt/n8n/custom/n8n-nodes-maltiverse/dist

RUN chown -R node:node /opt/n8n/custom

USER node
