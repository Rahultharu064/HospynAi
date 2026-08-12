// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title MedicalDataRegistry
 * @notice Registry for tracking all medical data transactions
 * @dev Provides a unified audit trail for all medical data operations
 * @author VoiceMed Pro
 */
contract MedicalDataRegistry is Ownable, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // ============================================
    // STRUCTS
    // ============================================

    struct DataTransaction {
        bytes32 txId;
        string dataHash;
        string dataType;       // EMR, PRESCRIPTION, LAB_REPORT, CONSENT, etc.
        string operation;      // CREATE, UPDATE, DELETE, VIEW, SHARE
        string patientId;
        address actor;
        address targetProvider;
        uint256 timestamp;
        string metadata;       // Additional JSON metadata
    }

    struct Provider {
        address providerAddress;
        string name;
        string providerType;   // HOSPITAL, CLINIC, PHARMACY, LAB, DOCTOR
        bool isActive;
        uint256 registeredAt;
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    using Counters for Counters.Counter;
    
    Counters.Counter private transactionCounter;
    
    // Mapping from transaction ID to data transaction
    mapping(bytes32 => DataTransaction) private transactions;
    
    // Mapping from data hash to transaction IDs
    mapping(string => bytes32[]) private hashTransactions;
    
    // Mapping from patient ID to their transactions
    mapping(string => bytes32[]) private patientTransactions;
    
    // Registered providers
    mapping(address => Provider) private providers;
    address[] private providerList;
    
    // Statistics
    uint256 public totalAnchoredHashes;
    uint256 public totalConsents;
    uint256 public totalPrescriptions;

    // ============================================
    // EVENTS
    // ============================================

    event TransactionRecorded(
        bytes32 indexed txId,
        string indexed dataType,
        string operation,
        string patientId,
        address indexed actor,
        uint256 timestamp
    );

    event ProviderRegistered(
        address indexed providerAddress,
        string name,
        string providerType
    );

    event ProviderDeactivated(
        address indexed providerAddress,
        string reason
    );

    event ProviderReactivated(address indexed providerAddress);

    event StatsUpdated(
        uint256 totalAnchoredHashes,
        uint256 totalConsents,
        uint256 totalPrescriptions
    );

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor() {
        // Register contract deployer as initial provider
        providers[msg.sender] = Provider({
            providerAddress: msg.sender,
            name: "VoiceMed Pro Admin",
            providerType: "PLATFORM",
            isActive: true,
            registeredAt: block.timestamp
        });
        providerList.push(msg.sender);
    }

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyRegisteredProvider() {
        require(
            providers[msg.sender].isActive || msg.sender == owner(),
            "Not a registered provider"
        );
        _;
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Record a data transaction
     */
    function recordTransaction(
        string memory dataHash,
        string memory dataType,
        string memory operation,
        string memory patientId,
        address targetProvider,
        string memory metadata
    )
        external
        nonReentrant
        whenNotPaused
        onlyRegisteredProvider
        returns (bytes32)
    {
        require(bytes(dataHash).length > 0, "Data hash required");
        require(bytes(dataType).length > 0, "Data type required");
        require(bytes(operation).length > 0, "Operation required");

        bytes32 txId = keccak256(
            abi.encodePacked(
                dataHash, dataType, operation, patientId, 
                msg.sender, block.timestamp, transactionCounter.current()
            )
        );

        transactions[txId] = DataTransaction({
            txId: txId,
            dataHash: dataHash,
            dataType: dataType,
            operation: operation,
            patientId: patientId,
            actor: msg.sender,
            targetProvider: targetProvider,
            timestamp: block.timestamp,
            metadata: metadata
        });

        hashTransactions[dataHash].push(txId);
        
        if (bytes(patientId).length > 0) {
            patientTransactions[patientId].push(txId);
        }

        transactionCounter.increment();

        emit TransactionRecorded(txId, dataType, operation, patientId, msg.sender, block.timestamp);

        return txId;
    }

    /**
     * @notice Register a healthcare provider
     */
    function registerProvider(
        string memory name,
        string memory providerType
    )
        external
        returns (bool)
    {
        require(bytes(name).length > 0, "Name required");

        Provider storage existing = providers[msg.sender];
        require(!existing.isActive, "Already registered");
        require(existing.registeredAt == 0, "Provider was deactivated; ask an admin to reactivate");

        providers[msg.sender] = Provider({
            providerAddress: msg.sender,
            name: name,
            providerType: providerType,
            isActive: true,
            registeredAt: block.timestamp
        });

        providerList.push(msg.sender);

        emit ProviderRegistered(msg.sender, name, providerType);
        return true;
    }

    /**
     * @notice Deactivate a provider
     */
    function deactivateProvider(address providerAddress, string memory reason)
        external
        onlyOwner
    {
        require(providers[providerAddress].isActive, "Provider not active");
        providers[providerAddress].isActive = false;

        emit ProviderDeactivated(providerAddress, reason);
    }

    /**
     * @notice Reactivate a previously deactivated provider
     * @dev Deactivated providers cannot self-reactivate via registerProvider; only an admin can restore them
     */
    function reactivateProvider(address providerAddress) external onlyOwner {
        Provider storage provider = providers[providerAddress];
        require(provider.registeredAt > 0, "Provider not found");
        require(!provider.isActive, "Provider already active");
        provider.isActive = true;

        emit ProviderReactivated(providerAddress);
    }

    // ============================================
    // QUERY FUNCTIONS
    // ============================================

    /**
     * @notice Get transaction by ID
     */
    function getTransaction(bytes32 txId) 
        external 
        view 
        returns (DataTransaction memory) 
    {
        require(transactions[txId].timestamp > 0, "Transaction not found");
        return transactions[txId];
    }

    /**
     * @notice Get transactions by data hash
     */
    function getTransactionsByHash(string memory dataHash) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return hashTransactions[dataHash];
    }

    /**
     * @notice Get transactions by patient
     */
    function getTransactionsByPatient(
        string memory patientId,
        uint256 offset,
        uint256 limit
    ) 
        external 
        view 
        returns (DataTransaction[] memory records, uint256 total) 
    {
        bytes32[] storage ids = patientTransactions[patientId];
        total = ids.length;

        uint256 resultCount = limit;
        if (offset + limit > total) {
            resultCount = total > offset ? total - offset : 0;
        }

        records = new DataTransaction[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            records[i] = transactions[ids[offset + i]];
        }

        return (records, total);
    }

    /**
     * @notice Get total transactions
     */
    function getTotalTransactions() external view returns (uint256) {
        return transactionCounter.current();
    }

    /**
     * @notice Get provider info
     */
    function getProvider(address providerAddress) 
        external 
        view 
        returns (Provider memory) 
    {
        require(providers[providerAddress].registeredAt > 0, "Provider not found");
        return providers[providerAddress];
    }

    /**
     * @notice Get all providers
     */
    function getAllProviders() external view returns (Provider[] memory) {
        Provider[] memory result = new Provider[](providerList.length);
        for (uint256 i = 0; i < providerList.length; i++) {
            result[i] = providers[providerList[i]];
        }
        return result;
    }

    // ============================================
    // STATS FUNCTIONS
    // ============================================

    /**
     * @notice Update global statistics
     */
    function updateStats(
        uint256 _anchoredHashes,
        uint256 _consents,
        uint256 _prescriptions
    ) external onlyOwner {
        totalAnchoredHashes = _anchoredHashes;
        totalConsents = _consents;
        totalPrescriptions = _prescriptions;

        emit StatsUpdated(_anchoredHashes, _consents, _prescriptions);
    }

    /**
     * @notice Get statistics
     */
    function getStats() 
        external 
        view 
        returns (
            uint256 _totalTransactions,
            uint256 _totalProviders,
            uint256 _anchoredHashes,
            uint256 _consents,
            uint256 _prescriptions
        ) 
    {
        return (
            transactionCounter.current(),
            providerList.length,
            totalAnchoredHashes,
            totalConsents,
            totalPrescriptions
        );
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}