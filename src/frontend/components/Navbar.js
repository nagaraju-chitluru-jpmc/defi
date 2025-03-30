// components/Navbar.js
import React from 'react';

const Navbar = ({ activeTab, setActiveTab, isConnected }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>DeFi Bond & Warrant System</h1>
      </div>
      
      {isConnected && (
        <ul className="navbar-nav">
          <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          </li>
          <li className={`nav-item ${activeTab === 'bonds' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('bonds')}>Bond Market</button>
          </li>
          <li className={`nav-item ${activeTab === 'warrants' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('warrants')}>Warrant Market</button>
          </li>
          <li className={`nav-item ${activeTab === 'portfolio' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('portfolio')}>My Portfolio</button>
          </li>
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
