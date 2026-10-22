import { useCallback, useEffect, useState } from "react";
import { formatEther } from "ethers";
import {
  connectWallet, switchToGanache, getContracts, fetchMetadata,
  readableError, isConfigured, EXPECTED_CHAIN_ID,
} from "./web3";
import MintForm from "./components/MintForm.jsx";
import MyNFTs from "./components/MyNFTs.jsx";
import Marketplace from "./components/Marketplace.jsx";
import AdminPanel from "./components/AdminPanel.jsx";

export default function App() {
  const [wallet, setWallet] = useState(null);      // { signer, account, chainId }
  const [contracts, setContracts] = useState(null);
  const [myNFTs, setMyNFTs] = useState([]);
  const [listings, setListings] = useState([]);
  const [proceeds, setProceeds] = useState(0n);
  const [owner, setOwner] = useState("");
  const [feeBps, setFeeBps] = useState(0n);
  const [status, setStatus] = useState("");
  const [balance, setBalance] = useState(0n);     // ETH balance of the connected account
  const [busy, setBusy] = useState(false);        // true while a transaction is in progress

  const connect = async () => {
    try {
      const w = await connectWallet();
      setWallet(w);
      if (w.chainId === EXPECTED_CHAIN_ID) setContracts(getContracts(w.signer));
    } catch (e) { setStatus(readableError(e)); }
  };

  // Reload everything from the blockchain
  const refresh = useCallback(async () => {
    if (!contracts || !wallet) return;
    const { nft, market } = contracts;
    const me = wallet.account.toLowerCase();

    // NFTs owned by the connected account (simple loop, fine for a demo)
    const total = Number(await nft.totalMinted());
    const mine = [];
    for (let id = 1; id <= total; id++) {
      if ((await nft.ownerOf(id)).toLowerCase() === me) {
        mine.push({ tokenId: id, meta: await fetchMetadata(await nft.tokenURI(id)) });
      }
    }
    setMyNFTs(mine);

    // Active listings + their metadata
    const raw = await market.getActiveListings();
    setListings(await Promise.all(raw.map(async (l) => ({
      listingId: l.listingId, tokenId: l.tokenId, seller: l.seller, price: l.price,
      meta: await fetchMetadata(await nft.tokenURI(l.tokenId)),
    }))));

    setProceeds(await market.proceeds(wallet.account));
    setOwner(await market.owner());
    setFeeBps(await market.feeBps());
    setBalance(await wallet.provider.getBalance(wallet.account));
  }, [contracts, wallet]);

  useEffect(() => { refresh(); }, [refresh]);

  // Re-connect when the user switches account or network in MetaMask
  useEffect(() => {
    if (!window.ethereum) return;
    const reload = () => connect();
    window.ethereum.on("accountsChanged", reload);
    window.ethereum.on("chainChanged", reload);
    return () => {
      window.ethereum.removeListener("accountsChanged", reload);
      window.ethereum.removeListener("chainChanged", reload);
    };
  }, []);

  /** Show a validation error (red message) without sending any transaction */
  const notify = (msg) => {
    setStatus(`⚠ ${msg}`);
    window.scrollTo({ top: 0, behavior: "smooth" }); // make sure the message is visible
  };

  /** Wrapper for every transaction: status message + wait + refresh */
  const runTx = async (label, fn) => {
    setBusy(true); // disable all buttons until the transaction is finished
    try {
      setStatus(`${label}: confirm in MetaMask...`);
      const tx = await fn();
      setStatus(`${label}: waiting for confirmation...`);
      await tx.wait();
      setStatus(`${label}: done ✔`);
      await refresh();
      return true;
    } catch (e) {
      notify(`${label} failed: ${readableError(e)}`);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const withdraw = () => runTx("Withdraw", () => contracts.market.withdrawProceeds());
  const isAdmin = wallet && owner && wallet.account.toLowerCase() === owner.toLowerCase();

  return (
    <div className="app">
      <header>
        <div>
          <h1>🖼️ <span className="title">NFT Marketplace</span></h1>
          <p className="subtitle">Mint, sell and buy unique digital items on the blockchain</p>
        </div>
        {wallet ? (
          <div className="account">
            <span className={isAdmin ? "badge admin-badge" : "badge"}>{isAdmin ? "👑 Admin" : "👤 User"}</span>
            <span className="address" title={wallet.account}>{wallet.account.slice(0, 6)}...{wallet.account.slice(-4)}</span>
            <span className="eth">{Number(formatEther(balance)).toFixed(3)} ETH</span>
            <span className="network">● Ganache</span>
          </div>
        ) : (
          <button onClick={connect}>🦊 Connect MetaMask</button>
        )}
      </header>

      {!isConfigured() && (
        <p className="warning">Contracts are not configured. Deploy them and fill <code>frontend/src/contracts/deployments.json</code> (see README).</p>
      )}
      {wallet && wallet.chainId !== EXPECTED_CHAIN_ID && (
        <p className="warning">Wrong network (chainId {wallet.chainId}). <button onClick={switchToGanache}>Switch to Ganache</button></p>
      )}
      {status && (
        <p className={status.startsWith("⚠") ? "status error" : "status"}>
          {busy && <span className="spinner" />}{status}
        </p>
      )}

      {contracts && (
        <>
          <section className="balance">
            <span>💰 Your proceeds: <b>{formatEther(proceeds)} ETH</b></span>
            <button disabled={busy || proceeds === 0n} onClick={withdraw}>Withdraw</button>
          </section>
          <MintForm busy={busy} notify={notify} contracts={contracts} runTx={runTx} />
          <MyNFTs busy={busy} notify={notify} nfts={myNFTs} contracts={contracts} runTx={runTx} />
          <Marketplace busy={busy} notify={notify} listings={listings} account={wallet.account} contracts={contracts} runTx={runTx} />
          {isAdmin && <AdminPanel busy={busy} notify={notify} feeBps={feeBps} contracts={contracts} runTx={runTx} />}
        </>
      )}
    </div>
  );
}
