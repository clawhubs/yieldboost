// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * AttestationRegistryOracle
 *
 * Stores hashes of compute attestations that have already passed broker-backed
 * verification in the app runtime. YieldStrategyINFT can query this contract
 * during minting so the NFT's `verified` flag is anchored to an on-chain oracle
 * decision instead of a placeholder boolean.
 */
contract AttestationRegistryOracle is Ownable {
    struct AttestationRecord {
        bool verified;
        uint64 verifiedAt;
        address verifier;
    }

    mapping(bytes32 => AttestationRecord) private _attestations;

    event AttestationRecorded(bytes32 indexed attestationHash, address indexed verifier, uint64 verifiedAt);
    event AttestationRevoked(bytes32 indexed attestationHash, address indexed verifier);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function recordAttestation(bytes32 attestationHash) external onlyOwner {
        require(attestationHash != bytes32(0), "Invalid attestation hash");

        _attestations[attestationHash] = AttestationRecord({
            verified: true,
            verifiedAt: uint64(block.timestamp),
            verifier: msg.sender
        });

        emit AttestationRecorded(attestationHash, msg.sender, uint64(block.timestamp));
    }

    function recordAttestations(bytes32[] calldata attestationHashes) external onlyOwner {
        for (uint256 index = 0; index < attestationHashes.length; index++) {
            bytes32 attestationHash = attestationHashes[index];
            if (attestationHash == bytes32(0)) {
                continue;
            }

            _attestations[attestationHash] = AttestationRecord({
                verified: true,
                verifiedAt: uint64(block.timestamp),
                verifier: msg.sender
            });

            emit AttestationRecorded(attestationHash, msg.sender, uint64(block.timestamp));
        }
    }

    function revokeAttestation(bytes32 attestationHash) external onlyOwner {
        require(_attestations[attestationHash].verified, "Attestation not verified");
        delete _attestations[attestationHash];
        emit AttestationRevoked(attestationHash, msg.sender);
    }

    function verifyAttestation(bytes32 attestationHash) external view returns (bool) {
        return _attestations[attestationHash].verified;
    }

    function getAttestation(bytes32 attestationHash)
        external
        view
        returns (bool verified, uint64 verifiedAt, address verifier)
    {
        AttestationRecord memory record = _attestations[attestationHash];
        return (record.verified, record.verifiedAt, record.verifier);
    }
}
