
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
    ) ERC20(name, symbol) Ownable(msg.sender) {
        strikePrice = _strikePrice;
        expirationTimestamp = block.timestamp + (_expirationDays * 1 days);
        // Equity token address will be set later
    }
    
    /**
     * @dev Set the underlying equity token address
     * @param _equityTokenAddress Address of the equity token
     */
    function setEquityTokenAddress(address _equityTokenAddress) external onlyOwner {
        equityTokenAddress = _equityTokenAddress;
    }
    
    /**
     * @dev Mint new warrant tokens
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Check if warrants have expired
     * @return boolean True if warrants have expired
     */
    function hasExpired() public view returns (bool) {
        return block.timestamp > expirationTimestamp;
    }
}