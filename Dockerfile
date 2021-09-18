FROM ubuntu:21.04

ARG NODE_OPTIONS
WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y curl && \
    bash -c 'curl -fsSL https://deb.nodesource.com/setup_14.x | bash -' && \
    apt-get update -y && \
    apt-get install -y nodejs libvips libvips-dev build-essential

ENV NODE_ENV production

ADD ./package.json /app/package.json
ADD ./package-lock.json /app/package-lock.json

RUN npm ci

ADD . /app

RUN npm run build

EXPOSE 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["npm", "start"]
