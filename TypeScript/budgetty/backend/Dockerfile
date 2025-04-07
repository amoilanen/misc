FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Ensure the build directory exists and is clean
RUN rm -rf dist && npm run build
# Debug: List contents of dist directory
RUN ls -la dist/

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# Copy the entire dist directory from builder
COPY --from=builder /app/dist ./dist
# Debug: List contents of dist directory in final image
RUN ls -la dist/

# Copy the source files needed for migrations
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create a startup script
RUN printf '#!/bin/sh\n\
echo "Running database migrations..."\n\
npm run migration:run\n\
if [ $? -ne 0 ]; then\n\
  echo "Migration failed!"\n\
  exit 1\n\
fi\n\
\n\
echo "Starting application..."\n\
node dist/main.js\n\
' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3001

# Use the startup script
CMD ["/app/start.sh"] 