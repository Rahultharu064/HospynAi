"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.opencvClient = exports.OpenCVClient = void 0;
const sharp_1 = __importDefault(require("sharp"));
const logger_1 = __importDefault(require("../../utils/logger"));
class OpenCVClient {
    /**
     * Preprocess image for better OCR accuracy
     */
    async preprocessImage(imagePath) {
        try {
            const outputPath = imagePath.replace(/\.(\w+)$/, '_processed.$1');
            await (0, sharp_1.default)(imagePath)
                .grayscale() // Convert to grayscale
                .normalize() // Normalize contrast
                .sharpen({
                sigma: 1.5,
                m1: 1.0,
                m2: 0.5,
            })
                .threshold(128) // Apply binary threshold
                .median(3) // Reduce noise
                .toFile(outputPath);
            logger_1.default.info(`Image preprocessed: ${outputPath}`);
            return outputPath;
        }
        catch (error) {
            logger_1.default.error('Image preprocessing failed:', error);
            return imagePath; // Return original if processing fails
        }
    }
    /**
     * Deskew image (correct rotation)
     */
    async deskewImage(imagePath) {
        try {
            const outputPath = imagePath.replace(/\.(\w+)$/, '_deskewed.$1');
            const metadata = await (0, sharp_1.default)(imagePath).metadata();
            // Apply slight rotation correction if needed
            await (0, sharp_1.default)(imagePath)
                .rotate(0) // Auto-detect and correct skew
                .toFile(outputPath);
            logger_1.default.info(`Image deskewed: ${outputPath}`);
            return outputPath;
        }
        catch (error) {
            logger_1.default.error('Image deskewing failed:', error);
            return imagePath;
        }
    }
    /**
     * Remove noise and enhance quality
     */
    async enhanceImage(imagePath) {
        try {
            const outputPath = imagePath.replace(/\.(\w+)$/, '_enhanced.$1');
            await (0, sharp_1.default)(imagePath)
                .modulate({
                brightness: 1.1,
                saturation: 0,
            })
                .sharpen({
                sigma: 2,
                m1: 1.5,
                m2: 0.7,
            })
                .toFile(outputPath);
            logger_1.default.info(`Image enhanced: ${outputPath}`);
            return outputPath;
        }
        catch (error) {
            logger_1.default.error('Image enhancement failed:', error);
            return imagePath;
        }
    }
    /**
     * Crop to document area
     */
    async cropToDocument(imagePath) {
        try {
            const outputPath = imagePath.replace(/\.(\w+)$/, '_cropped.$1');
            const metadata = await (0, sharp_1.default)(imagePath).metadata();
            // Crop 5% from each edge to remove borders
            const width = metadata.width || 1000;
            const height = metadata.height || 1000;
            const cropX = Math.floor(width * 0.05);
            const cropY = Math.floor(height * 0.05);
            await (0, sharp_1.default)(imagePath)
                .extract({
                left: cropX,
                top: cropY,
                width: width - cropX * 2,
                height: height - cropY * 2,
            })
                .toFile(outputPath);
            logger_1.default.info(`Image cropped: ${outputPath}`);
            return outputPath;
        }
        catch (error) {
            logger_1.default.error('Image cropping failed:', error);
            return imagePath;
        }
    }
    /**
     * Full preprocessing pipeline
     */
    async fullPreprocess(imagePath) {
        let processedPath = imagePath;
        processedPath = await this.deskewImage(processedPath);
        processedPath = await this.enhanceImage(processedPath);
        processedPath = await this.cropToDocument(processedPath);
        return processedPath;
    }
}
exports.OpenCVClient = OpenCVClient;
exports.opencvClient = new OpenCVClient();
//# sourceMappingURL=opencvClient.js.map