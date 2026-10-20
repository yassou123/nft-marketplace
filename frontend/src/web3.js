// All blockchain helpers used by the React app (ethers v6)
import { BrowserProvider, Contract } from "ethers";
import deployments from "./contracts/deployments.json";

export const EXPECTED_CHAIN_ID = deployments.chainId; // 1337 = Ganache

export function isConfigured() {
  return Boolean(deployments.MyNFT.address && deployments.NFTMarketplace.address);
}

/** Ask MetaMask to connect and return { provider, signer, account, chainId } */
export async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask is not installed");
  const provider = new BrowserProvider(window.ethereum);
  provider.pollingInterval = 1000; // faster confirmations on Ganache
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const { chainId } = await provider.getNetwork();
  return { provider, signer, account: await signer.getAddress(), chainId: Number(chainId) };
}

/** Switch MetaMask to the Ganache network (adds it if unknown) */
export async function switchToGanache() {
  const hex = "0x" + EXPECTED_CHAIN_ID.toString(16);
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
  } catch (e) {
    if (e.code !== 4902) throw e; // 4902 = chain not added yet
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: hex,
        chainName: "Ganache",
        rpcUrls: ["http://127.0.0.1:7545"],
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      }],
    });
  }
}

/** Contract instances connected to the signer (can send transactions) */
export function getContracts(signer) {
  return {
    nft: new Contract(deployments.MyNFT.address, deployments.MyNFT.abi, signer),
    market: new Contract(deployments.NFTMarketplace.address, deployments.NFTMarketplace.abi, signer),
  };
}

/** Build a metadata URI fully on-chain (no IPFS needed for the demo) */
export function buildTokenURI({ name, description, image }) {
  const json = JSON.stringify({ name, description, image });
  return "data:application/json;charset=utf-8," + encodeURIComponent(json);
}

/** Read metadata from a data: URI, an ipfs:// URI or an http(s) URL */
export async function fetchMetadata(uri) {
  try {
    if (uri.startsWith("data:application/json")) {
      return JSON.parse(decodeURIComponent(uri.split(",").slice(1).join(",")));
    }
    const url = uri.startsWith("ipfs://") ? uri.replace("ipfs://", "https://ipfs.io/ipfs/") : uri;
    return await (await fetch(url)).json();
  } catch {
    return { name: "Unknown NFT", description: uri, image: "" };
  }
}

/** Turn ethers/MetaMask errors into a short readable message */
export function readableError(e) {
  return e?.reason || e?.shortMessage || e?.info?.error?.message || e?.message || "Transaction failed";
}
