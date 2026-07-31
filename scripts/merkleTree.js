const { ethers } = require("hardhat");

// =============================================
// 1. HELPER FUNCTIONS (The core logic)
// =============================================

// Hashes a single transaction (string -> bytes32)
function hashTransaction(txData) {
  // Converts the string to UTF-8 bytes, then hashes it with keccak256
  return ethers.keccak256(ethers.toUtf8Bytes(txData));
}

// Hashes two child nodes together (standard Merkle concatenation)
function hashPair(left, right) {
  // Matches Solidity's keccak256(abi.encodePacked(left, right))
  return ethers.solidityPackedKeccak256(["bytes32", "bytes32"], [left, right]);
}

// Builds the Merkle Root from an array of transaction data
function getMerkleRoot(transactions) {
  if (!transactions || transactions.length === 0) {
    throw new Error("Cannot build Merkle tree for an empty array");
  }

  // Step 1: Hash all leaves
  let level = transactions.map((tx) => hashTransaction(tx));
  console.log(
    "  📄 Leaves (hashed):",
    level.map((h) => h.slice(0, 10) + "..."),
  );

  // Step 2: Keep hashing pairs until we get 1 root
  while (level.length > 1) {
    let nextLevel = [];

    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) {
        // Even number: hash the two siblings
        const combined = hashPair(level[i], level[i + 1]);
        nextLevel.push(combined);
      } else {
        // Odd number: Option A) Propagate up (simpler)
        // Option B) Hash with itself (standard in OpenZeppelin)
        // We'll use Option B to match common smart contract libraries:
        const combined = hashPair(level[i], level[i]);
        nextLevel.push(combined);
      }
    }

    console.log(
      "  🔼 Next Level:",
      nextLevel.map((h) => h.slice(0, 10) + "..."),
    );
    level = nextLevel;
  }

  return level[0]; // The final Merkle Root
}

// =============================================
// 2. TEST SUITE (Runs when you execute the script)
// =============================================

async function main() {
  console.log("\n🚀 Starting Merkle Tree Test Suite\n");
  console.log("====================================\n");

  // ---------- TEST 1: Even number of transactions (4) ----------
  const tx1 = [
    "Transfer 5 ETH to Alice",
    "Transfer 2 ETH to Bob",
    "Transfer 1 ETH to Charlie",
    "Transfer 10 ETH to Dave",
  ];
  console.log("✅ TEST 1 - Even transactions (4):");
  console.log("   Input:", tx1);
  const root1 = getMerkleRoot(tx1);
  console.log("   🌳 Merkle Root:", root1);
  console.log("\n------------------------------------\n");

  // ---------- TEST 2: Odd number of transactions (3) ----------
  const tx2 = ["Mint NFT #1", "Mint NFT #2", "Mint NFT #3"];
  console.log("✅ TEST 2 - Odd transactions (3) - auto-duplicates last leaf:");
  console.log("   Input:", tx2);
  const root2 = getMerkleRoot(tx2);
  console.log("   🌳 Merkle Root:", root2);
  console.log("\n------------------------------------\n");

  // ---------- TEST 3: Realistic Transaction Hashes (Hex) ----------
  const tx3 = [
    "0xaaaabbbbccccddddeeeeffff0000111122223333444455556666777788889999",
    "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
    "0xaaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666aaaa7777bbbb8888",
    "0x1111aaaa2222bbbb3333cccc4444dddd5555eeee6666ffff7777aaaa8888bbbb",
  ];
  console.log("✅ TEST 3 - Realistic Hex Transaction Hashes (4):");
  console.log("   Input:", tx3);
  const root3 = getMerkleRoot(tx3);
  console.log("   🌳 Merkle Root:", root3);
  console.log("\n------------------------------------\n");

  // ---------- TEST 4: Avalanche Effect (Change 1 character) ----------
  const tx4 = [...tx3]; // Clone the array
  tx4[0] = "0xffffbbbbccccddddeeeeffff0000111122223333444455556666777788889999"; // Changed first hash
  console.log("✅ TEST 4 - Avalanche effect (change 1 character in first TX):");
  console.log("   Original Root:", root3);
  const root4 = getMerkleRoot(tx4);
  console.log("   Mutated Root: ", root4);
  console.log(
    "   🔥 Roots are different?",
    root3 !== root4 ? "YES (Avalanche!)" : "NO (Bug!)",
  );
  console.log("\n====================================");
  console.log("🏁 All tests completed successfully!");
}

// =============================================
// 3. EXECUTE
// =============================================
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
