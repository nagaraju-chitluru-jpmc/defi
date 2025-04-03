// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TokenSaleFacet
 * @dev Facet for token sale functionality
 */
contract TokenSaleFacet {
    // Define storage structure for token sale
    struct TokenSaleStorage {
        // Diamond addresses for tokens (using address as reference)
        address bondTokenDiamond;
        address warrantTokenDiamond;
        address equityTokenDiamond;
        
        // Bond parameters
        uint256 bondMaturityPeriod; // in days
        uint256 bondYieldPercentage; // in basis points
        
        // Warrant parameters
        uint256 warrantStrikePrice;
        
        // Treasury address
        address payable treasury;
        
        // Sale status
        bool bondSaleActive;
        bool warrantSaleActive;
        
        // Minimum and maximum investment amounts
        uint256 minBondPurchase;
        uint256 maxBondPurchase;
        uint256 minWarrantPurchase;
        uint256 maxWarrantPurchase;
        
        // Stats
        uint256 totalFundsRaised;
        uint256 activeBondCount;
        uint256 totalWarrantsIssued;
        uint256 totalEquityIssued;
        uint256 totalBondRedemptions;
        uint256 totalWarrantsExercised;
        
        // Investor tracking
        mapping(address => bool) investors;
        address[] investorList;
        
        // Investment tracking
        mapping(address => InvestorInfo) investorInfo;
    }
    
    // Investor info struct
    struct InvestorInfo {
        uint256 totalBondInvestment;
        uint256 totalWarrantInvestment;
        uint256 bondRedemptions;
        uint256 warrantsExercised;
        bool hasBonds;
        bool hasWarrants;
        uint256 lastActivityTimestamp;
    }

    // Events
    event BondsPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event WarrantsPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event BondsRedeemed(address indexed holder, uint256 amount, uint256 payout);
    event WarrantsExercised(address indexed holder, uint256 amount, uint256 cost);
    event BondSaleStatusChanged(bool isActive);
    event WarrantSaleStatusChanged(bool isActive);
    event MinMaxAmountsUpdated(string tokenType, uint256 min, uint256 max);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event ContractFunded(address funder, uint256 amount);

    // Storage position in the diamond
    bytes32 constant TOKEN_SALE_STORAGE_POSITION = keccak256("diamond.token.sale.storage");

    // Storage accessor function
    function tokenSaleStorage() internal pure returns (TokenSaleStorage storage ts) {
        bytes32 position = TOKEN_SALE_STORAGE_POSITION;
        assembly {
            ts.slot := position
        }
    }
    
    // Initialize function - to be called once via delegatecall
    function initializeTokenSale(
        address _bondTokenDiamond,
        address _warrantTokenDiamond,
        address _equityTokenDiamond,
        uint256 _bondMaturityDays,
        uint256 _bondYieldBasisPoints,
        uint256 _warrantStrikePrice,
        address payable _treasury
    ) external {
        TokenSaleStorage storage ts = tokenSaleStorage();
        
        ts.bondTokenDiamond = _bondTokenDiamond;
        ts.warrantTokenDiamond = _warrantTokenDiamond;
        ts.equityTokenDiamond = _equityTokenDiamond;
        
        ts.bondMaturityPeriod = _bondMaturityDays;
        ts.bondYieldPercentage = _bondYieldBasisPoints;
        ts.warrantStrikePrice = _warrantStrikePrice;
        ts.treasury = _treasury;
        
        // Initialize default values
        ts.bondSaleActive = true;
        ts.warrantSaleActive = true;
        ts.minBondPurchase = 0.01 ether;
        ts.maxBondPurchase = 100 ether;
        ts.minWarrantPurchase = 0.01 ether;
        ts.maxWarrantPurchase = 50 ether;
    }
    
    // Getters for state variables
    function bondTokenDiamond() external view returns (address) {
        return tokenSaleStorage().bondTokenDiamond;
    }
    
    function warrantTokenDiamond() external view returns (address) {
        return tokenSaleStorage().warrantTokenDiamond;
    }
    
    function equityTokenDiamond() external view returns (address) {
        return tokenSaleStorage().equityTokenDiamond;
    }
    
    function bondMaturityPeriod() external view returns (uint256) {
        return tokenSaleStorage().bondMaturityPeriod;
    }
    
    function bondYieldPercentage() external view returns (uint256) {
        return tokenSaleStorage().bondYieldPercentage;
    }
    
    function warrantStrikePrice() external view returns (uint256) {
        return tokenSaleStorage().warrantStrikePrice;
    }
    
    function treasury() external view returns (address payable) {
        return tokenSaleStorage().treasury;
    }
    
    function bondSaleActive() external view returns (bool) {
        return tokenSaleStorage().bondSaleActive;
    }
    
    function warrantSaleActive() external view returns (bool) {
        return tokenSaleStorage().warrantSaleActive;
    }
    
    function minBondPurchase() external view returns (uint256) {
        return tokenSaleStorage().minBondPurchase;
    }
    
    function maxBondPurchase() external view returns (uint256) {
        return tokenSaleStorage().maxBondPurchase;
    }
    
    function minWarrantPurchase() external view returns (uint256) {
        return tokenSaleStorage().minWarrantPurchase;
    }
    
    function maxWarrantPurchase() external view returns (uint256) {
        return tokenSaleStorage().maxWarrantPurchase;
    }
    
    function totalFundsRaised() external view returns (uint256) {
        return tokenSaleStorage().totalFundsRaised;
    }
    
    function activeBondCount() external view returns (uint256) {
        return tokenSaleStorage().activeBondCount;
    }
    
    function totalWarrantsIssued() external view returns (uint256) {
        return tokenSaleStorage().totalWarrantsIssued;
    }
    
    function totalEquityIssued() external view returns (uint256) {
        return tokenSaleStorage().totalEquityIssued;
    }
    
    function totalBondRedemptions() external view returns (uint256) {
        return tokenSaleStorage().totalBondRedemptions;
    }
    
    function totalWarrantsExercised() external view returns (uint256) {
        return tokenSaleStorage().totalWarrantsExercised;
    }
    
    function investors(address investor) external view returns (bool) {
        return tokenSaleStorage().investors[investor];
    }
    
    // Main functions
    
    /**
     * @dev Purchase bond tokens with ETH
     */
    function purchaseBonds() external payable {
        TokenSaleStorage storage ts = tokenSaleStorage();
        
        require(ts.bondSaleActive, "Bond sales are paused");
        require(msg.value >= ts.minBondPurchase, "Investment below minimum");
        require(msg.value <= ts.maxBondPurchase, "Investment above maximum");
        
        // 1 ETH = 1 Bond Token
        uint256 bondAmount = msg.value;
        
        // Mint bond tokens to the buyer (call the BondTokenFacet's mint function)
        // This requires a delegatecall to another Diamond
        (bool success, ) = ts.bondTokenDiamond.call(
            abi.encodeWithSignature("mint(address,uint256)", msg.sender, bondAmount)
        );
        require(success, "Bond token minting failed");
        
        // Update stats
        ts.totalFundsRaised += msg.value;
        ts.activeBondCount += 1;
        
        // Track investor
        _trackInvestor(msg.sender);
        ts.investorInfo[msg.sender].totalBondInvestment += msg.value;
        ts.investorInfo[msg.sender].hasBonds = true;
        ts.investorInfo[msg.sender].lastActivityTimestamp = block.timestamp;
        
        // Transfer ETH to treasury
        (bool sent, ) = ts.treasury.call{value: msg.value}("");
        require(sent, "Failed to send ETH to treasury");
        
        emit BondsPurchased(msg.sender, bondAmount, msg.value);
    }
    
    /**
     * @dev Purchase warrant tokens with ETH
     */
    function purchaseWarrants() external payable {
        TokenSaleStorage storage ts = tokenSaleStorage();
        
        require(ts.warrantSaleActive, "Warrant sales are paused");
        require(msg.value >= ts.minWarrantPurchase, "Investment below minimum");
        require(msg.value <= ts.maxWarrantPurchase, "Investment above maximum");
        
        // Get warrant price from the WarrantTokenFacet
        (bool priceSuccess, bytes memory priceData) = ts.warrantTokenDiamond.call(
            abi.encodeWithSignature("warrantPrice()")
        );
        require(priceSuccess, "Failed to get warrant price");
        uint256 warrantPrice = abi.decode(priceData, (uint256));
        
        // Calculate warrant amount (based on warrant price)
        uint256 warrantAmount = (msg.value * 10**18) / warrantPrice;
        
        // Mint warrant tokens to the buyer
        (bool mintSuccess, ) = ts.warrantTokenDiamond.call(
            abi.encodeWithSignature("mint(address,uint256)", msg.sender, warrantAmount)
        );
        require(mintSuccess, "Warrant token minting failed");
        
        // Update stats
        ts.totalFundsRaised += msg.value;
        ts.totalWarrantsIssued += warrantAmount;
        
        // Track investor
        _trackInvestor(msg.sender);
        ts.investorInfo[msg.sender].totalWarrantInvestment += msg.value;
        ts.investorInfo[msg.sender].hasWarrants = true;
        ts.investorInfo[msg.sender].lastActivityTimestamp = block.timestamp;
        
        // Transfer ETH to treasury
        (bool sent, ) = ts.treasury.call{value: msg.value}("");
        require(sent, "Failed to send ETH to treasury");
        
        emit WarrantsPurchased(msg.sender, warrantAmount, msg.value);
    }
    
    /**
     * @dev Redeem mature bond tokens
     * @param amount Amount of bond tokens to redeem
     */
    function redeemBonds(uint256 amount) external {
        TokenSaleStorage storage ts = tokenSaleStorage();
        
        require(amount > 0, "Amount must be greater than 0");
        
        // Check if the sender has sufficient bond balance
        (bool balanceSuccess, bytes memory balanceData) = ts.bondTokenDiamond.call(
            abi.encodeWithSignature("balanceOf(address)", msg.sender)
        );
        require(balanceSuccess, "Failed to get bond balance");
        uint256 bondBalance = abi.decode(balanceData, (uint256));
        require(bondBalance >= amount, "Insufficient bond balance");
        
        // Check if bonds have matured
        (bool maturitySuccess, bytes memory maturityData) = ts.bondTokenDiamond.call(
            abi.encodeWithSignature("hasBondMatured(address)", msg.sender)
        );
        require(maturitySuccess, "Failed to check bond maturity");
        bool hasBondMatured = abi.decode(maturityData, (bool));
        require(hasBondMatured, "Bonds have not yet matured");
        
        // Calculate redemption amount (principal + yield)
        (bool redemptionSuccess, bytes memory redemptionData) = ts.bondTokenDiamond.call(
            abi.encodeWithSignature("calculateRedemptionAmount(uint256)", amount)
        );
        require(redemptionSuccess, "Failed to calculate redemption amount");
        uint256 redemptionAmount = abi.decode(redemptionData, (uint256));
        
        // Burn the bond tokens
        (bool burnSuccess, ) = ts.bondTokenDiamond.call(
            abi.encodeWithSignature("burnFrom(address,uint256)", msg.sender, amount)
        );
        require(burnSuccess, "Failed to burn bond tokens");
        
        // Update stats
        ts.activeBondCount -= 1;
        ts.totalBondRedemptions += amount;
        
        // Update investor info
        ts.investorInfo[msg.sender].bondRedemptions += amount;
        ts.investorInfo[msg.sender].lastActivityTimestamp = block.timestamp;
        
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
        TokenSaleStorage storage ts = tokenSaleStorage();
        
        require(amount > 0, "Amount must be greater than 0");
        
        // Check if the sender has sufficient warrant balance
        (bool balanceSuccess, bytes memory balanceData) = ts.warrantTokenDiamond.call(
            abi.encodeWithSignature("balanceOf(address)", msg.sender)
        );
        require(balanceSuccess, "Failed to get warrant balance");
        uint256 warrantBalance = abi.decode(balanceData, (uint256));
        require(warrantBalance >= amount, "Insufficient warrant balance");
        
        // Check if warrants have expired
        (bool expirySuccess, bytes memory expiryData) = ts.warrantTokenDiamond.call(
            abi.encodeWithSignature("hasExpired()")
        );
        require(expirySuccess, "Failed to check warrant expiry");
        bool hasExpired = abi.decode(expiryData, (bool));
        require(!hasExpired, "Warrants have expired");
        
        // Calculate total cost to exercise warrants
        (bool costSuccess, bytes memory costData) = ts.warrantTokenDiamond.call(
            abi.encodeWithSignature("calculateExerciseCost(uint256)", amount)
        );
        require(costSuccess, "Failed to calculate exercise cost");
        uint256 totalCost = abi.decode(costData, (uint256));
        require(msg.value >= totalCost, "Insufficient ETH sent");
        
        // Burn the warrant tokens
        (bool burnSuccess, ) = ts.warrantTokenDiamond.call(
            abi.encodeWithSignature("burnFrom(address,uint256)", msg.sender, amount)
        );
        require(burnSuccess, "Failed to burn warrant tokens");
        
        // Mint equity tokens to the warrant holder
        (bool mintSuccess, ) = ts.equityTokenDiamond.call(
            abi.encodeWithSignature("mint(address,uint256)", msg.sender, amount)
        );
        require(mintSuccess, "Failed to mint equity tokens");
        
        // Update stats
        ts.totalEquityIssued += amount;
        ts.totalWarrantsExercised += amount;
        
        // Update investor info
        ts.investorInfo[msg.sender].warrantsExercised += amount;
        ts.investorInfo[msg.sender].lastActivityTimestamp = block.timestamp;
        
        // Transfer ETH to treasury
        (bool sent, ) = ts.treasury.call{value: totalCost}("");
        require(sent, "Failed to send ETH to treasury");
        
        // Refund excess ETH if any
        uint256 refundAmount = msg.value - totalCost;
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }
        
        // emit WarrantsExercised(msg.sender, amount, totalCost);
    }
    
    /**
     * @dev Fund the contract to pay for bond redemptions
     */
    function fundBondRedemption() external payable {
        require(msg.value > 0, "Must send ETH");
        emit ContractFunded(msg.sender, msg.value);
    }
    
    /**
     * @dev Toggle bond sale status
     * @param _active New bond sale status
     */
    function toggleBondSale(bool _active) external {
        // Owner check would typically be here but is handled at the diamond level
        tokenSaleStorage().bondSaleActive = _active;
        emit BondSaleStatusChanged(_active);
    }
    
    /**
     * @dev Toggle warrant sale status
     * @param _active New warrant sale status
     */
    function toggleWarrantSale(bool _active) external {
        // Owner check would typically be here but is handled at the diamond level
        tokenSaleStorage().warrantSaleActive = _active;
        emit WarrantSaleStatusChanged(_active);
    }
    
    /**
     * @dev Update minimum and maximum bond purchase amounts
     * @param _min Minimum amount in wei
     * @param _max Maximum amount in wei
     */
    function updateBondPurchaseLimits(uint256 _min, uint256 _max) external {
        // Owner check would typically be here but is handled at the diamond level
        require(_min <= _max, "Min cannot be greater than max");
        
        TokenSaleStorage storage ts = tokenSaleStorage();
        ts.minBondPurchase = _min;
        ts.maxBondPurchase = _max;
        
        emit MinMaxAmountsUpdated("bond", _min, _max);
    }
    
    /**
     * @dev Update minimum and maximum warrant purchase amounts
     * @param _min Minimum amount in wei
     * @param _max Maximum amount in wei
     */
    function updateWarrantPurchaseLimits(uint256 _min, uint256 _max) external {
        // Owner check would typically be here but is handled at the diamond level
        require(_min <= _max, "Min cannot be greater than max");
        
        TokenSaleStorage storage ts = tokenSaleStorage();
        ts.minWarrantPurchase = _min;
        ts.maxWarrantPurchase = _max;
        
        emit MinMaxAmountsUpdated("warrant", _min, _max);
    }
    
    /**
     * @dev Update treasury address
     * @param newTreasury New treasury address
     */
    function updateTreasury(address payable newTreasury) external {
        // Owner check would typically be here but is handled at the diamond level
        require(newTreasury != address(0), "Invalid treasury address");
        
        TokenSaleStorage storage ts = tokenSaleStorage();
        address oldTreasury = ts.treasury;
        ts.treasury = newTreasury;
        
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    /**
     * @dev Get investor count
     * @return uint256 Number of investors
     */
    function getInvestorCount() external view returns (uint256) {
        return tokenSaleStorage().investorList.length;
    }
    
    /**
     * @dev Get list of all investors
     * @return address[] Array of investor addresses
     */
    function getAllInvestors() external view returns (address[] memory) {
        return tokenSaleStorage().investorList;
    }
    
    /**
     * @dev Get investor details
     * @param investor Investor address
     * @return InvestorInfo Investor details struct
     */
    function getInvestorDetails(address investor) external view returns (InvestorInfo memory) {
        return tokenSaleStorage().investorInfo[investor];
    }
    
    /**
     * @dev Internal function to track investors
     * @param investor Investor address
     */
    function _trackInvestor(address investor) internal {
        TokenSaleStorage storage ts = tokenSaleStorage();
        
        if (!ts.investors[investor]) {
            ts.investors[investor] = true;
            ts.investorList.push(investor);
        }
    }
    
    /**
     * @dev Transfer token contract addresses
     * @param newBondTokenDiamond New bond token diamond address
     * @param newWarrantTokenDiamond New warrant token diamond address
     * @param newEquityTokenDiamond New equity token diamond address
     */
    function updateTokenAddresses(
        address newBondTokenDiamond,
        address newWarrantTokenDiamond,
        address newEquityTokenDiamond
    ) external {
        // Owner check would typically be here but is handled at the diamond level
        require(newBondTokenDiamond != address(0), "Invalid bond token address");
        require(newWarrantTokenDiamond != address(0), "Invalid warrant token address");
        require(newEquityTokenDiamond != address(0), "Invalid equity token address");
        
        TokenSaleStorage storage ts = tokenSaleStorage();
        ts.bondTokenDiamond = newBondTokenDiamond;
        ts.warrantTokenDiamond = newWarrantTokenDiamond;
        ts.equityTokenDiamond = newEquityTokenDiamond;
    }
    
    // Receive function to accept ETH
    receive() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }
}