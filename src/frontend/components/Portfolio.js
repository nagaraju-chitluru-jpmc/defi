import React from 'react';

const Portfolio = ({ bondBalance, warrantBalance, totalValue, transactionHistory = [] }) => {
  return (
    <div className="portfolio">
      <h2>My Portfolio</h2>

      {/* Portfolio Summary */}
      <div className="portfolio-summary">
        <div className="portfolio-card">
          <h4>Bond Tokens</h4>
          <p className="portfolio-value">{bondBalance} BND</p>
        </div>
        <div className="portfolio-card">
          <h4>Warrant Tokens</h4>
          <p className="portfolio-value">{warrantBalance} WNT</p>
        </div>
        <div className="portfolio-card total">
          <h4>Total Portfolio Value</h4>
          <p className="portfolio-value">{totalValue} ETH</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transaction-history">
        <h3>Transaction History</h3>
        {transactionHistory.length === 0 ? (
          <p className="empty-history">Transaction history will appear here.</p>
        ) : (
          <ul className="transaction-list">
            {transactionHistory.map((tx, index) => (
              <li key={index} className={`transaction-item ${tx.type.toLowerCase()}`}>
                <span className="tx-type">{tx.type}</span>
                <span>{tx.amount} {tx.token}</span>
                <span className="tx-date">{tx.date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
