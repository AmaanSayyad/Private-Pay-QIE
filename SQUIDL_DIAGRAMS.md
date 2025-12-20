# Architecture Diagrams

## 1. High-Level System Architecture

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
        Aptos[Aptos Blockchain]
        Move[Move Contracts]
        Events[Event System]
    end
    
    subgraph "Privacy Infrastructure"
        Stealth[Stealth Address Generator]
        ECDH[ECDH Engine]
        Crypto[Cryptographic Primitives]
    end
    
    UI --> API
    Wallet --> Aptos
    Dashboard --> API
    API --> DB
    API --> Stealth
    Workers --> Aptos
    Workers --> Events
    Stealth --> ECDH
    ECDH --> Crypto
    Move --> Aptos
    Events --> Workers
```

## 2. Stealth Address Generation Flow

```mermaid
sequenceDiagram
    participant Payer
    participant Frontend
    participant Backend
    participant Crypto as Cryptographic Engine
    participant Aptos as Aptos Blockchain
    
    Payer->>Frontend: Access Payment Link
    Frontend->>Backend: Request Meta Address
    Backend->>Aptos: Fetch Meta Address
    Aptos-->>Backend: Return Meta Address
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
    
    Frontend->>Crypto: Derive Aptos Address
    Note over Crypto: address = SHA3_256(stealthPub)[0:16]
    Crypto-->>Frontend: stealthAddress
    
    Frontend-->>Payer: Display Stealth Address
    Payer->>Aptos: Send Payment to stealthAddress
```

## 3. Payment Flow - Complete Process

```mermaid
sequenceDiagram
    participant Recipient
    participant Payer
    participant Frontend
    participant Backend
    participant Workers as Monitoring Workers
    participant Aptos as Aptos Blockchain
    participant Move as Move Contracts
    
    Note over Recipient: Setup Phase
    Recipient->>Frontend: Create Payment Link
    Frontend->>Backend: Register Meta Address
    Backend->>Move: register(spendPub, viewingPub)
    Move->>Aptos: Store Meta Address
    Aptos-->>Move: Confirmed
    Move-->>Backend: Meta Address ID
    Backend-->>Frontend: Payment Link Created
    
    Note over Payer: Payment Phase
    Payer->>Frontend: Access Payment Link
    Frontend->>Backend: Get Meta Address
    Backend-->>Frontend: Meta Address
    Frontend->>Frontend: Generate Stealth Address
    Frontend-->>Payer: Display Stealth Address
    Payer->>Aptos: Send APT to stealthAddress
    
    Note over Workers: Monitoring Phase
    Workers->>Aptos: Scan for Transactions
    Aptos-->>Workers: Transaction Detected
    Workers->>Move: emit Announcement Event
    Note over Move: Store: ephemeralPub + viewHint
    Move->>Aptos: Event Emitted
    
    Note over Recipient: Withdrawal Phase
    Recipient->>Frontend: Check for Payments
    Frontend->>Backend: Fetch Announcements
    Backend->>Aptos: Query Events
    Aptos-->>Backend: Announcement Events
    Backend->>Backend: Compute Stealth Addresses
    Backend->>Backend: Match with Transactions
    Backend-->>Frontend: Payment Detected
    Recipient->>Frontend: Withdraw Funds
    Frontend->>Move: createTransaction(ephemeralPub)
    Move->>Move: Compute stealthPrivateKey
    Move->>Aptos: Sign & Execute Transfer
    Aptos-->>Recipient: Funds Received
```

## 4. Privacy Infrastructure Stack

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

## 7. Monitoring & Recovery System

```mermaid
sequenceDiagram
    participant Workers as Monitoring Workers
    participant Backend as Backend API
    participant Aptos as Aptos Blockchain
    participant Events as Event System
    participant DB as Database
    
    loop Every Block
        Workers->>Backend: GET /stealth-address/recent
        Backend->>DB: Query Recent Stealth Addresses
        DB-->>Backend: List with isTransacted flags
        Backend-->>Workers: Return List
        
        loop For Each Stealth Address
            alt isTransacted == true
                Workers->>Aptos: Check Transaction Status
                Aptos-->>Workers: Transaction Confirmed
                Workers->>Events: emit Announcement Event
                Note over Events: Store: ephemeralPub + viewHint<br/>NO stealthAddress<br/>NO metaAddress
                Events->>Aptos: Event Logged
            else isTransacted == false
                Workers->>Aptos: Continue Monitoring
            end
        end
    end
    
    Note over Backend,DB: Recovery Scenario
    Backend->>Aptos: Fetch All Announcement Events
    Aptos-->>Backend: All Events
    Backend->>Backend: Rebuild Database from Events
    Backend->>DB: Restore Stealth Address Data
```

## 8. User Registration & Meta Address Setup

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Crypto as Crypto Engine
    participant Move as Move Contract
    participant Aptos as Aptos Blockchain
    
    User->>Frontend: Sign In with Wallet
    Frontend->>Crypto: Generate Key Pairs
    Crypto->>Crypto: Generate spendPriv/spendPub
    Crypto->>Crypto: Generate viewingPriv/viewingPub
    Crypto-->>Frontend: Key Pairs
    
    Frontend->>Backend: Register Meta Address
    Backend->>Move: register(spendPub, viewingPub)
    Move->>Aptos: Store Meta Address
    Aptos-->>Move: Transaction Confirmed
    Move-->>Backend: Meta Address ID
    
    Backend->>Backend: Create Payment Link
    Backend->>Backend: Store in Database
    Backend-->>Frontend: Payment Link Created
    Frontend-->>User: Display Payment Link
```

## 9. Payment Link to Transaction Flow

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



## 11. Security & Privacy Layers

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