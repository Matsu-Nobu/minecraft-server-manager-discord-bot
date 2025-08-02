FROM node:18-slim

# Install required dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript and ts-node globally
RUN npm install -g typescript ts-node

# Create app directory
WORKDIR /app

# Create node_modules directory and set permissions
RUN mkdir -p node_modules && chown -R node:node .

# Switch to non-root user
USER node

# Copy package files
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm install
RUN npm install --save ssh2 @types/ssh2

# Copy source code
COPY --chown=node:node . .

# Start the bot
CMD ["npm", "run", "dev"]
