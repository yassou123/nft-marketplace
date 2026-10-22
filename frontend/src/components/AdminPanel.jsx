import { useState } from "react";

/** Visible only to the contract owner (deployer account) */
export default function AdminPanel({ feeBps, contracts, runTx, notify }) {
  const [fee, setFee] = useState("");

  const save = () => {
    const pct = Number(fee);
    if (fee === "" || isNaN(pct) || pct < 0 || pct > 10) {
      notify("The fee must be between 0 and 10 %.");
      return;
    }
    const bps = Math.round(Number(fee) * 100); // 2.5 % -> 250 bps
    runTx("Set fee", () => contracts.market.setFee(bps));
  };

  return (
    <section className="admin">
      <h2>Admin panel</h2>
      <p>Current marketplace fee: <b>{Number(feeBps) / 100}%</b> (max 10%). Fees are added to the admin proceeds.</p>
      <input type="number" step="0.1" min="0" max="10" placeholder="New fee in %" value={fee} onChange={(e) => setFee(e.target.value)} />
      <button onClick={save}>Update fee</button>
    </section>
  );
}
