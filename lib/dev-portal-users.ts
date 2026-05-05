import { promises as fs } from "node:fs";
import { dirname, resolve } from "node:path";

export interface DeveloperUserRecord {
  wallet_address: string;
  role: "owner" | "developer";
  created_at: string;
  last_login_at: string;
}

function getStorePath() {
  return resolve(
    process.cwd(),
    process.env.INTEGRITY_DEV_PORTAL_USER_STORE_PATH ||
      ".artifacts/dev-portal-users.local.json",
  );
}

async function readStore(): Promise<{ users: DeveloperUserRecord[] }> {
  const storePath = getStorePath();
  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as { users?: DeveloperUserRecord[] };
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
    };
  } catch {
    return { users: [] };
  }
}

async function writeStore(payload: { users: DeveloperUserRecord[] }) {
  const storePath = getStorePath();
  await fs.mkdir(dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function getDeveloperUser(walletAddress: string) {
  const payload = await readStore();
  return (
    payload.users.find(
      (entry) => entry.wallet_address.toLowerCase() === walletAddress.toLowerCase(),
    ) || null
  );
}

export async function upsertDeveloperUser(input: {
  walletAddress: string;
  role: "owner" | "developer";
}) {
  const payload = await readStore();
  const now = new Date().toISOString();
  const nextUser: DeveloperUserRecord = {
    wallet_address: input.walletAddress,
    role: input.role,
    created_at: now,
    last_login_at: now,
  };

  const index = payload.users.findIndex(
    (entry) => entry.wallet_address.toLowerCase() === input.walletAddress.toLowerCase(),
  );

  if (index >= 0) {
    nextUser.created_at = payload.users[index]?.created_at || now;
    payload.users[index] = {
      ...payload.users[index],
      role: input.role,
      last_login_at: now,
    };
  } else {
    payload.users.push(nextUser);
  }

  await writeStore(payload);
  return payload.users.find(
    (entry) => entry.wallet_address.toLowerCase() === input.walletAddress.toLowerCase(),
  ) as DeveloperUserRecord;
}
