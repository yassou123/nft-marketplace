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
    require(bytes(uri).length > 0, "Empty URI");   // 1. règle : description obligatoire
    tokenId = _nextTokenId++;                      // 2. prend le numéro suivant (1, 2, 3...)
    _safeMint(msg.sender, tokenId);                // 3. crée le NFT et le donne à celui qui appelle
    _setTokenURI(tokenId, uri);                    // 4. enregistre sa description (nom, image)
    emit NFTMinted(msg.sender, tokenId, uri);      // 5. annonce publique
}

    /// @notice Number of tokens minted so far (used by the frontend to iterate)
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
