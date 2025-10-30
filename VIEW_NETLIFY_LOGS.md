# How to View Netlify Function Logs (Real Solution)

## Problem: Netlify UI Not Showing Detailed Logs

If you can't click on function invocations in the Netlify dashboard, here are alternative ways:

## Option 1: Check Database (Easiest & Most Reliable)

The enhanced logging I added saves all error details to your Supabase database:

1. **Go to Supabase Dashboard** → **Table Editor** → `documents` table
2. **Find your failed document** (sort by newest)
3. **Click on the `processing_metadata` cell** to expand it
4. **Look for `error_details`** which contains:
   ```json
   {
     "message": "The actual error message",
     "stack": "Full stack trace",
     "type": "Error type",
     "timestamp": "When it happened"
   }
   ```

This is the most reliable way to see what went wrong!

## Option 2: Use Netlify CLI (Real-Time Logs)

Install Netlify CLI and tail logs in real-time:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site (run in project directory)
netlify link

# Stream function logs in real-time
netlify functions:log
```

Then in another terminal, trigger your upload/processing and watch the logs stream live!

## Option 3: SQL Query in Supabase

For quick error checking, run this SQL query in Supabase SQL Editor:

```sql
SELECT 
  id,
  filename,
  status,
  created_at,
  processed_at,
  processing_errors,
  processing_metadata->'error_details' as error_details,
  ocr_data
FROM documents
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

Replace `YOUR_USER_ID` with your actual user ID.

## Option 4: Add Alert Notification (For Future)

You could also add a service to send you the error via email/Slack when processing fails.

## What to Look For in Error Details

Common errors you might see:

### 1. OpenAI API Error
```json
{
  "message": "The model `gpt-5` does not exist",
  "type": "OpenAI API Error"
}
```
**Fix:** Check `OPENAI_MODEL` environment variable

### 2. Timeout Error
```json
{
  "message": "Function execution timed out after 10s",
  "type": "TimeoutError"
}
```
**Fix:** File too complex or need paid plan for longer timeouts

### 3. OCR Error
```json
{
  "message": "OCR processing failed: ...",
  "type": "Error"
}
```
**Fix:** File format issue or OCR service problem

### 4. Authentication Error
```json
{
  "message": "Unauthorized",
  "type": "AuthError"
}
```
**Fix:** Session expired or auth token invalid

## Next Steps

1. **First, check the database** `processing_metadata` field
2. **Copy the entire error object** you find there
3. **Share it** so we can fix the specific issue

The database approach is most reliable because:
- ✅ Always captures errors (even if Netlify UI doesn't show them)
- ✅ Includes full stack traces
- ✅ Persists even after function execution ends
- ✅ Easy to query and search

