import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { config } from '../config';
import { BadRequestError } from '../utils/errors';
import { Request } from 'express';
import logger from '../utils/logger';

// Ensure upload directories exist
const uploadDirs = {
  images: path.join(__dirname, '../../uploads/images'),
  documents: path.join(__dirname, '../../uploads/documents'),
  temp: path.join(__dirname, '../../uploads/temp'),
};

Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // Determine destination based on file type
    let dest = uploadDirs.temp;
    
    if (file.mimetype.startsWith('image/')) {
      dest = uploadDirs.images;
    } else if (file.mimetype === 'application/pdf' || file.mimetype.includes('document')) {
      dest = uploadDirs.documents;
    }
    
    cb(null, dest);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    cb(null, `${timestamp}-${uniqueSuffix}${ext}`);
  },
});

// File filter with detailed validation
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = config.upload.allowedMimeTypes;
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn(`File upload rejected: Invalid type ${file.mimetype}`);
    cb(new BadRequestError(
      `File type '${file.mimetype}' is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
    ));
  }
};

// Image-specific filter
const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(
      `Only image files are allowed (JPEG, PNG, WebP, GIF). Received: ${file.mimetype}`
    ));
  }
};

// Document-specific filter
const documentFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedDocTypes = ['application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (allowedDocTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only PDF and Word documents are allowed'));
  }
};

const audioMimeTypes = [
  'audio/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/ogg',
  'audio/x-m4a',
];

const audioFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (audioMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(
      `Only audio files are allowed (WebM, MP3, WAV, M4A). Received: ${file.mimetype}`
    ));
  }
};

// Create multer instances
export const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize, // Default 10MB
    files: 5, // Max 5 files at once
  },
});

// Single image upload
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}).single('image');

// Multiple images upload
export const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
}).array('images', 5);

// Single document upload
export const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB for documents
  },
}).single('document');

// Avatar upload with specific constraints
export const uploadAvatar = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for avatars
    files: 1,
  },
}).single('avatar');

// Audio upload for chatbot voice (in-memory — no disk path issues)
export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  fileFilter: audioFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max for voice messages
    files: 1,
  },
}).single('audio');

// Generic file upload with custom options
export const createUploader = (options: {
  fieldName?: string;
  maxSize?: number;
  maxFiles?: number;
  allowedTypes?: string[];
  isArray?: boolean;
}) => {
  const customFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
      cb(new BadRequestError(`File type '${file.mimetype}' is not allowed`));
    } else {
      cb(null, true);
    }
  };

  const uploader = multer({
    storage,
    fileFilter: customFilter,
    limits: {
      fileSize: options.maxSize || config.upload.maxFileSize,
      files: options.maxFiles || 1,
    },
  });

  const fieldName = options.fieldName || 'file';
  return options.isArray ? uploader.array(fieldName, options.maxFiles || 5) : uploader.single(fieldName);
};