// App.js - Main application component
import React, { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';


// Components
import Navbar from './components/Navbar';
import ConnectWallet from './components/ConnectWallet';
import BondMarket from './components/BondMarket';
import WarrantMarket from './components/WarrantMarket';
import Portfolio from './components/Portfolio';
import Dashboard from './components/Dashboard';

// Smart contract ABIs
import BondTokenABI from './contracts/src/backend/contracts/BondToken.sol/BondToken.json';
import WarrantTokenABI from './contracts/src/backend/contracts/WarrantToken.sol/WarrantToken.json';
import TokenSaleABI from './contracts/src/backend/contracts/TokenSale.sol/TokenSale.json';

// Contract addresses (would be populated from deployment)
const CONTRACT_ADDRESSES = {
  bondToken: '0x871508dA258ACE05A938E9c6b6bD4B5e304eb3de',
  warrantToken: '0xdf38dE6510c48F9C02861a78688F8eD261a5E387',
  tokenSale: '0xE8AbAe67628c2801464a7C269467d9eeE3Ab3471',
  equityToken: '0x8ba6745Ef31687BFfb668AEbA7b8798482fE712F',
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
  const [companyMetrics, setCompanyMetrics] = useState({
    totalFundsRaised: 0,
    activeBonds: 0,
    bondMaturity: 180, // days
    bondYield: 8.5, // percentage
    warrantsIssued: 0,
    warrantStrikePrice: 0,
  });

  // Connect to wallet and setup contracts
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Check if accounts array is valid and not empty
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts returned from MetaMask");
        }
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Verify signer is not null before getting address
        if (!signer) {
          throw new Error("Failed to get signer from provider");
        }
        
        const account = await signer.getAddress();
          
          // Initialize contract instances
          const bondTokenContract = new ethers.Contract(
            CONTRACT_ADDRESSES.bondToken,
            BondTokenABI.abi,
            signer
          );
          
          const warrantTokenContract = new ethers.Contract(
            CONTRACT_ADDRESSES.warrantToken,
            WarrantTokenABI.abi,
            signer
          );
          
          const tokenSaleContract = new ethers.Contract(
            CONTRACT_ADDRESSES.tokenSale,
            TokenSaleABI.abi,
            signer
          );
          
          setProvider(provider);
          setSigner(signer);
          setAccount(account);
          setContracts({
            bondToken: bondTokenContract,
            warrantToken: warrantTokenContract,
            tokenSale: tokenSaleContract,
          });
          
          // Setup event listeners
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0]);
            updateBalances(accounts[0], bondTokenContract, warrantTokenContract);
          });
          
          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });
          
          // Load initial data
          updateBalances(account, bondTokenContract, warrantTokenContract);
          fetchCompanyMetrics(tokenSaleContract);
          
          setIsLoading(false);
        } else {
          alert('Please install MetaMask to use this DeFi application');
        }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };
  
  // Update token balances
  const updateBalances = async (account, bondContract, warrantContract) => {
    if (account && bondContract && warrantContract) {
      const bondBalance = await bondContract.balanceOf(account);
      const warrantBalance = await warrantContract.balanceOf(account);
      
      setBondBalance(ethers.utils.formatEther(bondBalance));
      setWarrantBalance(ethers.utils.formatEther(warrantBalance));
    }
  };
  
  // Fetch company financial metrics
  const fetchCompanyMetrics = async (saleContract) => {
    if (saleContract) {
      try {
        const fundsRaised = await saleContract.totalFundsRaised();
        const activeBonds = await saleContract.activeBondCount();
        const bondMaturity = await saleContract.bondMaturityPeriod();
        const bondYield = await saleContract.bondYieldPercentage();
        const warrantsIssued = await saleContract.totalWarrantsIssued();
        const warrantStrike = await saleContract.warrantStrikePrice();
        
        setCompanyMetrics({
          totalFundsRaised: ethers.utils.formatEther(fundsRaised),
          activeBonds: activeBonds.toNumber(),
          bondMaturity: bondMaturity.toNumber(),
          bondYield: bondYield.toNumber() / 100, // Convert basis points to percentage
          warrantsIssued: warrantsIssued.toNumber(),
          warrantStrikePrice: ethers.utils.formatEther(warrantStrike),
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
        
        updateBalances(account, contracts.bondToken, contracts.warrantToken);
        fetchCompanyMetrics(contracts.tokenSale);
        alert(`Successfully purchased ${amount} bond tokens!`);
      } catch (error) {
        console.error('Error purchasing bonds:', error);
        alert('Failed to purchase bond tokens');
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
        
        updateBalances(account, contracts.bondToken, contracts.warrantToken);
        fetchCompanyMetrics(contracts.tokenSale);
        alert(`Successfully purchased ${amount} warrant tokens!`);
      } catch (error) {
        console.error('Error purchasing warrants:', error);
        alert('Failed to purchase warrant tokens');
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
          CONTRACT_ADDRESSES.tokenSale,
          ethers.utils.parseEther(amount.toString())
        );
        await approveTx.wait();
        
        // Then redeem the bonds
        const tx = await contracts.tokenSale.redeemBonds(
          ethers.utils.parseEther(amount.toString())
        );
        await tx.wait();
        
        updateBalances(account, contracts.bondToken, contracts.warrantToken);
        fetchCompanyMetrics(contracts.tokenSale);
        alert(`Successfully redeemed ${amount} bond tokens!`);
      } catch (error) {
        console.error('Error redeeming bonds:', error);
        alert('Failed to redeem bond tokens. Bonds may not have matured yet.');
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
          CONTRACT_ADDRESSES.tokenSale,
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
        
        updateBalances(account, contracts.bondToken, contracts.warrantToken);
        fetchCompanyMetrics(contracts.tokenSale);
        alert(`Successfully exercised ${amount} warrant tokens!`);
      } catch (error) {
        console.error('Error exercising warrants:', error);
        alert('Failed to exercise warrant tokens');
      } finally {
        setIsLoading(false);
      }
    }
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
          <ConnectWallet connectWallet={connectWallet} />
        ) : (
          <>
            <div className="account-info">
              <p>Connected: {account.substring(0, 6)}...{account.substring(38)}</p>
              <p>Bond Balance: {bondBalance}</p>
              <p>Warrant Balance: {warrantBalance}</p>
            </div>
            
            {isLoading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <Dashboard companyMetrics={companyMetrics} />
                )}
                
                {activeTab === 'bonds' && (
                  <BondMarket 
                    purchaseBonds={purchaseBonds} 
                    redeemBonds={redeemBonds}
                    bondBalance={bondBalance}
                    bondYield={companyMetrics.bondYield}
                    bondMaturity={companyMetrics.bondMaturity}
                  />
                )}
                
                {activeTab === 'warrants' && (
                  <WarrantMarket 
                    purchaseWarrants={purchaseWarrants} 
                    exerciseWarrants={exerciseWarrants}
                    warrantBalance={warrantBalance}
                    strikePrice={companyMetrics.warrantStrikePrice}
                  />
                )}
                
                {activeTab === 'portfolio' && (
                  <Portfolio 
                    bondBalance={bondBalance}
                    warrantBalance={warrantBalance}
                    bondYield={companyMetrics.bondYield}
                    strikePrice={companyMetrics.warrantStrikePrice}
                    account={account}
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