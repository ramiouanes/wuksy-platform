# Debug Upload Error Guide

## Where "Processing Failed" Comes From

Looking at your code in `src/app/upload/page.tsx` (line 267), when processing fails, it only shows "Processing failed" without details.

## 🎯 How to Find the Real Error

### Method 1: Network Tab (FASTEST - Do This First!)

1. **Open Chrome DevTools** (F12)
2. **Go to Network tab**
3. **Clear the network log** (🚫 icon)
4. **Upload your file**
5. **Look for the failed request** - it will be red and named something like:
   - `process` or
   - `/api/documents/[some-id]/process`
6. **Click on that request**
7. **Click the "Response" tab**
8. **You'll see the actual error JSON**, like:
   ```json
   {
     "error": "Processing failed",
     "details": "The actual error message here"
   }
   ```

### Method 2: Netlify Function Logs (For Backend Errors)

1. Go to: https://app.netlify.com/
2. Click your site: **curious-palmier-76b67e**
3. Click **"Logs"** in top navigation
4. Click **"Functions"** tab
5. **Keep this page open**
6. **Upload a file in your app**
7. **Watch the logs appear in real-time**

You'll see console.error() output from these lines:
- Line 303: `console.error('Streaming processing error:', error)`
- Line 554: `console.error('Biomarker extraction failed:', error)`
- Line 369: `console.error('OCR Service Error:', ocrError)`

### Method 3: Check Console More Carefully

The error IS being logged at line 264:
```javascript
console.error('Processing failed:', processingError)
```

**Make sure:**
- You're looking at the **Console** tab (not just Network)
- You haven't filtered out errors
- Red error messages should appear there

## 🔧 Common Errors You Might See

### 1. OpenAI API Key Missing/Invalid
```
Error: OpenAI API key not configured
```
**Fix:** Add `OPENAI_API_KEY` to Netlify environment variables

### 2. File Download Failed
```
Error: Failed to download file from storage
```
**Fix:** Check Supabase storage permissions and bucket configuration

### 3. OCR Processing Failed
```
Error: OCR processing failed: ...
```
**Fix:** Check if file is readable, not corrupted

### 4. No Biomarkers Found
```
Error: No biomarkers found in document
```
**Fix:** Document might not contain lab results, or OCR failed to read text

### 5. Authorization Error
```
Error: Missing authorization token
```
**Fix:** Sign out and sign back in to refresh your session

## 🛠️ Quick Fix: Add Better Error Display

Would you like me to update the upload page to show the actual error message instead of just "Processing failed"?

## 📊 Next Steps

1. **Check Network Tab Response** first - this will tell you exactly what went wrong
2. **Check Netlify Function Logs** if you need more backend details
3. **Share the error message** you find, and I can help fix it!

