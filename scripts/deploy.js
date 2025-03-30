// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  
  // Log initial balance
  const initialBalance = await deployer.getBalance();
  console.log(`Account balance: ${ethers.utils.formatEther(initialBalance)} ETH`);

  // Parameters for TokenSale contract
  const bondMaturityDays = 180; // 6 months
  const bondYieldBasisPoints = 850; // 8.5%
  const warrantStrikePrice = ethers.utils.parseEther("0.8"); // 0.8 ETH per equity token
  const treasuryAddress = deployer.address; // Use deployer address as treasury for now

  // Deploy TokenSale contract
  console.log("Deploying TokenSale contract...");
  const TokenSale = await ethers.getContractFactory("TokenSale");
  const tokenSale = await TokenSale.deploy(
    bondMaturityDays,
    bondYieldBasisPoints,
    warrantStrikePrice,
    treasuryAddress
  );
  await tokenSale.deployed();
  console.log(`TokenSale deployed to: ${tokenSale.address}`);

  // Get addresses of the token contracts created by TokenSale
  const bondTokenAddress = await tokenSale.bondToken();
  const warrantTokenAddress = await tokenSale.warrantToken();
  const equityTokenAddress = await tokenSale.equityToken();

  console.log(`BondToken deployed to: ${bondTokenAddress}`);
  console.log(`WarrantToken deployed to: ${warrantTokenAddress}`);
  console.log(`EquityToken deployed to: ${equityTokenAddress}`);

  // Fund the TokenSale contract for bond redemptions
  console.log("Funding TokenSale contract for bond redemptions...");
  const fundTx = await deployer.sendTransaction({
    to: tokenSale.address,
    value: ethers.utils.parseEther("10") // Fund with 10 ETH
  });
  await fundTx.wait();
  console.log(`TokenSale contract funded with 10 ETH`);

  // Log final balance
  const finalBalance = await deployer.getBalance();
  console.log(`Final account balance: ${ethers.utils.formatEther(finalBalance)} ETH`);
  console.log(`Deployment gas cost: ${ethers.utils.formatEther(initialBalance.sub(finalBalance))} ETH`);

  console.log("Deployment complete!");

  // Return all deployed contract addresses for verification
  return {
    tokenSale: tokenSale.address,
    bondToken: bondTokenAddress,
    warrantToken: warrantTokenAddress,
    equityToken: equityTokenAddress
  };
}

// Execute deployment
main()
  .then((deployedContracts) => {
    console.log("Contract addresses:", deployedContracts);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });