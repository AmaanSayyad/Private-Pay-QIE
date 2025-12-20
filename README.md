# PrivatePay 🐙

> **The first on-chain untraceable, unidentifiable private payments on QIE**

[![QIE](https://img.shields.io/badge/QIE-Blockchain-blue)](https://qie.digital/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-Smart%20Contracts-red)](https://soliditylang.org/)

**Simply means:** Stealth Crypto Payments using multilayer forks

Powered by ECDH + secp256k1 + BIP 0352/EIP 5564 + ROFL DarkPool Mixer

---

## 🚨 The Problem: Financial Privacy is Broken

### Real-Life Story

**Alice**, a legendary dev, won the Move AI Hack and received $13,000 prize money.

**Bob**, another participant who won another prize in the same hackathon, discovered his co-founder wasn't trustworthy about receiving prize money. Bob texted all 12 winners asking for the organizer's wallet address. Within minutes, using blockchain explorers and intelligence tools, he identified:
- Which wallet belonged to whom
- Exactly how much each person received
- Their entire transaction history

**This is a serious concern.** Nobody wants their wallet exposed — it makes them vulnerable to targeted attacks, extortion, and financial loss.

### The Core Issues

❌ **Payments on public blockchains are NOT private**
- Traceable through tools like Arkham Intelligence
- Trackable via Dune Analytics and explorers
- Identifiable by anyone with basic skills

❌ **Results:**
- Fear of transacting
- Inconvenience for legitimate users
- Financial loss from targeted attacks
- Privacy violations for everyone

---

## ✅ The Solution: PrivatePay

**Where every transaction is fully private, anonymous, unidentifiable, and untrackable.**

### Core Benefits

✨ **Sender privacy**: Your wallet is never linked to the transaction
✨ **Receiver privacy**: Recipients' identities remain hidden
✨ **Observer blindness**: Third parties see nothing linkable
✨ **Simple UX**: Like Stripe links, but every transaction is a new, invisible wallet

### Key Features

🔒 **Infinite Untraceable Stealth Accounts**
- Each payment generates a fresh stealth sub-account
- Unlimited transactions, unlimited mixers
- One single DarkPool

💼 **Static Payment Links**
- Share a single payment link (e.g., `amaan.privatepay.me`)
- Each access generates a unique stealth address
- No complex setup required

🔐 **Complete Unlinkability**
- Sender cannot identify receiver
- Receiver cannot identify sender
- Observers see nothing linkable

---

## 🚀 How It Works

### Three-Step Process

#### 1. Create Payment Link 🔗
- User creates static payment link (e.g., `amaan.privatepay.me`)
- System generates meta address (static identifier)
- Link can be shared publicly without privacy risk

#### 2. Receive Payment 💸
- Payer accesses link → generates unique stealth address
- Payment sent to stealth address on QIE
- Transaction is unlinkable to recipient's identity

#### 3. Manage Funds 💰
- Recipient monitors stealth addresses automatically
- Funds can be withdrawn to main wallet
- Full transaction history in private dashboard

---

## 🔧 Technology Stack

### Privacy Infrastructure

```
🔐 Cryptographic Primitives
├─ Secp256k1 elliptic curve cryptography
├─ SHA3-256 hashing for address derivation
└─ Secure random number generation

🤝 ECDH (Elliptic Curve Diffie-Hellman)
├─ Shared secret computation
├─ Key exchange protocol
└─ Perfect forward secrecy

🎭 Stealth Address Protocol (SSAP)
├─ Adapted from BIP 0352 / EIP 5564
├─ Unique address per transaction
└─ Complete unlinkability

🌊 DarkPool Mixer (In Progress)
├─ Runtime Offchain Logic (ROFL) integration
├─ Homomorphic encryption
└─ Monero-style Ring Signatures & RingCT

🔍 Automated Monitoring
├─ Backend workers for transaction detection
├─ Event-based backup system
└─ Resilient recovery mechanism
```

### Built With

- **Blockchain**: QIE (Solidity smart contracts)
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Cryptography**: @noble/secp256k1, @noble/hashes
- **Wallet**: MetaMask (QIE wallet)
- **Rewards**: Photon SDK integration

---

## 📊 Market Opportunity

### Total Addressable Market (TAM)

| Market | Size | Growth |
|--------|------|--------|
| 💰 Global payment processing | $160B annually | - |
| 🪙 Crypto payment market | $624M | 16.6% CAGR |
| 🔒 Privacy-focused solutions | $1.2B | Growing |
| 👥 Crypto users worldwide | 590M+ | Expanding |

### Target Users

- **Individuals**: Privacy-conscious crypto users
- **Freelancers**: Receive payments without exposing income
- **Businesses**: Accept payments without revealing revenue
- **DAOs**: Anonymous treasury management
- **Hedge Funds**: Private money movements
- **High Net Worth**: Protection from targeted attacks

---

## 🎯 Competitive Landscape

### Why PrivatePay Wins
<img width="820" height="221" alt="Screenshot 2025-11-30 at 5 43 32 AM" src="https://github.com/user-attachments/assets/84f95d8e-b13a-47a1-ab44-3d4f4448c705" />


## ⚡ Future Roadmap

### Phase 1: Core Platform ✅
- ✅ Stealth address generation
- ✅ Payment link system
- ✅ Dashboard and monitoring
- ✅ QIE wallet integration

### Phase 2: Enhanced Privacy 🚧
- 🚧 Zero-knowledge proofs (Plonky2)
- 🚧 Bulletproofs for amount hiding
- 🚧 Advanced DarkPool integration
- 🚧 ROFL-style monitoring

### Phase 3: Payment Expansion 🔮
- 🔮 Private credit and debit card payments
- 🔮 Private cross-chain bridges
- 🔮 Disposable wallets

### Phase 4: Enterprise Features 🔮
- 🔮 Hedge fund money moves
- 🔮 API marketplace
- 🔮 White-label solutions
- 🔮 Compliance tools

### Endless Possibilities
- No more "James Waynn Exposer" incidents
- End to HyperLiquid wallet reveals
- Protection for high-value transactions
- Privacy for everyone, everywhere

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐
│   User Wallet   │
│ (MetaMask/QIE)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│    Frontend     │◄────►│   Backend API    │
│  (React + TS)   │      │  (Node.js)       │
└────────┬────────┘      └────────┬─────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│ Stealth Address │      │   Supabase DB    │
│    Generator    │      │  (PostgreSQL)    │
└────────┬────────┘      └──────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│      QIE Blockchain             │
│  ┌──────────────────────────┐   │
│  │  Solidity Smart Contracts│   │
│  │  - StealthAddressRegistry│   │
│  │  - Payment Manager       │   │
│  │  - Event System          │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

### Cryptographic Flow

```
1. Meta Address Generation
   ├─ Generate spend key pair (spendPriv, spendPub)
   ├─ Generate viewing key pair (viewingPriv, viewingPub)
   └─ metaAddress = (spendPub, viewingPub)

2. Stealth Address Generation
   ├─ Generate ephemeral key pair (ephemeralPriv, ephemeralPub)
   ├─ Compute shared secret: ECDH(ephemeralPriv, viewingPub)
   ├─ Compute tweak: SHA256(sharedSecret || k)
   ├─ Derive stealth public key: stealthPub = spendPub + (tweak * G)
   └─ Derive QIE address: keccak256(stealthPub)[12:32]

3. Payment Detection
   ├─ Recipient computes: ECDH(viewingPriv, ephemeralPub)
   ├─ Checks view hint matches
   ├─ Derives stealth address
   └─ Checks blockchain for funds

4. Fund Withdrawal
   ├─ Compute stealth private key: stealthPriv = spendPriv + tweak
   ├─ Sign transaction with stealthPriv
   └─ Transfer funds to main wallet
```

---

## 📐 Detailed Architecture Diagrams

### 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[User Interface]
        Wallet[Wallet Integration]
        Dashboard[Dashboard]
    end
    
    subgraph "Backend Layer"
        API[Backend API]
        Workers[Monitoring Workers]
        DB[(Database)]
    end
    
    subgraph "Blockchain Layer"
        QIE[QIE Blockchain]
        Solidity[Solidity Contracts]
        Events[Event System]
    end
    
    subgraph "Privacy Infrastructure"
        Stealth[Stealth Address Generator]
        ECDH[ECDH Engine]
        Crypto[Cryptographic Primitives]
    end
    
    UI --> API
    Wallet --> QIE
    Dashboard --> API
    API --> DB
    API --> Stealth
    Workers --> QIE
    Workers --> Events
    Stealth --> ECDH
    ECDH --> Crypto
    Solidity --> QIE
    Events --> Workers
```

### 2. Stealth Address Generation Flow

```mermaid
sequenceDiagram
    participant Payer
    participant Frontend
    participant Backend
    participant Crypto as Cryptographic Engine
    participant QIE as QIE Blockchain
    
    Payer->>Frontend: Access Payment Link
    Frontend->>Backend: Request Meta Address
    Backend->>QIE: Fetch Meta Address
    QIE-->>Backend: Return Meta Address
    Backend-->>Frontend: Meta Address (spendPub + viewingPub)
    
    Frontend->>Crypto: Generate Ephemeral Key Pair
    Crypto-->>Frontend: ephemeralPriv, ephemeralPub
    
    Frontend->>Crypto: Compute ECDH Shared Secret
    Note over Crypto: sharedSecret = ECDH(ephemeralPriv, viewingPub)
    Crypto-->>Frontend: sharedSecret
    
    Frontend->>Crypto: Compute Tweak
    Note over Crypto: tweak = SHA256(sharedSecret || k)
    Crypto-->>Frontend: tweak
    
    Frontend->>Crypto: Derive Stealth Public Key
    Note over Crypto: stealthPub = spendPub + (tweak * G)
    Crypto-->>Frontend: stealthPub
    
    Frontend->>Crypto: Derive QIE Address
    Note over Crypto: address = keccak256(stealthPub)[12:32]
    Crypto-->>Frontend: stealthAddress
    
    Frontend-->>Payer: Display Stealth Address
    Payer->>QIE: Send Payment to stealthAddress
```

### 3. Payment Flow - Complete Process

```mermaid
sequenceDiagram
    participant Recipient
    participant Payer
    participant Frontend
    participant Backend
    participant Workers as Monitoring Workers
    participant QIE as QIE Blockchain
    participant Solidity as Solidity Contracts
    
    Note over Recipient: Setup Phase
    Recipient->>Frontend: Create Payment Link
    Frontend->>Backend: Register Meta Address
    Backend->>Solidity: register(spendPub, viewingPub)
    Solidity->>QIE: Store Meta Address
    QIE-->>Solidity: Confirmed
    Solidity-->>Backend: Meta Address ID
    Backend-->>Frontend: Payment Link Created
    
    Note over Payer: Payment Phase
    Payer->>Frontend: Access Payment Link
    Frontend->>Backend: Get Meta Address
    Backend-->>Frontend: Meta Address
    Frontend->>Frontend: Generate Stealth Address
    Frontend-->>Payer: Display Stealth Address
    Payer->>QIE: Send QIE to stealthAddress
    
    Note over Workers: Monitoring Phase
    Workers->>QIE: Scan for Transactions
    QIE-->>Workers: Transaction Detected
    Workers->>Solidity: emit Announcement Event
    Note over Solidity: Store: ephemeralPub + viewHint
    Solidity->>QIE: Event Emitted
    
    Note over Recipient: Withdrawal Phase
    Recipient->>Frontend: Check for Payments
    Frontend->>Backend: Fetch Announcements
    Backend->>QIE: Query Events
    QIE-->>Backend: Announcement Events
    Backend->>Backend: Compute Stealth Addresses
    Backend->>Backend: Match with Transactions
    Backend-->>Frontend: Payment Detected
    Recipient->>Frontend: Withdraw Funds
    Frontend->>Solidity: createTransaction(ephemeralPub)
    Solidity->>Solidity: Compute stealthPrivateKey
    Solidity->>QIE: Sign & Execute Transfer
    QIE-->>Recipient: Funds Received
```

### 4. Privacy Infrastructure Stack

```mermaid
graph TD
    subgraph "Cryptographic Layer"
        Secp256k1[Secp256k1 Elliptic Curve]
        SHA3[SHA3-256 Hashing]
        ECDH[ECDH Shared Secret]
    end
    
    subgraph "Stealth Address System"
        Meta[Meta Address<br/>spendPub + viewingPub]
        Ephemeral[Ephemeral Key Pair]
        Stealth[Stealth Address<br/>Derivation]
    end
    
    subgraph "Privacy Features"
        Receiver[Receiver Privacy<br/>Unlinkable Addresses]
        Sender[Sender Privacy<br/>ZK Proofs - Future]
        Amount[Amount Privacy<br/>Bulletproofs - Future]
    end
    
    subgraph "Monitoring & Backup"
        Workers[Backend Workers]
        Events[Event System]
        Recovery[Recovery Mechanism]
    end
    
    Secp256k1 --> Meta
    Secp256k1 --> Ephemeral
    SHA3 --> Stealth
    ECDH --> Stealth
    Meta --> Stealth
    Ephemeral --> Stealth
    Stealth --> Receiver
    Workers --> Events
    Events --> Recovery
```

### 5. Monitoring & Recovery System

```mermaid
sequenceDiagram
    participant Workers as Monitoring Workers
    participant Backend as Backend API
    participant QIE as QIE Blockchain
    participant Events as Event System
    participant DB as Database
    
    loop Every Block
        Workers->>Backend: GET /stealth-address/recent
        Backend->>DB: Query Recent Stealth Addresses
        DB-->>Backend: List with isTransacted flags
        Backend-->>Workers: Return List
        
        loop For Each Stealth Address
            alt isTransacted == true
                Workers->>QIE: Check Transaction Status
                QIE-->>Workers: Transaction Confirmed
                Workers->>Events: emit Announcement Event
                Note over Events: Store: ephemeralPub + viewHint<br/>NO stealthAddress<br/>NO metaAddress
                Events->>QIE: Event Logged
            else isTransacted == false
                Workers->>QIE: Continue Monitoring
            end
        end
    end
    
    Note over Backend,DB: Recovery Scenario
    Backend->>QIE: Fetch All Announcement Events
    QIE-->>Backend: All Events
    Backend->>Backend: Rebuild Database from Events
    Backend->>DB: Restore Stealth Address Data
```

### 6. User Registration & Meta Address Setup

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Crypto as Crypto Engine
    participant Solidity as Solidity Contract
    participant QIE as QIE Blockchain
    
    User->>Frontend: Sign In with Wallet
    Frontend->>Crypto: Generate Key Pairs
    Crypto->>Crypto: Generate spendPriv/spendPub
    Crypto->>Crypto: Generate viewingPriv/viewingPub
    Crypto-->>Frontend: Key Pairs
    
    Frontend->>Backend: Register Meta Address
    Backend->>Solidity: register(spendPub, viewingPub)
    Solidity->>QIE: Store Meta Address
    QIE-->>Solidity: Transaction Confirmed
    Solidity-->>Backend: Meta Address ID
    
    Backend->>Backend: Create Payment Link
    Backend->>Backend: Store in Database
    Backend-->>Frontend: Payment Link Created
    Frontend-->>User: Display Payment Link
```

### 7. Payment Link to Transaction Flow

```mermaid
stateDiagram-v2
    [*] --> PaymentLinkCreated: User Creates Link
    PaymentLinkCreated --> LinkShared: Share Link
    LinkShared --> PayerAccesses: Payer Clicks Link
    PayerAccesses --> MetaAddressFetched: Fetch Meta Address
    MetaAddressFetched --> StealthAddressGenerated: Generate Stealth Address
    StealthAddressGenerated --> PaymentInitiated: Payer Initiates Payment
    PaymentInitiated --> TransactionPending: Transaction Submitted
    TransactionPending --> TransactionConfirmed: Transaction Confirmed
    TransactionConfirmed --> MonitoringDetected: Workers Detect Transaction
    MonitoringDetected --> AnnouncementEmitted: Event Emitted
    AnnouncementEmitted --> RecipientNotified: Recipient Notified
    RecipientNotified --> FundsWithdrawn: Recipient Withdraws
    FundsWithdrawn --> [*]
    
    TransactionPending --> TransactionFailed: Transaction Fails
    TransactionFailed --> PaymentInitiated: Retry Payment
```

### 8. Security & Privacy Layers

```mermaid
graph TB
    subgraph "Layer 1: Cryptographic Security"
        L1_Secp256k1[Secp256k1 Keys]
        L1_ECDH[ECDH Encryption]
        L1_Hash[SHA3-256 Hashing]
    end
    
    subgraph "Layer 2: Address Privacy"
        L2_Stealth[Stealth Addresses]
        L2_Unlinkable[Unlinkable Transactions]
        L2_Meta[Meta Address Protection]
    end
    
    subgraph "Layer 3: Transaction Privacy"
        L3_Receiver[Receiver Privacy]
        L3_Sender[Sender Privacy - Future]
        L3_Amount[Amount Privacy - Future]
    end
    
    subgraph "Layer 4: System Security"
        L4_Backup[Event-Based Backup]
        L4_Monitoring[Automated Monitoring]
        L4_Recovery[Recovery Mechanism]
    end
    
    L1_Secp256k1 --> L2_Stealth
    L1_ECDH --> L2_Stealth
    L1_Hash --> L2_Stealth
    L2_Stealth --> L3_Receiver
    L2_Unlinkable --> L3_Receiver
    L3_Receiver --> L4_Backup
    L4_Monitoring --> L4_Recovery
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- QIE CLI (if available)
- MetaMask Wallet
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/AmaanSayyad/PrivatePay.git
cd PrivatePay
```

2. **Install dependencies**
```bash
# Frontend
cd squidl-frontend
npm install

# Backend
cd ../squidl-backend
npm install
```

3. **Configure environment variables**

Frontend (`.env`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_TREASURY_WALLET_ADDRESS=your_treasury_wallet
VITE_WEBSITE_HOST=privatepay.me
VITE_PHOTON_API_KEY=your_photon_api_key
VITE_PHOTON_CAMPAIGN_ID=your_campaign_id
```

Backend (`.env`):
```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=3000
```

4. **Run the application**
```bash
# Frontend (port 5173)
cd squidl-frontend
npm run dev

# Backend (port 3000)
cd squidl-backend
npm run dev
```

5. **Access the app**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

---

## 📚 Documentation

- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) - Common issues and solutions
- [QIE Rate Limit Fix](./QIE_RATE_LIMIT_FIX.md) - Auto-retry for API rate limits
- [Withdraw Fix Details](./WITHDRAW_JSON_ERROR_FIX.md) - Supabase error handling
- [Project Status](./PROJECT_RUNNING_STATUS.md) - Current running status
- [Environment Variables](./ENV_CHECK_REPORT.md) - Configuration guide

---
## 🙏 Acknowledgments

### Technology

- **QIE Foundation** - For the amazing blockchain platform
- **Oasis Protocol** - Inspiration from ROFL and Sapphire
- **BIP 0352 / EIP 5564** - Stealth address standards
- **@noble** libraries - Cryptographic primitives
---

<p align="center">
  <strong>Built with 🐙 by developers who believe privacy is a fundamental right</strong>
</p>

<p align="center">
  No more wallet exposure. No more targeted attacks. No more financial surveillance.
</p>

<p align="center">
  <strong>PrivatePay: Where every transaction is invisible.</strong>
</p>
