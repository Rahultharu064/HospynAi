"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUploader = exports.uploadAvatar = exports.uploadDocument = exports.uploadImages = exports.uploadImage = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
// Ensure upload directories exist
const uploadDirs = {
    images: path_1.default.join(__dirname, '../../uploads/images'),
    documents: path_1.default.join(__dirname, '../../uploads/documents'),
    temp: path_1.default.join(__dirname, '../../uploads/temp'),
};
Object.values(uploadDirs).forEach((dir) => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
});
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Determine destination based on file type
        let dest = uploadDirs.temp;
        if (file.mimetype.startsWith('image/')) {
            dest = uploadDirs.images;
        }
        else if (file.mimetype === 'application/pdf' || file.mimetype.includes('document')) {
            dest = uploadDirs.documents;
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto_1.default.randomBytes(16).toString('hex');
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const timestamp = Date.now();
        cb(null, `${timestamp}-${uniqueSuffix}${ext}`);
    },
});
// File filter with detailed validation
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = config_1.config.upload.allowedMimeTypes;
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        logger_1.default.warn(`File upload rejected: Invalid type ${file.mimetype}`);
        cb(new errors_1.BadRequestError(`File type '${file.mimetype}' is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
};
// Image-specific filter
const imageFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errors_1.BadRequestError(`Only image files are allowed (JPEG, PNG, WebP, GIF). Received: ${file.mimetype}`));
    }
};
// Document-specific filter
const documentFilter = (req, file, cb) => {
    const allowedDocTypes = ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedDocTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errors_1.BadRequestError('Only PDF and Word documents are allowed'));
    }
};
// Create multer instances
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: config_1.config.upload.maxFileSize, // Default 10MB
        files: 5, // Max 5 files at once
    },
});
// Single image upload
exports.uploadImage = (0, multer_1.default)({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
}).single('image');
// Multiple images upload
exports.uploadImages = (0, multer_1.default)({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 5,
    },
}).array('images', 5);
// Single document upload
exports.uploadDocument = (0, multer_1.default)({
    storage,
    fileFilter: documentFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB for documents
    },
}).single('document');
// Avatar upload with specific constraints
exports.uploadAvatar = (0, multer_1.default)({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max for avatars
        files: 1,
    },
}).single('avatar');
// Generic file upload with custom options
const createUploader = (options) => {
    const customFilter = (req, file, cb) => {
        if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
            cb(new errors_1.BadRequestError(`File type '${file.mimetype}' is not allowed`));
        }
        else {
            cb(null, true);
        }
    };
    const uploader = (0, multer_1.default)({
        storage,
        fileFilter: customFilter,
        limits: {
            fileSize: options.maxSize || config_1.config.upload.maxFileSize,
            files: options.maxFiles || 1,
        },
    });
    const fieldName = options.fieldName || 'file';
    return options.isArray ? uploader.array(fieldName, options.maxFiles || 5) : uploader.single(fieldName);
};
exports.createUploader = createUploader;
//# sourceMappingURL=uploadMiddleware.js.map