FROM node:10.15.1-jessie-slim
RUN apt-get update && apt-get install -y git python gcc g++ make
WORKDIR /srv/eos21
COPY . .
RUN npm i
CMD ['/usr/local/bin/node','eos21.js']
