FROM node:18-slim

WORKDIR /app

# Install dependencies for development
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install global dependencies
RUN npm install -g typescript ts-node

# Create node_modules directory and set permissions
RUN mkdir -p node_modules && chown -R node:node .

# Switch to non-root user
USER node

# Note: We don't copy or install dependencies here
# They will be mounted and installed via docker-compose
