// Dynamic imports to avoid initialization issues
// import Tesseract from 'tesseract.js'
// import pdf from 'pdf-parse'
// import sharp from 'sharp'

export interface OCRResult {
  text: string
  confidence: number
  metadata?: {
    pageCount?: number
    language?: string
    processingTime?: number
  }
}

export interface OCROptions {
  language?: string
  pageNumbers?: number[]
  preprocessImage?: boolean
}

export class OCRService {
  private static instance: OCRService
  
  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService()
    }
    return OCRService.instance
  }

  /**
   * Extract text from various file formats
   */
  async extractText(
    fileBuffer: Buffer, 
    mimeType: string, 
    options: OCROptions = {}
  ): Promise<OCRResult> {
    const startTime = Date.now()
    
    try {
      if (mimeType === 'application/pdf') {
        return await this.extractFromPDF(fileBuffer, options)
      } else if (mimeType.startsWith('image/')) {
        return await this.extractFromImage(fileBuffer, options)
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`)
      }
    } catch (error) {
      console.error('OCR extraction failed:', error)
      throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract text from PDF files
   */
  private async extractFromPDF(
    fileBuffer: Buffer, 
    options: OCROptions = {}
  ): Promise<OCRResult> {
    try {
      // Dynamic import to avoid initialization issues
      const pdf = (await import('pdf-parse')).default
      
      // First, try to extract text directly from PDF
      const pdfData = await pdf(fileBuffer)
      
      if (pdfData.text && pdfData.text.trim().length > 100) {
        // PDF has extractable text
        return {
          text: pdfData.text,
          confidence: 0.95, // High confidence for direct text extraction
          metadata: {
            pageCount: pdfData.numpages,
            language: options.language || 'eng',
            processingTime: Date.now() - Date.now()
          }
        }
      }
      
      // PDF is likely scanned/image-based, needs OCR
      // Convert PDF to images and OCR each page
      // For now, we'll return a message indicating PDF OCR needs additional setup
      throw new Error('PDF appears to be image-based. Image-based PDF OCR requires additional server-side setup.')
      
    } catch (error) {
      throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract text from image files
   */
  private async extractFromImage(
    fileBuffer: Buffer, 
    options: OCROptions = {}
  ): Promise<OCRResult> {
    const startTime = Date.now()
    
    try {
      console.log(`Starting OCR for image, buffer size: ${fileBuffer.length} bytes`)
      
      // Preprocess image if needed
      let processedBuffer = fileBuffer
      if (options.preprocessImage !== false) {
        console.log('Preprocessing image for better OCR...')
        processedBuffer = await this.preprocessImage(fileBuffer)
        console.log(`Preprocessed buffer size: ${processedBuffer.length} bytes`)
      }

      console.log('Initializing Tesseract OCR...')
      // Dynamic import to avoid initialization issues
      const Tesseract = (await import('tesseract.js')).default
      
      // Perform OCR using Tesseract.js
      const { data } = await Tesseract.recognize(
        processedBuffer,
        options.language || 'eng',
        {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
            }
          }
        }
      )

      const processingTime = Date.now() - startTime
      console.log(`OCR completed in ${processingTime}ms, confidence: ${data.confidence}%`)

      return {
        text: data.text,
        confidence: data.confidence / 100, // Convert to 0-1 scale
        metadata: {
          language: options.language || 'eng',
          processingTime
        }
      }
    } catch (error) {
      console.error('OCR Error details:', error)
      throw new Error(`Image OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Preprocess image to improve OCR accuracy
   */
  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Dynamic import to avoid initialization issues
      const sharp = (await import('sharp')).default
      
      return await sharp(imageBuffer)
        .grayscale() // Convert to grayscale
        .normalise() // Normalize contrast
        .sharpen() // Sharpen the image
        .resize(null, 1200, { // Resize to optimal height for OCR
          withoutEnlargement: true,
          fit: 'inside'
        })
        .png() // Convert to PNG for better OCR results
        .toBuffer()
    } catch (error) {
      console.warn('Image preprocessing failed, using original:', error)
      return imageBuffer
    }
  }

  /**
   * Validate OCR result quality
   */
  validateOCRQuality(result: OCRResult): {
    isValid: boolean
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []

    // Check confidence
    if (result.confidence < 0.6) {
      issues.push('Low OCR confidence')
      suggestions.push('Consider using a higher quality image or different preprocessing')
    }

    // Check text length
    if (result.text.length < 50) {
      issues.push('Very short extracted text')
      suggestions.push('Verify the document contains readable text')
    }

    // Check for common OCR errors
    const specialCharRatio = (result.text.match(/[^a-zA-Z0-9\s\.\,\:\;\-\(\)]/g) || []).length / result.text.length
    if (specialCharRatio > 0.1) {
      issues.push('High ratio of special characters detected')
      suggestions.push('Image quality may be poor or document may be damaged')
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    }
  }
}

export const ocrService = OCRService.getInstance() 