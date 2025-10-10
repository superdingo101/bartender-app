FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Reinstall prisma *inside* the container to ensure correct binary for musl + OpenSSL 3
RUN npm install prisma@latest @prisma/client@latest --force
RUN npx prisma generate

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Start command (overridden in docker-compose for dev)
CMD ["npm", "start"]