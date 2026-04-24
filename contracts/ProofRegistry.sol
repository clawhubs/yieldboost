// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProofRegistry {
    struct ProofRecord {
        address owner;
        string cid;
        bytes32 rootHash;
        bytes32 storageTxHash;
        uint256 currentApyBps;
        uint256 optimizedApyBps;
        uint64 timestamp;
    }

    uint256 public proofCount;
    mapping(uint256 => ProofRecord) private proofs;

    event ProofRecorded(
        uint256 indexed proofId,
        address indexed owner,
        string cid,
        bytes32 indexed rootHash,
        bytes32 storageTxHash,
        uint256 currentApyBps,
        uint256 optimizedApyBps,
        uint64 timestamp
    );

    function recordProof(
        string calldata cid,
        bytes32 rootHash,
        bytes32 storageTxHash,
        uint256 currentApyBps,
        uint256 optimizedApyBps
    ) external returns (uint256 proofId) {
        proofId = ++proofCount;
        uint64 timestamp = uint64(block.timestamp);

        proofs[proofId] = ProofRecord({
            owner: msg.sender,
            cid: cid,
            rootHash: rootHash,
            storageTxHash: storageTxHash,
            currentApyBps: currentApyBps,
            optimizedApyBps: optimizedApyBps,
            timestamp: timestamp
        });

        emit ProofRecorded(
            proofId,
            msg.sender,
            cid,
            rootHash,
            storageTxHash,
            currentApyBps,
            optimizedApyBps,
            timestamp
        );
    }

    function getProof(
        uint256 proofId
    )
        external
        view
        returns (
            address owner,
            string memory cid,
            bytes32 rootHash,
            bytes32 storageTxHash,
            uint256 currentApyBps,
            uint256 optimizedApyBps,
            uint64 timestamp
        )
    {
        ProofRecord storage proof = proofs[proofId];
        return (
            proof.owner,
            proof.cid,
            proof.rootHash,
            proof.storageTxHash,
            proof.currentApyBps,
            proof.optimizedApyBps,
            proof.timestamp
        );
    }
}
