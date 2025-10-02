# Real OCR Biomarker Extraction Setup

This document explains how to set up the real biomarker extraction system using Tesseract.js OCR and optional AI enhancement.

## Dependencies Installed

The following dependencies have been added to enable real document processing:

- `tesseract.js` - Free OCR engine for text extraction from images
- `openai` - OpenAI API client for AI-enhanced extraction (optional)
- `pdf-parse` - PDF text extraction library
- `sharp` - Image preprocessing for better OCR results

## Environment Variables

Add these to your `.env.local` file:

```env
# Required - Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - OpenAI API for AI-enhanced extraction
# If not provided, system falls back to pattern matching
OPENAI_API_KEY=your_openai_api_key
```

## How It Works

### 1. File Processing Pipeline

1. **File Validation**: Checks file type and size limits
2. **File Download**: Downloads document from Supabase storage
3. **OCR Extraction**: Uses Tesseract.js to extract text from images/PDFs
4. **Quality Validation**: Checks OCR confidence and text quality
5. **AI Enhancement**: Uses OpenAI to extract structured biomarker data (if API key available)
6. **Fallback Pattern Matching**: Uses regex patterns if AI fails or unavailable
7. **Database Matching**: Matches extracted biomarkers with known database entries

### 2. Supported File Types

- **Images**: JPEG, PNG, GIF, BMP, WebP
- **PDFs**: Text-based PDFs (direct extraction) and image-based PDFs (OCR needed)

### 3. Cost-Effective Approach

- **Tesseract.js**: Completely free, runs server-side
- **OpenAI GPT-3.5-turbo**: Cost-effective AI model (~$0.002/1K tokens)
- **Pattern Matching Fallback**: No cost, works without any API keys

## Features

### OCR Service (`src/lib/ocr-service.ts`)
- Text extraction from images and PDFs
- Image preprocessing for better accuracy
- Quality validation and confidence scoring
- Support for multiple languages

### AI Enhancement (`src/lib/ai-biomarker-service.ts`)
- OpenAI-powered structured data extraction
- Intelligent biomarker recognition
- Fallback to pattern matching
- Confidence scoring and validation

### File Utilities (`src/lib/file-utils.ts`)
- Secure file download from Supabase storage
- File validation and type checking
- Processing time estimation

## Testing the Implementation

1. **Without OpenAI (Free)**:
   - Upload a lab report image/PDF
   - System will use Tesseract.js + pattern matching
   - Should extract common biomarkers automatically

2. **With OpenAI (Enhanced)**:
   - Add `OPENAI_API_KEY` to environment
   - Upload any medical document
   - AI will intelligently extract biomarkers in structured format

## Debugging

The system includes comprehensive logging:
- OCR progress and confidence scores
- AI extraction attempts and fallbacks
- Processing time and quality metrics
- Error handling and recovery

Check the server console for detailed extraction logs.

## Limitations

1. **PDF OCR**: Image-based PDFs require additional server setup for conversion
2. **Handwriting**: Tesseract works best with printed text
3. **Complex Layouts**: Tables and multi-column layouts may need preprocessing
4. **Language Support**: Currently optimized for English medical documents

## Future Enhancements

- Google Cloud Vision API integration for better accuracy
- AWS Textract for advanced table extraction
- Specialized medical document models
- Real-time processing status updates 