# -- Stage 1: Builder ---------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# -- Stage 2: Nginx Production ------------------------------------
FROM nginx:1.27-alpine AS production

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
