// App.js - Main application component updated for Diamond Pattern
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Components
import Navbar from './components/Navbar';
import ConnectWallet from './components/ConnectWallet';
import BondMarket from './components/BondMarket';
import WarrantMarket from './components/WarrantMarket';
import Portfolio from './components/Portfolio';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';

// Import ABI for facets
import BondTokenFacetABI from './contracts/src/backend/contracts/BondTokenFacet.sol/BondTokenFacet.json';
import WarrantTokenFacetABI from './contracts/src/backend/contracts/WarrantTokenFacet.sol/WarrantTokenFacet.json';
import TokenSaleFacetABI from './contracts/src/backend/contracts/TokenSaleFacet.sol/TokenSaleFacet.json';
import EquityTokenFacetABI from './contracts/src/backend/contracts/EquityTokenFacet.sol/EquityTokenFacet.json';

// Contract addresses (update with your deployed diamond addresses)
const CONTRACT_ADDRESSES = {
  bondDiamond: '0x43e0F52563d32eF4815184Bb464981b1232b4bc0',
  warrantDiamond: '0x554d6dD53d0922D9e0a29C39a10FAd4f97C00f86',
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
  const [warrantBalance, setWarrantBalance] = useState(0);
  const [equityBalance, setEquityBalance] = useState(0);
  const [connectionError, setConnectionError] = useState('');
  const [companyMetrics, setCompanyMetrics] = useState({
    totalFundsRaised: 0,
    activeBonds: 0,
    bondMaturity: 180, // days
    bondYield: 8.5, // percentage
    warrantsIssued: 0,
    warrantStrikePrice: 0,
    contractBalance: 0, // Added for bond redemption fund
    totalBondRedemptions: 0, // Added tracking stats
    totalWarrantsExercised: 0, // Added tracking stats
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
      
      const warrantTokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.warrantDiamond,
        WarrantTokenFacetABI.abi,
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
        warrantToken: warrantTokenContract,
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
            updateBalances(newAccounts[0], bondTokenContract, warrantTokenContract, equityTokenContract);
          }
        });
        
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
      }
      
      // Load initial data
      await updateBalances(account, bondTokenContract, warrantTokenContract, equityTokenContract);
      await fetchCompanyMetrics(tokenSaleContract);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      setConnectionError(`Failed to connect: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Update token balances
  const updateBalances = async (account, bondContract, warrantContract, equityContract) => {
    if (account && bondContract && warrantContract) {
      try {
        const bondBalance = await bondContract.balanceOf(account);
        const warrantBalance = await warrantContract.balanceOf(account);
        
        // Get equity balance using the equity contract
        let equityBalance = ethers.BigNumber.from(0);
        if (equityContract) {
          equityBalance = await equityContract.balanceOf(account);
        }
        
        setBondBalance(ethers.utils.formatEther(bondBalance));
        setWarrantBalance(ethers.utils.formatEther(warrantBalance));
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
        const warrantsIssued = await saleContract.totalWarrantsIssued();
        const warrantStrike = await saleContract.warrantStrikePrice();
        const totalBondRedemptions = await saleContract.totalBondRedemptions();
        const totalWarrantsExercised = await saleContract.totalWarrantsExercised();
        
        // Get contract balance
        const contractBalance = await provider.getBalance(saleContract.address);
        
        setCompanyMetrics({
          totalFundsRaised: ethers.utils.formatEther(fundsRaised),
          activeBonds: activeBonds.toNumber(),
          bondMaturity: bondMaturity.toNumber() / 86400, // Convert seconds to days
          bondYield: bondYield.toNumber() / 100, // Convert basis points to percentage
          warrantsIssued: warrantsIssued.toNumber(),
          warrantStrikePrice: ethers.utils.formatEther(warrantStrike),
          contractBalance: ethers.utils.formatEther(contractBalance),
          totalBondRedemptions: totalBondRedemptions.toNumber(),
          totalWarrantsExercised: totalWarrantsExercised.toNumber(),
        });
      } catch (error) {
        console.error('Error fetching company metrics:', error);
      }
    }
  };
  
  // Purchase bond tokens
  const purchaseBonds = async (amount) => {
    if (contracts.tokenSale) {
      try {
        setIsLoading(true);
        const tx = await contracts.tokenSale.purchaseBonds({
          value: ethers.utils.parseEther(amount.toString())
        });
        await tx.wait();
        
        updateBalances(account, contracts.bondToken, contracts.warrantToken, contracts.equityToken);
        fetchCompanyMetrics(contracts.tokenSale);
        alert(`Successfully purchased ${amount} bond tokens!`);
      } catch (error) {
        console.error('Error purchasing bonds:', error);
        alert('Failed to purchase bond tokens: ' + (error.data?.message || error.message || "Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Purchase warrant tokens
  const purchaseWarrants = async (amount) => {
    if (contracts.tokenSale) {
      try {
        setIsLoading(true);
        const tx = await contracts.tokenSale.purchaseWarrants({
          value: ethers.utils.parseEther(amount.toString())
        });
        await tx.wait();
        
        updateBalances(account, contracts.bondToken, contracts.warrantToken, contracts.equityToken);
        fetchCompanyMetrics(contracts.tokenSale);
        alert(`Successfully purchased ${amount} warrant tokens!`);
      } catch (error) {
        console.error('Error purchasing warrants:', error);
        alert('Failed to purchase warrant tokens: ' + (error.data?.message || error.message || "Unknown error"));
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
        
        updateBalances(account, contracts.bondToken, contracts.warrantToken, contracts.equityToken);
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
  
  // Exercise warrants
  const exerciseWarrants = async (amount) => {
    if (contracts.tokenSale && contracts.warrantToken) {
      try {
        setIsLoading(true);
        // First approve the token sale contract to spend warrant tokens
        const approveTx = await contracts.warrantToken.approve(
          CONTRACT_ADDRESSES.tokenSaleDiamond,
          ethers.utils.parseEther(amount.toString())
        );
        await approveTx.wait();
        
        // Calculate the total ETH needed to exercise the warrants
        const strikePrice = ethers.utils.parseEther(companyMetrics.warrantStrikePrice);
        const totalCost = strikePrice.mul(ethers.utils.parseEther(amount.toString())).div(ethers.utils.parseEther("1"));
        
        // Then exercise the warrants
        const tx = await contracts.tokenSale.exerciseWarrants(
          ethers.utils.parseEther(amount.toString()),
          { value: totalCost }
        );
        await tx.wait();
        
        updateBalances(account, contracts.bondToken, contracts.warrantToken, contracts.equityToken);
        fetchCompanyMetrics(contracts.tokenSale);
        alert(`Successfully exercised ${amount} warrant tokens!`);
      } catch (error) {
        console.error('Error exercising warrants:', error);
        alert('Failed to exercise warrant tokens: ' + (error.data?.message || error.message || "Unknown error"));
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
  
  // Check if warrants have expired
  const checkWarrantExpiration = async () => {
    if (contracts.warrantToken) {
      try {
        const hasExpired = await contracts.warrantToken.hasExpired();
        const timeToExpiration = await contracts.warrantToken.timeToExpiration();
        
        return {
          hasExpired,
          timeToExpiration: timeToExpiration.toNumber(),
          expirationDate: new Date(Date.now() + (timeToExpiration.toNumber() * 1000)).toLocaleDateString()
        };
      } catch (error) {
        console.error('Error checking warrant expiration:', error);
        return {
          hasExpired: true,
          timeToExpiration: 0,
          expirationDate: 'Unknown'
        };
      }
    }
    
    return {
      hasExpired: true,
      timeToExpiration: 0,
      expirationDate: 'N/A'
    };
  };

  return (
    <div className="app">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isConnected={!!account}
      />
      
      <main className="container">
        {!account ? (
          <ConnectWallet 
            connectWallet={connectWallet} 
            error={connectionError}
          />
        ) : (
          <>
            <div className="account-info">
              <p>Connected: {account.substring(0, 6)}...{account.substring(38)}</p>
              <p>Bond Balance: {bondBalance}</p>
              <p>Warrant Balance: {warrantBalance}</p>
              {parseFloat(equityBalance) > 0 && <p>Equity Balance: {equityBalance}</p>}
            </div>
            
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
                
                {activeTab === 'warrants' && (
                  <WarrantMarket 
                    purchaseWarrants={purchaseWarrants} 
                    exerciseWarrants={exerciseWarrants}
                    warrantBalance={warrantBalance}
                    strikePrice={companyMetrics.warrantStrikePrice}
                    checkWarrantExpiration={checkWarrantExpiration}
                  />
                )}
                
                {activeTab === 'portfolio' && (
                  <Portfolio 
                    bondBalance={bondBalance}
                    warrantBalance={warrantBalance}
                    equityBalance={equityBalance}
                    bondYield={companyMetrics.bondYield}
                    strikePrice={companyMetrics.warrantStrikePrice}
                    account={account}
                    checkBondMaturity={checkBondMaturity}
                    checkWarrantExpiration={checkWarrantExpiration}
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
  );
}

export default App;