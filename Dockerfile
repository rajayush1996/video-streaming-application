# Use an official Node.js runtime as a parent image
FROM node:lts-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json) to take advantage of cached Docker layers
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source inside Docker image
COPY . .

# Expose port 3000 (or any other port your app uses)
EXPOSE 3000

# Define the command to run your app using the 'start-all' script which includes both the app and swagger
CMD ["npm", "run", "start-all"]
