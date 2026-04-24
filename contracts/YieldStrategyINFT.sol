// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * Oracle interface for TEE verification (simplified for testnet)
 */
interface IOracle {
    function verifyAttestation(bytes32 attestationHash) external view returns (bool);
}

/**
 * YieldStrategyINFT - ERC-7857 Compliant Strategy NFT
 * 
 * Each NFT represents a yield optimization strategy that can be:
 * - Minted from an optimization result
 * - Traded as an Agent NFT
 * - Authorized for usage by other wallets
 * 
 * Strategy metadata is encrypted and stored on 0G Storage, with hash on-chain.
 */
contract YieldStrategyINFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    
    // Strategy metadata
    struct StrategyMetadata {
        string encryptedUri;  // Encrypted strategy stored on 0G Storage
        bytes32 contentHash;  // Hash of the strategy content for verification
        uint256 apy;          // Optimized APY in basis points (10000 = 100%)
        uint256 timestamp;    // When the strategy was created
        address creator;      // Original optimizer
        bool verified;        // Whether verified by TEE (if available)
    }

    // State variables
    uint256 private _nextTokenId = 1;
    
    // Token ID => Strategy metadata
    mapping(uint256 => StrategyMetadata) public strategies;
    
    // Oracle address (optional for TEE verification)
    address public oracle;
    
    // Authorization mapping: token ID => authorized addresses
    mapping(uint256 => mapping(address => bool)) public authorizedUsers;

    // Events
    event StrategyMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string encryptedUri,
        bytes32 contentHash,
        uint256 apy
    );
    
    event UsageAuthorized(uint256 indexed tokenId, address indexed user);
    
    event UsageRevoked(uint256 indexed tokenId, address indexed user);
    
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    constructor(address initialOwner) ERC721("YieldStrategy Agent", "YSA") Ownable(initialOwner) {
        oracle = address(0); // No oracle by default for testnet
    }

    /**
     * Mint a new strategy NFT
     * @param to Address to mint the NFT to
     * @param encryptedUri Encrypted strategy metadata URI (0G Storage)
     * @param contentHash Hash of the strategy content
     * @param apy Optimized APY in basis points
     * @param attestationHash Optional TEE attestation hash for verification
     */
    function mintStrategy(
        address to,
        string calldata encryptedUri,
        bytes32 contentHash,
        uint256 apy,
        bytes32 attestationHash
    ) external nonReentrant returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(bytes(encryptedUri).length > 0, "Empty URI");
        require(apy > 0, "Invalid APY");

        uint256 tokenId = _nextTokenId++;
        
        // Verify TEE attestation if oracle is set
        bool verified = false;
        if (oracle != address(0) && attestationHash != bytes32(0)) {
            try IOracle(oracle).verifyAttestation(attestationHash) returns (bool result) {
                verified = result;
            } catch {
                verified = false;
            }
        }

        // Store strategy metadata
        strategies[tokenId] = StrategyMetadata({
            encryptedUri: encryptedUri,
            contentHash: contentHash,
            apy: apy,
            timestamp: block.timestamp,
            creator: msg.sender,
            verified: verified
        });

        // Mint NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, encryptedUri);

        emit StrategyMinted(tokenId, to, encryptedUri, contentHash, apy);
        
        return tokenId;
    }

    /**
     * Authorize a user to use this strategy
     * @param tokenId Token ID to authorize
     * @param user Address to authorize
     */
    function authorizeUsage(uint256 tokenId, address user) external {
        require(_ownerOf(tokenId) == msg.sender, "Not owner");
        require(user != address(0), "Invalid user");
        
        authorizedUsers[tokenId][user] = true;
        emit UsageAuthorized(tokenId, user);
    }

    /**
     * Revoke usage authorization
     * @param tokenId Token ID to revoke
     * @param user Address to revoke
     */
    function revokeUsage(uint256 tokenId, address user) external {
        require(_ownerOf(tokenId) == msg.sender, "Not owner");
        
        authorizedUsers[tokenId][user] = false;
        emit UsageRevoked(tokenId, user);
    }

    /**
     * Check if a user is authorized to use a strategy
     * @param tokenId Token ID to check
     * @param user Address to check
     */
    function isAuthorized(uint256 tokenId, address user) external view returns (bool) {
        address owner = _ownerOf(tokenId);
        return user == owner || authorizedUsers[tokenId][user];
    }

    /**
     * Get strategy metadata
     * @param tokenId Token ID
     */
    function getStrategy(uint256 tokenId) external view returns (StrategyMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return strategies[tokenId];
    }

    /**
     * Update oracle address for TEE verification
     * @param newOracle New oracle address
     */
    function setOracle(address newOracle) external onlyOwner {
        address oldOracle = oracle;
        oracle = newOracle;
        emit OracleUpdated(oldOracle, newOracle);
    }

    /**
     * Get total number of minted strategies
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
