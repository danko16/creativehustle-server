git pull origin master
export NODE_ENV=production
export $(cat .env | xargs)
/home/danang/.nvm/versions/node/v12.18.0/bin/yarn install