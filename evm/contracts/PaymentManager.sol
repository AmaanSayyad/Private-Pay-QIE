// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./StealthAddressRegistry.sol";

/**
 * @title PaymentManager
 * @dev Manages private payments using stealth addresses on QIE network
 */
contract PaymentManager {
    StealthAddressRegistry public immutable registry;
    
    // Events
    event PrivatePaymentSent(
        address indexed sender,
        address indexed recipient,
        uint256 indexed metaAddressIndex,
        address stealthAddress,
        uint256 amount,
        uint256 timestamp
    );
    
    event StealthWithdrawal(
        address indexed stealthAddress,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    // Errors
    error InvalidAmount();
    error TransferFailed();
    error InsufficientBalance();
    error InvalidStealthAddress();
    error InvalidRecipient();
    
    constructor(address _registry) {
        require(_registry != address(0), "Invalid registry address");
        registry = StealthAddressRegistry(_registry);
    }
    
    /**
     * @dev Send a private payment to a stealth address
     * @param recipient The recipient's address who owns the meta address
     * @param metaIndex The index of the recipient's meta address
     * @param k The derivation parameter used for stealth address generation
     * @param ephemeralPubKey The ephemeral public key used for this payment
     * @param stealthAddress The computed stealth address to receive the payment
     * @param viewHint The view hint for efficient scanning
     */
    function sendPrivatePayment(
        address recipient,
        uint256 metaIndex,
        uint32 k,
        bytes33 calldata ephemeralPubKey,
        address stealthAddress,
        uint32 viewHint
    ) external payable {
        if (msg.value == 0) revert InvalidAmount();
        if (recipient == address(0)) revert InvalidRecipient();
        if (stealthAddress == address(0)) revert InvalidStealthAddress();
        
        // Verify the meta address exists
        require(metaIndex < registry.getMetaAddressCount(recipient), "Invalid meta address index");
        
        // Transfer QIE to stealth address
        (bool success, ) = stealthAddress.call{value: msg.value}("");
        if (!success) revert TransferFailed();
        
        // Announce payment through registry
        registry.announcePayment(
            recipient,
            metaIndex,
            ephemeralPubKey,
            stealthAddress,
            viewHint,
            k,
            msg.value
        );
        
        emit PrivatePaymentSent(
            msg.sender,
            recipient,
            metaIndex,
            stealthAddress,
            msg.value,
            block.timestamp
        );
    }
    
    /**
     * @dev Withdraw funds from a stealth address (simplified version)
     * @param to The address to send the withdrawn funds to
     * @dev In production, this would verify the caller owns the stealth address
     * @dev through cryptographic proof or signature verification
     */
    function withdrawFromStealth(address payable to) external {
        if (to == address(0)) revert InvalidRecipient();
        
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientBalance();
        
        (bool success, ) = to.call{value: balance}("");
        if (!success) revert TransferFailed();
        
        emit StealthWithdrawal(
            address(this),
            to,
            balance,
            block.timestamp
        );
    }
    
    /**
     * @dev Get the QIE balance of a stealth address
     * @param stealthAddress The stealth address to check
     * @return The balance in wei
     */
    function getStealthBalance(address stealthAddress) external view returns (uint256) {
        return stealthAddress.balance;
    }
    
    /**
     * @dev Emergency function to recover stuck funds (only for testing)
     * @dev In production, this should be removed or have proper access controls
     */
    function emergencyWithdraw() external {
        require(msg.sender == address(this), "Unauthorized");
        
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = msg.sender.call{value: balance}("");
            require(success, "Emergency withdrawal failed");
        }
    }
    
    /**
     * @dev Receive function to accept QIE transfers
     */
    receive() external payable {
        // Allow contract to receive QIE
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        // Allow contract to receive QIE
    }
}