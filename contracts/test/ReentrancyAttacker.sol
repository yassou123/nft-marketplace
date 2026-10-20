// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMarket {
    function listItem(address nft, uint256 tokenId, uint256 price) external returns (uint256);
    function withdrawProceeds() external;
    function buyItem(uint256 listingId) external payable;
}

interface INFT {
    function mint(string calldata uri) external returns (uint256);
    function approve(address to, uint256 tokenId) external;
}

/// @notice TEST ONLY - malicious seller that tries to withdraw twice (reentrancy attack)
contract ReentrancyAttacker {
    IMarket public market;
    INFT public nft;
    uint256 public reentryAttempts;

    constructor(address _market, address _nft) {
        market = IMarket(_market);
        nft = INFT(_nft);
    }

    function mintAndList(uint256 price) external {
        uint256 id = nft.mint("ipfs://attacker");
        nft.approve(address(market), id);
        market.listItem(address(nft), id, price);
    }

    function attack() external {
        market.withdrawProceeds();
    }

    // Called when the marketplace sends ETH -> tries to re-enter
    receive() external payable {
        if (reentryAttempts < 1) {
            reentryAttempts++;
            market.withdrawProceeds();
        }
    }

    // Must accept NFTs if it ever buys one
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
