
/**
 * @title EquityToken
 * @dev ERC20 token representing company equity (shares)
 */
contract EquityToken is ERC20, Ownable {
    uint256 public totalAuthorizedShares;
    
    /**
     * @dev Constructor to initialize the Equity token
     * @param name Token name
     * @param symbol Token symbol
     * @param _totalAuthorizedShares Total authorized shares
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 _totalAuthorizedShares
    ) ERC20(name, symbol) Ownable(msg.sender) {
        totalAuthorizedShares = _totalAuthorizedShares;
    }
    
    /**
     * @dev Mint new equity tokens (only owner can mint)
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= totalAuthorizedShares, "Exceeds authorized shares");
        _mint(to, amount);
    }
}
