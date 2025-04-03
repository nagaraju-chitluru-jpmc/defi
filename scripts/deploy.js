// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting Diamond Pattern deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  
  // Log initial balance
  const initialBalance = await deployer.getBalance();
  console.log(`Account balance: ${ethers.utils.formatEther(initialBalance)} ETH`);

  // Parameters for tokens and token sale
  const bondMaturityDays = 180; // 6 months
  const bondYieldBasisPoints = 850; // 8.5%
  const warrantStrikePrice = ethers.utils.parseEther("0.8"); // 0.8 ETH per equity token
  const treasuryAddress = deployer.address; // Use deployer address as treasury for now
  const authorizedShares = ethers.utils.parseEther("1000000"); // 1 million authorized shares

  console.log("Deploying Diamond Pattern contracts...");

  // Step 1: Deploy the Diamond contracts
  console.log("Deploying Diamond contracts...");
  const Diamond = await ethers.getContractFactory("Diamond");
  
  const bondDiamond = await Diamond.deploy(deployer.address);
  await bondDiamond.deployed();
  console.log(`Bond Diamond deployed to: ${bondDiamond.address}`);
  
  const warrantDiamond = await Diamond.deploy(deployer.address);
  await warrantDiamond.deployed();
  console.log(`Warrant Diamond deployed to: ${warrantDiamond.address}`);
  
  const equityDiamond = await Diamond.deploy(deployer.address);
  await equityDiamond.deployed();
  console.log(`Equity Diamond deployed to: ${equityDiamond.address}`);
  
  const tokenSaleDiamond = await Diamond.deploy(deployer.address);
  await tokenSaleDiamond.deployed();
  console.log(`Token Sale Diamond deployed to: ${tokenSaleDiamond.address}`);

  // Step 2: Deploy the facets
  console.log("Deploying facets...");
  
  const BondTokenFacet = await ethers.getContractFactory("BondTokenFacet");
  const bondTokenFacet = await BondTokenFacet.deploy();
  await bondTokenFacet.deployed();
  console.log(`Bond Token Facet deployed to: ${bondTokenFacet.address}`);
  
  const WarrantTokenFacet = await ethers.getContractFactory("WarrantTokenFacet");
  const warrantTokenFacet = await WarrantTokenFacet.deploy();
  await warrantTokenFacet.deployed();
  console.log(`Warrant Token Facet deployed to: ${warrantTokenFacet.address}`);
  
  const EquityTokenFacet = await ethers.getContractFactory("EquityTokenFacet");
  const equityTokenFacet = await EquityTokenFacet.deploy();
  await equityTokenFacet.deployed();
  console.log(`Equity Token Facet deployed to: ${equityTokenFacet.address}`);
  
  const TokenSaleFacet = await ethers.getContractFactory("TokenSaleFacet");
  const tokenSaleFacet = await TokenSaleFacet.deploy();
  await tokenSaleFacet.deployed();
  console.log(`Token Sale Facet deployed to: ${tokenSaleFacet.address}`);

  // Step 3: Get diamond cut interface for each diamond
  const bondDiamondCut = await ethers.getContractAt("IDiamondCut", bondDiamond.address);
  const warrantDiamondCut = await ethers.getContractAt("IDiamondCut", warrantDiamond.address);
  const equityDiamondCut = await ethers.getContractAt("IDiamondCut", equityDiamond.address);
  const tokenSaleDiamondCut = await ethers.getContractAt("IDiamondCut", tokenSaleDiamond.address);

  // Step 4: Add Bond Token facet to Bond Diamond
  console.log("Adding Bond Token facet to Bond Diamond...");
  
  // Define the function selectors for BondTokenFacet
  const bondTokenSelectors = [
    "name()",
    "symbol()",
    "decimals()",
    "totalSupply()",
    "balanceOf(address)",
    "transfer(address,uint256)",
    "allowance(address,address)",
    "approve(address,uint256)",
    "transferFrom(address,address,uint256)",
    "increaseAllowance(address,uint256)",
    "decreaseAllowance(address,uint256)",
    "mint(address,uint256)",
    "burn(uint256)",
    "burnFrom(address,uint256)",
    "issuanceTimestamp()",
    "maturityPeriod()",
    "yieldBasisPoints()",
    "bondPurchaseTimestamp(address)",
    "bondAmounts(address)",
    "hasBondMatured(address)",
    "calculateRedemptionAmount(uint256)",
    "timeToMaturity(address)",
    "getAllBondHolders()",
    "getBondHolderCount()"
  ].map(selector => ethers.utils.id(selector).substring(0, 10));
  
  // FIX: Pass proper empty bytes for calldata - use "0x" as a string, not bytes
  await bondDiamondCut.diamondCut([{
    facetAddress: bondTokenFacet.address,
    action: 0, // Add
    functionSelectors: bondTokenSelectors
  }], ethers.constants.AddressZero, "0x");
  console.log("Bond Token selectors added to Bond Diamond");
  
  // Step 5: Initialize the Bond Token facet
  console.log("Initializing Bond Token facet...");
  const bondTokenInitData = bondTokenFacet.interface.encodeFunctionData("initializeBondToken", [
    "Company Bond Token",
    "CBOND",
    bondMaturityDays,
    bondYieldBasisPoints
  ]);
  
  await bondDiamondCut.diamondCut(
    [], 
    bondTokenFacet.address, 
    bondTokenInitData
  );
  console.log("Bond Token facet initialized");

  // Step 6: Add Warrant Token facet to Warrant Diamond
  console.log("Adding Warrant Token facet to Warrant Diamond...");
  
  // Define the function selectors for WarrantTokenFacet
  const warrantTokenSelectors = [
    "name()",
    "symbol()",
    "decimals()",
    "totalSupply()",
    "balanceOf(address)",
    "transfer(address,uint256)",
    "allowance(address,address)",
    "approve(address,uint256)",
    "transferFrom(address,address,uint256)",
    "increaseAllowance(address,uint256)",
    "decreaseAllowance(address,uint256)",
    "mint(address,uint256)",
    "burn(uint256)",
    "burnFrom(address,uint256)",
    "strikePrice()",
    "expirationTimestamp()",
    "equityTokenAddress()",
    "warrantPrice()",
    "isWarrantHolder(address)",
    "warrantPurchaseTimestamp(address)",
    "warrantAmounts(address)",
    "setEquityTokenAddress(address)",
    "setWarrantPrice(uint256)",
    "updateStrikePrice(uint256)",
    "extendExpiration(uint256)",
    "hasExpired()",
    "timeToExpiration()",
    "calculateExerciseCost(uint256)",
    "getAllWarrantHolders()",
    "getWarrantHolderCount()"
  ].map(selector => ethers.utils.id(selector).substring(0, 10));
  
  // FIX: Use "0x" string instead of arrayify
  await warrantDiamondCut.diamondCut([{
    facetAddress: warrantTokenFacet.address,
    action: 0, // Add
    functionSelectors: warrantTokenSelectors
  }], ethers.constants.AddressZero, "0x");
  console.log("Warrant Token selectors added to Warrant Diamond");
  
  // Step 7: Initialize the Warrant Token facet
  console.log("Initializing Warrant Token facet...");
  const warrantTokenInitData = warrantTokenFacet.interface.encodeFunctionData("initializeWarrantToken", [
    "Company Warrant Token",
    "CWARR",
    warrantStrikePrice,
    365 * 3 // 3-year expiration
  ]);
  
  await warrantDiamondCut.diamondCut(
    [], 
    warrantTokenFacet.address, 
    warrantTokenInitData
  );
  console.log("Warrant Token facet initialized");

  // Step 8: Add Equity Token facet to Equity Diamond
  console.log("Adding Equity Token facet to Equity Diamond...");
  
  // Define the function selectors for EquityTokenFacet
  const equityTokenSelectors = [
    "name()",
    "symbol()",
    "decimals()",
    "totalSupply()",
    "balanceOf(address)",
    "transfer(address,uint256)",
    "allowance(address,address)",
    "approve(address,uint256)",
    "transferFrom(address,address,uint256)",
    "increaseAllowance(address,uint256)",
    "decreaseAllowance(address,uint256)",
    "mint(address,uint256)",
    "totalAuthorizedShares()"
  ].map(selector => ethers.utils.id(selector).substring(0, 10));
  
  // FIX: Use "0x" string instead of arrayify
  await equityDiamondCut.diamondCut([{
    facetAddress: equityTokenFacet.address,
    action: 0, // Add
    functionSelectors: equityTokenSelectors
  }], ethers.constants.AddressZero, "0x");
  console.log("Equity Token selectors added to Equity Diamond");
  
  // Step 9: Initialize the Equity Token facet
  console.log("Initializing Equity Token facet...");
  const equityTokenInitData = equityTokenFacet.interface.encodeFunctionData("initializeEquityToken", [
    "Company Equity Token",
    "CEQUITY",
    authorizedShares
  ]);
  
  await equityDiamondCut.diamondCut(
    [], 
    equityTokenFacet.address, 
    equityTokenInitData
  );
  console.log("Equity Token facet initialized");

  // Step 10: Set equity token address in warrant token
  console.log("Setting equity token address in warrant token...");
  const warrantToken = await ethers.getContractAt("WarrantTokenFacet", warrantDiamond.address);
  await warrantToken.setEquityTokenAddress(equityDiamond.address);
  console.log("Equity token address set in warrant token");

  // Step 11: Add Token Sale facet to Token Sale Diamond
  console.log("Adding Token Sale facet to Token Sale Diamond...");
  
  // Define the function selectors for TokenSaleFacet
  const tokenSaleSelectors = [
    "bondTokenDiamond()",
    "warrantTokenDiamond()",
    "equityTokenDiamond()",
    "bondMaturityPeriod()",
    "bondYieldPercentage()",
    "warrantStrikePrice()",
    "treasury()",
    "bondSaleActive()",
    "warrantSaleActive()",
    "minBondPurchase()",
    "maxBondPurchase()",
    "minWarrantPurchase()",
    "maxWarrantPurchase()",
    "totalFundsRaised()",
    "activeBondCount()",
    "totalWarrantsIssued()",
    "totalEquityIssued()",
    "totalBondRedemptions()",
    "totalWarrantsExercised()",
    "investors(address)",
    "purchaseBonds()",
    "purchaseWarrants()",
    "redeemBonds(uint256)",
    "exerciseWarrants(uint256)",
    "fundBondRedemption()",
    "toggleBondSale(bool)",
    "toggleWarrantSale(bool)",
    "updateBondPurchaseLimits(uint256,uint256)",
    "updateWarrantPurchaseLimits(uint256,uint256)",
    "updateTreasury(address)",
    "getInvestorCount()",
    "getAllInvestors()",
    "getInvestorDetails(address)",
    "updateTokenAddresses(address,address,address)"
  ].map(selector => ethers.utils.id(selector).substring(0, 10));
  
  // Add fallback function selector for receive() function
  //tokenSaleSelectors.push("0x");
  
  // FIX: Use "0x" string instead of arrayify
  await tokenSaleDiamondCut.diamondCut([{
    facetAddress: tokenSaleFacet.address,
    action: 0, // Add
    functionSelectors: tokenSaleSelectors
  }], ethers.constants.AddressZero, "0x");
  console.log("Token Sale selectors added to Token Sale Diamond");
  
  // Step 12: Initialize the Token Sale facet
  console.log("Initializing Token Sale facet...");
  const tokenSaleInitData = tokenSaleFacet.interface.encodeFunctionData("initializeTokenSale", [
    bondDiamond.address,
    warrantDiamond.address,
    equityDiamond.address,
    bondMaturityDays,
    bondYieldBasisPoints,
    warrantStrikePrice,
    treasuryAddress
  ]);
  
  await tokenSaleDiamondCut.diamondCut(
    [], 
    tokenSaleFacet.address, 
    tokenSaleInitData
  );
  console.log("Token Sale facet initialized");

  // Step 13: Fund the Token Sale Diamond for bond redemptions
  console.log("Funding Token Sale Diamond for bond redemptions...");
  const fundTx = await deployer.sendTransaction({
    to: tokenSaleDiamond.address,
    value: ethers.utils.parseEther("10") // Fund with 10 ETH
  });
  await fundTx.wait();
  console.log(`Token Sale Diamond funded with 10 ETH`);

  // Log final balance
  const finalBalance = await deployer.getBalance();
  console.log(`Final account balance: ${ethers.utils.formatEther(finalBalance)} ETH`);
  console.log(`Deployment gas cost: ${ethers.utils.formatEther(initialBalance.sub(finalBalance))} ETH`);

  console.log("Diamond Pattern deployment complete!");

  // Return all deployed contract addresses for verification
  return {
    bondDiamond: bondDiamond.address,
    warrantDiamond: warrantDiamond.address,
    equityDiamond: equityDiamond.address,
    tokenSaleDiamond: tokenSaleDiamond.address,
    bondTokenFacet: bondTokenFacet.address,
    warrantTokenFacet: warrantTokenFacet.address,
    equityTokenFacet: equityTokenFacet.address,
    tokenSaleFacet: tokenSaleFacet.address
  };
}

// Execute deployment
main()
  .then((deployedContracts) => {
    console.log("Contract addresses:", deployedContracts);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Diamond Pattern deployment failed:", error);
    process.exit(1);
  });