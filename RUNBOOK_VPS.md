# VPS Runbook

Runbook ini untuk deploy `YieldBoost AI` ke VPS yang sekarang memakai:

- host alias SSH: `hackaton-do`
- app path: `/opt/yieldboost/current`
- shared env path: `/opt/yieldboost/shared/.env.production.local`
- process manager: `PM2`
- public app port: `3000`

## First Deploy

Pastikan server punya:

- `Node.js 20`
- `npm`
- `pm2`
- firewall membuka `3000/tcp`

Deploy:

```bash
npm run deploy:vps
```

Override default bila perlu:

```bash
APP_URL=http://your-ip:3000 VPS_HOST_ALIAS=hackaton-do npm run deploy:vps
```

## App Commands

Masuk server:

```bash
ssh hackaton-do
```

Cek process:

```bash
pm2 status
pm2 logs yieldboost
pm2 restart yieldboost
```

Health check:

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:3000/judge
```

## Directory Layout

```text
/opt/yieldboost/current
/opt/yieldboost/shared/.env.production.local
```

## Notes

- `deploy:vps` akan memaksa `NEXT_PUBLIC_APP_URL` ke `APP_URL`
- `deploy:vps` juga memaksa `NEXT_PUBLIC_DEFAULT_NETWORK_KEY=mainnet`
- source dikirim sebagai tarball agar tidak tergantung git checkout di server
- `ecosystem.config.cjs` menjadi source of truth untuk process PM2
