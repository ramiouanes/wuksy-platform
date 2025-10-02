# How to Debug Backend Issues in Netlify

## Finding Function Logs (Where Your Backend Errors Are)

### Step 1: Access Function Logs

1. **Go to your Netlify Dashboard**
2. **Click on "Logs" in the left sidebar**
3. **Select "Functions"** (NOT "Deploy logs")
4. You'll see a list of function invocations

### Step 2: Find Your Processing Request

Look for function calls related to document processing:
- **Function name**: Look for `api-documents-[id]-process` or similar
- **Time**: Match the timestamp to when you clicked "Start Analyzing"
- **Status**: Look for ones with status `500` (error) or `200` (success)

### Step 3: View Detailed Logs

1. **Click on the specific function invocation**
2. You'll see ALL the `console.log`, `console.error` outputs from your backend
3. Look for:
   - ❌ Error markers (from our enhanced logging)
   - Stack traces
   - API error messages
   - Processing steps that completed vs failed

### Step 4: What to Look For

With the enhanced logging I just added, you should see detailed output like:

```
✅ OCR extraction successful, text length: 1234
📄 OCR text preview (first 500 chars): ...

OR

❌ OCR Service Error - CRITICAL:
Error type: Error
Error message: [actual error]
Error stack: [stack trace]
```

If AI extraction fails, you'll see:
```
❌ AI EXTRACTION ERROR - CRITICAL ❌
Error type: [type]
Error message: [actual error from OpenAI]
OpenAI API error details: [API response]
```

## Common Issues and What Logs Tell You

### 1. OpenAI API Key Not Working
**Logs will show:**
```
OpenAI API error details: {
  "error": {
    "message": "Incorrect API key provided",
    "type": "invalid_request_error"
  }
}
```
**Solution:** Check environment variable is set correctly in Netlify

### 2. OpenAI Model Not Found
**Logs will show:**
```
OpenAI API error details: {
  "error": {
    "message": "The model `gpt-5` does not exist",
    "type": "invalid_request_error"
  }
}
```
**Solution:** Set `OPENAI_MODEL` environment variable to correct model name

### 3. Timeout Issues
**Logs will show:**
```
Error: Function execution timed out after 10s
```
**Solution:** Netlify free tier has 10s function timeout. Your document might be too large or complex.

### 4. OCR Failure
**Logs will show:**
```
❌ OCR Service Error - CRITICAL:
Error message: [specific OCR error]
```
**Solution:** Could be image format issue, file corruption, or OCR service configuration

### 5. Environment Variables Not Available
**Logs will show:**
```
AIBiomarkerService constructor - API key available: false
OpenAI API key not found
```
**Solution:** Environment variables not set in Netlify dashboard

## How to Check Environment Variables in Netlify

1. **Netlify Dashboard** → Your site → **Site settings**
2. **Environment variables** (in left sidebar under "Build & deploy")
3. Verify these are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional, defaults to gpt-4o)

**Important:** After adding/changing environment variables, you MUST redeploy:
- Go to **Deploys** → **Trigger deploy** → **Deploy site**

## Checking Database for Error Details

I've also enhanced the error storage in the database. Check your Supabase dashboard:

1. **Go to Supabase Dashboard**
2. **Table Editor** → `documents` table
3. **Find your failed document**
4. **Look at these columns:**
   - `processing_errors`: Array of error messages
   - `processing_metadata`: Contains detailed error info including stack traces

Example query in SQL Editor:
```sql
SELECT 
  id, 
  filename, 
  status, 
  processing_errors,
  processing_metadata->'error_details' as error_details
FROM documents
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

## Real-Time Debugging

### Option 1: Live Tail (Recommended)
Netlify doesn't have live tail in free tier, but you can:
1. Keep the **Functions log page** open
2. **Refresh** after each test
3. Look for the newest invocation

### Option 2: Check Database Immediately
After processing fails:
1. Go to Supabase → Table Editor → `documents`
2. Find your document (sorted by newest)
3. Check `processing_metadata` → `error_details`

## Next Steps After Viewing Logs

Once you see the actual error in the logs:

1. **Copy the full error message and stack trace**
2. **Share it** so we can fix the specific issue
3. **Check if it's:**
   - API key issue → Fix in Netlify env vars
   - Model issue → Fix `OPENAI_MODEL` env var
   - Timeout → Might need to optimize or upgrade plan
   - OCR issue → File format or quality problem
   - Memory issue → File too large

## Quick Debug Checklist

Before contacting support, verify:
- [ ] Environment variables are set in Netlify (not just locally)
- [ ] You redeployed after adding env vars
- [ ] File is valid PDF or image format
- [ ] File size is under 10MB
- [ ] You're logged in and authenticated
- [ ] You've checked Function logs (not Deploy logs)
- [ ] You've looked at the most recent function invocation
- [ ] You've checked the database `processing_metadata` field

## Testing Locally vs Production

If it works locally but fails in Netlify:
1. **Different environment** → Check Netlify env vars match local `.env.local`
2. **Timeout limits** → Local has no timeout, Netlify free tier = 10s
3. **Memory limits** → Netlify free tier has memory constraints
4. **Cold starts** → First request after idle might timeout

---

**Remember:** The enhanced logging I added will now show you EXACTLY where and why processing fails. Check the Function logs after your next upload attempt!

