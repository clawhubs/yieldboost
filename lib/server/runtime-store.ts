import "server-only";

import {
  type SettingsPatchInput,
  type SettingsState,
  type StoredProofRecord,
  buildSettingsResponse,
  getDefaultSettingsState,
} from "@/lib/backend-data";

interface RuntimeStore {
  proofs: StoredProofRecord[];
  settings: SettingsState;
}

const globalStore = globalThis as typeof globalThis & {
  __yieldboostRuntimeStore?: RuntimeStore;
};

function getStore(): RuntimeStore {
  if (!globalStore.__yieldboostRuntimeStore) {
    globalStore.__yieldboostRuntimeStore = {
      proofs: [],
      settings: getDefaultSettingsState(),
    };
  }

  return globalStore.__yieldboostRuntimeStore;
}

export function recordStoredProof(record: StoredProofRecord) {
  const store = getStore();
  store.proofs = [record, ...store.proofs.filter((item) => item.cid !== record.cid)].slice(
    0,
    50,
  );
  return record;
}

export function getStoredProofs() {
  return [...getStore().proofs];
}

export function getStoredProofByCid(cid: string) {
  return getStore().proofs.find((proof) => proof.cid === cid) ?? null;
}

export function getLatestStoredProof() {
  return getStore().proofs[0] ?? null;
}

export function getSettingsState() {
  return { ...getStore().settings };
}

export function getSettingsResponse() {
  return buildSettingsResponse(getSettingsState());
}

export function updateSettingsState(patch: SettingsPatchInput) {
  const store = getStore();
  store.settings = {
    ...store.settings,
    ...patch,
  };
  return { ...store.settings };
}
