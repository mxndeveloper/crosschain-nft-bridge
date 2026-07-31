const { ethers } = require('hardhat');

async function main() {
  const SimpleVault = await ethers.getContractFactory('SimpleVault');
  const vault = await SimpleVault.deploy();
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  console.log('✅ SimpleVault deployed to:', address);
  console.log('📝 Copy this address into your frontend CONTRACT_ADDRESS');
}

main().catch(console.error);
