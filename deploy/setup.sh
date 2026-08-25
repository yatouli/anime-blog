#!/usr/bin/env bash
# ============================================================
# 星野の小窝 — 一键部署脚本（Ubuntu/Debian VPS）
# 用法:  sudo bash setup.sh 你的域名.com
# 例:    sudo bash setup.sh blog.example.com
# 依赖: 需要 root 权限；域名需先解析 A 记录指向本机 IP
# ============================================================
set -e

DOMAIN="${1:-}"
BLOG_DIR="/var/www/anime-blog"
PORT="${PORT:-3000}"

echo "==== 1/7 安装系统依赖 ===="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git nginx unzip

echo "==== 2/7 安装 Node.js 24（内置 SQLite 需要 Node 22.5+，推荐 24）===="
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 24 ]; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

echo "==== 3/7 拉取代码 ===="
mkdir -p "$BLOG_DIR"
if [ -d "$BLOG_DIR/.git" ]; then
  cd "$BLOG_DIR" && git pull --ff-only || true
else
  git clone https://github.com/yatouli/anime-blog.git "$BLOG_DIR"
fi
cd "$BLOG_DIR"

echo "==== 4/7 安装依赖并构建 ===="
npm install --no-audit --no-fund
npm run build

echo "==== 5/7 环境变量 ===="
if [ -n "$DOMAIN" ]; then
  echo "SITE_URL=https://$DOMAIN" > .env.production
fi
# 首次启动会自动建库并从 data/*.json 导入种子数据（无需手动初始化）

echo "==== 6/7 PM2 常驻运行 ===="
npm install -g pm2
if [ -n "$ADMIN_PASSWORD" ]; then
  ADMIN_PASSWORD="$ADMIN_PASSWORD" pm2 start "npm run start -- -p $PORT" --name anime-blog
else
  echo "⚠️  未设置 ADMIN_PASSWORD，将使用代码默认值，请尽快修改！"
  pm2 start "npm run start -- -p $PORT" --name anime-blog
fi
pm2 save
pm2 startup systemd -u root --hp /root | tail -n 1 || true

echo "==== 7/7 Nginx 反向代理 ===="
if [ -n "$DOMAIN" ]; then
  cat > /etc/nginx/sites-available/anime-blog <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 200m;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
  ln -sf /etc/nginx/sites-available/anime-blog /etc/nginx/sites-enabled/anime-blog
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx

  echo "==== 可选：HTTPS 证书（Let's Encrypt）===="
  if command -v certbot >/dev/null || apt-get install -y certbot python3-certbot-nginx; then
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect || echo "⚠️  certbot 自动签发失败，可稍后手动执行: certbot --nginx -d $DOMAIN"
  fi
fi

echo ""
echo "✅ 部署完成！"
if [ -n "$DOMAIN" ]; then
  echo "   访问: https://$DOMAIN  (若证书未签发则 http://$DOMAIN)"
else
  echo "   访问: http://服务器IP:$PORT"
fi
echo "   后台: /admin （密码为 ADMIN_PASSWORD，默认 anime2024 请立即修改）"
echo "   数据: $BLOG_DIR/data/ （备份这个目录 = 备份整个博客）"
