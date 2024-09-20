FROM node:lts-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "src/bin/www"]

# For building Docker image
# docker build -t starzopp .

# TO start docker container
# docker run -p 3000:3000 starzopp

# To stop docker container
# docker stop starzopp

# To remove Docker image
# docker rmi starzopp