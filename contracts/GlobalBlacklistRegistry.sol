// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GlobalBlacklistRegistry {
    struct BlacklistRecord {
        address reporter;
        string cid;
        bytes32 fingerprint;
        uint64 timestamp;
    }

    uint256 public recordCount;
    mapping(uint256 => BlacklistRecord) private records;
    mapping(bytes32 => bool) public fingerprintExists;

    event BlacklistRecorded(
        uint256 indexed recordId,
        address indexed reporter,
        bytes32 indexed fingerprint,
        string cid,
        uint64 timestamp
    );

    function recordBlacklist(
        string calldata cid,
        bytes32 fingerprint
    ) external returns (uint256 recordId) {
        require(bytes(cid).length > 0, "Empty CID");
        require(fingerprint != bytes32(0), "Empty fingerprint");
        require(!fingerprintExists[fingerprint], "Fingerprint exists");

        recordId = ++recordCount;
        uint64 timestamp = uint64(block.timestamp);

        records[recordId] = BlacklistRecord({
            reporter: msg.sender,
            cid: cid,
            fingerprint: fingerprint,
            timestamp: timestamp
        });
        fingerprintExists[fingerprint] = true;

        emit BlacklistRecorded(recordId, msg.sender, fingerprint, cid, timestamp);
    }

    function getRecord(
        uint256 recordId
    )
        external
        view
        returns (
            address reporter,
            string memory cid,
            bytes32 fingerprint,
            uint64 timestamp
        )
    {
        BlacklistRecord storage record = records[recordId];
        return (
            record.reporter,
            record.cid,
            record.fingerprint,
            record.timestamp
        );
    }
}
