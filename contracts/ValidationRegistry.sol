// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ValidationRegistry {
    enum Verdict {
        PASS,
        WATCH,
        FAIL
    }

    struct ValidationReport {
        address reporter;
        uint256 tokenId;
        string datasetCid;
        string reportCid;
        bytes32 reportHash;
        Verdict verdict;
        uint256 verifiedApyBps;
        int256 simulatedProfitUsd;
        uint64 timestamp;
    }

    uint256 public reportCount;
    mapping(uint256 => ValidationReport) private reports;
    mapping(uint256 => uint256[]) private reportsByToken;

    event ValidationRecorded(
        uint256 indexed reportId,
        uint256 indexed tokenId,
        address indexed reporter,
        string datasetCid,
        string reportCid,
        bytes32 reportHash,
        Verdict verdict,
        uint256 verifiedApyBps,
        int256 simulatedProfitUsd,
        uint64 timestamp
    );

    function recordValidation(
        uint256 tokenId,
        string calldata datasetCid,
        string calldata reportCid,
        bytes32 reportHash,
        Verdict verdict,
        uint256 verifiedApyBps,
        int256 simulatedProfitUsd
    ) external returns (uint256 reportId) {
        require(bytes(datasetCid).length > 0, "Empty dataset CID");
        require(bytes(reportCid).length > 0, "Empty report CID");
        require(reportHash != bytes32(0), "Empty report hash");

        reportId = ++reportCount;
        uint64 timestamp = uint64(block.timestamp);

        reports[reportId] = ValidationReport({
            reporter: msg.sender,
            tokenId: tokenId,
            datasetCid: datasetCid,
            reportCid: reportCid,
            reportHash: reportHash,
            verdict: verdict,
            verifiedApyBps: verifiedApyBps,
            simulatedProfitUsd: simulatedProfitUsd,
            timestamp: timestamp
        });
        reportsByToken[tokenId].push(reportId);

        emit ValidationRecorded(
            reportId,
            tokenId,
            msg.sender,
            datasetCid,
            reportCid,
            reportHash,
            verdict,
            verifiedApyBps,
            simulatedProfitUsd,
            timestamp
        );
    }

    function getReport(
        uint256 reportId
    ) external view returns (ValidationReport memory) {
        return reports[reportId];
    }

    function getReportsByToken(
        uint256 tokenId
    ) external view returns (uint256[] memory) {
        return reportsByToken[tokenId];
    }
}
