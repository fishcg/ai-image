FROM 172.24.173.77:30500/node:24.13.0-alpine

WORKDIR /home/www/ai-image

COPY package.json package-lock.json* pnpm-lock.yaml* entrypoint.sh ./

RUN npm install pnpm -g && pnpm install

COPY . .

EXPOSE 7993

ENV TZ=Asia/Shanghai

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
