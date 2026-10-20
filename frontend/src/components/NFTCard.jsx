/** Reusable card showing an NFT image, name and description */
export default function NFTCard({ meta, tokenId, children }) {
  return (
    <div className="card">
      {meta.image ? <img src={meta.image} alt={meta.name} /> : <div className="noimg">No image</div>}
      <h3>{meta.name} <small>#{String(tokenId)}</small></h3>
      <p>{meta.description}</p>
      {children}
    </div>
  );
}
