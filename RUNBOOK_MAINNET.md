# Mainnet Runbook

Runbook ini dibuat untuk cutover `YieldBoost AI` ke 0G mainnet dengan modal awal sekitar `6 OG`, sambil tetap menjaga testnet sebagai fallback yang aman.

## Tujuan

Target akhir runbook ini:

1. `ProofRegistry` live di mainnet dan terverifikasi di ChainScan.
2. `YieldStrategyINFT` live di mainnet dan terverifikasi di ChainScan.
3. Jalur `0G Storage` dan `0G Compute` mainnet aktif.
4. Minimal satu proof mainnet berhasil muncul di explorer.
5. `ZG_NETWORK_KEY=mainnet` baru diaktifkan setelah semua checkpoint lolos.

## Prinsip Operasional

- Jangan pindah ke `mainnet` sebagai default terlalu cepat.
- Deploy kontrak dulu, baru jalur compute.
- Testnet jangan dihapus; testnet tetap jadi rollback path.
- `setup:tee-broker:mainnet` adalah jalur utama untuk compute setup. Script ini sudah mencoba:
  - deposit `3 OG` ke ledger
  - transfer `1 OG` ke inference sub-account
  - acknowledge provider
- Script manual seperti `transfer:fund:broker:mainnet` dan `acknowledge:provider:mainnet` dipakai hanya jika setup utama perlu diperbaiki sebagian.

## Budget Guide

Dengan saldo sekitar `6 OG`, strategi yang disarankan:

- `0.1 - 0.3 OG` buffer konservatif untuk deploy kontrak + proof tx + verify tx
- `3 OG` untuk compute ledger deposit
- `1 OG` untuk inference sub-account dari jalur setup broker
- sisakan buffer operasional setelah setup

Checklist saldo:

- `>= 6 OG`: aman untuk mulai full cutover
- `< 5 OG`: tunda compute setup, deploy kontrak dulu
- `< 3 OG`: jangan lanjut mainnet compute path

## File dan Env yang Dipakai

Sumber template:

- [`.env.mainnet.example`](.env.mainnet.example)

Artifact yang dihasilkan saat deploy/verify:

- `.artifacts/proof-registry-deployment-mainnet.json`
- `.artifacts/yield-strategy-inft-deployment-mainnet.json`
- `.artifacts/ProofRegistry.verification.json`
- `.artifacts/YieldStrategyINFT.verification.json`
- `public/abi/ProofRegistry.json`
- `public/abi/YieldStrategyINFT.json`

## Fase 0 — Backup dan Freeze

Sebelum menyentuh mainnet:

1. Pastikan branch `main` bersih.
2. Simpan salinan `.env.local`.
3. Simpan artifact testnet yang sekarang sudah valid.
4. Pastikan deployment testnet terakhir masih bisa dibuka dari `/judge`.

Command:

```bash
git status --short
cp .env.local .env.local.backup.mainnet-prep
```

Lanjut hanya jika `git status` bersih atau perubahan aktif memang Anda pahami.

## Fase 1 — Isi Env Mainnet Dasar

Isi env yang aman dari awal:

```env
NEXT_PUBLIC_0G_MAINNET_CHAIN_ID=16661
NEXT_PUBLIC_0G_MAINNET_CHAIN_NAME=0G Mainnet
NEXT_PUBLIC_0G_MAINNET_EXPLORER_BASE_URL=https://chainscan.0g.ai
NEXT_PUBLIC_0G_MAINNET_RPC=https://evmrpc.0g.ai
ZG_MAINNET_RPC_URL=https://evmrpc.0g.ai
ZG_MAINNET_PRIVATE_KEY=<wallet_mainnet>
ZG_MAINNET_LEDGER_PRIVATE_KEY=<wallet_mainnet_atau_wallet_yang_sama>
```

Jika wallet signer dan ledger signer memang sama, itu valid untuk fase hackathon ini.

Tetap pertahankan:

```env
ZG_NETWORK_KEY=testnet
```

Belum perlu diisi dulu:

```env
ZG_MAINNET_STORAGE_URL=<mainnet_storage_endpoint>
ZG_MAINNET_PROOF_REGISTRY_ADDRESS=<mainnet_proof_registry_address>
ZG_MAINNET_COMPUTE_PROVIDER_ADDRESS=<mainnet_compute_provider_address>
YIELD_STRATEGY_INFT_MAINNET_ADDRESS=<mainnet_yield_strategy_inft_address>
```

## Fase 2 — Deploy ProofRegistry Mainnet

Command:

```bash
npm run deploy:proof-registry:mainnet
```

Expected output:

- contract address
- explorer URL
- artifact `.artifacts/proof-registry-deployment-mainnet.json`

Lalu isi env:

```env
ZG_MAINNET_PROOF_REGISTRY_ADDRESS=<address_hasil_deploy>
```

Export ABI + verification bundle:

```bash
npm run export:proof-registry-abi
```

Verify ke ChainScan:

```bash
npm run verify:proof-registry:mainnet
```

Checkpoint:

- address kontrak terbuka di `https://chainscan.0g.ai/address/<address>`
- verification exact match berhasil

Kalau verify gagal:

- jangan lanjut ke cutover
- cek artifact `.artifacts/ProofRegistry.verification.json`

## Fase 3 — Deploy YieldStrategyINFT Mainnet

Command:

