// App.js - Main application component updated for Bond Market
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ConnectWallet from './components/ConnectWallet';
import BondMarket from './components/BondMarket';
import Portfolio from './components/Portfolio';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';

// Import ABI for facets
import BondTokenFacetABI from './contracts/src/backend/contracts/BondTokenFacet.sol/BondTokenFacet.json';
import TokenSaleFacetABI from './contracts/src/backend/contracts/TokenSaleFacet.sol/TokenSaleFacet.json';
import EquityTokenFacetABI from './contracts/src/backend/contracts/EquityTokenFacet.sol/EquityTokenFacet.json';

// Contract addresses (update with your deployed diamond addresses)
const CONTRACT_ADDRESSES = {
  bondDiamond: '0x43e0F52563d32eF4815184Bb464981b1232b4bc0',
  equityDiamond: '0x1234567890123456789012345678901234567890', // Update with actual address
  tokenSaleDiamond: '0x49aa5A5dD68927B6EF8D0b0cdf42057cF08C3f8A',
};

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contracts, setContracts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bondBalance, setBondBalance] = useState(0);
  const [equityBalance, setEquityBalance] = useState(0);
  const [connectionError, setConnectionError] = useState('');
  const [companyMetrics, setCompanyMetrics] = useState({
    totalFundsRaised: 0,
    activeBonds: 0,
    bondMaturity: 180, // days
    bondYield: 8.5, // percentage
    contractBalance: 0, // Added for bond redemption fund
    totalBondRedemptions: 0, // Added tracking stats
  });

  // Connect to wallet and setup contracts
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setConnectionError('Please install MetaMask to use this DeFi application');
        return;
      }
      
      // Clear any previous errors
      setConnectionError('');
      
      // Request accounts from MetaMask
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        setConnectionError('No accounts returned from MetaMask');
        return;
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const account = accounts[0];
      
      // Initialize diamond contract instances with their respective facet interfaces
      const bondTokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.bondDiamond,
        BondTokenFacetABI.abi,
        signer
      );

      const equityTokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.equityDiamond,
        EquityTokenFacetABI.abi,
        signer
      );
      
      const tokenSaleContract = new ethers.Contract(
        CONTRACT_ADDRESSES.tokenSaleDiamond,
        TokenSaleFacetABI.abi,
        signer
      );
      
      setProvider(provider);
      setSigner(signer);
      setAccount(account);
      setContracts({
        bondToken: bondTokenContract,
        equityToken: equityTokenContract,
        tokenSale: tokenSaleContract,
      });
      
      // Setup event listeners
      if (typeof window.ethereum.on === 'function') {
        window.ethereum.on('accountsChanged', (newAccounts) => {
          if (newAccounts.length === 0) {
            // User disconnected their wallet
            setAccount(null);
            setConnectionError('Wallet disconnected');
          } else {
            setAccount(newAccounts[0]);
            updateBalances(newAccounts[0], bondTokenContract, equityTokenContract);
          }
        });
        
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
      }
      
      // Load initial data
      await updateBalances(account, bondTokenContract, equityTokenContract);
      await fetchCompanyMetrics(tokenSaleContract);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      setConnectionError(`Failed to connect: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Update token balances
  const updateBalances = async (account, bondContract, equityContract) => {
    if (account && bondContract) {
      try {
        const bondBalance = await bondContract.balanceOf(account);
        
        // Get equity balance using the equity contract
        let equityBalance = ethers.BigNumber.from(0);
        if (equityContract) {
          equityBalance = await equityContract.balanceOf(account);
        }
        
        setBondBalance(ethers.utils.formatEther(bondBalance));
        setEquityBalance(ethers.utils.formatEther(equityBalance));
      } catch (error) {
        console.error('Error updating balances:', error);
      }
    }
  };
  
  // Fetch company financial metrics
  const fetchCompanyMetrics = async (saleContract) => {
    if (saleContract) {
      try {
        // Get metrics from the token sale diamond
        const fundsRaised = await saleContract.totalFundsRaised();
        const activeBonds = await saleContract.activeBondCount();
        const bondMaturity = await saleContract.bondMaturityPeriod();
        const bondYield = await saleContract.bondYieldPercentage();
        const totalBondRedemptions = await saleContract.totalBondRedemptions();
        
        // Get contract balance
        const contractBalance = await provider.getBalance(saleContract.address);
        
        setCompanyMetrics({
          totalFundsRaised: ethers.utils.formatEther(fundsRaised),
          activeBonds: activeBonds.toNumber(),
          bondMaturity: bondMaturity.toNumber() / 86400, // Convert seconds to days
          bondYield: bondYield.toNumber() / 100, // Convert basis points to percentage
          contractBalance: ethers.utils.formatEther(contractBalance),
          totalBondRedemptions: totalBondRedemptions.toNumber(),
        });
      } catch (error) {
        console.error('Error fetching company metrics:', error);
      }
    }
  };
  
  // Purchase bond tokens
  const purchaseBonds = async (amount, bondType) => {
    if (contracts.tokenSale) {
      try {
        setIsLoading(true);
        const tx = await contracts.tokenSale.purchaseBonds({
          value: ethers.utils.parseEther(amount.toString())
        });
        await tx.wait();
        
        updateBalances(account, contracts.bondToken, contracts.equityToken);
        fetchCompanyMetrics(contracts.tokenSale);
        alert(`Successfully purchased ${amount} ${bondType} bonds!`);
      } catch (error) {
        console.error('Error purchasing bonds:', error);
        alert('Failed to purchase bond tokens: ' + (error.data?.message || error.message || "Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Redeem mature bonds
  const redeemBonds = async (amount) => {
    if (contracts.tokenSale && contracts.bondToken) {
      try {
        setIsLoading(true);
        // First approve the token sale contract to spend bond tokens
        const approveTx = await contracts.bondToken.approve(
          CONTRACT_ADDRESSES.tokenSaleDiamond,
          ethers.utils.parseEther(amount.toString())
        );
        await approveTx.wait();
        
        // Then redeem the bonds
        const tx = await contracts.tokenSale.redeemBonds(
          ethers.utils.parseEther(amount.toString())
        );
        await tx.wait();
        
        updateBalances(account, contracts.bondToken, contracts.equityToken);
        fetchCompanyMetrics(contracts.tokenSale);
        alert(`Successfully redeemed ${amount} bond tokens!`);
      } catch (error) {
        console.error('Error redeeming bonds:', error);
        alert('Failed to redeem bond tokens: ' + (error.data?.message || error.message || "Bonds may not have matured yet."));
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Check if bonds have matured
  const checkBondMaturity = async () => {
    if (contracts.bondToken && account) {
      try {
        const hasMatured = await contracts.bondToken.hasBondMatured(account);
        const timeToMaturity = await contracts.bondToken.timeToMaturity(account);
        
        return {
          hasMatured,
          timeToMaturity: timeToMaturity.toNumber(),
          maturityDate: new Date(Date.now() + (timeToMaturity.toNumber() * 1000)).toLocaleDateString()
        };
      } catch (error) {
        console.error('Error checking bond maturity:', error);
        return {
          hasMatured: false,
          timeToMaturity: 0,
          maturityDate: 'Unknown'
        };
      }
    }
    
    return {
      hasMatured: false,
      timeToMaturity: 0,
      maturityDate: 'N/A'
    };
  };

  return (
    <div className="app">
      {account && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
      
      <div className="main-content">
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isConnected={!!account}
          account={account}
          bondBalance={bondBalance}
        />
        
        <main className="container">
          {!account ? (
            <ConnectWallet 
              connectWallet={connectWallet} 
              error={connectionError}
            />
          ) : (
            <>
              {isLoading ? (
                <div className="loading">Loading...</div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <Dashboard 
                      companyMetrics={companyMetrics} 
                      contractAddresses={CONTRACT_ADDRESSES}
                    />
                  )}
                  
                  {activeTab === 'bonds' && (
                    <BondMarket 
                      purchaseBonds={purchaseBonds} 
                      redeemBonds={redeemBonds}
                      bondBalance={bondBalance}
                      bondYield={companyMetrics.bondYield}
                      bondMaturity={companyMetrics.bondMaturity}
                      checkBondMaturity={checkBondMaturity}
                      contractBalance={companyMetrics.contractBalance}
                    />
                  )}
                  
                  {activeTab === 'portfolio' && (
                    <Portfolio 
                      bondBalance={bondBalance}
                      equityBalance={equityBalance}
                      bondYield={companyMetrics.bondYield}
                      account={account}
                      checkBondMaturity={checkBondMaturity}
                    />
                  )}
                  
                  {activeTab === 'admin' && (
                    <Admin 
                      contracts={contracts}
                      account={account}
                      companyMetrics={companyMetrics}
                      fetchCompanyMetrics={fetchCompanyMetrics}
                    />
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;