"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tesseractClient = exports.TesseractClient = void 0;
const tesseract_js_1 = require("tesseract.js");
const logger_1 = __importDefault(require("../../utils/logger"));
class TesseractClient {
    constructor() {
        this.worker = null;
    }
    /**
     * Initialize Tesseract worker
     */
    async initialize(language = 'eng') {
        try {
            this.worker = await (0, tesseract_js_1.createWorker)(language);
            await this.worker.setParameters({
                tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,;:!?-()[]{}@#$%^&*+=/\\<>"\' ',
                preserve_interword_spaces: '1',
            });
            logger_1.default.info(`Tesseract worker initialized with language: ${language}`);
        }
        catch (error) {
            logger_1.default.error('Failed to initialize Tesseract worker:', error);
            throw error;
        }
    }
    /**
     * Extract text from image
     */
    async extractText(imagePath) {
        if (!this.worker) {
            await this.initialize();
        }
        try {
            const result = await this.worker.recognize(imagePath);
            const words = (result.data.blocks || []).flatMap((block) => block.paragraphs.flatMap((paragraph) => paragraph.lines.flatMap((line) => line.words)));
            return {
                text: result.data.text,
                confidence: result.data.confidence,
                words,
            };
        }
        catch (error) {
            logger_1.default.error('Tesseract text extraction failed:', error);
            throw error;
        }
    }
    /**
     * Extract structured data from OCR text based on document type
     */
    extractStructuredData(text, documentType, confidence) {
        const extractedData = {
            rawFields: { rawText: text, confidence },
        };
        switch (documentType) {
            case 'PRESCRIPTION':
                extractedData.prescriptionData = this.extractPrescriptionData(text, confidence);
                extractedData.patientInfo = this.extractPatientInfo(text, confidence);
                extractedData.doctorInfo = this.extractDoctorInfo(text, confidence);
                break;
            case 'LAB_REPORT':
                extractedData.labResults = this.extractLabResults(text, confidence);
                extractedData.patientInfo = this.extractPatientInfo(text, confidence);
                break;
            case 'INSURANCE_CARD':
                extractedData.insuranceInfo = this.extractInsuranceInfo(text, confidence);
                extractedData.patientInfo = this.extractPatientInfo(text, confidence);
                break;
            default:
                extractedData.patientInfo = this.extractPatientInfo(text, confidence);
        }
        return extractedData;
    }
    /**
     * Extract patient information from text
     */
    extractPatientInfo(text, baseConfidence) {
        const patterns = {
            firstName: /(?:Patient|Name|First\s*Name)[:\s]+([A-Z][a-z]+)/i,
            lastName: /(?:Last\s*Name|Surname)[:\s]+([A-Z][a-z]+)/i,
            dateOfBirth: /(?:DOB|Date\s*of\s*Birth|Birth)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
            gender: /(?:Gender|Sex)[:\s]+([MF](?:emale|ale)?)/i,
            phone: /(?:Phone|Tel|Mobile|Contact)[:\s]+(\+?[\d\s\-\(\)]{7,15})/i,
            email: /(?:Email|E-mail)[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
            patientId: /(?:Patient\s*ID|MRN|Medical\s*Record)[:\s]+([A-Z0-9\-]+)/i,
        };
        return {
            firstName: this.extractPattern(text, patterns.firstName) || this.guessName(text, 'first'),
            lastName: this.extractPattern(text, patterns.lastName) || this.guessName(text, 'last'),
            dateOfBirth: this.extractPattern(text, patterns.dateOfBirth),
            gender: this.normalizeGender(this.extractPattern(text, patterns.gender)),
            phone: this.extractPattern(text, patterns.phone),
            email: this.extractPattern(text, patterns.email),
            address: null,
            patientId: this.extractPattern(text, patterns.patientId),
            confidence: baseConfidence * 0.85,
        };
    }
    /**
     * Extract prescription data
     */
    extractPrescriptionData(text, confidence) {
        const medicationPattern = /(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|IU)?)\s*(?:(\d+x?\s*(?:daily|BID|TID|QID|PRN|q\d+h|q\d+)))?/gi;
        const medications = [];
        let match;
        while ((match = medicationPattern.exec(text)) !== null) {
            medications.push({
                name: match[1],
                dosage: match[2] || null,
                frequency: match[3] || null,
                duration: null,
                quantity: null,
                route: null,
                confidence: confidence * 0.8,
            });
        }
        return {
            doctorName: this.extractPattern(text, /(?:Dr\.?\s*|Doctor[:\s]+)([A-Z][a-z]+\s+[A-Z][a-z]+)/i),
            doctorLicense: this.extractPattern(text, /(?:License|Registration|Reg\.?)[:\s]+([A-Z0-9\-]+)/i),
            patientName: this.extractPattern(text, /(?:Patient|Name)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i),
            date: this.extractPattern(text, /(?:Date|Prescribed)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i),
            medications,
            diagnosis: this.extractPattern(text, /(?:Diagnosis|Dx|Impression)[:\s]+([A-Za-z\s,]+)/i),
            instructions: this.extractPattern(text, /(?:Instructions|Directions|Sig)[:\s]+(.+)/i),
            confidence,
        };
    }
    /**
     * Extract lab results
     */
    extractLabResults(text, confidence) {
        const resultPattern = /(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d+)?)\s*(\w+\/?\w*)?\s+(\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?)?/g;
        const results = [];
        let match;
        while ((match = resultPattern.exec(text)) !== null) {
            const referenceRange = match[4] || null;
            const value = parseFloat(match[2]);
            let isAbnormal = false;
            if (referenceRange) {
                const [low, high] = referenceRange.split(/[-–]/).map(Number);
                isAbnormal = value < low || value > high;
            }
            results.push({
                parameter: match[1],
                value: match[2],
                unit: match[3] || null,
                referenceRange,
                isAbnormal,
                confidence: confidence * 0.85,
            });
        }
        return {
            testName: this.extractPattern(text, /(?:Test|Panel|Assay)[:\s]+([A-Za-z\s]+)/i),
            testDate: this.extractPattern(text, /(?:Date|Collected|Sample)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i),
            patientName: this.extractPattern(text, /(?:Patient|Name)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i),
            results,
            referenceRanges: null,
            interpretation: this.extractPattern(text, /(?:Interpretation|Comment|Note)[:\s]+(.+)/i),
            confidence,
        };
    }
    /**
     * Extract insurance information
     */
    extractInsuranceInfo(text, confidence) {
        return {
            providerName: this.extractPattern(text, /(?:Insurance|Provider|Company|Carrier)[:\s]+([A-Za-z\s]+)/i),
            policyNumber: this.extractPattern(text, /(?:Policy\s*(?:#|Number|ID|No\.?))[:\s]+([A-Z0-9\-]+)/i),
            groupNumber: this.extractPattern(text, /(?:Group\s*(?:#|Number|ID|No\.?))[:\s]+([A-Z0-9\-]+)/i),
            memberName: this.extractPattern(text, /(?:Member|Subscriber|Insured)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i),
            memberDob: this.extractPattern(text, /(?:Member\s*DOB|Subscriber\s*DOB)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i),
            effectiveDate: this.extractPattern(text, /(?:Effective|Start\s*Date)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i),
            expiryDate: this.extractPattern(text, /(?:Expir(?:y|ation)|End\s*Date)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i),
            coverageType: this.extractPattern(text, /(?:Coverage|Plan\s*Type)[:\s]+([A-Za-z\s]+)/i),
            confidence,
        };
    }
    /**
     * Extract doctor information
     */
    extractDoctorInfo(text, confidence) {
        return {
            name: this.extractPattern(text, /(?:Dr\.?\s*|Doctor|Physician)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i),
            licenseNumber: this.extractPattern(text, /(?:License|Registration|Reg\.?)[#:\s]+([A-Z0-9\-]+)/i),
            specialization: this.extractPattern(text, /(?:Special(?:ty|ization)|Department)[:\s]+([A-Za-z\s]+)/i),
            hospital: this.extractPattern(text, /(?:Hospital|Clinic|Facility)[:\s]+([A-Za-z\s]+)/i),
            phone: this.extractPattern(text, /(?:Phone|Tel|Contact)[:\s]+(\+?[\d\s\-\(\)]{7,15})/i),
            confidence,
        };
    }
    /**
     * Extract value using regex pattern
     */
    extractPattern(text, pattern) {
        const match = text.match(pattern);
        return match ? match[1].trim() : null;
    }
    /**
     * Guess name from text
     */
    guessName(text, position) {
        const namePattern = /([A-Z][a-z]+)\s+([A-Z][a-z]+)/;
        const match = text.match(namePattern);
        if (match) {
            return position === 'first' ? match[1] : match[2];
        }
        return '';
    }
    /**
     * Normalize gender value
     */
    normalizeGender(gender) {
        if (!gender)
            return null;
        const g = gender.toLowerCase().trim();
        if (g.startsWith('m'))
            return 'MALE';
        if (g.startsWith('f'))
            return 'FEMALE';
        return 'OTHER';
    }
    /**
     * Terminate worker
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }
}
exports.TesseractClient = TesseractClient;
exports.tesseractClient = new TesseractClient();
//# sourceMappingURL=tessaractClient.js.map