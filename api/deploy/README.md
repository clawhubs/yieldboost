# API Deploy

## VPS service

- Copy `api/deploy/env/api.env.example` to `api/deploy/env/api.env`
- Install `api/deploy/systemd/yieldboost-integrity-api.service` into `/etc/systemd/system/`
- Run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable yieldboost-integrity-api
sudo systemctl start yieldboost-integrity-api
sudo systemctl status yieldboost-integrity-api
```

## Nginx

- Copy `api/deploy/nginx/api.yieldboostai.xyz.conf` into `/etc/nginx/sites-available/`
- Symlink into `/etc/nginx/sites-enabled/`
- Reload nginx

## Rollout rule

- Keep `INTEGRITY_API_NETWORK=testnet` for beta hardening
- When testnet beta is stable, switch only the env to `mainnet` and run the same service path
