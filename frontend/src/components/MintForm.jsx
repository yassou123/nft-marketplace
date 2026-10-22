import { useState } from "react";
import { buildTokenURI } from "../web3";

/** Create (mint) a new NFT for the connected account */
export default function MintForm({ contracts, runTx, notify, busy }) {
  const [form, setForm] = useState({ name: "", description: "", image: "" });
  const [imgError, setImgError] = useState(false);
  const update = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (k === "image") setImgError(false); // new URL: try to load the preview again
  };
  const validUrl = /^(https?|ipfs):\/\//.test(form.image.trim());
  const previewSrc = form.image.trim().replace("ipfs://", "https://ipfs.io/ipfs/");

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return notify("Please enter a name for your NFT.");
    if (!form.image.trim()) return notify("Please enter an image URL.");
    if (!validUrl) {
      return notify("The image URL must start with https://, http:// or ipfs://");
    }
    if (imgError) return notify("The image cannot be loaded. Check the URL.");
    runTx("Mint", () => contracts.nft.mint(buildTokenURI(form)));
    setForm({ name: "", description: "", image: "" });
  };

  return (
    <section>
      <h2>✨ Create an NFT</h2>
      <div className="mint">
        <form onSubmit={submit} className="form">
          <input placeholder="Name *" value={form.name} onChange={update("name")} />
          <input placeholder="Description" value={form.description} onChange={update("description")} />
          <input placeholder="Image URL * (https://... or ipfs://...)" value={form.image} onChange={update("image")} />
          <button type="submit" disabled={busy}>Mint</button>
        </form>
        {/* Live preview of the NFT before minting */}
        <div className="card preview">
          {validUrl && !imgError ? (
            <img src={previewSrc} alt="preview" onError={() => setImgError(true)} />
          ) : (
            <div className="noimg">{imgError ? "⚠ Image not found" : "Image preview"}</div>
          )}
          <h3>{form.name || "NFT name"}</h3>
          <p>{form.description || "Description"}</p>
        </div>
      </div>
    </section>
  );
}
