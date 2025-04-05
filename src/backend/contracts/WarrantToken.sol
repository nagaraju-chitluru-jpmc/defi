// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WarrantToken
 * @dev ERC20 token representing warrants that can be exchanged for equity
 */
contract WarrantToken is ERC20, ERC20Burnable, Ownable {
    // Strike price in wei
    uint256 public strikePrice;
    
    // Expiration timestamp
    uint256 public expirationTimestamp;
    
    // Underlying equity token address
    address public equityTokenAddress;
    
    // Warrant price in ETH
    uint256 public warrantPrice;
    
    // Tracking warrant holders
    address[] public warrantHolders;
    mapping(address => bool) public isWarrantHolder;
    
    // Tracking warrant purchases
    mapping(address => uint256) public warrantPurchaseTimestamp;
    mapping(address => uint256) public warrantAmounts;
    
    // Events
    event WarrantIssued(address indexed holder, uint256 amount, uint256 timestamp);
    event WarrantTransferred(address indexed from, address indexed to, uint256 amount);
    event WarrantExercised(address indexed holder, uint256 amount, uint256 cost);
    event StrikePriceChanged(uint256 oldPrice, uint256 newPrice);
    
    /**
     * @dev Constructor to initialize the Warrant token
     * @param name Token name
     * @param symbol Token symbol
     * @param _strikePrice Strike price in wei
     * @param _expirationDays Expiration period in days
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 _strikePrice,
        uint256 _expirationDays
    ) ERC20(name, symbol) {
        strikePrice = _strikePrice;
        expirationTimestamp = block.timestamp + (_expirationDays * 1 days);
        warrantPrice = 0.1 ether; // Default price of 0.1 ETH per warrant
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Set the underlying equity token address
     * @param _equityTokenAddress Address of the equity token
     */
    function setEquityTokenAddress(address _equityTokenAddress) external onlyOwner {
        equityTokenAddress = _equityTokenAddress;
    }
    
    /**
     * @dev Set the warrant price
     * @param _warrantPrice New warrant price in wei
     */
    function setWarrantPrice(uint256 _warrantPrice) external onlyOwner {
        warrantPrice = _warrantPrice;
    }
    
    /**
     * @dev Update the strike price
     * @param _newStrikePrice New strike price in wei
     */
    function updateStrikePrice(uint256 _newStrikePrice) external onlyOwner {
        emit StrikePriceChanged(strikePrice, _newStrikePrice);
        strikePrice = _newStrikePrice;
    }
    
    /**
     * @dev Extend the expiration period
     * @param _additionalDays Additional days to extend
     */
    function extendExpiration(uint256 _additionalDays) external onlyOwner {
        expirationTimestamp += _additionalDays * 1 days;
    }
    
    /**
     * @dev Mint new warrant tokens
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        
        if (!isWarrantHolder[to]) {
            warrantHolders.push(to);
            isWarrantHolder[to] = true;
        }
        
        warrantPurchaseTimestamp[to] = block.timestamp;
        warrantAmounts[to] += amount;
        
        emit WarrantIssued(to, amount, block.timestamp);
    }
    
    /**
     * @dev Check if warrants have expired
     * @return boolean True if warrants have expired
     */
    function hasExpired() public view returns (bool) {
        return block.timestamp > expirationTimestamp;
    }
    
    /**
     * @dev Get time remaining until expiration
     * @return uint256 Time in seconds until expiration (0 if already expired)
     */
    function timeToExpiration() public view returns (uint256) {
        if (hasExpired()) {
            return 0;
        }
        return expirationTimestamp - block.timestamp;
    }
    
    /**
     * @dev Calculate the cost to exercise a specified amount of warrants
     * @param amount Amount of warrants to exercise
     * @return uint256 Total cost in wei
     */
    function calculateExerciseCost(uint256 amount) public view returns (uint256) {
        return amount * strikePrice;
    }
    
    /**
     * @dev Get all warrant holders
     * @return address[] Array of all warrant holders
     */
    function getAllWarrantHolders() external view returns (address[] memory) {
        return warrantHolders;
    }
    
    /**
     * @dev Get warrant holder count
     * @return uint256 Number of warrant holders
     */
    function getWarrantHolderCount() external view returns (uint256) {
        return warrantHolders.length;
    }
    
    /**
     * @dev Override token transfer to track warrant ownership
     * @param from Address sending tokens
     * @param to Address receiving tokens
     * @param amount Amount of tokens being transferred
     */
    function _transfer(address from, address to, uint256 amount) internal override {
        super._transfer(from, to, amount);
        
        // Update warrant tracking for 'from' address
        warrantAmounts[from] -= amount;
        
        // Update warrant tracking for 'to' address
        if (!isWarrantHolder[to]) {
            warrantHolders.push(to);
            isWarrantHolder[to] = true;
            warrantPurchaseTimestamp[to] = block.timestamp;
        }
        
        warrantAmounts[to] += amount;
        
        emit WarrantTransferred(from, to, amount);
    }
}