# Use the official Node.js image as the base image
FROM node:16

# # Set the working directory inside the container
# WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install app dependencies
RUN yarn install

# Install required dependencies for Puppeteer and Chrome
# RUN apt-get update && apt-get install -y wget gnupg
# RUN apt-get update && apt-get install -y gconf-service libgbm-dev libasound2 libatk1.0-0 libc6 libcairo2 \
#     libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
#     libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
#     libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
#     libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget unzip

# # Install 64 bit version of Chrome package
# RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
# RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -

# # install Chrome from the package
# RUN dpkg -i google-chrome-stable_current_amd64.deb

# Add Chrome repo to system source
# RUN apt-repository "deb http://dl.google.com/linux/chrome/deb/ stable main"
# RUN echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list

# Install Chrome
# RUN apt-get update && apt-get install -y google-chrome-stable

# # If any errors, do this
# RUN apt-get install -f

# Copy all the application files to the container
COPY . .

# Start the application
CMD ["node", "index.js"]

# # Use the official Node.js image as the base image
# FROM node:16

# # Set the working directory inside the container
# WORKDIR /app

# # Copy the package.json and package-lock.json files to the container
# COPY package*.json ./

# # Install app dependencies using Yarn (no need to install Yarn separately)
# RUN yarn install

# # Install required dependencies for Puppeteer and Chrome
# # RUN apt-get update && apt-get install -y wget && \
# #     wget --version && \
# #     wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
# #     dpkg -i google-chrome-stable_current_amd64.deb && \
# #     apt-get install -f && \
# #     google-chrome
#     # apt-get clean \
#     # && rm -rf /var/lib/apt/lists/*

# # Copy all the application files to the container
# COPY . .

# # Start the application
# CMD ["node", "index.js"]
