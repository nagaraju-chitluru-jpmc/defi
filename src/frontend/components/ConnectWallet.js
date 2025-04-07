import React from 'react';

const ConnectWallet = ({ connectWallet, error }) => {
  return (
    <div className="connect-wallet">
      <h2>Welcome to FT5003 - DistributedFusion</h2>
      <p>The premier platform for bond token investments on the blockchain.</p>
      
      <div className="features">
        <div className="feature">
          <h3>Bond Tokens</h3>
          <p>Fixed-income debt instruments that provide regular interest payments and return principal at maturity.</p>
        </div>
      </div>
      
      <button className="connect-button" onClick={connectWallet}>
        Connect Wallet to Start
      </button>
      
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ConnectWallet;