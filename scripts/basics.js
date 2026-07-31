const { ethers } = require("hardhat");

async function main() {
  // ========== FIX: Define the provider ==========
  // This connects to your local Hardhat network (100% fake ETH, safe for testing)
  const provider = ethers.provider;

  // 1. Create a wallet (private key + address)
  const wallet = ethers.Wallet.createRandom();
  console.log("Private Key:", wallet.privateKey);
  console.log("Address:", wallet.address);

  // 2. Sign a message (proves you own the private key)
  const message = "I am the owner";
  const signature = await wallet.signMessage(message);
  console.log("Signature:", signature);

  // 3. Verify the signature (Recover the signer address)
  const recoveredAddress = ethers.verifyMessage(message, signature);
  console.log("Recovered Address:", recoveredAddress);
  console.log("Signature is valid:", recoveredAddress === wallet.address);

  // ========== DEMO: Using the provider safely (NO real assets) ==========
  console.log("\n--- Testing Provider (Local Hardhat Network) ---");

  // Get the current block number (free, no transaction)
  const blockNumber = await provider.getBlockNumber();
  console.log("Current Local Block Number:", blockNumber);

  // Get a random Hardhat test account (pre-funded with 10,000 fake ETH)
  const signers = await ethers.getSigners();
  const testAccount = signers[0];
  console.log("Test Account Address:", testAccount.address);

  // Get the balance of that test account (fake ETH)
  const balance = await provider.getBalance(testAccount.address);
  console.log("Test Account Balance:", ethers.formatEther(balance), "fake ETH");

  // Get the current gas price (fake gas price)
  const feeData = await provider.getFeeData();
  console.log(
    "Current Gas Price:",
    ethers.formatUnits(feeData.gasPrice, "gwei"),
    "gwei (fake)",
  );

  // Get the transaction count (nonce) for the wallet we created earlier
  // Note: This wallet has no transactions yet, so nonce = 0
  const nonce = await provider.getTransactionCount(wallet.address);
  console.log("Nonce for our random wallet:", nonce);
}

// Execute the async function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
