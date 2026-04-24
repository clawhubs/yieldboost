// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * MockOracle - Mock oracle for testing TEE verification
 * 
 * This is a simple mock oracle that returns true for any attestation hash.
 * Used for local testing and testnet deployment before real TEE oracle is available.
 */
contract MockOracle {
    
    // For testing: track which attestations were verified
    mapping(bytes32 => bool) public verifiedAttestations;
    
    event AttestationVerified(bytes32 indexed attestationHash);
    
    /**
     * Mock verification - always returns true for testing
     * @param attestationHash Hash of the attestation to verify
     */
    function verifyAttestation(bytes32 attestationHash) external returns (bool) {
        verifiedAttestations[attestationHash] = true;
        emit AttestationVerified(attestationHash);
        return true;
    }
    
    /**
     * Check if an attestation was verified
     * @param attestationHash Hash to check
     */
    function isVerified(bytes32 attestationHash) external view returns (bool) {
        return verifiedAttestations[attestationHash];
    }
}
