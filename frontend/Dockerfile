# ==== Build stage ====
FROM node:18-alpine AS build

WORKDIR /app
ARG VITE_BACKEND_PORT
ENV VITE_BACKEND_PORT=$VITE_BACKEND_PORT
COPY package.json package-lock.json ./
RUN npm ci

COPY . .


RUN npm run build

# ==== Production stage ====
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

