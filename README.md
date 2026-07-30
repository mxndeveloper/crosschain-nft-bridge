# Cross‑Chain NFT Bridge (Lock‑and‑Mint + EIP‑712)

A secure, relayer‑powered bridge that moves unique in‑game items (ERC‑721 NFTs)
from one blockchain to another. The original NFT is **locked** on the source
chain, and a matching NFT is **minted** on the destination chain using a
verifiable EIP‑712 signature from a trusted relayer.

**Deployed to Arbitrum Sepolia & Base Sepolia (coming soon):**  
`Source Bridge: 0x…`  
`Destination Bridge: 0x…`

---

## 🧠 Why a Bridge Matters for Blockchain Games

| Challenge | Solution in this Project |
|-----------|--------------------------|
| Players are split across different chains | Assets can move freely between Arbitrum, Base, etc. |
| Duplicate items break scarcity | Lock‑and‑mint ensures only one copy exists at a time |
| A central server would be a single point of failure | Off‑chain relayer signs EIP‑712 authorisations — fully on‑chain verification |
| Replay attacks (using the same signature twice) | Every signature is bound to a unique nonce |

---

## 🛠 Tech Stack

- **Solidity** ^0.8.20
- **OpenZeppelin** (ERC‑721, AccessControl, EIP‑712, ECDSA)
- **Hardhat** + Ethers v6
- **Two‑chain local simulation** (no external network needed for tests)
- **Arbitrum Sepolia & Base Sepolia** (target testnets)

---

## 📁 Project Structure
contracts/
GameItemNFT.sol # ERC‑721 with minter role
MockBridge.sol # Lock/mint bridge with EIP‑712 relayer signatures
test/
Bridge.test.js # Full cross‑chain flow simulation
scripts/
localDemo.js # Interactive demo of the lock‑and‑mint cycle
hardhat.config.js

---

## 🔒 Security & Design Decisions

| Design Choice | Why |
|---------------|-----|
| **Lock‑and‑mint** over burn‑and‑mint | Reversible: if the bridge supports unlocking, the original NFT can be returned. |
| **EIP‑712 signatures** | Structured data signing prevents signature reuse across contracts and chains. |
| **Relayer as a trusted signer** | Simplifies the off‑chain component; can be upgraded to a decentralised relayer network. |
| **Nonce per user** | Every lock increments a nonce included in the signature — no replay attacks. |
| **AccessControl** | Only the bridge has `MINTER_ROLE` on the destination NFT contract. |
| **Domain separator** | Tied to chain ID and contract address — a signature on chain A cannot be replayed on chain B. |

---

## 🧪 Running the Project

```bash
npm install
npx hardhat compile
npx hardhat test                  # 1 test – full lock‑and‑mint flow
npx hardhat run scripts/localDemo.js 

---

## 🚀 Final Push

After adding these files, commit and push:

```bash
git add .gitignore .env.example README.md
git commit -m "chore: add .gitignore, .env.example, and polished README"
git push  # interactive local demo