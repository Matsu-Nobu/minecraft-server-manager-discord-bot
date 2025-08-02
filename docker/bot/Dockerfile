FROM node:18-slim

WORKDIR /app

# Install git for potential npm packages that require it
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

# Copy package files
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY --chown=node:node . .

# Run the bot
CMD ["npm", "run", "dev"]
