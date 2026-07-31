const { ethers } = require("hardhat");

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 GAS BENCHMARK: For-Loop Optimization");
  console.log("=".repeat(60) + "\n");

  // Deploy the Test contract
  console.log("📦 Deploying Test contract...");
  const Test = await ethers.getContractFactory("Test");
  const test = await Test.deploy();
  await test.waitForDeployment();
  const contractAddress = await test.getAddress();
  console.log(`✅ Contract deployed at: ${contractAddress}\n`);

  // -------- CONFIGURATION: Test multiple array sizes --------
  // This shows how the optimization scales linearly
  const ARRAY_SIZES = [10, 50, 100, 200, 500, 1000];

  console.log("📊 Running benchmarks for multiple array sizes...\n");
  console.log("-".repeat(60));

  // Store results for summary table
  const results = [];

  for (const size of ARRAY_SIZES) {
    console.log(`\n🔢 Array Size: ${size}`);

    // Generate test data: [1, 2, 3, ..., size]
    const data = Array.from({ length: size }, (_, i) => i + 1);

    // ------ 1. Estimate Gas for NON-OPTIMIZED version ------
    console.log(
      `  ⏳ Estimating NON-OPTIMIZED (data.length each iteration)...`,
    );
    const gasNonOpt = await test.sumArrayNonOptimized.estimateGas(data);

    // ------ 2. Estimate Gas for OPTIMIZED version ------
    console.log(`  ⏳ Estimating OPTIMIZED (cached length + unchecked)...`);
    const gasOpt = await test.sumArrayOptimized.estimateGas(data);

    // ------ 3. Calculate Savings (BigInt-safe conversion) ------
    // Gas values are ~65k, well below Number.MAX_SAFE_INTEGER (9e15),
    // so conversion to Number is safe.
    const nonOptNum = Number(gasNonOpt);
    const optNum = Number(gasOpt);
    const saved = nonOptNum - optNum;
    const percentage = ((saved / nonOptNum) * 100).toFixed(2);

    // Display results for this size
    console.log(`  ❌ Non-Optimized: ${nonOptNum.toLocaleString()} gas`);
    console.log(`  ✅ Optimized:     ${optNum.toLocaleString()} gas`);
    console.log(
      `  ⛽ Savings:       ${saved.toLocaleString()} gas (${percentage}% reduction)`,
    );

    // Store for summary
    results.push({ size, nonOpt: nonOptNum, opt: optNum, saved, percentage });
  }

  // -------- SUMMARY TABLE --------
  console.log("\n" + "=".repeat(60));
  console.log("📈 SUMMARY: Gas Cost vs. Array Size");
  console.log("=".repeat(60));

  console.log("\n  Size  | Non-Optimized | Optimized | Saved   | % Saved");
  console.log("  ------|---------------|-----------|---------|--------");
  for (const r of results) {
    const sizeStr = String(r.size).padStart(6);
    const nonStr = String(r.nonOpt.toLocaleString()).padStart(13);
    const optStr = String(r.opt.toLocaleString()).padStart(9);
    const savedStr = String(r.saved.toLocaleString()).padStart(7);
    const pctStr = String(r.percentage).padStart(6);
    console.log(
      `  ${sizeStr} | ${nonStr} | ${optStr} | ${savedStr} | ${pctStr}%`,
    );
  }

  // -------- FINANCIAL PERSPECTIVE (Optional) --------
  console.log("\n" + "=".repeat(60));
  console.log("💸 FINANCIAL PERSPECTIVE (Approximate)");
  console.log("=".repeat(60));

  const gasPriceGwei = 30; // Typical gas price in Gwei
  const ethPriceUSD = 3000; // Approximate ETH price in USD

  // Use the 100-item result as a baseline
  const hundredItem = results.find((r) => r.size === 100);
  if (hundredItem) {
    const savedEth = (hundredItem.saved * gasPriceGwei) / 1e9;
    const savedUSD = savedEth * ethPriceUSD;

    console.log(`
  📊 For a 100-item array at ${gasPriceGwei} Gwei gas price:
     ⛽ Gas Saved:     ${hundredItem.saved.toLocaleString()} gas
     💰 ETH Saved:     ${savedEth.toFixed(8)} ETH
     💵 USD Saved:     $${savedUSD.toFixed(6)} per function call

  📈 Scaling: The savings grow linearly with array size.
     At 1,000 items: ~${(savedUSD * 10).toFixed(6)} USD saved per call.
    `);
  }

  // -------- RECOMMENDATION --------
  console.log("\n" + "=".repeat(60));
  console.log("🎯 RECOMMENDATION");
  console.log("=".repeat(60));
  console.log(`
  ✅ Always use 'unchecked { i++; }' when the loop bound is finite
     and overflow is mathematically impossible.

  ✅ Cache 'data.length' to avoid reading from calldata each iteration.

  ⚠️  Only use unchecked on the iterator—keep the body arithmetic safe!
     (total += data[i]) should remain checked to prevent overflow.
  `);

  console.log("=".repeat(60));
  console.log("🏁 Benchmark completed successfully!");
  console.log("=".repeat(60) + "\n");
}

// -------- EXECUTE --------
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
