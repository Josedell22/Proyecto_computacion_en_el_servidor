#!/bin/sh
set -eu

sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl iptables-persistent

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

sudo usermod -aG docker "${USER}"

sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo netfilter-persistent save

echo "Docker listo. Cierre sesión SSH y vuelva a entrar para usar docker sin sudo."
echo "Luego, en la carpeta del proyecto:"
echo "  cp .env.production.example .env.production"
echo "  nano .env.production"
echo "  docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build"
