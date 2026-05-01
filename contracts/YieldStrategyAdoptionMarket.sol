// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title YieldStrategyAdoptionMarket
 * @notice Simple adoption marketplace for enumerable YieldBoost strategy NFTs.
 * @dev The contract intentionally stays small: owners list a Strategy NFT,
 * adopters buy it, and the NFT transfers atomically through safeTransferFrom.
 */
contract YieldStrategyAdoptionMarket is ReentrancyGuard {
    IERC721Enumerable public immutable strategyNft;

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    mapping(uint256 => Listing) public listings;

    event StrategyListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event StrategyDelisted(uint256 indexed tokenId, address indexed seller);
    event StrategyAdopted(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);

    constructor(address strategyNftAddress) {
        require(strategyNftAddress != address(0), "Invalid NFT address");
        strategyNft = IERC721Enumerable(strategyNftAddress);
    }

    function listStrategy(uint256 tokenId, uint256 price) external {
        require(price > 0, "Invalid price");
        require(strategyNft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(
            strategyNft.getApproved(tokenId) == address(this) ||
                strategyNft.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });

        emit StrategyListed(tokenId, msg.sender, price);
    }

    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Listing inactive");
        require(listing.seller == msg.sender, "Not seller");

        delete listings[tokenId];
        emit StrategyDelisted(tokenId, msg.sender);
    }

    function adoptStrategy(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Listing inactive");
        require(msg.value == listing.price, "Incorrect payment");
        require(strategyNft.ownerOf(tokenId) == listing.seller, "Seller no longer owner");

        delete listings[tokenId];
        strategyNft.safeTransferFrom(listing.seller, msg.sender, tokenId);

        (bool paid, ) = payable(listing.seller).call{value: msg.value}("");
        require(paid, "Seller payment failed");

        emit StrategyAdopted(tokenId, listing.seller, msg.sender, msg.value);
    }

    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }
}
