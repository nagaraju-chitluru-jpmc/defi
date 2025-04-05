# Step-by-Step Setup Guide for Bond & Warrant DeFi System

This guide provides detailed instructions to set up and run the Bond & Warrant DeFi System project.

## 1. Project Setup

### Create Project Directory

```bash
mkdir defi-bond-warrant-system
cd defi-bond-warrant-system
```

### Initialize the Project

```bash
npm init -y
```

### Install React and Required Dependencies

```bash
npm install react react-dom react-scripts ethers@5.7.2 @openzeppelin/contracts
npm install --save-dev @nomicfoundation/hardhat-toolbox hardhat dotenv
```

## 2. Create Project Structure

Create the basic project structure:

```bash
mkdir -p contracts scripts src/components src/contracts public
```

## 3. Configure Project

### Create React App Configuration

Create a `jsconfig.json` file in the root directory:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

### Initialize Hardhat

```bash
npx hardhat init
```

Select "Create an empty hardhat.config.js" when prompted.

### Setup Environment Variables

Create a `.env` file in the root directory:

```
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_api_key_here
```

## 4. Add Smart Contracts

Create the following files in the `contracts` directory:

1. `BondToken.sol`
2. `WarrantToken.sol`
3. `EquityToken.sol`
4. `TokenSale.sol`

Copy the smart contract code provided earlier into these files.

## 5. Setup Deployment Script

Create the `deploy.js` file in the `scripts` directory and add the deployment script code.

## 6. Create React Components

Create the following files in the `src/components` directory:

1. `Navbar.js`
2. `ConnectWallet.js`
3. `Dashboard.js`
4. `BondMarket.js`
5. `WarrantMarket.js`
6. `Portfolio.js`

Copy the React component code provided earlier into these files.

## 7. Setup Main App Component

Create `App.js` and `App.css` in the `src` directory and add the provided code.

## 8. Create Index Entry Point

Create `index.js` in the `src` directory:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## 9. Create HTML Template

Create `index.html` in the `public` directory:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Bond & Warrant DeFi System"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>Bond & Warrant DeFi System</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

## 10. Deploy Smart Contracts

### Compile Contracts

```bash
npx hardhat compile
```

### Start Local Blockchain Node

```bash
npx hardhat node
```

This will start a local blockchain node at http://127.0.0.1:8545 and display several test accounts with private keys.

### Deploy to Local Node

Open a new terminal window and run:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

This will deploy the contracts to your local blockchain and output the contract addresses.

### Update Contract Addresses

Update the `CONTRACT_ADDRESSES` object in `src/App.js` with the addresses obtained from the deployment.

## 11. Generate Contract ABIs

After deployment, the contract ABIs will be generated in the `artifacts/contracts` directory. Copy the required ABIs to the `src/contracts` directory:

```bash
mkdir -p src/contracts
cp artifacts/contracts/BondToken.sol/BondToken.json src/contracts/
cp artifacts/contracts/WarrantToken.sol/WarrantToken.json src/contracts/
cp artifacts/contracts/TokenSale.sol/TokenSale.json src/contracts/
```

## 12. Run the React App

```bash
npm start
```

This will start the React development server at http://localhost:3000.

## 13. Connect with MetaMask

1. Install the MetaMask browser extension if you haven't already.
2. Set up MetaMask to connect to your local network:
   - Network Name: Localhost 8545
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH
3. Import a test account using one of the private keys provided by Hardhat.

## 14. Use the Application

1. Open http://localhost:3000 in your browser.
2. Connect your MetaMask wallet using the "Connect Wallet" button.
3. Explore the various features of the application:
   - View the dashboard
   - Purchase bond tokens
   - Purchase warrant tokens
   - Redeem mature bonds
   - Exercise warrants
   - View your portfolio

## Troubleshooting

### MetaMask Connection Issues

If you have trouble connecting MetaMask to your local Hardhat node:
- Make sure the Hardhat node is running
- Ensure you're using the correct RPC URL and Chain ID
- Reset your MetaMask account (Settings > Advanced > Reset Account)

### Contract Deployment Errors

If contract deployment fails:
- Check your Hardhat configuration
- Ensure your contracts compile successfully
- Make sure you have enough test ETH in your account

### React App Errors

If the React app doesn't start or has errors:
- Check the console for error messages
- Verify that all dependencies are installed
- Make sure the contract ABIs are in the correct location

### Transaction Errors

If transactions fail:
- Check that you're connected to the correct network
- Ensure you have enough ETH for gas fees
- Verify that the contract addresses in the app are correct