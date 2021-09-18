FROM ubuntu:21.04

ARG NODE_OPTIONS
ARG CORES=1
WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y curl && \
    bash -c 'curl -fsSL https://deb.nodesource.com/setup_14.x | bash -' && \
    apt-get update -y && \
    apt-get install -y imagemagick \
    nodejs \
    libvips-dev \
    build-essential \
    libvips-tools \
    python3-gi \
    gir1.2-vips-8.0 \
    git  \
    gobject-introspection  \
    libjpeg-dev  \
    libpng-dev \
    libexif-dev \
    librsvg2-dev \
    libpoppler-glib-dev \
    libpng-dev \
    libwebp-dev \
    libopenexr-dev \
    libheif-dev \
    libtiff-dev \
    gtk-doc-tools && \
    cd /tmp && \
    git clone git://github.com/jcupitt/libvips.git && \
    cd libvips && \
    ./autogen.sh && \
    make -j $CORES && \
    make install  && \
    cd /app &&  \
    rm -rf /tmp/libvips && \
    apt-get clean -y && \
    rm -rf /var/lib/apt/lists/* && \
    npm cache clean --force

ADD ./package.json /app/package.json
ADD ./package-lock.json /app/package-lock.json

RUN npm ci

ENV NODE_ENV production

ADD . /app

RUN npm run build

EXPOSE 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["npm", "start"]
