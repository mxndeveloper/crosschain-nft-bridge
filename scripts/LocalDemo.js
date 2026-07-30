const hre = require("hardhat");

async function main() {
  const [deployer, relayer, user] = await hre.ethers.getSigners();

  // Deploy NFTs
  const NFT = await hre.ethers.getContractFactory("GameItemNFT");
  const chainANFT = await NFT.deploy("ChainA Item", "ITEMA");
  const chainBNFT = await NFT.deploy("ChainB Item", "ITEMB");

  // Deploy Bridges
  const Bridge = await hre.ethers.getContractFactory("MockBridge");
  const chainABridge = await Bridge.deploy(chainANFT.target, relayer.address);
  const chainBBridge = await Bridge.deploy(chainBNFT.target, relayer.address);

  // Grant minting rights
  const MINTER = await chainANFT.MINTER_ROLE();
  await chainANFT.grantRole(MINTER, chainABridge.target);
  await chainBNFT.grantRole(MINTER, chainBBridge.target);

  // Mint a token on Chain A to user
  await chainANFT.safeMint(user.address);
  await chainANFT.connect(user).approve(chainABridge.target, 0);

  console.log("Token 0 minted on Chain A to", user.address);

  // Lock
  const lockTx = await chainABridge.connect(user).lock(0);
  const lockReceipt = await lockTx.wait();
  const lockEvent = lockReceipt.logs.find((l) => l.fragment?.name === "Locked");
  const [, tokenId, nonce] = lockEvent.args;
  console.log("Locked on Chain A, nonce:", nonce.toString());

  // Relayer signs
  const domain = {
    name: "MockBridge",
    version: "1",
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    verifyingContract: chainBBridge.target,
  };
  const types = {
    Mint: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };
  const value = { to: user.address, tokenId: tokenId, nonce: nonce };
  const signature = await relayer.signTypedData(domain, types, value);

  // Mint on Chain B
  await chainBBridge.mint(user.address, tokenId, nonce, signature);
  console.log("Minted on Chain B to", user.address);

  const ownerA = await chainANFT.ownerOf(0);
  const ownerB = await chainBNFT.ownerOf(0);
  console.log("Owner on Chain A:", ownerA); // bridge
  console.log("Owner on Chain B:", ownerB); // user
  console.log("Cross-chain transfer successful!");
}

main().catch(console.error);
