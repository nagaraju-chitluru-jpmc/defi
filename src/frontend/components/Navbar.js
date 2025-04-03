// components/Navbar.js
import React from 'react';

const Navbar = ({ activeTab, setActiveTab, isConnected }) => {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-brand">DeFi Bond & Warrant System</div>
        
        {isConnected && (
          <ul className="navbar-nav">
            <li className="nav-item">
              <a 
                href="#" 
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('dashboard');
                }}
              >
                Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#" 
                className={`nav-link ${activeTab === 'bonds' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('bonds');
                }}
              >
                Bond Market
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#" 
                className={`nav-link ${activeTab === 'warrants' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('warrants');
                }}
              >
                Warrant Market
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#" 
                className={`nav-link ${activeTab === 'portfolio' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('portfolio');
                }}
              >
                My Portfolio
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#" 
                className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('admin');
                }}
              >
                Admin
              </a>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;