// components/Admin.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Admin = ({ 
  contracts, 
  account, 
  companyMetrics,
  fetchCompanyMetrics
}) => {
  const [isOwner, setIsOwner] = useState(false);
  const [bondSaleActive, setBondSaleActive] = useState(true);
  const [warrantSaleActive, setWarrantSaleActive] = useState(true);
  const [minBondPurchase, setMinBondPurchase] = useState('0.01');
  const [maxBondPurchase, setMaxBondPurchase] = useState('100');
  const [minWarrantPurchase, setMinWarrantPurchase] = useState('0.01');
  const [maxWarrantPurchase, setMaxWarrantPurchase] = useState('50');
  const [fundAmount, setFundAmount] = useState('0.1');
  const [warrantPrice, setWarrantPrice] = useState('0.1');
  const [warrantStrikePrice, setWarrantStrikePrice] = useState('0.8');
  const [treasuryAddress, setTreasuryAddress] = useState('');
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [investors, setInvestors] = useState([]);
  const [bondHolders, setBondHolders] = useState([]);
  const [warrantHolders, setWarrantHolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const checkOwner = async () => {
      if (contracts.tokenSale && account) {
        try {
          const owner = await contracts.tokenSale.owner();
          setIsOwner(owner.toLowerCase() === account.toLowerCase());
          
          // Load current settings
          const saleContract = contracts.tokenSale;
          
          // Get bond sale status
          const bondSaleStatus = await saleContract.bondSaleActive();
          setBondSaleActive(bondSaleStatus);
          
          // Get warrant sale status
          const warrantSaleStatus = await saleContract.warrantSaleActive();
          setWarrantSaleActive(warrantSaleStatus);
          
          // Get purchase limits
          const minBond = await saleContract.minBondPurchase();
          setMinBondPurchase(ethers.utils.formatEther(minBond));
          
          const maxBond = await saleContract.maxBondPurchase();
          setMaxBondPurchase(ethers.utils.formatEther(maxBond));
          
          const minWarrant = await saleContract.minWarrantPurchase();
          setMinWarrantPurchase(ethers.utils.formatEther(minWarrant));
          
          const maxWarrant = await saleContract.maxWarrantPurchase();
          setMaxWarrantPurchase(ethers.utils.formatEther(maxWarrant));
          
          // Get treasury address
          const treasury = await saleContract.treasury();
          setTreasuryAddress(treasury);
          
          // Get warrant price
          const wPrice = await contracts.warrantToken.warrantPrice();
          setWarrantPrice(ethers.utils.formatEther(wPrice));
          
          // Get warrant strike price
          const sPrice = await contracts.warrantToken.strikePrice();
          setWarrantStrikePrice(ethers.utils.formatEther(sPrice));
          
          // Fetch investors
          await loadInvestors();
          
          // Fetch token holders
          await loadTokenHolders();
        } catch (error) {
          console.error('Error checking owner:', error);
        }
      }
    };
    
    checkOwner();
  }, [contracts, account]);
  
  const loadInvestors = async () => {
    if (contracts.tokenSale) {
      try {
        const investorCount = await contracts.tokenSale.getInvestorCount();
        
        if (investorCount.toNumber() > 0) {
          const allInvestors = await contracts.tokenSale.getAllInvestors();
          
          // Get details for each investor
          const investorsWithDetails = await Promise.all(
            allInvestors.map(async (address) => {
              const details = await contracts.tokenSale.getInvestorDetails(address);
              return {
                address,
                totalBondInvestment: ethers.utils.formatEther(details.totalBondInvestment),
                totalWarrantInvestment: ethers.utils.formatEther(details.totalWarrantInvestment),
                bondRedemptions: details.bondRedemptions.toString(),
                warrantsExercised: details.warrantsExercised.toString(),
                hasBonds: details.hasBonds,
                hasWarrants: details.hasWarrants,
                lastActivity: new Date(details.lastActivityTimestamp.toNumber() * 1000).toLocaleString()
              };
            })
          );
          
          setInvestors(investorsWithDetails);
        }
      } catch (error) {
        console.error('Error loading investors:', error);
      }
    }
  };
  
  const loadTokenHolders = async () => {
    if (contracts.bondToken && contracts.warrantToken) {
      try {
        // Get bond holders
        const bondHolderAddresses = await contracts.bondToken.getAllBondHolders();
        
        if (bondHolderAddresses.length > 0) {
          const bondHoldersWithBalances = await Promise.all(
            bondHolderAddresses.map(async (address) => {
              const balance = await contracts.bondToken.balanceOf(address);
              const matured = await contracts.bondToken.hasBondMatured(address);
              const timeToMaturity = await contracts.bondToken.timeToMaturity(address);
              
              return {
                address,
                balance: ethers.utils.formatEther(balance),
                matured,
                timeToMaturity: timeToMaturity.toNumber(),
                maturityDate: new Date(Date.now() + (timeToMaturity.toNumber() * 1000)).toLocaleDateString()
              };
            })
          );
          
          setBondHolders(bondHoldersWithBalances);
        }
        
        // Get warrant holders
        const warrantHolderAddresses = await contracts.warrantToken.getAllWarrantHolders();
        
        if (warrantHolderAddresses.length > 0) {
          const warrantHoldersWithBalances = await Promise.all(
            warrantHolderAddresses.map(async (address) => {
              const balance = await contracts.warrantToken.balanceOf(address);
              
              return {
                address,
                balance: ethers.utils.formatEther(balance)
              };
            })
          );
          
          setWarrantHolders(warrantHoldersWithBalances);
        }
      } catch (error) {
        console.error('Error loading token holders:', error);
      }
    }
  };
  
  const handleToggleBondSale = async () => {
    if (contracts.tokenSale) {
      try {
        setIsLoading(true);
        const tx = await contracts.tokenSale.toggleBondSale(!bondSaleActive);
        setStatusMessage('Transaction submitted. Waiting for confirmation...');
        
        await tx.wait();
        setBondSaleActive(!bondSaleActive);
        setStatusMessage(`Bond sales ${!bondSaleActive ? 'activated' : 'paused'} successfully!`);
      } catch (error) {
        console.error('Error toggling bond sale:', error);
        setStatusMessage('Error toggling bond sale status');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleToggleWarrantSale = async () => {
    if (contracts.tokenSale) {
      try {
        setIsLoading(true);
        const tx = await contracts.tokenSale.toggleWarrantSale(!warrantSaleActive);
        setStatusMessage('Transaction submitted. Waiting for confirmation...');
        
        await tx.wait();
        setWarrantSaleActive(!warrantSaleActive);
        setStatusMessage(`Warrant sales ${!warrantSaleActive ? 'activated' : 'paused'} successfully!`);
      } catch (error) {
        console.error('Error toggling warrant sale:', error);
        setStatusMessage('Error toggling warrant sale status');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleUpdateBondPurchaseLimits = async () => {
    if (contracts.tokenSale) {
      try {
        setIsLoading(true);
        const min = ethers.utils.parseEther(minBondPurchase);
        const max = ethers.utils.parseEther(maxBondPurchase);
        
        const tx = await contracts.tokenSale.updateBondPurchaseLimits(min, max);
        setStatusMessage('Transaction submitted. Waiting for confirmation...');
        
        await tx.wait();
        setStatusMessage('Bond purchase limits updated successfully!');
      } catch (error) {
        console.error('Error updating bond purchase limits:', error);
        setStatusMessage('Error updating bond purchase limits');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleUpdateWarrantPurchaseLimits = async () => {
    if (contracts.tokenSale) {
      try {
        setIsLoading(true);
        const min = ethers.utils.parseEther(minWarrantPurchase);
        const max = ethers.utils.parseEther(maxWarrantPurchase);
        
        const tx = await contracts.tokenSale.updateWarrantPurchaseLimits(min, max);
        setStatusMessage('Transaction submitted. Waiting for confirmation...');
        
        await tx.wait();
        setStatusMessage('Warrant purchase limits updated successfully!');
      } catch (error) {
        console.error('Error updating warrant purchase limits:', error);
        setStatusMessage('Error updating warrant purchase limits');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleFundContract = async () => {
    if (contracts.tokenSale) {
      try {
        setIsLoading(true);
        const tx = await contracts.tokenSale.fundBondRedemption({
          value: ethers.utils.parseEther(fundAmount)
        });
        setStatusMessage('Transaction submitted. Waiting for confirmation...');
        
        await tx.wait();
        setStatusMessage(`Contract funded with ${fundAmount} ETH successfully!`);
        fetchCompanyMetrics(contracts.tokenSale);
      } catch (error) {
        console.error('Error funding contract:', error);
        setStatusMessage('Error funding contract');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleUpdateWarrantPrice = async () => {
    if (contracts.warrantToken) {
      try {
        setIsLoading(true);
        const price = ethers.utils.parseEther(warrantPrice);
        
        const tx = await contracts.warrantToken.setWarrantPrice(price);
        setStatusMessage('Transaction submitted. Waiting for confirmation...');
        
        await tx.wait();
        setStatusMessage('Warrant price updated successfully!');
        fetchCompanyMetrics(contracts.tokenSale);
      } catch (error) {
        console.error('Error updating warrant price:', error);
        setStatusMessage('Error updating warrant price');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleUpdateStrikePrice = async () => {
    if (contracts.warrantToken) {
      try {
        setIsLoading(true);
        const price = ethers.utils.parseEther(warrantStrikePrice);
        
        const tx = await contracts.warrantToken.updateStrikePrice(price);
        setStatusMessage('Transaction submitted. Waiting for confirmation...');
        
        await tx.wait();
        setStatusMessage('Warrant strike price updated successfully!');
        fetchCompanyMetrics(contracts.tokenSale);
      } catch (error) {
        console.error('Error updating strike price:', error);
        setStatusMessage('Error updating strike price');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleUpdateTreasury = async () => {
    if (contracts.tokenSale && ethers.utils.isAddress(treasuryAddress)) {
      try {
        setIsLoading(true);
        const tx = await contracts.tokenSale.updateTreasury(treasuryAddress);
        setStatusMessage('Transaction submitted. Waiting for confirmation...');
        
        await tx.wait();
        setStatusMessage('Treasury address updated successfully!');
      } catch (error) {
        console.error('Error updating treasury address:', error);
        setStatusMessage('Error updating treasury address');
      } finally {
        setIsLoading(false);
      }
    } else {
      setStatusMessage('Invalid treasury address');
    }
  };
  
  const handleTransferOwnership = async () => {
    if (contracts.tokenSale && ethers.utils.isAddress(newOwnerAddress)) {
      try {
        setIsLoading(true);
        const tx = await contracts.tokenSale.transferFullOwnership(newOwnerAddress);
        setStatusMessage('Transaction submitted. Waiting for confirmation...');
        
        await tx.wait();
        setStatusMessage('Ownership transferred successfully!');
        setIsOwner(false); // No longer the owner after transfer
      } catch (error) {
        console.error('Error transferring ownership:', error);
        setStatusMessage('Error transferring ownership');
      } finally {
        setIsLoading(false);
      }
    } else {
      setStatusMessage('Invalid owner address');
    }
  };

  if (!isOwner) {
    return (
      <div className="admin-unauthorized">
        <h2>Admin Panel</h2>
        <p>You do not have administrative privileges for this DeFi system. Only the contract owner can access this panel.</p>
      </div>
    );
  }
  
  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      
      {statusMessage && (
        <div className={`status-message ${statusMessage.includes('Error') ? 'error' : 'success'}`}>
          {statusMessage}
        </div>
      )}
      
      <div className="admin-overview">
        <h3>System Overview</h3>
        <div className="overview-stats">
          <div className="stat-card">
            <h4>Total Funds Raised</h4>
            <p>{companyMetrics.totalFundsRaised} ETH</p>
          </div>
          <div className="stat-card">
            <h4>Active Bonds</h4>
            <p>{companyMetrics.activeBonds}</p>
          </div>
          <div className="stat-card">
            <h4>Total Warrants Issued</h4>
            <p>{companyMetrics.warrantsIssued}</p>
          </div>
          <div className="stat-card">
            <h4>Bond Yield</h4>
            <p>{companyMetrics.bondYield}%</p>
          </div>
        </div>
      </div>
      
      <div className="admin-sections">
        <div className="admin-section">
          <h3>Sale Controls</h3>
          
          <div className="control-group">
            <h4>Bond Sale</h4>
            <div className="status-indicator">
              Status: <span className={bondSaleActive ? 'active' : 'inactive'}>
                {bondSaleActive ? 'Active' : 'Paused'}
              </span>
            </div>
            <button 
              className={`toggle-button ${bondSaleActive ? 'pause' : 'activate'}`}
              onClick={handleToggleBondSale}
              disabled={isLoading}
            >
              {bondSaleActive ? 'Pause Bond Sale' : 'Activate Bond Sale'}
            </button>
          </div>
          
          <div className="control-group">
            <h4>Warrant Sale</h4>
            <div className="status-indicator">
              Status: <span className={warrantSaleActive ? 'active' : 'inactive'}>
                {warrantSaleActive ? 'Active' : 'Paused'}
              </span>
            </div>
            <button 
              className={`toggle-button ${warrantSaleActive ? 'pause' : 'activate'}`}
              onClick={handleToggleWarrantSale}
              disabled={isLoading}
            >
              {warrantSaleActive ? 'Pause Warrant Sale' : 'Activate Warrant Sale'}
            </button>
          </div>
        </div>
        
        <div className="admin-section">
          <h3>Purchase Limits</h3>
          
          <div className="control-group">
            <h4>Bond Purchase Limits</h4>
            <div className="input-row">
              <div className="input-group">
                <label>Minimum (ETH):</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={minBondPurchase}
                  onChange={(e) => setMinBondPurchase(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="input-group">
                <label>Maximum (ETH):</label>
                <input 
                  type="number" 
                  step="1"
                  value={maxBondPurchase}
                  onChange={(e) => setMaxBondPurchase(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <button 
              className="update-button"
              onClick={handleUpdateBondPurchaseLimits}
              disabled={isLoading}
            >
              Update Bond Limits
            </button>
          </div>
          
          <div className="control-group">
            <h4>Warrant Purchase Limits</h4>
            <div className="input-row">
              <div className="input-group">
                <label>Minimum (ETH):</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={minWarrantPurchase}
                  onChange={(e) => setMinWarrantPurchase(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="input-group">
                <label>Maximum (ETH):</label>
                <input 
                  type="number" 
                  step="1"
                  value={maxWarrantPurchase}
                  onChange={(e) => setMaxWarrantPurchase(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <button 
              className="update-button"
              onClick={handleUpdateWarrantPurchaseLimits}
              disabled={isLoading}
            >
              Update Warrant Limits
            </button>
          </div>
        </div>
        
        <div className="admin-section">
          <h3>Token Pricing</h3>
          
          <div className="control-group">
            <h4>Warrant Price</h4>
            <div className="input-group">
              <label>Price per Warrant (ETH):</label>
              <input 
                type="number" 
                step="0.01"
                value={warrantPrice}
                onChange={(e) => setWarrantPrice(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button 
              className="update-button"
              onClick={handleUpdateWarrantPrice}
              disabled={isLoading}
            >
              Update Warrant Price
            </button>
          </div>
          
          <div className="control-group">
            <h4>Warrant Strike Price</h4>
            <div className="input-group">
              <label>Strike Price (ETH):</label>
              <input 
                type="number" 
                step="0.1"
                value={warrantStrikePrice}
                onChange={(e) => setWarrantStrikePrice(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button 
              className="update-button"
              onClick={handleUpdateStrikePrice}
              disabled={isLoading}
            >
              Update Strike Price
            </button>
          </div>
        </div>
        
        <div className="admin-section">
          <h3>System Funding</h3>
          
          <div className="control-group">
            <h4>Fund Contract for Bond Redemptions</h4>
            <div className="input-group">
              <label>Amount (ETH):</label>
              <input 
                type="number" 
                step="0.01"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button 
              className="fund-button"
              onClick={handleFundContract}
              disabled={isLoading}
            >
              Fund Contract
            </button>
          </div>
          
          <div className="control-group">
            <h4>Treasury Address</h4>
            <div className="input-group">
              <label>Address:</label>
              <input 
                type="text"
                value={treasuryAddress}
                onChange={(e) => setTreasuryAddress(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button 
              className="update-button"
              onClick={handleUpdateTreasury}
              disabled={isLoading}
            >
              Update Treasury
            </button>
          </div>
        </div>
        
        <div className="admin-section">
          <h3>Ownership</h3>
          
          <div className="control-group">
            <h4>Transfer Ownership</h4>
            <div className="input-group">
              <label>New Owner Address:</label>
              <input 
                type="text"
                value={newOwnerAddress}
                onChange={(e) => setNewOwnerAddress(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button 
              className="danger-button"
              onClick={handleTransferOwnership}
              disabled={isLoading}
            >
              Transfer All Ownership
            </button>
            <p className="warning-text">
              Warning: This will transfer ownership of all contracts to the new address.
              You will no longer have admin access after this action.
            </p>
          </div>
        </div>
      </div>
      
      <div className="admin-data-sections">
        <div className="data-section">
          <h3>Investors ({investors.length})</h3>
          {investors.length > 0 ? (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Bond Investment</th>
                    <th>Warrant Investment</th>
                    <th>Bonds Redeemed</th>
                    <th>Warrants Exercised</th>
                    <th>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map((investor, index) => (
                    <tr key={index}>
                      <td>{investor.address.substring(0, 6)}...{investor.address.substring(38)}</td>
                      <td>{investor.totalBondInvestment} ETH</td>
                      <td>{investor.totalWarrantInvestment} ETH</td>
                      <td>{investor.bondRedemptions}</td>
                      <td>{investor.warrantsExercised}</td>
                      <td>{investor.lastActivity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No investors yet.</p>
          )}
        </div>
        
        <div className="data-section">
          <h3>Bond Holders ({bondHolders.length})</h3>
          {bondHolders.length > 0 ? (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Balance</th>
                    <th>Matured</th>
                    <th>Maturity Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bondHolders.map((holder, index) => (
                    <tr key={index}>
                      <td>{holder.address.substring(0, 6)}...{holder.address.substring(38)}</td>
                      <td>{holder.balance} BOND</td>
                      <td>{holder.matured ? 'Yes' : 'No'}</td>
                      <td>{holder.maturityDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No bond holders yet.</p>
          )}
        </div>
        
        <div className="data-section">
          <h3>Warrant Holders ({warrantHolders.length})</h3>
          {warrantHolders.length > 0 ? (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {warrantHolders.map((holder, index) => (
                    <tr key={index}>
                      <td>{holder.address.substring(0, 6)}...{holder.address.substring(38)}</td>
                      <td>{holder.balance} WARR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No warrant holders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;