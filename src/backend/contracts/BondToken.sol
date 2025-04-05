// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BondToken
 * @dev ERC20 token representing corporate bonds with fixed yield
 */
contract BondToken is ERC20, ERC20Burnable, Ownable {
    // Bond issuance timestamp
    uint256 public issuanceTimestamp;
    
    // Bond maturity period in seconds
    uint256 public maturityPeriod;
    
    // Bond yield percentage (in basis points, e.g., 850 = 8.5%)
    uint256 public yieldBasisPoints;
    
    // Mapping to track bond issuance timestamp for each holder
    mapping(address => uint256) public bondPurchaseTimestamp;
    
    // Mapping to track bond amounts for each holder
    mapping(address => uint256) public bondAmounts;
    
    // Array of bond holders for tracking
    address[] public bondHolders;
    
    // Events
    event BondIssued(address indexed holder, uint256 amount, uint256 timestamp);
    event BondTransferred(address indexed from, address indexed to, uint256 amount);
    event BondMatured(address indexed holder, uint256 amount);

    /**
     * @dev Constructor to initialize the Bond token
     * @param name Token name
     * @param symbol Token symbol
     * @param _maturityPeriodDays Maturity period in days
     * @param _yieldBasisPoints Yield percentage in basis points
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 _maturityPeriodDays,
        uint256 _yieldBasisPoints
    ) ERC20(name, symbol) {
        issuanceTimestamp = block.timestamp;
        maturityPeriod = _maturityPeriodDays * 1 days;
        yieldBasisPoints = _yieldBasisPoints;
        _transferOwnership(msg.sender);
    }

    /**
     * @dev Mint new bond tokens
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        
        // Record purchase timestamp and amount
        if (bondPurchaseTimestamp[to] == 0) {
            bondHolders.push(to);
        }
        
        bondPurchaseTimestamp[to] = block.timestamp;
        bondAmounts[to] += amount;
        
        emit BondIssued(to, amount, block.timestamp);
    }
    
    /**
     * @dev Check if bonds have matured for a specific holder
     * @param holder Address of the bond holder
     * @return boolean True if bonds have matured
     */
    function hasBondMatured(address holder) public view returns (bool) {
        if (bondPurchaseTimestamp[holder] == 0) {
            return false;
        }
        return (block.timestamp >= bondPurchaseTimestamp[holder] + maturityPeriod);
    }
    
    /**
     * @dev Calculate redemption amount including yield
     * @param amount Original bond amount
     * @return uint256 Redemption amount including yield
     */
    function calculateRedemptionAmount(uint256 amount) public view returns (uint256) {
        return amount + (amount * yieldBasisPoints / 10000);
    }
    
    /**
     * @dev Get time remaining until maturity for a specific holder
     * @param holder Address of the bond holder
     * @return uint256 Time in seconds until maturity (0 if already matured)
     */
    function timeToMaturity(address holder) public view returns (uint256) {
        if (bondPurchaseTimestamp[holder] == 0) {
            return 0;
        }
        
        uint256 maturityTime = bondPurchaseTimestamp[holder] + maturityPeriod;
        
        if (block.timestamp >= maturityTime) {
            return 0;
        }
        
        return maturityTime - block.timestamp;
    }
    
    /**
     * @dev Get all bond holders
     * @return address[] Array of all bond holders
     */
    function getAllBondHolders() external view returns (address[] memory) {
        return bondHolders;
    }
    
    /**
     * @dev Get bond holder count
     * @return uint256 Number of bond holders
     */
    function getBondHolderCount() external view returns (uint256) {
        return bondHolders.length;
    }
    
    /**
     * @dev Override token transfer to track bond ownership
     * @param from Address sending tokens
     * @param to Address receiving tokens
     * @param amount Amount of tokens being transferred
     */
    function _transfer(address from, address to, uint256 amount) internal override {
        super._transfer(from, to, amount);
        
        // Update bond tracking for 'from' address
        bondAmounts[from] -= amount;
        
        // Update bond tracking for 'to' address
        if (bondPurchaseTimestamp[to] == 0) {
            bondHolders.push(to);
            bondPurchaseTimestamp[to] = bondPurchaseTimestamp[from]; // Inherit purchase timestamp
        }
        
        bondAmounts[to] += amount;
        
        emit BondTransferred(from, to, amount);
    }
}