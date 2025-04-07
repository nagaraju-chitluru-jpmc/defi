// components/Sidebar.js
import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="sidebar">
      <div className="logo">
        <h2>FT5003 - DistributedFusion</h2>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li className={activeTab === 'dashboard' ? 'active' : ''}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('dashboard');
              }}
            >
              <i className="icon dashboard-icon"></i>
              Dashboard
            </a>
          </li>
          <li className={activeTab === 'bonds' ? 'active' : ''}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('bonds');
              }}
            >
              <i className="icon deals-icon"></i>
              Deals
            </a>
          </li>
          <li className={activeTab === 'portfolio' ? 'active' : ''}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('portfolio');
              }}
            >
              <i className="icon portfolio-icon"></i>
              Portfolio
            </a>
          </li>
          <li className={activeTab === 'balance' ? 'active' : ''}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('balance');
              }}
            >
              <i className="icon balance-icon"></i>
              Balance
            </a>
          </li>
          <li className={activeTab === 'account' ? 'active' : ''}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('account');
              }}
            >
              <i className="icon account-icon"></i>
              Account
            </a>
          </li>
          <li className={activeTab === 'admin' ? 'active' : ''}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('admin');
              }}
            >
              <i className="icon settings-icon"></i>
              Admin
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;