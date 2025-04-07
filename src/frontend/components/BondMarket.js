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
  const [redeemAmount, setRedeemAmount] = useState(0);
  const [maturityStatus, setMaturityStatus] = useState({
    hasMatured: false,
    timeToMaturity: 0,
    maturityDate: 'N/A'
  });
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Available bonds to invest in
  const availableBonds = [
    {
      id: 1,
      name: '1 Treasury Bond',
      type: 'Government',
      totalAmount: 1999.00,
      raisedAmount: 1999.00,
      interestRate: 5.98,
      duration: 9, // months
      startDate: '02-Apr-2025',
      status: 'Running'
    },
    {
      id: 2,
      name: '2 Corporate Bond',
      type: 'Corporate',
      totalAmount: 4135.00,
      raisedAmount: 4135.00,
      interestRate: 6.15,
      duration: 6, // months
      startDate: '28-Mar-2025',
      status: 'Running'
    },
    {
      id: 3,
      name: '3 Municipal Bond',
      type: 'Government',
      totalAmount: 4997.00,
      raisedAmount: 4997.00,
      interestRate: 6.30,
      duration: 12, // months
      startDate: '26-Mar-2025',
      status: 'Running'
    },
    {
      id: 4,
      name: '4 High-Yield Bond',
      type: 'Corporate',
      totalAmount: 2164.00,
      raisedAmount: 2164.00,
      interestRate: 6.50,
      duration: 9, // months
      startDate: '22-Mar-2025',
      status: 'Running'
    }
  ];
  
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
  
  const handlePurchase = (amount, bondName) => {
    purchaseBonds(amount, bondName);
  };
  
  const handleRedeem = () => {
    if (redeemAmount <= 0 || redeemAmount > bondBalance) {
      alert('Please enter a valid amount');
      return;
    }
    redeemBonds(redeemAmount);
  };
  
  // Calculate expected return
  const calculateReturn = (amount, interestRate) => {
    const principal = parseFloat(amount);
    const interest = principal * (interestRate / 100);
    return (principal + interest).toFixed(2);
  };

  const faqList = [
    {
      question: 'What are bond tokens?',
      answer: 'Bond tokens represent debt instruments that pay a fixed yield at maturity. When you purchase a bond token, you are essentially lending money to the issuer in exchange for a guaranteed return.',
    },
    {
      question: 'How do I earn returns?',
      answer: 'Bond tokens automatically accrue value over time. When your bonds reach maturity, you can redeem them to receive your initial investment plus the promised yield.'
    },
    {
      question: 'Can I sell my bonds before maturity?',
      answer: 'Yes, bond tokens are standard ERC20 tokens that can be transferred to other users. However, the bond maturity is tied to the purchase date, so the new owner will inherit your maturity timeline.'
    }
  ];
  
  return (
    <div className="bond-market">
      <h2>Bond Market</h2>
      
      <div className="search-filter">
        <input type="text" placeholder="Search" className="search-input" />
        <div className="filter-options">
          <button className="filter-button active">All</button>
          <button className="filter-button">New</button>
          <button className="filter-button">Ongoing</button>
          <button className="filter-button">Ended</button>
        </div>
      </div>
      
      <div className="bond-cards">
        {availableBonds.map(bond => (
          <div key={bond.id} className="bond-card">
            <div className="bond-status">{bond.status}</div>
            <h3>{bond.name}</h3>
            <div className="bond-amount">
              ${bond.raisedAmount.toFixed(2)} / ${bond.totalAmount.toFixed(2)} ({Math.floor((bond.raisedAmount / bond.totalAmount) * 100)}%)
            </div>
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{width: `${(bond.raisedAmount / bond.totalAmount) * 100}%`}}
              ></div>
            </div>
            
            <div className="bond-details">
              <div className="detail-row">
                <span className="detail-label">Loan Start Date</span>
                <span className="detail-value">{bond.startDate}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Bond Interest</span>
                <span className="detail-value">{bond.interestRate}% nett p.a.</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Duration</span>
                <span className="detail-value">{bond.duration} months</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Fully Funded</span>
              </div>
            </div>
            
            <button 
              className="purchase-button" 
              onClick={() => handlePurchase(1, bond.name)}
            >
              Purchase Bond
            </button>
          </div>
        ))}
      </div>
      
      {/* Redemption Section */}
      {parseFloat(bondBalance) > 0 && (
        <div className="redeem-section">
          <h3>Redeem Mature Bonds</h3>
          <div className="redeem-card">
            <div className="maturity-status">
              <p>Your Bonds: <span className={maturityStatus.hasMatured ? 'matured' : 'pending'}>
                {maturityStatus.hasMatured ? 'MATURED' : 'PENDING'}
              </span></p>
              {!maturityStatus.hasMatured && maturityStatus.timeToMaturity > 0 && (
                <p>Maturity date: {maturityStatus.maturityDate}</p>
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
              <p>Redemption Value: {calculateReturn(redeemAmount, bondYield)} ETH</p>
            </div>
            
            <button 
              className="redeem-button" 
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
      )}
      
      {/* FAQ */}
      <div className="bond-faq">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-list">
          {faqList.map((item, i) => (
            <div key={i} className="faq-item">
              <button className="faq-question" onClick={() => setActiveFaq(i === activeFaq ? null : i)}>
                {item.question}
                <span className="faq-toggle">{activeFaq === i ? '−' : '+'}</span>
              </button>
              {activeFaq === i && <p className="faq-answer">{item.answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BondMarket;