```bash
npm run deploy:inft:mainnet
```

Expected output:

- contract address
- explorer URL
- artifact `.artifacts/yield-strategy-inft-deployment-mainnet.json`

Lalu isi env:

```env
YIELD_STRATEGY_INFT_MAINNET_ADDRESS=<address_hasil_deploy>
```

Export ABI + verification bundle:

```bash
npm run export:inft-abi
```

Verify ke ChainScan:

```bash
npm run verify:inft:mainnet
```

Checkpoint:

- address INFT terbuka di `https://chainscan.0g.ai/address/<address>`
- verification exact match berhasil
- file `public/abi/YieldStrategyINFT.json` sudah ada

## Fase 4 — Lengkapi Env Storage dan Compute

Isi env yang masih kosong:

```env
ZG_MAINNET_STORAGE_URL=<mainnet_storage_endpoint>
ZG_MAINNET_COMPUTE_PROVIDER_ADDRESS=<mainnet_compute_provider_address>
```

Opsional tapi sangat disarankan untuk persistence produksi:

```env
KV_REST_API_URL=<vercel_kv_url>
KV_REST_API_TOKEN=<vercel_kv_token>
```

Checkpoint:

- semua env mainnet utama sudah terisi
- saldo wallet masih cukup nyaman untuk setup compute

## Fase 5 — Setup 0G Compute Broker Mainnet

Jalur utama:

```bash
npm run setup:tee-broker:mainnet
```

Script ini mencoba:

1. membuat broker instance
2. deposit `3 OG` ke ledger
3. transfer `1 OG` ke inference sub-account
4. acknowledge provider
5. list service

Periksa output dengan teliti. Jika script sukses penuh, jangan ulangi funding manual.

Gunakan script manual hanya jika setup utama berhenti di tengah:

```bash
npm run transfer:fund:broker:mainnet
npm run acknowledge:provider:mainnet
```

Gunakan hanya saat perlu memperbaiki langkah tertentu, bukan sebagai langkah rutin setelah `setup:tee-broker:mainnet`.

Checkpoint:

- provider acknowledged
- service list bisa dibaca
- wallet masih punya buffer operasional

## Fase 6 — Smoke Test Mainnet Sebelum Cutover Default

Tujuan fase ini adalah membuktikan flow mainnet hidup, **tanpa** langsung memindahkan default app.

Langkah:

1. Jalankan app dengan env mainnet yang sudah lengkap.
2. Buka UI.
3. Pilih network `mainnet`.
4. Connect wallet demo / wallet operasional yang akan dipakai.
5. Jalankan `1-click optimize`.

Yang harus dicek:

- optimize result tampil
- proof write berhasil
- tx explorer mainnet valid
- registry tx mainnet valid
- `/judge` bisa membaca proof terbaru setelah network mainnet dipakai

Checkpoint minimum:

- minimal 1 proof tx mainnet
- minimal 1 registry tx mainnet

## Fase 7 — Optional INFT Mint Smoke Test

Kalau Anda ingin bukti `Agent ID / INFT` yang lebih kuat:

1. Gunakan flow `/api/agent/mint`
2. Mint satu strategy NFT
3. Simpan tx hash explorer

Ini bukan blocker untuk cutover inti, tapi sangat berguna untuk materi submission.

## Fase 8 — Cutover Default ke Mainnet

Baru setelah semua checkpoint lolos:

```env
ZG_NETWORK_KEY=mainnet
```

Deploy ulang aplikasi.

Checkpoint setelah deploy:

1. `/` terbuka normal
2. `/judge` menampilkan proof terbaru yang benar
3. explorer link mengarah ke mainnet
4. latest snapshot, proof, dan stats tidak fallback ke data testnet lama

## Fase 9 — Submission Checklist

Sebelum submit ke HackQuest, pastikan Anda sudah punya:

- `ProofRegistry` mainnet address
- `YieldStrategyINFT` mainnet address
- minimal 1 mainnet explorer link untuk proof
- minimal 1 mainnet explorer link untuk registry
- README yang sudah menjelaskan mainnet path
- video demo maksimal 3 menit
- post X publik

## Rollback Plan

Kalau ada masalah setelah cutover:

1. ubah kembali:

```env
ZG_NETWORK_KEY=testnet
```

2. redeploy
3. jangan hapus env mainnet
4. jangan hapus kontrak mainnet yang sudah terdeploy

Rollback ini hanya memindahkan default flow kembali ke testnet, bukan membatalkan deployment mainnet Anda.

## Command Summary

Urutan paling direkomendasikan:

```bash
npm run deploy:proof-registry:mainnet
npm run export:proof-registry-abi
npm run verify:proof-registry:mainnet

npm run deploy:inft:mainnet
npm run export:inft-abi
npm run verify:inft:mainnet

npm run setup:tee-broker:mainnet
```

Lalu:

- jalankan 1 optimize mainnet nyata
- cek `/judge`
- baru set `ZG_NETWORK_KEY=mainnet`

## Catatan Penting

- Jangan menjalankan `transfer:fund:broker:mainnet` berkali-kali tanpa alasan, karena itu bisa membuat funding compute menjadi boros atau membingungkan.
- Jangan cutover default sebelum proof mainnet pertama benar-benar berhasil.
- Testnet tetap dipertahankan sebagai fallback walau mainnet nanti jadi default.
