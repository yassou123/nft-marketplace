// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title NFTMarketplace - list, buy and cancel ERC-721 sales paid in ETH
/// @notice Escrow model: a listed NFT is held by the marketplace until sold or cancelled.
///         Payments use the "pull" pattern: sellers withdraw their proceeds themselves.
contract NFTMarketplace is Ownable, ReentrancyGuard {
    struct Listing {
        uint256 listingId;
        address nft;
        uint256 tokenId;
        address seller;
        uint256 price; // in wei
        bool active;
    }

    uint256 public constant MAX_FEE_BPS = 1000; // 10% hard cap
    uint256 public feeBps = 250;                // 2.5% (basis points: 10000 = 100%)
    uint256 public listingCount;

    mapping(uint256 => Listing) public listings;   // listingId => Listing
    mapping(address => uint256) public proceeds;   // seller/owner => withdrawable wei

    event ItemListed(uint256 indexed listingId, address indexed nft, uint256 indexed tokenId, address seller, uint256 price);
    event ItemSold(uint256 indexed listingId, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    event PriceUpdated(uint256 indexed listingId, uint256 newPrice);
    event ProceedsWithdrawn(address indexed account, uint256 amount);
    event FeeUpdated(uint256 newFeeBps);

    constructor() Ownable(msg.sender) {}

    // ---------------------------------------------------------------- modifiers
    modifier onlyActive(uint256 listingId) {
        require(listings[listingId].active, "Listing not active");
        _;
    }

    modifier onlySeller(uint256 listingId) {
        require(listings[listingId].seller == msg.sender, "Not the seller");
        _;
    }

    // ---------------------------------------------------------------- seller actions
    /// @notice List an NFT for sale. Caller must own it and approve this contract first.
    function listItem(address nft, uint256 tokenId, uint256 price) external nonReentrant returns (uint256 listingId) {
        require(price > 0, "Price must be > 0");
        IERC721 token = IERC721(nft);
        require(token.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            token.getApproved(tokenId) == address(this) || token.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        // Effects
        listingId = ++listingCount;
        listings[listingId] = Listing(listingId, nft, tokenId, msg.sender, price, true);
        emit ItemListed(listingId, nft, tokenId, msg.sender, price);

        // Interaction: move the NFT into escrow
        token.transferFrom(msg.sender, address(this), tokenId);
    }

    /// @notice Cancel a listing and get the NFT back
    function cancelListing(uint256 listingId) external nonReentrant onlyActive(listingId) onlySeller(listingId) {
        Listing storage l = listings[listingId];
        l.active = false;
        emit ListingCancelled(listingId);
        IERC721(l.nft).safeTransferFrom(address(this), msg.sender, l.tokenId);
    }

    /// @notice Change the price of an active listing
    function updatePrice(uint256 listingId, uint256 newPrice) external onlyActive(listingId) onlySeller(listingId) {
        require(newPrice > 0, "Price must be > 0");
        listings[listingId].price = newPrice;
        emit PriceUpdated(listingId, newPrice);
    }

    // ---------------------------------------------------------------- buyer actions
    /// @notice Buy a listed NFT by sending exactly its price in ETH
    function buyItem(uint256 listingId) external payable nonReentrant onlyActive(listingId) {
        Listing storage l = listings[listingId];
        require(msg.sender != l.seller, "Seller cannot buy");
        require(msg.value == l.price, "Wrong ETH amount");

        // Checks-Effects-Interactions: update state BEFORE any external call
        l.active = false;
        uint256 fee = (msg.value * feeBps) / 10000;
        proceeds[l.seller] += msg.value - fee;
        proceeds[owner()] += fee;
        emit ItemSold(listingId, msg.sender, msg.value);

        IERC721(l.nft).safeTransferFrom(address(this), msg.sender, l.tokenId);
    }

    // ---------------------------------------------------------------- withdrawals
    /// @notice Withdraw accumulated ETH (sales for sellers, fees for the owner)
    function withdrawProceeds() external nonReentrant {
        uint256 amount = proceeds[msg.sender];
        require(amount > 0, "No proceeds");
        proceeds[msg.sender] = 0; // reset BEFORE sending (anti-reentrancy)
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");
        emit ProceedsWithdrawn(msg.sender, amount);
    }

    // ---------------------------------------------------------------- admin
    /// @notice Owner can change the marketplace fee (max 10%)
    function setFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    // ---------------------------------------------------------------- views
    /// @notice Return all active listings (fine for a small demo marketplace)
    function getActiveListings() external view returns (Listing[] memory result) {
        uint256 count;
        for (uint256 i = 1; i <= listingCount; i++) if (listings[i].active) count++;
        result = new Listing[](count);
        uint256 j;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].active) result[j++] = listings[i];
        }
    }

    /// @dev Required to receive NFTs via safeTransferFrom (not used by listItem, kept for safety)
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
