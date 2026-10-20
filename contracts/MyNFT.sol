// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/// @title MyNFT - simple ERC-721 collection where anyone can mint
/// @notice Each token stores its own metadata URI (IPFS link or data: URI)
contract MyNFT is ERC721URIStorage {
    uint256 private _nextTokenId = 1; // token IDs start at 1

    event NFTMinted(address indexed owner, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("MyNFT Collection", "MNFT") {}

    /// @notice Mint a new NFT to the caller
    /// @param uri Metadata URI (JSON with name, description, image)
    /// @return tokenId The ID of the newly minted token
    function mint(string calldata uri) external returns (uint256 tokenId) {
        require(bytes(uri).length > 0, "Empty URI");
        tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        emit NFTMinted(msg.sender, tokenId, uri);
    }

    /// @notice Number of tokens minted so far (used by the frontend to iterate)
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
