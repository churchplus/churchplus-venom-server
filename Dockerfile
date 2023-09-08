# Use the official Node.js image as the base image
FROM node:16

# # Set the working directory inside the container
# WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install app dependencies
RUN yarn install

# Copy all the application files to the container
COPY . .

# Start the application
CMD ["node", "index.js"]