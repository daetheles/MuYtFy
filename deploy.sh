#!/bin/bash

# Скрипт деплоя для goatmusic.ru
# Использование: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
SERVER_IP="YOUR_SERVER_IP"  # Замените на IP вашего сервера
DOMAIN="goatmusic.ru"
PROJECT_NAME="goatmusic"

echo "🚀 Деплой $PROJECT_NAME на $ENVIRONMENT..."

# Создаем архив проекта
echo "📦 Создаем архив проекта..."
tar -czf $PROJECT_NAME.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=*.log \
    --exclude=*.tar.gz \
    .

# Копируем файлы на сервер
echo "📤 Копируем файлы на сервер..."
scp $PROJECT_NAME.tar.gz root@$SERVER_IP:/tmp/

# Подключаемся к серверу и разворачиваем
echo "🔧 Разворачиваем на сервере..."
ssh root@$SERVER_IP << 'EOF'
    cd /tmp
    tar -xzf goatmusic.tar.gz
    rm goatmusic.tar.gz
    
    # Создаем директорию проекта
    mkdir -p /var/www/goatmusic.ru
    cp -r * /var/www/goatmusic.ru/
    
    # Устанавливаем зависимости
    cd /var/www/goatmusic.ru
    npm install --production
    
    # Перезапускаем PM2
    pm2 restart goatmusic-server || pm2 start ecosystem.config.js --env production
    
    # Перезагружаем Nginx
    nginx -t && systemctl reload nginx
    
    echo "✅ Деплой завершен успешно!"
EOF

# Удаляем локальный архив
rm $PROJECT_NAME.tar.gz

echo "🎉 Деплой завершен! Проект доступен на https://$DOMAIN"
