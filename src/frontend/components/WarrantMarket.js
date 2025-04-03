// components/WarrantMarket.js
import React, { useState, useEffect } from 'react';

const WarrantMarket = ({ 
  purchaseWarrants, 
  exerciseWarrants, 
  warrantBalance, 
  strikePrice,
  checkWarrantExpiration
}) => {
  const [purchaseAmount, setPurchaseAmount] = useState(1);
  const [exerciseAmount, setExerciseAmount] = useState(0);
  const [expirationStatus, setExpirationStatus] = useState({
    hasExpired: false,
    timeToExpiration: 0,
    expirationDate: 'N/A'
  });
  const [countdownString, setCountdownString] = useState('');
  const warrantPrice = 0.1; // Price per warrant token in ETH
  const currentEquityPrice = 1.2; // Mock market price of equity
  
  // Get warrant expiration information
  useEffect(() => {
    const loadExpirationStatus = async () => {
      const status = await checkWarrantExpiration();
      setExpirationStatus(status);
    };
    
    loadExpirationStatus();
    // Refresh every minute
    const interval = setInterval(loadExpirationStatus, 60000);
    
    return () => clearInterval(interval);
  }, [checkWarrantExpiration, warrantBalance]);
  
  // Format countdown timer
  useEffect(() => {
    if (expirationStatus.timeToExpiration > 0) {
      const updateCountdown = () => {
        const seconds = Math.max(0, expirationStatus.timeToExpiration - ((Date.now() / 1000) - (Date.now() / 1000) % 1));
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        setCountdownString(`${days}d ${hours}h ${minutes}m`);
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      
      return () => clearInterval(interval);
    } else {
      setCountdownString('Expired');
    }
  }, [expirationStatus]);
  
  const handlePurchase = () => {
    if (purchaseAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    purchaseWarrants(purchaseAmount * warrantPrice);
  };
  
  const handleExercise = () => {
    if (exerciseAmount <= 0 || exerciseAmount > warrantBalance) {
      alert('Please enter a valid amount');
      return;
    }
    exerciseWarrants(exerciseAmount);
  };
  
  // Calculate cost to exercise warrants
  const calculateExerciseCost = (amount) => {
    return (parseFloat(amount) * parseFloat(strikePrice)).toFixed(4);
  };
  
  // Calculate warrant's intrinsic value
  const calculateIntrinsicValue = () => {
    const intrinsicValue = Math.max(0, currentEquityPrice - parseFloat(strikePrice));
    return intrinsicValue.toFixed(4);
  };
  
  // Calculate potential profit from exercising warrants
  const calculateProfit = (amount) => {
    const exerciseCost = parseFloat(calculateExerciseCost(amount));
    const equityValue = parseFloat(amount) * currentEquityPrice;
    return (equityValue - exerciseCost).toFixed(4);
  };
  
  return (
    <div className="warrant-market">
      <h2>Warrant Token Market</h2>
      
      <div className="market-info">
        <div className="info-card">
          <h3>Market Overview</h3>
          <div className="info-stats">
            <div className="stat">
              <p className="stat-label">Current Warrant Price</p>
              <p className="stat-value">{warrantPrice} ETH</p>
            </div>
            <div className="stat">
              <p className="stat-label">Strike Price</p>
              <p className="stat-value">{strikePrice} ETH</p>
            </div>
            <div className="stat">
              <p className="stat-label">Current Equity Price</p>
              <p className="stat-value">{currentEquityPrice} ETH</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="warrant-info">
        <div className="info-card">
          <h3>Warrant Terms</h3>
          <p><strong>Current Price:</strong> {warrantPrice} ETH per warrant</p>
          <p><strong>Strike Price:</strong> {strikePrice} ETH</p>
          <p><strong>Intrinsic Value:</strong> {calculateIntrinsicValue()} ETH</p>
          <p><strong>Rights:</strong> Each warrant gives right to purchase 1 equity token at strike price</p>
          <p className={expirationStatus.hasExpired ? 'expired-warning' : ''}>
            <strong>Status:</strong> {expirationStatus.hasExpired ? 'EXPIRED' : 'ACTIVE'}
          </p>
          {!expirationStatus.hasExpired && (
            <p><strong>Expires:</strong> {expirationStatus.expirationDate}</p>
          )}
        </div>
      </div>
      
      <div className="market-actions">
        <div className="action-card">
          <h3>Purchase Warrants</h3>
          <p>Purchase warrant tokens to obtain rights to buy equity.</p>
          
          <div className="input-group">
            <label>Amount (Warrants):</label>
            <input 
              type="number" 
              min="1"
              step="1"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
            />
          </div>
          
          <div className="calculation">
            <p>Cost: {(purchaseAmount * warrantPrice).toFixed(4)} ETH</p>
            <p>Warrants to Receive: {purchaseAmount}</p>
            <p>Potential Value at Current Equity Price: {(purchaseAmount * currentEquityPrice).toFixed(4)} ETH</p>
            <p>Exercise Cost (at Strike Price): {calculateExerciseCost(purchaseAmount)} ETH</p>
          </div>
          
          <button className="action-button" onClick={handlePurchase}>
            Purchase Warrant Tokens
          </button>
        </div>
        
        <div className="action-card">
          <h3>Exercise Warrants</h3>
          <p>Exercise your warrant tokens to purchase equity at the strike price.</p>
          
          <div className="expiration-status">
            <p>Warrant Status: <span className={expirationStatus.hasExpired ? 'expired' : 'active'}>
              {expirationStatus.hasExpired ? 'EXPIRED' : 'ACTIVE'}
            </span></p>
            {!expirationStatus.hasExpired && expirationStatus.timeToExpiration > 0 && (
              <>
                <p>Time until expiration: <span className="countdown">{countdownString}</span></p>
                <p>Expiration date: {expirationStatus.expirationDate}</p>
              </>
            )}
          </div>
          
          <div className="input-group">
            <label>Amount (Warrant Tokens):</label>
            <input 
              type="number"
              min="1"
              step="1"
              max={warrantBalance}
              value={exerciseAmount}
              onChange={(e) => setExerciseAmount(e.target.value)}
            />
          </div>
          
          <div className="calculation">
            <p>Your Balance: {warrantBalance} Warrant Tokens</p>
            <p>Exercise Cost: {calculateExerciseCost(exerciseAmount)} ETH</p>
            <p>Equity Tokens to Receive: {exerciseAmount}</p>
            <p>Equity Value at Current Price: {(exerciseAmount * currentEquityPrice).toFixed(4)} ETH</p>
            <p>Potential Profit: {calculateProfit(exerciseAmount)} ETH</p>
          </div>
          
          <button 
            className="action-button" 
            onClick={handleExercise}
            disabled={warrantBalance <= 0 || expirationStatus.hasExpired}
          >
            Exercise Warrant Tokens
          </button>
          {expirationStatus.hasExpired && warrantBalance > 0 && (
            <p className="expired-warning">Your warrants have expired and can no longer be exercised.</p>
          )}
        </div>
      </div>
      
      <div className="warrant-faq">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-item">
          <h4>What are warrant tokens?</h4>
          <p>Warrant tokens give you the right, but not the obligation, to purchase 
             equity tokens at a predetermined price (the strike price) before the expiration date.</p>
        </div>
        <div className="faq-item">
          <h4>How do I profit from warrants?</h4>
          <p>If the market price of equity rises above the strike price, your warrants gain 
             intrinsic value. You can then exercise them to purchase equity at the lower strike price 
             and potentially sell it at the higher market price.</p>
        </div>
        <div className="faq-item">
          <h4>What happens if warrants expire?</h4>
          <p>If you don't exercise your warrants before the expiration date, they become worthless. 
             Always monitor the expiration date of your warrants.</p>
        </div>
        <div className="faq-item">
          <h4>Can I trade my warrants?</h4>
          <p>Yes, warrant tokens are standard ERC20 tokens that can be transferred to other users.</p>
        </div>
      </div>
    </div>
  );
};

export default WarrantMarket;