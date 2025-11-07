# 🔄 AGENT 6: Web App Polling Update

## Visual Architecture Change

### BEFORE (Streaming)
```
┌─────────────────┐
│   Upload Page   │
│   (Next.js)     │
└────────┬────────┘
         │ POST /api/documents/[id]/process
         ↓
┌─────────────────────────┐
│  Netlify Function       │
│  - Streams updates      │
│  - Times out at 10s ❌  │
└────────┬────────────────┘
         │ Stream (SSE)
         ↓
┌─────────────────────────┐
│  Upload Page            │
│  - Receives updates     │
│  - Auto-navigates ❌    │
└─────────────────────────┘
```

### AFTER (Polling)
```
┌─────────────────┐
│   Upload Page   │
│   (Next.js)     │
└────────┬────────┘
         │ 1. POST /api/documents/[id]/process
         ↓         (returns immediately)
┌─────────────────────────┐
│  Netlify Function       │
│  - Queues job           │
│  - Returns 202 ✅       │
└─────────────────────────┘
         
         │ 2. Poll every 2s
         ↓ GET /api/documents/[id]/processing-status
┌─────────────────────────┐
│  Netlify Function       │
│  - Fetches DB status    │
│  - Returns updates ✅   │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  Upload Page            │
│  - Shows updates        │
│  - User clicks button ✅│
└─────────────────────────┘
```

---

## 🎨 UI Flow Changes

### BEFORE
```
1. User uploads files
2. Clicks "Start Analysis"
3. Streaming updates appear
4. ⏱️ Auto-navigates after 2 seconds
   ❌ User has no control
   ❌ Can't see final state
```

### AFTER
```
1. User uploads files
2. Clicks "Start Analysis"
3. Polling updates appear (every 2s)
4. ✅ "View Results" button appears
5. ✅ User clicks when ready
6. ✅ Can navigate away and return
```

---

## 📊 File Changes

### `src/app/upload/page.tsx`

#### ❌ REMOVED
```typescript
// OLD: Streaming function (140 lines)
const processDocumentWithStreaming = async (...) => {
  const reader = response.body?.pipeThrough(...)
  // Complex stream reading logic
  while (true) {
    const { value, done } = await reader.read()
    // ...
  }
}

// OLD: Auto-navigation
setTimeout(() => {
  router.push('/documents')
}, 2000)
```

#### ✅ ADDED
```typescript
// NEW: Polling function (92 lines)
const processDocumentWithPolling = async (...) => {
  return new Promise<void>((resolve, reject) => {
    const poll = async () => {
      const response = await fetch(
        `/api/documents/${documentId}/processing-status`
      )
      const data = await response.json()
      // Update UI state
      if (data.status === 'completed') resolve()
    }
    poll() // Initial
    setInterval(poll, 2000) // Every 2s
  })
}

// NEW: "View Results" button
{allComplete ? (
  <Button onClick={() => router.push('/documents')}>
    View Results
  </Button>
) : (
  <Button onClick={uploadFiles}>Start Analysis</Button>
)}

// NEW: Cleanup on unmount
useEffect(() => {
  return () => {
    // Cleanup intervals
  }
}, [])
```

---

## 🔧 Polling Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| **Interval** | 2 seconds | Feels real-time, not excessive |
| **Timeout** | 3 minutes | Supabase Edge Function limit |
| **Retry** | 5 failures | Handle temporary network issues |
| **Cleanup** | On complete/error/unmount | Prevent memory leaks |

---

## 📈 Progress Mapping

```
Server Phase         →  Progress %  →  UI Display
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
queued               →      5%     →  "Queued..."
validation           →     10%     →  "Validating..."
download             →     20%     →  "Downloading..."
ocr                  →     40%     →  "Extracting text..."
ai_extraction        →     70%     →  "AI analyzing..."
saving               →     90%     →  "Saving results..."
complete             →    100%     →  "Complete!" ✅
```

---

## 🎯 Button States

