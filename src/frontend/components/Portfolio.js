import React, { useState, useEffect } from 'react';

const Portfolio = ({ bondBalance, warrantBalance, bondYield, strikePrice, account }) => {
  const [equityBalance, setEquityBalance] = useState(0);
  const [bondValue, setBondValue] = useState(0);
  const [warrantValue, setWarrantValue] = useState(0);
  const [equityValue, setEquityValue] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  
  // Mock market price - in a real app, this would come from an oracle
  const currentEquityPrice = 1.2; // ETH per equity token
  const warrantMarketPrice = 0.1; // ETH per warrant
  
  useEffect(() => {
    // In a real application, we would fetch the equity balance from the contract
    setEquityBalance(5); // Mock value
    
    // Calculate portfolio values
    const bondVal = parseFloat(bondBalance) * (1 + (bondYield/100));
    const warrantVal = parseFloat(warrantBalance) * warrantMarketPrice;
    const equityVal = parseFloat(equityBalance) * currentEquityPrice;
    
    setBondValue(bondVal);
    setWarrantValue(warrantVal);
    setEquityValue(equityVal);
    setTotalValue(bondVal + warrantVal + equityVal);
  }, [bondBalance, warrantBalance, equityBalance, bondYield]);
  
  const calculateWarrantIntrinsicValue = () => {
    const intrinsicValue = Math.max(0, currentEquityPrice - parseFloat(strikePrice));
    return intrinsicValue.toFixed(4);
  };
  
  return (
    <div className="portfolio">
      <h2>My Investment Portfolio</h2>
      
      <div className="portfolio-summary">
        <div className="summary-card">
          <h3>Total Portfolio Value</h3>
          <p className="total-value">{totalValue.toFixed(4)} ETH</p>
        </div>
      </div>
      
      <div className="holdings">
        <div className="holding-card">
          <h3>Bond Holdings</h3>
          <p><strong>Balance:</strong> {bondBalance} Bond Tokens</p>
          <p><strong>Yield Rate:</strong> {bondYield}%</p>
          <p><strong>Value at Maturity:</strong> {bondValue.toFixed(4)} ETH</p>
        </div>
        
        <div className="holding-card">
          <h3>Warrant Holdings</h3>
          <p><strong>Balance:</strong> {warrantBalance} Warrant Tokens</p>
          <p><strong>Strike Price:</strong> {strikePrice} ETH</p>
          <p><strong>Current Equity Price:</strong> {currentEquityPrice} ETH</p>
          <p><strong>Intrinsic Value:</strong> {calculateWarrantIntrinsicValue()} ETH per warrant</p>
          <p><strong>Market Value:</strong> {warrantValue.toFixed(4)} ETH</p>
        </div>
        
        <div className="holding-card">
          <h3>Equity Holdings</h3>
          <p><strong>Balance:</strong> {equityBalance} Equity Tokens</p>
          <p><strong>Current Price:</strong> {currentEquityPrice} ETH</p>
          <p><strong>Market Value:</strong> {equityValue.toFixed(4)} ETH</p>
        </div>
      </div>
      
      <div className="transaction-history">
        <h3>Transaction History</h3>
        <p className="no-transactions">Transaction history will appear here.</p>
        {/* In a real app, we would fetch and display transaction history */}
      </div>
    </div>
  );
};

export default Portfolio;