FROM node:lts-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "src/bin/www"]

# For building Docker image
# docker build -t astro-bharat .

# TO start docker container
# docker run -p 3000:3000 astro-bharat

# To stop docker container
# docker stop astro-bharat

# To remove Docker image
# docker rmi astro-bharat