// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title StealthAddressRegistry
 * @dev Registry contract for managing stealth address meta addresses and payment announcements on QIE network
 */
contract StealthAddressRegistry {
    struct MetaAddress {
        bytes33 spendPubKey;
        bytes33 viewingPubKey;
        uint256 createdAt;
    }
    
    // Mapping from user address to their meta addresses
    mapping(address => MetaAddress[]) public metaAddresses;
    
    // Events
    event MetaAddressRegistered(
        address indexed user,
        uint256 indexed index,
        bytes33 spendPubKey,
        bytes33 viewingPubKey,
        uint256 timestamp
    );
    
    event PaymentAnnouncement(
        address indexed recipient,
        uint256 indexed metaAddressIndex,
        bytes33 ephemeralPubKey,
        address stealthAddress,
        uint32 viewHint,
        uint32 k,
        uint256 amount,
        uint256 timestamp
    );
    
    /**
     * @dev Register a new meta address for the caller
     * @param spendPub The spend public key (33 bytes compressed secp256k1)
     * @param viewingPub The viewing public key (33 bytes compressed secp256k1)
     */
    function registerMetaAddress(bytes33 calldata spendPub, bytes33 calldata viewingPub) external {
        require(spendPub != bytes33(0), "Invalid spend public key");
        require(viewingPub != bytes33(0), "Invalid viewing public key");
        
        uint256 index = metaAddresses[msg.sender].length;
        
        metaAddresses[msg.sender].push(MetaAddress({
            spendPubKey: spendPub,
            viewingPubKey: viewingPub,
            createdAt: block.timestamp
        }));
        
        emit MetaAddressRegistered(
            msg.sender,
            index,
            spendPub,
            viewingPub,
            block.timestamp
        );
    }
    
    /**
     * @dev Announce a payment to a stealth address
     * @param recipient The recipient's address who owns the meta address
     * @param metaAddressIndex The index of the recipient's meta address
     * @param ephemeralPubKey The ephemeral public key used for this payment
     * @param stealthAddress The computed stealth address
     * @param viewHint The view hint for efficient scanning
     * @param k The derivation parameter
     * @param amount The amount being sent
     */
    function announcePayment(
        address recipient,
        uint256 metaAddressIndex,
        bytes33 calldata ephemeralPubKey,
        address stealthAddress,
        uint32 viewHint,
        uint32 k,
        uint256 amount
    ) external {
        require(recipient != address(0), "Invalid recipient address");
        require(metaAddressIndex < metaAddresses[recipient].length, "Invalid meta address index");
        require(ephemeralPubKey != bytes33(0), "Invalid ephemeral public key");
        require(stealthAddress != address(0), "Invalid stealth address");
        require(amount > 0, "Amount must be greater than 0");
        
        emit PaymentAnnouncement(
            recipient,
            metaAddressIndex,
            ephemeralPubKey,
            stealthAddress,
            viewHint,
            k,
            amount,
            block.timestamp
        );
    }
    
    /**
     * @dev Get a specific meta address for a user
     * @param user The user's address
     * @param index The index of the meta address
     * @return The meta address struct
     */
    function getMetaAddress(address user, uint256 index) 
        external view returns (MetaAddress memory) {
        require(index < metaAddresses[user].length, "Invalid index");
        return metaAddresses[user][index];
    }
    
    /**
     * @dev Get the number of meta addresses for a user
     * @param user The user's address
     * @return The count of meta addresses
     */
    function getMetaAddressCount(address user) external view returns (uint256) {
        return metaAddresses[user].length;
    }
    
    /**
     * @dev Get all meta addresses for a user
     * @param user The user's address
     * @return Array of meta addresses
     */
    function getAllMetaAddresses(address user) external view returns (MetaAddress[] memory) {
        return metaAddresses[user];
    }
}