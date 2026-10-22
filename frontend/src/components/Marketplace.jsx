import { useState } from "react";
import { formatEther, parseEther } from "ethers";
import NFTCard from "./NFTCard.jsx";

/** All active listings: buy, or cancel / update price for your own */
export default function Marketplace({ listings, account, contracts, runTx, notify }) {
  const [newPrices, setNewPrices] = useState({});
  const { market } = contracts;

  const updatePrice = (l, id) => {
    const value = newPrices[id];
    if (!value || !(Number(value) > 0)) {
      notify(`Listing #${id}: enter a new price greater than 0 ETH.`);
      return;
    }
    runTx("Update price", () => market.updatePrice(l.listingId, parseEther(value)));
  };

  return (
    <section>
      <h2>Marketplace ({listings.length} for sale)</h2>
      <div className="grid">
        {listings.map((l) => {
          const id = String(l.listingId);
          const mine = l.seller.toLowerCase() === account.toLowerCase();
          return (
            <NFTCard key={id} meta={l.meta} tokenId={l.tokenId}>
              <p className="price">{formatEther(l.price)} ETH</p>
              <p className="seller">Seller: {l.seller.slice(0, 6)}...{l.seller.slice(-4)}</p>
              {mine ? (
                <>
                  <input type="number" step="0.01" min="0" placeholder="New price (ETH)"
                    value={newPrices[id] || ""}
                    onChange={(e) => setNewPrices({ ...newPrices, [id]: e.target.value })} />
                  <button onClick={() => updatePrice(l, id)}>
                    Update price
                  </button>
                  <button className="secondary" onClick={() => runTx("Cancel", () => market.cancelListing(l.listingId))}>
                    Cancel listing
                  </button>
                </>
              ) : (
                <button onClick={() => runTx("Buy", () => market.buyItem(l.listingId, { value: l.price }))}>
                  Buy
                </button>
              )}
            </NFTCard>
          );
        })}
        {listings.length === 0 && <p>No NFT for sale right now.</p>}
      </div>
    </section>
  );
}
