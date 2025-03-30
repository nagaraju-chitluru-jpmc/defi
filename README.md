# DeFi Bond & Warrant System

A blockchain-based decentralized finance (DeFi) system for companies to raise funds through bond tokens and warrant tokens. This  project demonstrates how traditional financial instruments can be implemented on the blockchain using smart contracts and a React.js frontend.

## Overview

This DeFi system allows companies to:

1. Issue bond tokens to raise debt capital with a fixed yield and maturity date
2. Issue warrant tokens that give investors the right to purchase equity at a predetermined strike price
3. Track and manage investments through a user-friendly React.js interface

Investors can:

1. Purchase bond tokens to earn fixed yield returns
2. Purchase warrant tokens for potential equity upside
3. Redeem matured bonds to collect principal plus interest
4. Exercise warrants to acquire equity tokens at the strike price
5. View their portfolio and track investment performance

## Technical Architecture

The project consists of two main components:

### 1. Smart Contracts (Solidity)

- **BondToken.sol**: ERC20 token representing corporate bonds with fixed yield
- **WarrantToken.sol**: ERC20 token representing warrants that can be exchanged for equity
- **EquityToken.sol**: ERC20 token representing company equity (shares)
- **TokenSale.sol**: Contract for selling and managing bond and warrant tokens

### 2. Frontend (React.js)

- Modern React.js application with function components and hooks
- Integration with Web3.js/Ethers.js for blockchain interaction
- User-friendly interface for purchasing, redeeming