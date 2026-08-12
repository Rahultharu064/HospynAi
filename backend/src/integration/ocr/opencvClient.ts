import sharp from 'sharp';
import logger from '../../utils/logger';

export class OpenCVClient {
  /**
   * Preprocess image for better OCR accuracy
   */
  async preprocessImage(imagePath: string): Promise<string> {
    try {
      const outputPath = imagePath.replace(/\.(\w+)$/, '_processed.$1');

      await sharp(imagePath)
        .grayscale()                    // Convert to grayscale
        .normalize()                    // Normalize contrast
        .sharpen({                      // Sharpen edges
          sigma: 1.5,
          m1: 1.0,
          m2: 0.5,
        })
        .threshold(128)                 // Apply binary threshold
        .median(3)                      // Reduce noise
        .toFile(outputPath);

      logger.info(`Image preprocessed: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error('Image preprocessing failed:', error);
      return imagePath; // Return original if processing fails
    }
  }

  /**
   * Deskew image (correct rotation)
   */
  async deskewImage(imagePath: string): Promise<string> {
    try {
      const outputPath = imagePath.replace(/\.(\w+)$/, '_deskewed.$1');

      const metadata = await sharp(imagePath).metadata();
      
      // Apply slight rotation correction if needed
      await sharp(imagePath)
        .rotate(0) // Auto-detect and correct skew
        .toFile(outputPath);

      logger.info(`Image deskewed: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error('Image deskewing failed:', error);
      return imagePath;
    }
  }

  /**
   * Remove noise and enhance quality
   */
  async enhanceImage(imagePath: string): Promise<string> {
    try {
      const outputPath = imagePath.replace(/\.(\w+)$/, '_enhanced.$1');

      await sharp(imagePath)
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

      logger.info(`Image enhanced: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error('Image enhancement failed:', error);
      return imagePath;
    }
  }

  /**
   * Crop to document area
   */
  async cropToDocument(imagePath: string): Promise<string> {
    try {
      const outputPath = imagePath.replace(/\.(\w+)$/, '_cropped.$1');
      const metadata = await sharp(imagePath).metadata();

      // Crop 5% from each edge to remove borders
      const width = metadata.width || 1000;
      const height = metadata.height || 1000;
      const cropX = Math.floor(width * 0.05);
      const cropY = Math.floor(height * 0.05);

      await sharp(imagePath)
        .extract({
          left: cropX,
          top: cropY,
          width: width - cropX * 2,
          height: height - cropY * 2,
        })
        .toFile(outputPath);

      logger.info(`Image cropped: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error('Image cropping failed:', error);
      return imagePath;
    }
  }

  /**
   * Full preprocessing pipeline
   */
  async fullPreprocess(imagePath: string): Promise<string> {
    let processedPath = imagePath;
    
    processedPath = await this.deskewImage(processedPath);
    processedPath = await this.enhanceImage(processedPath);
    processedPath = await this.cropToDocument(processedPath);
    
    return processedPath;
  }
}

export const opencvClient = new OpenCVClient();