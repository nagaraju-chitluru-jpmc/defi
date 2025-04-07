// components/Navbar.js
import React from 'react';

const Navbar = ({ isConnected, account, bondBalance }) => {
  return (
    <nav className="top-navbar">
      <div className="page-title">
        {/* This will change based on the active tab */}
        <h1>Dashboard</h1>
      </div>
      
      {isConnected && (
        <div className="user-section">
          <div className="notifications">
            <span className="notification-icon">🔔</span>
            <span className="notification-count">1</span>
          </div>
          
          <div className="message-center">
            <span className="message-icon">✉️</span>
          </div>
          
          <div className="user-info">
            <span className="user-name">
              {account ? `${account.substring(0, 6)}...${account.substring(38)}` : 'Connect Wallet'}
            </span>
            <div className="user-avatar">
              {/* This could be a profile picture or a wallet icon */}
              👤
            </div>
            {account && (
              <button className="logout-button" onClick={() => window.location.reload()}>
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;