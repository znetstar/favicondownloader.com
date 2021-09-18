FROM ubuntu:21.04

ARG NODE_OPTIONS
WORKDIR /app

RUN bash -c 'curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -' && \
    apt-get update -y && \
    apt-get install -y nodejs libvips libvips-dev

ENV NODE_ENV production

RUN npm ci && \
    npm run build

EXPOSE 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["npm", "start"]
