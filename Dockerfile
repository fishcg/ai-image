FROM node:24.10

WORKDIR /home/www/ai-image

COPY package.json package-lock.json* pnpm-lock.yaml* entrypoint.sh ./

RUN npm install pnpm -g && pnpm install

COPY . .

EXPOSE 7993

ENV TZ=Asia/Shanghai

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
