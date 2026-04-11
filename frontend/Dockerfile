# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

# VITE_API_BASE_URL is baked in at build time
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npx vite build

# Stage 2: serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
