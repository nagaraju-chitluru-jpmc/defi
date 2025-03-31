// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./BondToken.sol";
import "./WarrantToken.sol";
import "./EquityToken.sol";

/**
 * @title TokenSale
 * @dev Contract for selling and managing bond and warrant tokens
 */
contract TokenSale is Ownable {
    // Token contracts
    BondToken public bondToken;
    WarrantToken public warrantToken;
    EquityToken public equityToken;
    
    // Bond parameters
    uint256 public bondMaturityPeriod; // in days
    uint256 public bondYieldPercentage; // in basis points
    
    // Warrant parameters
    uint256 public warrantStrikePrice;
    
    // Treasury address
    address payable public treasury;
    
    // Stats
    uint256 public totalFundsRaised;
    uint256 public activeBondCount;
    uint256 public totalWarrantsIssued;
    uint256 public totalEquityIssued;
    
    // Events
    event BondsPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event WarrantsPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event BondsRedeemed(address indexed holder, uint256 amount, uint256 payout);
    event WarrantsExercised(address indexed holder, uint256 amount, uint256 cost);
    
    /**
     * @dev Constructor to set up the token sale
     * @param _bondMaturityDays Bond maturity period in days
     * @param _bondYieldBasisPoints Bond yield in basis points
     * @param _warrantStrikePrice Warrant strike price in wei
     * @param _treasury Treasury address to receive funds
     */
    constructor(
        uint256 _bondMaturityDays,
        uint256 _bondYieldBasisPoints,
        uint256 _warrantStrikePrice,
        address payable _treasury
    ) {
        bondMaturityPeriod = _bondMaturityDays;
        bondYieldPercentage = _bondYieldBasisPoints;
        warrantStrikePrice = _warrantStrikePrice;
        treasury = _treasury;
        
        // Create token contracts
        bondToken = new BondToken("Company Bond Token", "CBOND", _bondMaturityDays, _bondYieldBasisPoints);
        warrantToken = new WarrantToken("Company Warrant Token", "CWARR", _warrantStrikePrice, 365 * 3); // 3-year expiration
        equityToken = new EquityToken("Company Equity Token", "CEQUITY", 1000000 * 10**18); // 1 million authorized shares
        
        // Set equity token address in warrant contract
        warrantToken.setEquityTokenAddress(address(equityToken));
         _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Purchase bond tokens with ETH
     */
    function purchaseBonds() external payable {
        require(msg.value > 0, "Must send ETH to purchase bonds");
        
        // 1 ETH = 1 Bond Token
        uint256 bondAmount = msg.value;
        
        // Mint bond tokens to the buyer
        bondToken.mint(msg.sender, bondAmount);
        
        // Update stats
        totalFundsRaised += msg.value;
        activeBondCount += 1;
        
        // Transfer ETH to treasury
        (bool sent, ) = treasury.call{value: msg.value}("");
        require(sent, "Failed to send ETH to treasury");
        
        emit BondsPurchased(msg.sender, bondAmount, msg.value);
    }
    
    /**
     * @dev Purchase warrant tokens with ETH
     */
    function purchaseWarrants() external payable {
        require(msg.value > 0, "Must send ETH to purchase warrants");
        
        // Calculate warrant amount (1 warrant costs 0.1 ETH)
        uint256 warrantPrice = 0.1 ether;
        uint256 warrantAmount = (msg.value * 10**18) / warrantPrice;
        
        // Mint warrant tokens to the buyer
        warrantToken.mint(msg.sender, warrantAmount);
        
        // Update stats
        totalFundsRaised += msg.value;
        totalWarrantsIssued += warrantAmount;
        
        // Transfer ETH to treasury
        (bool sent, ) = treasury.call{value: msg.value}("");
        require(sent, "Failed to send ETH to treasury");
        
        emit WarrantsPurchased(msg.sender, warrantAmount, msg.value);
    }
    
    /**
     * @dev Redeem mature bond tokens
     * @param amount Amount of bond tokens to redeem
     */
    function redeemBonds(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(bondToken.balanceOf(msg.sender) >= amount, "Insufficient bond balance");
        require(bondToken.hasBondMatured(msg.sender), "Bonds have not yet matured");
        
        // Calculate redemption amount (principal + yield)
        uint256 redemptionAmount = bondToken.calculateRedemptionAmount(amount);
        
        // Burn the bond tokens
        bondToken.burnFrom(msg.sender, amount);
        
        // Update stats
        activeBondCount -= 1;
        
        // Transfer redemption amount to the bond holder
        require(address(this).balance >= redemptionAmount, "Insufficient contract balance");
        payable(msg.sender).transfer(redemptionAmount);
        
        emit BondsRedeemed(msg.sender, amount, redemptionAmount);
    }
    
    /**
     * @dev Exercise warrant tokens to purchase equity
     * @param amount Amount of warrant tokens to exercise
     */
    function exerciseWarrants(uint256 amount) external payable {
        require(amount > 0, "Amount must be greater than 0");
        require(warrantToken.balanceOf(msg.sender) >= amount, "Insufficient warrant balance");
        require(!warrantToken.hasExpired(), "Warrants have expired");
        
        // Calculate total cost to exercise warrants
        uint256 totalCost = amount * warrantStrikePrice;
        require(msg.value >= totalCost, "Insufficient ETH sent");
        
        // Burn the warrant tokens
        warrantToken.burnFrom(msg.sender, amount);
        
        // Mint equity tokens to the warrant holder
        equityToken.mint(msg.sender, amount);
        
        // Update stats
        totalEquityIssued += amount;
        
        // Transfer ETH to treasury
        (bool sent, ) = treasury.call{value: totalCost}("");
        require(sent, "Failed to send ETH to treasury");
        
        // Refund excess ETH if any
        uint256 refundAmount = msg.value - totalCost;
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }
        
        emit WarrantsExercised(msg.sender, amount, totalCost);
    }
    
    /**
     * @dev Fund the contract to pay for bond redemptions
     */
    function fundBondRedemption() external payable {
        require(msg.value > 0, "Must send ETH");
    }
    
    /**
     * @dev Update treasury address
     * @param newTreasury New treasury address
     */
    function updateTreasury(address payable newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
    }
    
    /**
     * @dev Transfer contract ownership to a new owner (includes tokens)
     * @param newOwner The address of the new owner
     */
    function transferFullOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        
        // Transfer ownership of token contracts
        bondToken.transferOwnership(newOwner);
        warrantToken.transferOwnership(newOwner);
        equityToken.transferOwnership(newOwner);
        
        // Transfer ownership of this contract
        transferOwnership(newOwner);
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}