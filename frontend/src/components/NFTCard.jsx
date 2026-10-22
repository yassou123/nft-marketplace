import { useState } from "react";

/** Reusable card showing an NFT image, name and description */
export default function NFTCard({ meta, tokenId, children }) {
  const [broken, setBroken] = useState(false); // image URL not reachable
  return (
    <div className="card">
      {meta.image && !broken ? (
        <img src={meta.image} alt={meta.name} onError={() => setBroken(true)} />
      ) : (
        <div className="noimg">{broken ? "⚠ Image not found" : "No image"}</div>
      )}
      <h3>{meta.name} <small>#{String(tokenId)}</small></h3>
      <p>{meta.description}</p>
      {children}
    </div>
  );
}
