const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const PRICE = ethers.parseEther("1");

describe("NFT Marketplace", function () {
  async function deployFixture() {
    const [admin, seller, buyer, other] = await ethers.getSigners();
    const nft = await ethers.deployContract("MyNFT");
    const market = await ethers.deployContract("NFTMarketplace");
    // seller mints token #1 and approves the marketplace
    await nft.connect(seller).mint("ipfs://token1");
    await nft.connect(seller).approve(market.target, 1);
    return { nft, market, admin, seller, buyer, other };
  }

  async function listedFixture() {
    const f = await deployFixture();
    await f.market.connect(f.seller).listItem(f.nft.target, 1, PRICE);
    return f;
  }

  // ------------------------------------------------------------------ MyNFT
  describe("MyNFT", function () {
    it("mints with incremental IDs and stores the URI", async function () {
      const { nft, seller, buyer } = await loadFixture(deployFixture);
      await expect(nft.connect(buyer).mint("ipfs://token2"))
        .to.emit(nft, "NFTMinted").withArgs(buyer.address, 2, "ipfs://token2");
      expect(await nft.ownerOf(1)).to.equal(seller.address);
      expect(await nft.tokenURI(2)).to.equal("ipfs://token2");
      expect(await nft.totalMinted()).to.equal(2);
    });

    it("rejects an empty URI", async function () {
      const { nft, buyer } = await loadFixture(deployFixture);
      await expect(nft.connect(buyer).mint("")).to.be.revertedWith("Empty URI");
    });
  });

  // ------------------------------------------------------------------ Listing
  describe("listItem", function () {
    it("lists an NFT and moves it into escrow", async function () {
      const { nft, market, seller } = await loadFixture(deployFixture);
      await expect(market.connect(seller).listItem(nft.target, 1, PRICE))
        .to.emit(market, "ItemListed").withArgs(1, nft.target, 1, seller.address, PRICE);
      expect(await nft.ownerOf(1)).to.equal(market.target);
      const active = await market.getActiveListings();
      expect(active.length).to.equal(1);
      expect(active[0].price).to.equal(PRICE);
    });

    it("reverts if price is 0", async function () {
      const { nft, market, seller } = await loadFixture(deployFixture);
      await expect(market.connect(seller).listItem(nft.target, 1, 0)).to.be.revertedWith("Price must be > 0");
    });

    it("reverts if caller is not the owner", async function () {
      const { nft, market, other } = await loadFixture(deployFixture);
      await expect(market.connect(other).listItem(nft.target, 1, PRICE)).to.be.revertedWith("Not the owner");
    });

    it("reverts if marketplace is not approved", async function () {
      const { nft, market, buyer } = await loadFixture(deployFixture);
      await nft.connect(buyer).mint("ipfs://token2");
      await expect(market.connect(buyer).listItem(nft.target, 2, PRICE)).to.be.revertedWith("Marketplace not approved");
    });
  });

  // ------------------------------------------------------------------ Buying
  describe("buyItem", function () {
    it("transfers the NFT and credits seller + fee", async function () {
      const { nft, market, admin, seller, buyer } = await loadFixture(listedFixture);
      await expect(market.connect(buyer).buyItem(1, { value: PRICE }))
        .to.emit(market, "ItemSold").withArgs(1, buyer.address, PRICE);
      expect(await nft.ownerOf(1)).to.equal(buyer.address);
      const fee = (PRICE * 250n) / 10000n;
      expect(await market.proceeds(seller.address)).to.equal(PRICE - fee);
      expect(await market.proceeds(admin.address)).to.equal(fee);
      expect((await market.getActiveListings()).length).to.equal(0);
    });

    it("reverts with wrong ETH amount", async function () {
      const { market, buyer } = await loadFixture(listedFixture);
      await expect(market.connect(buyer).buyItem(1, { value: ethers.parseEther("0.5") }))
        .to.be.revertedWith("Wrong ETH amount");
    });

    it("prevents the seller from buying their own NFT", async function () {
      const { market, seller } = await loadFixture(listedFixture);
      await expect(market.connect(seller).buyItem(1, { value: PRICE })).to.be.revertedWith("Seller cannot buy");
    });

    it("prevents buying the same listing twice (double spend)", async function () {
      const { market, buyer, other } = await loadFixture(listedFixture);
      await market.connect(buyer).buyItem(1, { value: PRICE });
      await expect(market.connect(other).buyItem(1, { value: PRICE })).to.be.revertedWith("Listing not active");
    });
  });

  // ------------------------------------------------------------------ Cancel / update
  describe("cancelListing & updatePrice", function () {
    it("seller can cancel and gets the NFT back", async function () {
      const { nft, market, seller } = await loadFixture(listedFixture);
      await expect(market.connect(seller).cancelListing(1)).to.emit(market, "ListingCancelled").withArgs(1);
      expect(await nft.ownerOf(1)).to.equal(seller.address);
    });

    it("non-seller cannot cancel or update", async function () {
      const { market, other } = await loadFixture(listedFixture);
      await expect(market.connect(other).cancelListing(1)).to.be.revertedWith("Not the seller");
      await expect(market.connect(other).updatePrice(1, 5)).to.be.revertedWith("Not the seller");
    });

    it("seller can update price", async function () {
      const { market, seller } = await loadFixture(listedFixture);
      const newPrice = ethers.parseEther("2");
      await expect(market.connect(seller).updatePrice(1, newPrice)).to.emit(market, "PriceUpdated").withArgs(1, newPrice);
      expect((await market.listings(1)).price).to.equal(newPrice);
    });
  });

  // ------------------------------------------------------------------ Withdraw
  describe("withdrawProceeds", function () {
    it("pays the seller and resets the balance", async function () {
      const { market, seller, buyer } = await loadFixture(listedFixture);
      await market.connect(buyer).buyItem(1, { value: PRICE });
      const due = await market.proceeds(seller.address);
      await expect(market.connect(seller).withdrawProceeds()).to.changeEtherBalance(seller, due);
      expect(await market.proceeds(seller.address)).to.equal(0);
    });

    it("reverts when there is nothing to withdraw", async function () {
      const { market, other } = await loadFixture(deployFixture);
      await expect(market.connect(other).withdrawProceeds()).to.be.revertedWith("No proceeds");
    });
  });

  // ------------------------------------------------------------------ Admin
  describe("Admin (setFee)", function () {
    it("owner can set fee up to 10%", async function () {
      const { market, admin } = await loadFixture(deployFixture);
      await expect(market.connect(admin).setFee(500)).to.emit(market, "FeeUpdated").withArgs(500);
      await expect(market.connect(admin).setFee(1001)).to.be.revertedWith("Fee too high");
    });

    it("non-owner cannot set fee", async function () {
      const { market, other } = await loadFixture(deployFixture);
      await expect(market.connect(other).setFee(100))
        .to.be.revertedWithCustomError(market, "OwnableUnauthorizedAccount").withArgs(other.address);
    });
  });

  // ------------------------------------------------------------------ Security
  describe("Security: reentrancy attack", function () {
    it("blocks a malicious seller trying to withdraw twice", async function () {
      const { nft, market, buyer } = await loadFixture(deployFixture);
      const attacker = await ethers.deployContract("ReentrancyAttacker", [market.target, nft.target]);
      await attacker.mintAndList(PRICE);
      const listingId = await market.listingCount();
      await market.connect(buyer).buyItem(listingId, { value: PRICE });

      const before = await ethers.provider.getBalance(market.target);
      // The re-entrant call is rejected by nonReentrant -> ETH send fails -> whole tx reverts
      await expect(attacker.attack()).to.be.revertedWith("Transfer failed");
      expect(await ethers.provider.getBalance(market.target)).to.equal(before); // no ETH stolen
      expect(await market.proceeds(attacker.target)).to.be.gt(0);              // balance intact
    });
  });
});
