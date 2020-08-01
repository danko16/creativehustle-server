eval `ssh-agent -s`
ssh-add ~/.ssh/id_rsa_github
git pull origin master
export NODE_ENV=production
export $(cat .env | xargs)