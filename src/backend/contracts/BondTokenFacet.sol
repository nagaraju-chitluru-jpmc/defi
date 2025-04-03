// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title BondTokenFacet
 * @dev Facet for Bond token functionality
 */
contract BondTokenFacet {
    // Define storage structure for ERC20 compatibility
    struct ERC20Storage {
        mapping(address => uint256) balances;
        mapping(address => mapping(address => uint256)) allowances;
        uint256 totalSupply;
        string name;
        string symbol;
        uint8 decimals;
    }

    // Define storage structure specific to Bond token
    struct BondStorage {
        uint256 issuanceTimestamp;
        uint256 maturityPeriod;
        uint256 yieldBasisPoints;
        mapping(address => uint256) bondPurchaseTimestamp;
        mapping(address => uint256) bondAmounts;
        address[] bondHolders;
    }

    // Storage position in the diamond
    bytes32 constant ERC20_STORAGE_POSITION = keccak256("diamond.token.erc20.storage");
    bytes32 constant BOND_STORAGE_POSITION = keccak256("diamond.token.bond.storage");

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event BondIssued(address indexed holder, uint256 amount, uint256 timestamp);
    event BondTransferred(address indexed from, address indexed to, uint256 amount);
    event BondMatured(address indexed holder, uint256 amount);

    // Storage accessor functions
    function erc20Storage() internal pure returns (ERC20Storage storage ds) {
        bytes32 position = ERC20_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    function bondStorage() internal pure returns (BondStorage storage bs) {
        bytes32 position = BOND_STORAGE_POSITION;
        assembly {
            bs.slot := position
        }
    }

    // Initialize function - to be called once via delegatecall
    function initializeBondToken(
        string memory name,
        string memory symbol,
        uint256 _maturityPeriodDays,
        uint256 _yieldBasisPoints
    ) external {
        ERC20Storage storage es = erc20Storage();
        BondStorage storage bs = bondStorage();

        es.name = name;
        es.symbol = symbol;
        es.decimals = 18;

        bs.issuanceTimestamp = block.timestamp;
        bs.maturityPeriod = _maturityPeriodDays * 1 days;
        bs.yieldBasisPoints = _yieldBasisPoints;
    }

    // ERC20 Standard functions
    function name() external view returns (string memory) {
        return erc20Storage().name;
    }

    function symbol() external view returns (string memory) {
        return erc20Storage().symbol;
    }

    function decimals() external view returns (uint8) {
        return erc20Storage().decimals;
    }

    function totalSupply() external view returns (uint256) {
        return erc20Storage().totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return erc20Storage().balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return erc20Storage().allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {
        _approve(msg.sender, spender, erc20Storage().allowances[msg.sender][spender] + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {
        uint256 currentAllowance = erc20Storage().allowances[msg.sender][spender];
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        _approve(msg.sender, spender, currentAllowance - subtractedValue);
        return true;
    }

    // Bond-specific functions
    function mint(address to, uint256 amount) external {
        // Owner check would typically be here but is handled at the diamond level
        _mint(to, amount);
        
        // Record purchase timestamp and amount
        BondStorage storage bs = bondStorage();
        if (bs.bondPurchaseTimestamp[to] == 0) {
            bs.bondHolders.push(to);
        }
        
        bs.bondPurchaseTimestamp[to] = block.timestamp;
        bs.bondAmounts[to] += amount;
        
        emit BondIssued(to, amount, block.timestamp);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }

    function issuanceTimestamp() external view returns (uint256) {
        return bondStorage().issuanceTimestamp;
    }

    function maturityPeriod() external view returns (uint256) {
        return bondStorage().maturityPeriod;
    }

    function yieldBasisPoints() external view returns (uint256) {
        return bondStorage().yieldBasisPoints;
    }

    function bondPurchaseTimestamp(address holder) external view returns (uint256) {
        return bondStorage().bondPurchaseTimestamp[holder];
    }

    function bondAmounts(address holder) external view returns (uint256) {
        return bondStorage().bondAmounts[holder];
    }

    function hasBondMatured(address holder) external view returns (bool) {
        BondStorage storage bs = bondStorage();
        if (bs.bondPurchaseTimestamp[holder] == 0) {
            return false;
        }
        return (block.timestamp >= bs.bondPurchaseTimestamp[holder] + bs.maturityPeriod);
    }

    function calculateRedemptionAmount(uint256 amount) external view returns (uint256) {
        BondStorage storage bs = bondStorage();
        return amount + (amount * bs.yieldBasisPoints / 10000);
    }

    function timeToMaturity(address holder) external view returns (uint256) {
        BondStorage storage bs = bondStorage();
        if (bs.bondPurchaseTimestamp[holder] == 0) {
            return 0;
        }
        
        uint256 maturityTime = bs.bondPurchaseTimestamp[holder] + bs.maturityPeriod;
        
        if (block.timestamp >= maturityTime) {
            return 0;
        }
        
        return maturityTime - block.timestamp;
    }

    function getAllBondHolders() external view returns (address[] memory) {
        return bondStorage().bondHolders;
    }

    function getBondHolderCount() external view returns (uint256) {
        return bondStorage().bondHolders.length;
    }

    // Internal functions
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        ERC20Storage storage es = erc20Storage();
        
        uint256 fromBalance = es.balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            es.balances[from] = fromBalance - amount;
        }
        es.balances[to] += amount;

        emit Transfer(from, to, amount);

        // Bond-specific transfer logic
        BondStorage storage bs = bondStorage();
        
        // Update bond tracking for 'from' address
        bs.bondAmounts[from] -= amount;
        
        // Update bond tracking for 'to' address
        if (bs.bondPurchaseTimestamp[to] == 0) {
            bs.bondHolders.push(to);
            bs.bondPurchaseTimestamp[to] = bs.bondPurchaseTimestamp[from]; // Inherit purchase timestamp
        }
        
        bs.bondAmounts[to] += amount;
        
        emit BondTransferred(from, to, amount);
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        ERC20Storage storage es = erc20Storage();
        
        es.totalSupply += amount;
        es.balances[account] += amount;
        
        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: burn from the zero address");

        ERC20Storage storage es = erc20Storage();
        
        uint256 accountBalance = es.balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            es.balances[account] = accountBalance - amount;
        }
        es.totalSupply -= amount;
        
        emit Transfer(account, address(0), amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        erc20Storage().allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = erc20Storage().allowances[owner][spender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }
}