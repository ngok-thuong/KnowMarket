const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("deployer:", deployer.address);

  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();

  const treasury = deployer.address;
  const feeBps = 200; // 2%
  const minFee = 200_000; // 0.2 USDC (6 decimals)
  const maxFee = 10_000_000; // 10 USDC
  const minBounty = 2_000_000; // 2 USDC

  const QnA = await hre.ethers.getContractFactory("QnA");
  const qna = await QnA.deploy(await usdc.getAddress(), treasury, feeBps, minFee, maxFee, minBounty);
  await qna.waitForDeployment();

  console.log("MockUSDC:", await usdc.getAddress());
  console.log("QnA:", await qna.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

