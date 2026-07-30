const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Cross‑Chain NFT Bridge", function () {
  let relayerSigner, user, chainABridge, chainBBridge, chainANFT, chainBNFT;

  before(async function () {
    const accounts = await ethers.getSigners();
    relayerSigner = accounts[1]; // trusted relayer key
    user = accounts[2]; // player

    // Deploy NFTs for Chain A and Chain B
    const NFTFactory = await ethers.getContractFactory("GameItemNFT");
    chainANFT = await NFTFactory.deploy("ChainA Item", "ITEMA");
    chainBNFT = await NFTFactory.deploy("ChainB Item", "ITEMB");

    // Deploy bridges
    const BridgeFactory = await ethers.getContractFactory("MockBridge");
    chainABridge = await BridgeFactory.deploy(
      chainANFT.target,
      relayerSigner.address,
    );
    chainBBridge = await BridgeFactory.deploy(
      chainBNFT.target,
      relayerSigner.address,
    );

    // Grant MINTER_ROLE to bridges on their respective NFT contracts
    const MINTER_ROLE = await chainANFT.MINTER_ROLE();
    await chainANFT.grantRole(MINTER_ROLE, chainABridge.target);
    await chainBNFT.grantRole(MINTER_ROLE, chainBBridge.target);

    // Mint an NFT to the user on Chain A
    await chainANFT.safeMint(user.address); // tokenId = 0
    await chainANFT.connect(user).approve(chainABridge.target, 0);
  });

  it("should lock an NFT on Chain A and mint on Chain B with relayer signature", async function () {
    // 1. Lock on Chain A
    const lockTx = await chainABridge.connect(user).lock(0);
    const receipt = await lockTx.wait();

    // Extract the nonce from the Locked event
    const event = receipt.logs.find((l) => l.fragment?.name === "Locked");
    const [sender, tokenId, nonce] = event.args;
    expect(sender).to.equal(user.address);
    expect(tokenId).to.equal(0);

    // 2. Relayer signs the EIP‑712 mint authorisation
    const domain = {
      name: "MockBridge",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: chainBBridge.target,
    };
    const types = {
      Mint: [
        { name: "to", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    };
    const value = {
      to: user.address,
      tokenId: tokenId,
      nonce: nonce,
    };
    const signature = await relayerSigner.signTypedData(domain, types, value);

    // 3. Call mint on Chain B
    await chainBBridge
      .connect(user)
      .mint(user.address, tokenId, nonce, signature);

    // 4. Verify user owns the NFT on Chain B
    const owner = await chainBNFT.ownerOf(0);
    expect(owner).to.equal(user.address);

    // 5. Verify the NFT on Chain A is now held by the bridge (locked)
    const chainAOwner = await chainANFT.ownerOf(0);
    expect(chainAOwner).to.equal(chainABridge.target);
  });
});
