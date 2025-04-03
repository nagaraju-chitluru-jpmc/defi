// components/BondMarket.js
import React, { useState, useEffect } from 'react';

const BondMarket = ({ 
  purchaseBonds, 
  redeemBonds, 
  bondBalance, 
  bondYield, 
  bondMaturity,
  checkBondMaturity,
  contractBalance
}) => {
  const [purchaseAmount, setPurchaseAmount] = useState(1);
  const [redeemAmount, setRedeemAmount] = useState(0);
  const [maturityStatus, setMaturityStatus] = useState({
    hasMatured: false,
    timeToMaturity: 0,
    maturityDate: 'N/A'
  });
  const [countdownString, setCountdownString] = useState('');
  
  // Get bond maturity information
  useEffect(() => {
    const loadMaturityStatus = async () => {
      const status = await checkBondMaturity();
      setMaturityStatus(status);
    };
    
    loadMaturityStatus();
    // Refresh every minute
    const interval = setInterval(loadMaturityStatus, 60000);
    
    return () => clearInterval(interval);
  }, [checkBondMaturity, bondBalance]);
  
  // Format countdown timer
  useEffect(() => {
    if (maturityStatus.timeToMaturity > 0) {
      const updateCountdown = () => {
        const seconds = Math.max(0, maturityStatus.timeToMaturity - ((Date.now() / 1000) - (Date.now() / 1000) % 1));
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        setCountdownString(`${days}d ${hours}h ${minutes}m`);
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      
      return () => clearInterval(interval);
    } else {
      setCountdownString('Matured');
    }
  }, [maturityStatus]);
  
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
      
      <div className="market-info">
        <div className="info-card">
          <h3>Market Overview</h3>
          <div className="info-stats">
            <div className="stat">
              <p className="stat-label">Current Yield</p>
              <p className="stat-value">{bondYield}%</p>
            </div>
            <div className="stat">
              <p className="stat-label">Maturity Period</p>
              <p className="stat-value">{bondMaturity} days</p>
            </div>
            <div className="stat">
              <p className="stat-label">Redemption Fund</p>
              <p className="stat-value">{contractBalance} ETH</p>
            </div>
          </div>
        </div>
      </div>
      
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
            <p>Maturity Date: {new Date(Date.now() + (bondMaturity * 86400 * 1000)).toLocaleDateString()}</p>
          </div>
          
          <button className="action-button" onClick={handlePurchase}>
            Purchase Bond Tokens
          </button>
        </div>
        
        <div className="action-card">
          <h3>Redeem Mature Bonds</h3>
          <p>Redeem your matured bond tokens to receive principal plus yield.</p>
          
          <div className="maturity-status">
            <p>Your Bonds: <span className={maturityStatus.hasMatured ? 'matured' : 'pending'}>
              {maturityStatus.hasMatured ? 'MATURED' : 'PENDING'}
            </span></p>
            {!maturityStatus.hasMatured && maturityStatus.timeToMaturity > 0 && (
              <>
                <p>Time until maturity: <span className="countdown">{countdownString}</span></p>
                <p>Maturity date: {maturityStatus.maturityDate}</p>
              </>
            )}
          </div>
          
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
            disabled={bondBalance <= 0 || !maturityStatus.hasMatured}
          >
            Redeem Bond Tokens
          </button>
          {!maturityStatus.hasMatured && bondBalance > 0 && (
            <p className="note">Note: Bonds can only be redeemed after the maturity period.</p>
          )}
        </div>
      </div>
      
      <div className="bond-faq">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-item">
          <h4>What are bond tokens?</h4>
          <p>Bond tokens represent debt instruments that pay a fixed yield at maturity. 
             When you purchase a bond token, you're essentially lending money to the issuer 
             in exchange for a guaranteed return.</p>
        </div>
        <div className="faq-item">
          <h4>How do I earn returns?</h4>
          <p>Bond tokens automatically accrue value over time. When your bonds reach maturity, 
             you can redeem them to receive your initial investment plus the promised yield.</p>
        </div>
        <div className="faq-item">
          <h4>Can I sell my bonds before maturity?</h4>
          <p>Yes, bond tokens are standard ERC20 tokens that can be transferred to other users. 
             However, the bond maturity is tied to the purchase date, so the new owner will inherit 
             your maturity timeline.</p>
        </div>
      </div>
    </div>
  );
};

export default BondMarket;