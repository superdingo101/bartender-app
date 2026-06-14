FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Copy package files and install locked dependencies
COPY package*.json ./
RUN npm ci

# Generate Prisma client for the container platform
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Start command (overridden in docker-compose for dev)
CMD ["npm", "start"]
