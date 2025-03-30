import React from 'react';

const Dashboard = ({ companyMetrics }) => {
  return (
    <div className="dashboard">
      <h2>Company Financial Dashboard</h2>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Funds Raised</h3>
          <p className="metric-value">{companyMetrics.totalFundsRaised} ETH</p>
        </div>
        
        <div className="metric-card">
          <h3>Active Bonds</h3>
          <p className="metric-value">{companyMetrics.activeBonds}</p>
        </div>
        
        <div className="metric-card">
          <h3>Bond Yield</h3>
          <p className="metric-value">{companyMetrics.bondYield}%</p>
        </div>
        
        <div className="metric-card">
          <h3>Bond Maturity</h3>
          <p className="metric-value">{companyMetrics.bondMaturity} days</p>
        </div>
        
        <div className="metric-card">
          <h3>Warrants Issued</h3>
          <p className="metric-value">{companyMetrics.warrantsIssued}</p>
        </div>
        
        <div className="metric-card">
          <h3>Warrant Strike Price</h3>
          <p className="metric-value">{companyMetrics.warrantStrikePrice} ETH</p>
        </div>
      </div>
      
      <div className="funding-info">
        <h3>How It Works</h3>
        <div className="funding-steps">
          <div className="step">
            <div className="step-number">1</div>
            <p>Company issues bond tokens to raise debt capital</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <p>Investors receive bonds with fixed yield and maturity date</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <p>Company issues warrant tokens as additional incentive</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <p>Investors can exercise warrants to buy equity at strike price</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;