```
STATE            │ BUTTON TEXT       │ ICON        │ ENABLED │ ACTION
─────────────────┼───────────────────┼─────────────┼─────────┼────────────────
Files pending    │ "Start Analysis"  │ Upload      │ ✅      │ uploadFiles()
Uploading        │ "Processing..."   │ Spinner     │ ❌      │ -
Processing       │ "Processing..."   │ Spinner     │ ❌      │ -
Complete         │ "View Results"    │ CheckCircle │ ✅      │ router.push()
Error            │ "View Results"    │ CheckCircle │ ✅      │ router.push()
```

---

## 🧪 Test Scenarios

### ✅ Happy Path
```
1. Upload small PDF
2. Click "Start Analysis"
3. See polling updates every 2s
4. Progress bar fills
5. AI reasoning appears
6. "View Results" button shows
7. Click → navigate to /documents
```

### ✅ Navigate Away
```
1. Upload file
2. Start processing
3. Navigate to /profile
4. Come back to /upload
5. Status persists (via backend)
6. Can check /documents for result
```

### ✅ Timeout
```
1. Upload huge file (>3 min processing)
2. Poll for 3 minutes
3. Timeout error shows
4. Retry or navigate away
```

### ✅ Network Error
```
1. Processing starts
2. Network disconnects
3. Poll fails
4. Retries up to 5 times
5. Either recovers or shows error
```

---

## 📊 API Contract

### Endpoint: `/api/documents/[id]/processing-status`

**Request:**
```http
GET /api/documents/abc123/processing-status HTTP/1.1
Authorization: Bearer <token>
```

**Response (Processing):**
```json
{
  "status": "processing",
  "progress": 40,
  "currentPhase": "ocr",
  "currentMessage": "Extracting text from document...",
  "updates": [
    {
      "phase": "validation",
      "message": "File validated",
      "details": {}
    },
    {
      "phase": "ocr",
      "message": "Extracting text...",
      "details": {
        "textLength": 1500
      }
    }
  ],
  "document": {
    "id": "abc123",
    "filename": "bloodwork.pdf",
    "processed_at": null
  }
}
```

**Response (Complete):**
```json
{
  "status": "completed",
  "progress": 100,
  "currentPhase": "complete",
  "currentMessage": "Processing complete!",
  "updates": [...],
  "document": {
    "id": "abc123",
    "filename": "bloodwork.pdf",
    "processed_at": "2024-11-07T10:30:00Z"
  }
}
```

---

## 🚀 Performance

| Metric | Old (Streaming) | New (Polling) | Improvement |
|--------|----------------|---------------|-------------|
| **Timeout** | 10 seconds ❌ | 3 minutes ✅ | 18x longer |
| **Connection** | Persistent | Per request | More resilient |
| **Network** | Holds open | Intermittent | Less resources |
| **Navigation** | Forced | User-controlled | Better UX |
| **Resume** | Not possible | Possible | Flexible |

---

## ✅ Checklist

- [x] Replace streaming function with polling
- [x] Update uploadFiles() to use polling
- [x] Remove auto-navigation setTimeout
- [x] Add "View Results" button
- [x] Add cleanup useEffect
- [x] Map server response to UI state
- [x] Handle timeout (3 minutes)
- [x] Handle errors with retry
- [x] Maintain same UI appearance
- [x] Zero linter errors

---

## 🎉 RESULT

**Web app now polls for processing status!**

✅ Works with Netlify free tier  
✅ Handles long processing times  
✅ User-controlled navigation  
✅ Resilient to errors  
✅ Same beautiful UI  

**Ready for testing when backend infrastructure is complete!**

---

## 📚 Related Files

- `AGENT_6_COMPLETION_REPORT.md` - Detailed documentation
- `AGENT_6_SUMMARY.md` - Quick reference
- `BACKGROUND_PROCESSING_MIGRATION_PLAN.md` - Overall plan
- `src/app/upload/page.tsx` - Modified file

---

**AGENT 6 COMPLETE** ✨

