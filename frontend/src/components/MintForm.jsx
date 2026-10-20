import { useState } from "react";
import { buildTokenURI } from "../web3";

/** Create (mint) a new NFT for the connected account */
export default function MintForm({ contracts, runTx }) {
  const [form, setForm] = useState({ name: "", description: "", image: "" });
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.image) return;
    runTx("Mint", () => contracts.nft.mint(buildTokenURI(form)));
    setForm({ name: "", description: "", image: "" });
  };

  return (
    <section>
      <h2>Create an NFT</h2>
      <form onSubmit={submit} className="form">
        <input placeholder="Name *" value={form.name} onChange={update("name")} />
        <input placeholder="Description" value={form.description} onChange={update("description")} />
        <input placeholder="Image URL * (https://... or ipfs://...)" value={form.image} onChange={update("image")} />
        <button type="submit">Mint</button>
      </form>
    </section>
  );
}
