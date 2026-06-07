// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PrescriptionVerifier
 * @notice Smart contract for verifying and tracking prescriptions on blockchain
 * @dev Provides tamper-proof prescription verification for pharmacies
 * @author VoiceMed Pro
 */
contract PrescriptionVerifier is Ownable, Pausable, ReentrancyGuard {

    // ============================================
    // STRUCTS
    // ============================================

    struct PrescriptionRecord {
        bytes32 prescriptionId;
        string dataHash;
        string patientId;
        address doctor;
        address pharmacy;
        string drugName;
        string status;  // ACTIVE, DISPENSED, CANCELLED, EXPIRED
        uint256 issuedAt;
        uint256 expiresAt;
        uint256 dispensedAt;
        uint256 refillsAllowed;
        uint256 refillsUsed;
        bool exists;
    }

    struct DispenseRecord {
        bytes32 dispenseId;
        bytes32 prescriptionId;
        address pharmacy;
        address pharmacist;
        uint256 quantity;
        uint256 dispensedAt;
        string notes;
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    // Mapping from prescription ID to record
    mapping(bytes32 => PrescriptionRecord) private prescriptions;
    
    // Mapping from data hash to prescription ID
    mapping(string => bytes32) private hashToPrescription;
    
    // Mapping from patient to their prescriptions
    mapping(string => bytes32[]) private patientPrescriptions;
    
    // Mapping from doctor to their prescriptions
    mapping(address => bytes32[]) private doctorPrescriptions;
    
    // Dispense records
    mapping(bytes32 => DispenseRecord[]) private dispenseHistory;
    
    // Authorized pharmacies
    mapping(address => bool) private authorizedPharmacies;
    
    // Authorized doctors
    mapping(address => bool) private authorizedDoctors;

    // ============================================
    // EVENTS
    // ============================================

    event PrescriptionCreated(
        bytes32 indexed prescriptionId,
        string patientId,
        address indexed doctor,
        string drugName,
        uint256 expiresAt
    );

    event PrescriptionDispensed(
        bytes32 indexed dispenseId,
        bytes32 indexed prescriptionId,
        address indexed pharmacy,
        uint256 quantity,
        uint256 remainingRefills
    );

    event PrescriptionCancelled(
        bytes32 indexed prescriptionId,
        address indexed cancelledBy,
        string reason
    );

    event PrescriptionVerified(
        bytes32 indexed prescriptionId,
        bool isValid,
        address verifiedBy
    );

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor() {
        authorizedDoctors[msg.sender] = true;
        authorizedPharmacies[msg.sender] = true;
    }

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyDoctor() {
        require(authorizedDoctors[msg.sender] || msg.sender == owner(), "Not authorized doctor");
        _;
    }

    modifier onlyPharmacy() {
        require(authorizedPharmacies[msg.sender] || msg.sender == owner(), "Not authorized pharmacy");
        _;
    }

    modifier prescriptionExists(bytes32 prescriptionId) {
        require(prescriptions[prescriptionId].exists, "Prescription not found");
        _;
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Create a new prescription record
     */
    function createPrescription(
        string memory dataHash,
        string memory patientId,
        string memory drugName,
        uint256 expiresAt,
        uint256 refillsAllowed
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyDoctor 
        returns (bytes32) 
    {
        require(bytes(dataHash).length == 64, "Invalid hash");
        require(expiresAt > block.timestamp, "Expiry must be in future");
        require(refillsAllowed <= 12, "Too many refills");

        bytes32 prescriptionId = keccak256(
            abi.encodePacked(dataHash, patientId, msg.sender, block.timestamp)
        );

        require(!prescriptions[prescriptionId].exists, "Prescription already exists");

        prescriptions[prescriptionId] = PrescriptionRecord({
            prescriptionId: prescriptionId,
            dataHash: dataHash,
            patientId: patientId,
            doctor: msg.sender,
            pharmacy: address(0),
            drugName: drugName,
            status: "ACTIVE",
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            dispensedAt: 0,
            refillsAllowed: refillsAllowed,
            refillsUsed: 0,
            exists: true
        });

        hashToPrescription[dataHash] = prescriptionId;
        patientPrescriptions[patientId].push(prescriptionId);
        doctorPrescriptions[msg.sender].push(prescriptionId);

        emit PrescriptionCreated(prescriptionId, patientId, msg.sender, drugName, expiresAt);

        return prescriptionId;
    }

    /**
     * @notice Dispense a prescription
     */
    function dispensePrescription(
        bytes32 prescriptionId,
        uint256 quantity,
        string memory notes
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyPharmacy 
        prescriptionExists(prescriptionId) 
        returns (bytes32) 
    {
        PrescriptionRecord storage record = prescriptions[prescriptionId];

        require(
            keccak256(bytes(record.status)) == keccak256(bytes("ACTIVE")),
            "Prescription not active"
        );
        require(block.timestamp <= record.expiresAt, "Prescription expired");
        require(record.refillsUsed < record.refillsAllowed + 1, "No refills remaining");
        require(quantity > 0, "Quantity must be positive");

        bytes32 dispenseId = keccak256(
            abi.encodePacked(prescriptionId, msg.sender, block.timestamp, quantity)
        );

        // Update refills
        if (record.refillsUsed == 0 && record.pharmacy == address(0)) {
            record.pharmacy = msg.sender;
        }
        record.refillsUsed++;
        record.dispensedAt = block.timestamp;

        if (record.refillsUsed >= record.refillsAllowed + 1) {
            record.status = "DISPENSED";
        }

        // Record dispense history
        dispenseHistory[prescriptionId].push(DispenseRecord({
            dispenseId: dispenseId,
            prescriptionId: prescriptionId,
            pharmacy: msg.sender,
            pharmacist: msg.sender,
            quantity: quantity,
            dispensedAt: block.timestamp,
            notes: notes
        }));

        emit PrescriptionDispensed(
            dispenseId,
            prescriptionId,
            msg.sender,
            quantity,
            record.refillsAllowed + 1 - record.refillsUsed
        );

        return dispenseId;
    }

    /**
     * @notice Cancel a prescription
     */
    function cancelPrescription(
        bytes32 prescriptionId,
        string memory reason
    ) 
        external 
        nonReentrant 
        prescriptionExists(prescriptionId) 
    {
        PrescriptionRecord storage record = prescriptions[prescriptionId];
        
        require(
            msg.sender == record.doctor || msg.sender == owner(),
            "Only prescribing doctor or owner can cancel"
        );
        require(
            keccak256(bytes(record.status)) == keccak256(bytes("ACTIVE")),
            "Can only cancel active prescriptions"
        );

        record.status = "CANCELLED";

        emit PrescriptionCancelled(prescriptionId, msg.sender, reason);
    }

    /**
     * @notice Verify a prescription
     */
    function verifyPrescription(
        bytes32 prescriptionId
    ) 
        external 
        view 
        prescriptionExists(prescriptionId) 
        returns (
            bool isValid,
            string memory status,
            string memory drugName,
            uint256 issuedAt,
            uint256 expiresAt,
            uint256 refillsRemaining,
            address doctor
        ) 
    {
        PrescriptionRecord storage record = prescriptions[prescriptionId];
        
        bool active = keccak256(bytes(record.status)) == keccak256(bytes("ACTIVE"));
        bool notExpired = block.timestamp <= record.expiresAt;
        bool hasRefills = record.refillsUsed < record.refillsAllowed + 1;
        
        isValid = active && notExpired && hasRefills;
        
        return (
            isValid,
            record.status,
            record.drugName,
            record.issuedAt,
            record.expiresAt,
            record.refillsAllowed + 1 - record.refillsUsed,
            record.doctor
        );
    }

    /**
     * @notice Verify prescription by hash
     */
    function verifyByHash(string memory dataHash) 
        external 
        view 
        returns (bool isValid, bytes32 prescriptionId) 
    {
        prescriptionId = hashToPrescription[dataHash];
        if (prescriptionId == bytes32(0)) {
            return (false, bytes32(0));
        }

        (isValid, , , , , , ) = this.verifyPrescription(prescriptionId);
        return (isValid, prescriptionId);
    }

    // ============================================
    // QUERY FUNCTIONS
    // ============================================

    /**
     * @notice Get prescription record
     */
    function getPrescription(bytes32 prescriptionId) 
        external 
        view 
        prescriptionExists(prescriptionId) 
        returns (PrescriptionRecord memory) 
    {
        return prescriptions[prescriptionId];
    }

    /**
     * @notice Get patient prescriptions
     */
    function getPatientPrescriptions(
        string memory patientId,
        uint256 offset,
        uint256 limit
    ) 
        external 
        view 
        returns (PrescriptionRecord[] memory records, uint256 total) 
    {
        bytes32[] storage ids = patientPrescriptions[patientId];
        total = ids.length;

        uint256 resultCount = limit;
        if (offset + limit > total) {
            resultCount = total > offset ? total - offset : 0;
        }

        records = new PrescriptionRecord[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            records[i] = prescriptions[ids[offset + i]];
        }

        return (records, total);
    }

    /**
     * @notice Get dispense history for a prescription
     */
    function getDispenseHistory(bytes32 prescriptionId) 
        external 
        view 
        prescriptionExists(prescriptionId) 
        returns (DispenseRecord[] memory) 
    {
        return dispenseHistory[prescriptionId];
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    function addAuthorizedDoctor(address doctor) external onlyOwner {
        require(doctor != address(0), "Invalid address");
        authorizedDoctors[doctor] = true;
    }

    function removeAuthorizedDoctor(address doctor) external onlyOwner {
        authorizedDoctors[doctor] = false;
    }

    function addAuthorizedPharmacy(address pharmacy) external onlyOwner {
        require(pharmacy != address(0), "Invalid address");
        authorizedPharmacies[pharmacy] = true;
    }

    function removeAuthorizedPharmacy(address pharmacy) external onlyOwner {
        authorizedPharmacies[pharmacy] = false;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function isAuthorizedDoctor(address doctor) external view returns (bool) {
        return authorizedDoctors[doctor];
    }

    function isAuthorizedPharmacy(address pharmacy) external view returns (bool) {
        return authorizedPharmacies[pharmacy];
    }
}