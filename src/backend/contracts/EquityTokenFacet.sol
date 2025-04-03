// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title EquityTokenFacet
 * @dev Facet for Equity token functionality
 */
contract EquityTokenFacet {
    // Define storage structure for ERC20 compatibility
    struct ERC20Storage {
        mapping(address => uint256) balances;
        mapping(address => mapping(address => uint256)) allowances;
        uint256 totalSupply;
        string name;
        string symbol;
        uint8 decimals;
    }

    // Define storage structure specific to Equity token
    struct EquityStorage {
        uint256 totalAuthorizedShares;
    }

    // Storage position in the diamond
    bytes32 constant ERC20_STORAGE_POSITION = keccak256("diamond.token.erc20.equity.storage");
    bytes32 constant EQUITY_STORAGE_POSITION = keccak256("diamond.token.equity.storage");

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // Storage accessor functions
    function erc20Storage() internal pure returns (ERC20Storage storage ds) {
        bytes32 position = ERC20_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    function equityStorage() internal pure returns (EquityStorage storage es) {
        bytes32 position = EQUITY_STORAGE_POSITION;
        assembly {
            es.slot := position
        }
    }

    // Initialize function - to be called once via delegatecall
    function initializeEquityToken(
        string memory name,
        string memory symbol,
        uint256 _totalAuthorizedShares
    ) external {
        ERC20Storage storage es = erc20Storage();
        EquityStorage storage eqs = equityStorage();

        es.name = name;
        es.symbol = symbol;
        es.decimals = 18;

        eqs.totalAuthorizedShares = _totalAuthorizedShares;
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

    function totalAuthorizedShares() external view returns (uint256) {
        return equityStorage().totalAuthorizedShares;
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

    // Equity-specific functions
    function mint(address to, uint256 amount) external {
        // Owner check would typically be here but is handled at the diamond level
        ERC20Storage storage es = erc20Storage();
        EquityStorage storage eqs = equityStorage();
        
        require(es.totalSupply + amount <= eqs.totalAuthorizedShares, "Exceeds authorized shares");
        _mint(to, amount);
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