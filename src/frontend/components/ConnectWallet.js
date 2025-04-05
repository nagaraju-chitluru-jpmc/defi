import React from 'react';

const ConnectWallet = ({ connectWallet }) => {
  return (
    <div className="connect-wallet">
      <h2>Welcome to the Bond & Warrant DeFi System</h2>
      <p>This platform allows companies to raise funds through bond tokens and warrant tokens on the blockchain.</p>
      
      <div className="features">
        <div className="feature">
          <h3>Bond Tokens</h3>
          <p>Fixed-income debt instruments that provide regular interest payments and return principal at maturity.</p>
        </div>
        
        <div className="feature">
          <h3>Warrant Tokens</h3>
          <p>Options to purchase equity at a predetermined price, providing upside potential.</p>
        </div>
      </div>
      
      <button className="connect-button" onClick={connectWallet}>
        Connect Wallet to Start
      </button>
    </div>
  );
};

export default ConnectWallet;