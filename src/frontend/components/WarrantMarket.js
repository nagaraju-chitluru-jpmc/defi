import React, { useState } from 'react';

const WarrantMarket = ({ purchaseWarrants, exerciseWarrants, warrantBalance, strikePrice }) => {
  const [purchaseAmount, setPurchaseAmount] = useState(1);
  const [exerciseAmount, setExerciseAmount] = useState(0);
  const warrantPrice = 0.1; // Price per warrant token in ETH
  
  const handlePurchase = () => {
    if (purchaseAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    purchaseWarrants(purchaseAmount);
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
  
  return (
    <div className="warrant-market">
      <h2>Warrant Token Market</h2>
      
      <div className="warrant-info">
        <div className="info-card">
          <h3>Warrant Terms</h3>
          <p><strong>Current Price:</strong> {warrantPrice} ETH per warrant</p>
          <p><strong>Strike Price:</strong> {strikePrice} ETH</p>
          <p><strong>Rights:</strong> Each warrant gives right to purchase 1 equity token at strike price</p>
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
          </div>
          
          <button className="action-button" onClick={handlePurchase}>
            Purchase Warrant Tokens
          </button>
        </div>
        
        <div className="action-card">
          <h3>Exercise Warrants</h3>
          <p>Exercise your warrant tokens to purchase equity at the strike price.</p>
          
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
          </div>
          
          <button 
            className="action-button" 
            onClick={handleExercise}
            disabled={warrantBalance <= 0}
          >
            Exercise Warrant Tokens
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarrantMarket;