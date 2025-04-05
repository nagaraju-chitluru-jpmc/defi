import React, { useState } from 'react';

const WarrantMarket = ({
  equityPrice,
  strikePrice,
  purchaseWarrants,
  exerciseWarrants,
  warrantBalance,
  checkWarrantExpiry,
  expirationDate
}) => {
  const [purchaseAmount, setPurchaseAmount] = useState(1);
  const [exerciseAmount, setExerciseAmount] = useState(0);
  const [hasExpired, setHasExpired] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const calculateProfit = (amount) => {
    const intrinsicValue = Math.max(equityPrice - strikePrice, 0);
    return (parseFloat(amount) * intrinsicValue).toFixed(4);
  };

  const handleCheckExpiry = async () => {
    const expired = await checkWarrantExpiry();
    setHasExpired(expired);
  };

  const faqList = [
    {
      question: 'What are warrant tokens?',
      answer: 'Warrants give you the right to purchase equity at a strike price before expiration.'
    },
    {
      question: 'How do I profit from warrants?',
      answer: 'If the equity price exceeds the strike price at expiry, you gain the difference as profit.'
    },
    {
      question: 'Can I sell or transfer warrants?',
      answer: 'Yes, warrant tokens are ERC20-compatible and transferable.'
    }
  ];

  return (
    <div className="warrant-market">
      <h2>Warrant Token Market</h2>

      {/* Market Overview */}
      <div className="info-card">
        <h3>Market Overview</h3>
        <div className="info-stats">
          <div className="stat">
            <p className="stat-label">Strike Price</p>
            <p className="stat-value">{strikePrice} ETH</p>
          </div>
          <div className="stat">
            <p className="stat-label">Equity Price</p>
            <p className="stat-value">{equityPrice} ETH</p>
          </div>
          <div className="stat">
            <p className="stat-label">Expiration Date</p>
            <p className="stat-value">{expirationDate}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="market-actions">
        {/* Purchase Warrants */}
        <div className="action-card">
          <h3>Purchase Warrants</h3>
          <p>Buy warrant tokens to gain the option to purchase equity at the strike price.</p>

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
            <p>Potential Profit: {calculateProfit(purchaseAmount)} ETH</p>
          </div>

          <button className="action-button" onClick={() => purchaseWarrants(purchaseAmount)}>
            Purchase Warrant Tokens
          </button>
        </div>

        {/* Exercise Warrants */}
        <div className="action-card">
          <h3>Exercise Warrants</h3>
          <p>Exercise your warrants before expiry to buy equity at the strike price.</p>

          <div className="input-group">
            <label>Amount (Warrant Tokens):</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              max={warrantBalance}
              value={exerciseAmount}
              onChange={(e) => setExerciseAmount(e.target.value)}
            />
          </div>

          <div className="calculation">
            <p>Warrants Owned: {warrantBalance}</p>
            <p>Exercise Cost: {(exerciseAmount * strikePrice).toFixed(4)} ETH</p>
            <p>Equity Value: {(exerciseAmount * equityPrice).toFixed(4)} ETH</p>
            <p>Profit: {calculateProfit(exerciseAmount)} ETH</p>
          </div>

          <button className="action-button" onClick={handleCheckExpiry}>
            Check Expiry
          </button>

          <button
            className="action-button"
            onClick={() => exerciseWarrants(exerciseAmount)}
            disabled={hasExpired}
          >
            Exercise Warrant Tokens
          </button>

          {hasExpired && <p className="note">Warrants have expired and cannot be exercised.</p>}
        </div>
      </div>

      {/* FAQ */}
      <div className="warrant-faq">
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

export default WarrantMarket;
