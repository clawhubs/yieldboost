global SENTINEL_DOMAIN: Field = 20260508;
global AGENT_ID_WEIGHT: Field = 131071;
global AGENT_SECRET_WEIGHT: Field = 524287;
global ACTION_CONTEXT_WEIGHT: Field = 8191;
global NULLIFIER_ID_WEIGHT: Field = 65537;
global NULLIFIER_CONTEXT_WEIGHT: Field = 257;
global NULLIFIER_SECRET_WEIGHT: Field = 4099;

fn main(
    agent_id: Field,
    agent_secret: Field,
    agent_commitment: pub Field,
    action_context_hash: pub Field,
    session_nullifier: pub Field,
) {
    let computed_commitment = agent_id * AGENT_ID_WEIGHT
        + agent_secret * AGENT_SECRET_WEIGHT
        + action_context_hash * ACTION_CONTEXT_WEIGHT
        + SENTINEL_DOMAIN;

    let computed_nullifier = agent_id * NULLIFIER_ID_WEIGHT
        + action_context_hash * NULLIFIER_CONTEXT_WEIGHT
        + agent_secret * NULLIFIER_SECRET_WEIGHT
        + SENTINEL_DOMAIN;

    assert(computed_commitment == agent_commitment);
    assert(computed_nullifier == session_nullifier);
}
