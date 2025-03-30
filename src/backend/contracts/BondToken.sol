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
    ) ERC20(name, symbol) Ownable(msg.sender) {
        issuanceTimestamp = block.timestamp;
        maturityPeriod = _maturityPeriodDays * 1 days;
        yieldBasisPoints = _yieldBasisPoints;
    }

    /**
     * @dev Mint new bond tokens
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        // Record purchase timestamp
        bondPurchaseTimestamp[to] = block.timestamp;
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
}
