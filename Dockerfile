# Use the official Node.js image as the base image
FROM node:16-slim




# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install app dependencies
RUN yarn install


# Install required dependencies for Puppeteer and Chrome
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*


# Copy all the application files to the container
COPY . .

# Start the application
CMD ["node", "index.js"]