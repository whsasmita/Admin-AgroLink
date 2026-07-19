# --- Stage 1: Build (Production) ---
FROM node:24-alpine AS build
WORKDIR /app

# Lebih cepat: hanya copy file dependency dulu untuk cache layer
COPY package*.json ./
RUN npm ci

# Copy source & build
COPY . .
# Jika pakai Vite, kamu bisa inject env saat build:
# ARG VITE_API_URL
# ENV VITE_API_URL=$VITE_API_URL
RUN npm run build   # Vite => output /app/dist

# --- Stage 2: Serve static (tanpa Nginx) ---
FROM node:24-alpine
WORKDIR /srv

# Web server statis simpel
RUN npm i -g serve

# Salin hasil build
COPY --from=build /app/dist ./app

# Kesehatan & Port
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:3000 || exit 1

# -s = SPA fallback ke index.html, -l 3000 = listen di 3000
CMD ["serve", "-s", "app", "-l", "3000"]
