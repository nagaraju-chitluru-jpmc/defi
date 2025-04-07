import React, { useState } from 'react';

const Portfolio = ({ bondBalance, equityBalance, totalValue, bondYield, checkBondMaturity }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [maturityInfo, setMaturityInfo] = useState({});
  
  // Sample portfolio data
  const activeBonds = [
    {
      id: 1,
      name: '1 Treasury Bond',
      purchaseDate: '02-Apr-2025',
      amount: parseFloat(bondBalance) > 0 ? (parseFloat(bondBalance) * 0.4).toFixed(2) : '0.00',
      interestRate: 5.98,
      duration: '9 months',
      maturityDate: '02-Jan-2026',
      status: 'Active'
    },
    {
      id: 2,
      name: '2 Corporate Bond',
      purchaseDate: '28-Mar-2025',
      amount: parseFloat(bondBalance) > 0 ? (parseFloat(bondBalance) * 0.6).toFixed(2) : '0.00',
      interestRate: 6.15,
      duration: '6 months',
      maturityDate: '28-Sep-2025',
      status: 'Active'
    }
  ];
  
  const transactionHistory = [
    {
      id: 1,
      date: '02-Apr-2025',
      type: 'Purchase',
      amount: activeBonds[0].amount,
      token: 'BOND',
      status: 'Completed'
    },
    {
      id: 2,
      date: '28-Mar-2025',
      type: 'Purchase',
      amount: activeBonds[1].amount,
      token: 'BOND',
      status: 'Completed'
    }
  ];
  
  // Calculate total portfolio value
  const calculatedTotalValue = parseFloat(bondBalance) + parseFloat(equityBalance);
  
  const handleCheckMaturity = async (bondId) => {
    const status = await checkBondMaturity();
    setMaturityInfo(prev => ({
      ...prev,
      [bondId]: status
    }));
  };
  
  return (
    <div className="portfolio">
      <h2>My Portfolio</h2>

      {/* Portfolio Summary */}
      <div className="portfolio-summary">
        <div className="summary-card total">
          <h3>Total Portfolio Value</h3>
          <p className="portfolio-value">{calculatedTotalValue.toFixed(2)} ETH</p>
        </div>
        <div className="summary-card">
          <h3>Bond Tokens</h3>
          <p className="portfolio-value">{bondBalance} BOND</p>
        </div>
        {parseFloat(equityBalance) > 0 && (
          <div className="summary-card">
            <h3>Equity Balance</h3>
            <p className="portfolio-value">{equityBalance} EQT</p>
          </div>
        )}
      </div>

      {/* Portfolio Tabs */}
      <div className="portfolio-tabs">
        <button 
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Investments
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Transaction History
        </button>
      </div>

      {/* Active Investments */}
      {activeTab === 'active' && (
        <div className="active-investments">
          <h3>Active Bond Investments</h3>
          
          {activeBonds.length > 0 ? (
            <div className="investments-table">
              <table>
                <thead>
                  <tr>
                    <th>Bond Name</th>
                    <th>Purchase Date</th>
                    <th>Amount</th>
                    <th>Interest Rate</th>
                    <th>Duration</th>
                    <th>Maturity Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBonds.map(bond => (
                    <tr key={bond.id}>
                      <td>{bond.name}</td>
                      <td>{bond.purchaseDate}</td>
                      <td>{bond.amount} BOND</td>
                      <td>{bond.interestRate}%</td>
                      <td>{bond.duration}</td>
                      <td>{bond.maturityDate}</td>
                      <td>
                        <span className={`status-pill ${bond.status.toLowerCase()}`}>
                          {bond.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-button check-maturity"
                          onClick={() => handleCheckMaturity(bond.id)}
                        >
                          Check Maturity
                        </button>
                        {maturityInfo[bond.id] && (
                          <div className="maturity-info">
                            <p>Status: {maturityInfo[bond.id].hasMatured ? 'Matured' : 'Pending'}</p>
                            {!maturityInfo[bond.id].hasMatured && (
                              <p>Matures on: {maturityInfo[bond.id].maturityDate}</p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-investments">You don't have any active investments.</p>
          )}
        </div>
      )}

      {/* Transaction History */}
      {activeTab === 'history' && (
        <div className="transaction-history">
          <h3>Transaction History</h3>
          
          {transactionHistory.length > 0 ? (
            <div className="transactions-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Token</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.map(tx => (
                    <tr key={tx.id}>
                      <td>{tx.date}</td>
                      <td>{tx.type}</td>
                      <td>{tx.amount}</td>
                      <td>{tx.token}</td>
                      <td>
                        <span className={`status-pill ${tx.status.toLowerCase()}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-transactions">No transaction history available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Portfolio;