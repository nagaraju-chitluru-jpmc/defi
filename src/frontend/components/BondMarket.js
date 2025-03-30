import React, { useState } from 'react';

const BondMarket = ({ purchaseBonds, redeemBonds, bondBalance, bondYield, bondMaturity }) => {
  const [purchaseAmount, setPurchaseAmount] = useState(1);
  const [redeemAmount, setRedeemAmount] = useState(0);
  
  const handlePurchase = () => {
    if (purchaseAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    purchaseBonds(purchaseAmount);
  };
  
  const handleRedeem = () => {
    if (redeemAmount <= 0 || redeemAmount > bondBalance) {
      alert('Please enter a valid amount');
      return;
    }
    redeemBonds(redeemAmount);
  };
  
  // Calculate expected return
  const calculateReturn = (amount) => {
    const principal = parseFloat(amount);
    const interest = principal * (bondYield / 100);
    return (principal + interest).toFixed(4);
  };
  
  return (
    <div className="bond-market">
      <h2>Bond Token Market</h2>
      
      <div className="bond-info">
        <div className="info-card">
          <h3>Bond Terms</h3>
          <p><strong>Yield:</strong> {bondYield}% fixed return</p>
          <p><strong>Maturity:</strong> {bondMaturity} days</p>
          <p><strong>Value:</strong> 1 Bond Token = 1 ETH</p>
          <p><strong>At Maturity:</strong> 1 Bond Token = {(1 + (bondYield/100)).toFixed(4)} ETH</p>
        </div>
      </div>
      
      <div className="market-actions">
        <div className="action-card">
          <h3>Purchase Bonds</h3>
          <p>Purchase bond tokens to earn fixed yield.</p>
          
          <div className="input-group">
            <label>Amount (ETH):</label>
            <input 
              type="number" 
              min="0.1"
              step="0.1"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
            />
          </div>
          
          <div className="calculation">
            <p>Cost: {purchaseAmount} ETH</p>
            <p>Expected Return: {calculateReturn(purchaseAmount)} ETH</p>
            <p>Profit: {(calculateReturn(purchaseAmount) - purchaseAmount).toFixed(4)} ETH</p>
          </div>
          
          <button className="action-button" onClick={handlePurchase}>
            Purchase Bond Tokens
          </button>
        </div>
        
        <div className="action-card">
          <h3>Redeem Mature Bonds</h3>
          <p>Redeem your matured bond tokens to receive principal plus yield.</p>
          <p className="note">Note: Bonds can only be redeemed after the maturity period.</p>
          
          <div className="input-group">
            <label>Amount (Bond Tokens):</label>
            <input 
              type="number"
              min="0.1"
              step="0.1"
              max={bondBalance}
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
            />
          </div>
          
          <div className="calculation">
            <p>Your Balance: {bondBalance} Bond Tokens</p>
            <p>Redemption Value: {calculateReturn(redeemAmount)} ETH</p>
          </div>
          
          <button 
            className="action-button" 
            onClick={handleRedeem}
            disabled={bondBalance <= 0}
          >
            Redeem Bond Tokens
          </button>
        </div>
      </div>
    </div>
  );
};

export default BondMarket;