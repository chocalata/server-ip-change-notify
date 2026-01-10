FROM --platform=linux/arm64/v8 node:22
RUN apt update && apt -y upgrade
COPY debian-dependencies-chrome-whatsappweb.txt /debian-dependencies-chrome-whatsappweb.txt

# Debug connectivity
#RUN apt install -y curl && curl -I http://deb.debian.org/debian/

RUN until xargs -a /debian-dependencies-chrome-whatsappweb.txt apt install -y --fix-missing; do \
    echo "Retrying apt install..."; \
    sleep 2; \
    done

## FOR PUPPETEER TO WORK ON ARM64
RUN until apt install -y chromium --fix-missing; do \
    echo "Retrying apt install..."; \
    sleep 2; \
    done

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY src/ /usr/src/app/
RUN npm install --production

CMD [ "npm", "run", "start"]