// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title WarrantTokenFacet
 * @dev Facet for Warrant token functionality
 */
contract WarrantTokenFacet {
    // Define storage structure for ERC20 compatibility
    struct ERC20Storage {
        mapping(address => uint256) balances;
        mapping(address => mapping(address => uint256)) allowances;
        uint256 totalSupply;
        string name;
        string symbol;
        uint8 decimals;
    }

    // Define storage structure specific to Warrant token
    struct WarrantStorage {
        uint256 strikePrice;
        uint256 expirationTimestamp;
        address equityTokenAddress;
        uint256 warrantPrice;
        address[] warrantHolders;
        mapping(address => bool) isWarrantHolder;
        mapping(address => uint256) warrantPurchaseTimestamp;
        mapping(address => uint256) warrantAmounts;
    }

    // Storage position in the diamond
    bytes32 constant ERC20_STORAGE_POSITION = keccak256("diamond.token.erc20.warrant.storage");
    bytes32 constant WARRANT_STORAGE_POSITION = keccak256("diamond.token.warrant.storage");

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event WarrantIssued(address indexed holder, uint256 amount, uint256 timestamp);
    event WarrantTransferred(address indexed from, address indexed to, uint256 amount);
    event WarrantExercised(address indexed holder, uint256 amount, uint256 cost);
    event StrikePriceChanged(uint256 oldPrice, uint256 newPrice);

    // Storage accessor functions
    function erc20Storage() internal pure returns (ERC20Storage storage ds) {
        bytes32 position = ERC20_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    function warrantStorage() internal pure returns (WarrantStorage storage ws) {
        bytes32 position = WARRANT_STORAGE_POSITION;
        assembly {
            ws.slot := position
        }
    }

    // Initialize function - to be called once via delegatecall
    function initializeWarrantToken(
        string memory name,
        string memory symbol,
        uint256 _strikePrice,
        uint256 _expirationDays
    ) external {
        ERC20Storage storage es = erc20Storage();
        WarrantStorage storage ws = warrantStorage();

        es.name = name;
        es.symbol = symbol;
        es.decimals = 18;

        ws.strikePrice = _strikePrice;
        ws.expirationTimestamp = block.timestamp + (_expirationDays * 1 days);
        ws.warrantPrice = 0.1 ether; // Default price of 0.1 ETH per warrant
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

    // Warrant-specific functions
    function mint(address to, uint256 amount) external {
        // Owner check would typically be here but is handled at the diamond level
        _mint(to, amount);
        
        WarrantStorage storage ws = warrantStorage();
        
        if (!ws.isWarrantHolder[to]) {
            ws.warrantHolders.push(to);
            ws.isWarrantHolder[to] = true;
        }
        
        ws.warrantPurchaseTimestamp[to] = block.timestamp;
        ws.warrantAmounts[to] += amount;
        
        emit WarrantIssued(to, amount, block.timestamp);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }

    function strikePrice() external view returns (uint256) {
        return warrantStorage().strikePrice;
    }

    function expirationTimestamp() external view returns (uint256) {
        return warrantStorage().expirationTimestamp;
    }

    function equityTokenAddress() external view returns (address) {
        return warrantStorage().equityTokenAddress;
    }

    function warrantPrice() external view returns (uint256) {
        return warrantStorage().warrantPrice;
    }

    function isWarrantHolder(address holder) external view returns (bool) {
        return warrantStorage().isWarrantHolder[holder];
    }

    function warrantPurchaseTimestamp(address holder) external view returns (uint256) {
        return warrantStorage().warrantPurchaseTimestamp[holder];
    }

    function warrantAmounts(address holder) external view returns (uint256) {
        return warrantStorage().warrantAmounts[holder];
    }

    function setEquityTokenAddress(address _equityTokenAddress) external {
        // Owner check would typically be here but is handled at the diamond level
        warrantStorage().equityTokenAddress = _equityTokenAddress;
    }

    function setWarrantPrice(uint256 _warrantPrice) external {
        // Owner check would typically be here but is handled at the diamond level
        warrantStorage().warrantPrice = _warrantPrice;
    }

    function updateStrikePrice(uint256 _newStrikePrice) external {
        // Owner check would typically be here but is handled at the diamond level
        WarrantStorage storage ws = warrantStorage();
        emit StrikePriceChanged(ws.strikePrice, _newStrikePrice);
        ws.strikePrice = _newStrikePrice;
    }

    function extendExpiration(uint256 _additionalDays) external {
        // Owner check would typically be here but is handled at the diamond level
        warrantStorage().expirationTimestamp += _additionalDays * 1 days;
    }

    function hasExpired() external view returns (bool) {
        return block.timestamp > warrantStorage().expirationTimestamp;
    }

    function timeToExpiration() external view returns (uint256) {
        WarrantStorage storage ws = warrantStorage();
        if (block.timestamp > ws.expirationTimestamp) {
            return 0;
        }
        return ws.expirationTimestamp - block.timestamp;
    }

    function calculateExerciseCost(uint256 amount) external view returns (uint256) {
        return amount * warrantStorage().strikePrice;
    }

    function getAllWarrantHolders() external view returns (address[] memory) {
        return warrantStorage().warrantHolders;
    }

    function getWarrantHolderCount() external view returns (uint256) {
        return warrantStorage().warrantHolders.length;
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

        // Warrant-specific transfer logic
        WarrantStorage storage ws = warrantStorage();
        
        // Update warrant tracking for 'from' address
        ws.warrantAmounts[from] -= amount;
        
        // Update warrant tracking for 'to' address
        if (!ws.isWarrantHolder[to]) {
            ws.warrantHolders.push(to);
            ws.isWarrantHolder[to] = true;
            ws.warrantPurchaseTimestamp[to] = block.timestamp;
        }
        
        ws.warrantAmounts[to] += amount;
        
        emit WarrantTransferred(from, to, amount);
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