# 🚀 Деплой проекта на хостинг goatmusic.ru

## 📋 Требования к хостингу

- **VPS/Выделенный сервер** с Ubuntu 20.04+ или CentOS 8+
- **Node.js 18+** и **npm**
- **Nginx** для веб-сервера
- **PM2** для управления процессами
- **SSL сертификат** (Let's Encrypt)

## 🔧 Подготовка сервера

### 1. Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Установка Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Установка Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4. Установка PM2
```bash
sudo npm install -g pm2
pm2 startup
```

### 5. Установка Certbot для SSL
```bash
sudo apt install certbot python3-certbot-nginx -y
```

## 🌐 Настройка домена

### 1. DNS записи
Добавьте в DNS вашего домена:
```
A    goatmusic.ru    YOUR_SERVER_IP
A    www.goatmusic.ru    YOUR_SERVER_IP
```

### 2. Получение SSL сертификата
```bash
sudo certbot --nginx -d goatmusic.ru -d www.goatmusic.ru
```

## 📁 Структура проекта на сервере

```
/var/www/goatmusic.ru/
├── index.html
├── style.css
├── script.js
├── server.js
├── package.json
├── ecosystem.config.js
└── node_modules/
```

## 🚀 Деплой

### 1. Настройка скрипта деплоя
Отредактируйте `deploy.sh`:
```bash
SERVER_IP="YOUR_ACTUAL_SERVER_IP"
```

### 2. Запуск деплоя
```bash
chmod +x deploy.sh
./deploy.sh production
```

### 3. Ручной деплой (альтернатива)
```bash
# Создание архива
tar -czf goatmusic.tar.gz --exclude=node_modules --exclude=.git .

# Копирование на сервер
scp goatmusic.tar.gz root@YOUR_SERVER_IP:/tmp/

# Подключение к серверу
ssh root@YOUR_SERVER_IP

# Развертывание
cd /tmp
tar -xzf goatmusic.tar.gz
mkdir -p /var/www/goatmusic.ru
cp -r * /var/www/goatmusic.ru/
cd /var/www/goatmusic.ru
npm install --production
pm2 start ecosystem.config.js --env production
```

## ⚙️ Настройка Nginx

### 1. Копирование конфигурации
```bash
sudo cp nginx.conf /etc/nginx/sites-available/goatmusic.ru
sudo ln -s /etc/nginx/sites-available/goatmusic.ru /etc/nginx/sites-enabled/
```

### 2. Проверка и перезагрузка
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔍 Проверка работы

### 1. Статус сервисов
```bash
pm2 status
sudo systemctl status nginx
```

### 2. Логи
```bash
pm2 logs goatmusic-server
sudo tail -f /var/log/nginx/access.log
```

### 3. Тестирование API
```bash
curl https://goatmusic.ru/api/stream/youtube/dQw4w9WgXcQ
```

## 🛠️ Обновление

### Автоматическое обновление
```bash
./deploy.sh production
```

### Ручное обновление
```bash
ssh root@YOUR_SERVER_IP
cd /var/www/goatmusic.ru
git pull origin main
npm install --production
pm2 restart goatmusic-server
```

## 🔒 Безопасность

### 1. Firewall
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Обновление зависимостей
```bash
npm audit fix
```

## 📊 Мониторинг

### 1. PM2 мониторинг
```bash
pm2 monit
```

### 2. Системный мониторинг
```bash
htop
df -h
free -h
```

## 🆘 Устранение неполадок

### 1. Проверка портов
```bash
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### 2. Проверка логов
```bash
pm2 logs goatmusic-server --lines 100
sudo tail -f /var/log/nginx/error.log
```

### 3. Перезапуск сервисов
```bash
pm2 restart goatmusic-server
sudo systemctl restart nginx
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи сервисов
2. Убедитесь, что все порты открыты
3. Проверьте DNS настройки
4. Убедитесь, что SSL сертификат действителен

## 🎯 Следующие шаги

После успешного деплоя:
1. Настройте мониторинг (например, UptimeRobot)
2. Настройте резервное копирование
3. Настройте CDN для статических файлов
4. Добавьте аналитику (Google Analytics)
