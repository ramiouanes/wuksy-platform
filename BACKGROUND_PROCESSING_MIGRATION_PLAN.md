# Background Processing Migration Plan
## Moving from Netlify Streaming to Supabase Edge Functions

---

## 🎯 **OBJECTIVE**

Migrate document processing from Netlify serverless functions (10-second timeout) to Supabase Edge Functions (150-second timeout) while maintaining the real-time AI reasoning display experience for both mobile and web apps.

---

## 📦 **CURRENT APP CONTEXT**

### **What Already Exists (DO NOT RECREATE)**

#### **1. Database Infrastructure**
- ✅ **Supabase Database** - Fully configured and connected
- ✅ **documents table** - With columns:
  - `id`, `user_id`, `filename`, `storage_path`, `status`, `processed_at`, `extracted_biomarkers`, `ocr_data`, `processing_metadata`, `processing_errors`
- ✅ **biomarker_readings table** - For storing extracted biomarkers
- ✅ **biomarkers table** - Reference database of known biomarkers
- ✅ **RLS Policies** - Proper row-level security configured

#### **2. File Storage**
- ✅ **Supabase Storage** - Files uploaded to `documents` bucket
- ✅ **Upload API** - `wuksy-platform/src/app/api/documents/upload/route.ts` (KEEP AS-IS)

#### **3. Processing Services (MIGRATE, DON'T DELETE YET)**
- ✅ **OCR Service** - `wuksy-platform/src/lib/ocr-service.ts` (uses Tesseract.js)
- ✅ **AI Biomarker Service** - `wuksy-platform/src/lib/ai-biomarker-service.ts` (uses OpenAI)
- ✅ **File Utils** - `wuksy-platform/src/lib/file-utils.ts` (download/validation)

#### **4. Authentication**
- ✅ **Supabase Auth** - Fully configured
- ✅ **Auth Helpers** - `wuksy-platform/src/lib/auth-server.ts` (server-side auth)

#### **5. Environment Variables (ALREADY SET)**
```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```
- ⚠️ These need to be added to Supabase Edge Function secrets

#### **6. Netlify Configuration**
- ✅ **netlify.toml** - With streaming headers (will need updating)
- ✅ **Deployment** - Currently deployed and working

---

## 🔴 **CURRENT PROBLEMS**

### **Problem 1: Netlify Timeout**
- **Location**: `src/app/api/documents/[id]/process/route.ts`
- **Issue**: Serverless function has 10-second timeout (free tier)
- **Symptom**: Large files get stuck in "processing" forever when function is killed

### **Problem 2: Premature Navigation (Web App)**
- **Location**: `src/app/upload/page.tsx:324-327`
- **Issue**: Auto-navigates after 2 seconds, before processing completes
- **Code**:
```typescript
setTimeout(() => {
  router.push('/documents')
}, 2000)
```

### **Problem 3: No Timeout Handling (Mobile App)**
- **Location**: `src/lib/document-processing-service.ts`
- **Issue**: XMLHttpRequest has no explicit timeout set
- **Result**: Hangs indefinitely when stream dies

---

## ✅ **SOLUTION ARCHITECTURE**

### **New Flow**

```
┌─────────────────┐
│   Mobile App    │
│   (React Native)│
└────────┬────────┘
         │ 1. Upload file
         ↓
┌─────────────────┐
│   Web App       │
│   (Next.js)     │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Netlify Function (Thin Trigger)    │
│  /api/documents/[id]/process        │
│  - Validates request                │
│  - Updates status to "queued"       │
│  - Triggers Supabase Edge Function  │
│  - Returns 202 immediately          │
└────────┬────────────────────────────┘
         │ 2. HTTP POST (trigger)
         ↓
┌──────────────────────────────────────┐
│  Supabase Edge Function              │
│  process-document                    │
│  - Downloads file from storage       │
│  - Runs OCR (Tesseract)              │
│  - Calls OpenAI for extraction       │
│  - Writes updates to DB in real-time│
│  - 150-second timeout (free tier)   │
└────────┬─────────────────────────────┘
         │ 3. Writes status updates
         ↓
┌──────────────────────────────────────┐
│  Supabase Database                   │
│  - documents (status field)          │
│  - document_processing_updates       │
│    (new table for AI updates)        │
└────────┬─────────────────────────────┘
         │ 4. Polling every 2s
         ↓
┌─────────────────────────────────────┐
│  Netlify Function (Status Endpoint) │
│  /api/documents/[id]/processing-    │
│  status                              │
│  - Fetches latest updates from DB   │
│  - Returns status + AI reasoning    │
└────────┬────────────────────────────┘
         │ 5. Display updates
         ↓
┌─────────────────┐
│  Mobile/Web App │
│  Shows AI       │
│  reasoning      │
└─────────────────┘
```

### **Key Benefits**
- ✅ 150-second timeout (15x longer than Netlify)
- ✅ Shared backend logic for mobile + web
- ✅ Real-time AI updates (via polling)
- ✅ Works on Netlify free tier
- ✅ Scalable architecture

---

## 🚀 **NETLIFY DEPLOYMENT COMPATIBILITY**

### **How It Works with Netlify**

1. **Netlify hosts the Next.js web app** - No changes needed
2. **Netlify Functions remain** - But only as "trigger" endpoints (fast, <1s response)
3. **Supabase Edge Functions** - Do the heavy processing (150s timeout)
4. **Database polling** - Both apps poll Netlify endpoints which query Supabase

### **What Gets Deployed Where**

#### **Netlify (Web App + API Triggers)**
- Next.js app (frontend)
- `/api/documents/upload` - File upload (KEEP AS-IS)
- `/api/documents/[id]/process` - Job trigger (MODIFIED - just queues job)
- `/api/documents/[id]/processing-status` - Status polling (NEW)

#### **Supabase (Backend Processing)**
- Edge Function: `process-document` - Does actual processing
- Database: Stores status updates
- Storage: Stores uploaded files (ALREADY EXISTS)

### **Deployment Commands**

```bash
# Deploy Supabase Edge Functions
npx supabase functions deploy process-document

# Deploy to Netlify (automatic via Git push)
git push origin main
```

### **Environment Variables**

**Supabase Edge Function Secrets:**
```bash
npx supabase secrets set OPENAI_API_KEY=your_key
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
```

**Netlify Environment Variables (ALREADY SET):**
- No changes needed - already configured

---

## 📋 **MULTI-AGENT IMPLEMENTATION PLAN**

---

### **AGENT 1: Setup Supabase Edge Function Infrastructure**

**Goal**: Create the Supabase Edge Function structure and deployment configuration

**Files to Create:**
- `supabase/functions/process-document/index.ts`
- `supabase/functions/_shared/cors.ts`
- `supabase/functions/_shared/supabase-client.ts`

**Tasks:**
1. Create the Supabase Edge Function directory structure at: `wuksy-platform/supabase/functions/process-document/`
2. Create `index.ts` with basic structure for Deno environment:
   - Import Supabase client (Deno-compatible)
   - Setup HTTP request handler
   - Add CORS headers
   - Basic error handling
3. Create shared utilities:
   - CORS helper for handling OPTIONS requests
   - Supabase client factory with service role key
4. Add helper function to write processing updates to database
5. Test basic deployment with `npx supabase functions deploy process-document`

**Important Notes:**
- Use **Deno imports**, not npm packages: `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"`
- Use Supabase client for Deno: `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`
- Handle CORS properly (OPTIONS preflight + headers)
- **DO NOT** migrate processing logic yet - just setup infrastructure

**Prompt:**
```
I need to set up a Supabase Edge Function to handle document processing in the background.

CONTEXT:
- Current app: wuksy-platform (Next.js on Netlify)
- Existing: Supabase database, storage, auth all configured
- Problem: Netlify functions timeout at 10 seconds
- Solution: Move processing to Supabase Edge Functions (150-second timeout)

WHAT EXISTS (DO NOT RECREATE):
- Supabase project with database tables: documents, biomarker_readings, biomarkers
- Supabase storage bucket: "documents"
- File upload API: src/app/api/documents/upload/route.ts (KEEP)
- Processing services in src/lib/: ocr-service.ts, ai-biomarker-service.ts, file-utils.ts

TASKS:
1. Create Supabase Edge Function directory: supabase/functions/process-document/
2. Create index.ts with Deno-compatible imports:
   - HTTP server setup
   - Supabase client initialization (with service role)
   - CORS handling (OPTIONS + headers)
3. Create shared utilities:
   - supabase/functions/_shared/cors.ts - CORS helper
   - supabase/functions/_shared/supabase-client.ts - Client factory
4. Add helper function: writeProcessingUpdate(documentId, phase, message, details)
   - Writes to documents table: update status, last_update_at
   - Prepares for document_processing_updates table (will be created by Agent 2)
5. Basic request handler that:
   - Accepts POST with { documentId: string }
   - Validates request has documentId
   - Returns 200 with { success: true, message: "Processing started" }

DENO IMPORT EXAMPLES:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
```

REQUIREMENTS:
- Use Deno runtime (not Node.js)
- Proper CORS headers
- Error handling with try/catch
- Console logging for debugging
- Structure ready for processing logic (Agent 3 will add)
- Test deployment with: npx supabase functions deploy process-document

DO NOT:
- Migrate processing logic yet (Agent 3 does this)
- Create database tables (Agent 2 does this)
- Modify existing Netlify functions

OUTPUT:
- Working edge function that deploys successfully
- Responds to basic HTTP POST
- Has proper structure for adding processing logic
```

---

### **AGENT 2: Create Processing Status Table & Queue**

**Goal**: Add database tables to track processing status and store AI updates

**Files to Create:**
- `supabase/migrations/[timestamp]_add_processing_status_tracking.sql`

**What Exists (Reference, Don't Recreate):**
- `documents` table with: id, user_id, filename, storage_path, status, processed_at, extracted_biomarkers, ocr_data, processing_metadata
- Existing RLS policies on documents table
- biomarker_readings, biomarkers tables

**Tasks:**
1. Create migration file with timestamp
2. Create `document_processing_updates` table:
   - Links to existing documents table
   - Stores each phase update (validation, ocr, reasoning, etc.)
   - Stores AI thought process and metrics
3. Update `documents` table (add columns):
   - `processing_started_at` (timestamptz)
   - `processing_completed_at` (timestamptz)
   - `last_update_at` (timestamptz)
4. Add RLS policies (users can only see their own document updates)
5. Create indexes for polling performance
6. Include DOWN migration for rollback

**Prompt:**
```
I need to create database infrastructure to support background document processing with real-time status updates via polling.

CONTEXT:
- Existing Supabase database with documents, biomarker_readings, biomarkers tables
- Documents will be processed by Supabase Edge Functions (async)
- Clients will poll for status updates every 2 seconds
- Need to store granular AI processing updates for display

WHAT EXISTS (DO NOT RECREATE):
- documents table with columns: id, user_id, filename, storage_path, status, processed_at, extracted_biomarkers, ocr_data, processing_metadata, processing_errors
- Existing RLS policies: users can only access their own documents
- biomarker_readings table for storing extracted biomarkers

TASKS:
1. Create migration: supabase/migrations/[timestamp]_add_processing_status_tracking.sql
2. Create NEW table: document_processing_updates
   Schema:
   - id (uuid, primary key, default gen_random_uuid())
   - document_id (uuid, foreign key → documents.id, on delete cascade)
   - created_at (timestamptz, default now())
   - phase (text) - values: 'queued', 'validation', 'download', 'ocr', 'ai_extraction', 'saving', 'complete', 'error'
   - message (text) - human-readable status message
   - details (jsonb) - for AI thought process, biomarkers found, confidence, etc.
   
3. Modify EXISTING documents table (ALTER TABLE, don't recreate):
   ADD COLUMN IF NOT EXISTS:
   - processing_started_at (timestamptz)
   - processing_completed_at (timestamptz)
   - last_update_at (timestamptz)

4. Add RLS policies:
   - Enable RLS on document_processing_updates
   - Policy: Users can SELECT updates WHERE document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
   - Policy: Service role can INSERT/UPDATE (for edge function)

5. Add indexes:
   - CREATE INDEX idx_processing_updates_document_id ON document_processing_updates(document_id, created_at DESC)
   - CREATE INDEX idx_documents_last_update ON documents(last_update_at DESC) WHERE status = 'processing'

6. Include DOWN migration:
   - DROP table document_processing_updates
   - ALTER TABLE documents DROP columns (if needed for rollback)

REQUIREMENTS:
- Follow existing RLS pattern (check auth.uid() against documents.user_id)
- Add helpful SQL comments
- Use IF NOT EXISTS where appropriate
- Efficient indexes for polling queries
- Proper foreign key constraints

EXAMPLE RLS POLICY FORMAT (from existing migrations):
```sql
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);
```

OUTPUT:
- Migration file that runs successfully
- RLS policies properly configured
- Indexes for performance
- Rollback capability
```

---

### **AGENT 3: Migrate Processing Logic to Edge Function**

**Goal**: Move OCR + AI biomarker extraction logic to Supabase Edge Function (Deno environment)

**Files to Migrate (Reference, adapt for Deno):**
- `src/lib/ocr-service.ts` - Tesseract OCR
- `src/lib/ai-biomarker-service.ts` - OpenAI extraction
- `src/lib/file-utils.ts` - File download/validation
- Logic from: `src/app/api/documents/[id]/process/route.ts` (lines 542-707)

**Tasks:**
1. Migrate `extractBiomarkersFromDocumentWithStreaming()` to Deno
2. Replace `onProgress()` callback with database writes
3. Adapt Node.js code for Deno:
   - File handling (Buffer → Uint8Array)
   - HTTP fetch (use Deno's native fetch)
   - OpenAI SDK (use REST API or Deno-compatible client)
4. Write each processing phase to `document_processing_updates` table
5. Handle errors and update document status

**Important:**
- **Tesseract.js may not work in Deno** - might need to use external OCR API (like OCR.space or Google Vision) or find Deno-compatible OCR
- OpenAI can use REST API directly (no SDK needed)
- Keep same processing phases: validation → download → ocr → ai_extraction → complete

**Prompt:**
```
I need to migrate document processing logic from Netlify function (Node.js) to Supabase Edge Function (Deno).

CONTEXT:
- Current processing in: src/app/api/documents/[id]/process/route.ts
- Function: extractBiomarkersFromDocumentWithStreaming() (lines 542-707)
- Uses: Tesseract OCR, OpenAI API, Supabase storage
- Must adapt for Deno runtime (not Node.js)

WHAT EXISTS (REFERENCE - DON'T RECREATE):
- src/lib/ocr-service.ts - Tesseract.js wrapper (Node.js)
- src/lib/ai-biomarker-service.ts - OpenAI wrapper (Node.js)
- src/lib/file-utils.ts - File download/validation (Node.js)
- Supabase Edge Function structure (created by Agent 1)
- document_processing_updates table (created by Agent 2)

MIGRATION TASKS:
1. Adapt processing logic for Deno in: supabase/functions/process-document/index.ts
2. Main processing flow:
   a. Validate document exists and user has access
   b. Update status to "processing"
   c. Write update: phase='validation', message='Validating file...'
   d. Download file from Supabase storage
   e. Write update: phase='download', message='File downloaded'
   f. Extract text with OCR
   g. Write update: phase='ocr', message='Extracted text from document'
   h. Call OpenAI for biomarker extraction with streaming
   i. Write updates: phase='ai_extraction', message='AI analyzing...', details={thoughtProcess, biomarkersFound}
   j. Save biomarkers to biomarker_readings table
   k. Write update: phase='saving', message='Saving biomarkers...'
   l. Update document: status='completed', processed_at=now()
   m. Write update: phase='complete', message='Processing complete!'

3. Replace onProgress() calls with writeProcessingUpdate():
   ```typescript
   await writeProcessingUpdate(documentId, 'ocr', 'Extracting text...', {
     textLength: ocrResult.text.length,
     confidence: ocrResult.confidence
   })
   ```

4. Deno Adaptations:
   - File download: Use Supabase storage client for Deno
   - OCR: **ISSUE** - Tesseract.js doesn't work in Deno
     OPTIONS:
     a. Use external OCR API (OCR.space, Google Cloud Vision)
     b. Use pdf-parse for text PDFs (Deno-compatible)
     c. Skip OCR for MVP, extract from PDF text only
   - OpenAI: Use direct REST API fetch (no SDK):
     ```typescript
     const response = await fetch('https://api.openai.com/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ ... })
     })
     ```

5. Error handling:
   - Try/catch around each phase
   - On error: Write update with phase='error', update document status='failed'
   - Include error details in processing_errors array

6. Environment variables (use Deno.env.get):
   - OPENAI_API_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

CRITICAL DECISION - OCR IN DENO:
Since Tesseract.js doesn't work in Deno, choose ONE approach:
- **Option A**: Use OCR.space free API (5000 requests/month free)
- **Option B**: Extract text from PDF using pdf-parse equivalent for Deno
- **Option C**: Return to client with error if image file (require PDF only for now)

I RECOMMEND: Option A (OCR.space API) for maximum compatibility

REQUIREMENTS:
- Complete within 150 seconds (Supabase free tier limit)
- Write updates to database after each phase (for polling)
- Same AI reasoning quality as before
- Proper error handling
- Works with PDFs and images

FILES TO MODIFY:
- supabase/functions/process-document/index.ts (add processing logic)

DO NOT:
- Modify existing Netlify functions yet (Agent 4 does this)
- Change mobile/web apps yet (Agents 5-6 do this)
- Recreate database tables

OUTPUT:
- Working edge function that processes documents end-to-end
- Writes status updates to database
- Handles errors gracefully
- Test with: npx supabase functions deploy process-document
```

---

### **AGENT 4: Create Job Queue Trigger (Netlify → Supabase)**

**Goal**: Replace synchronous processing in Netlify with async job queuing

**Files to Modify:**
- `src/app/api/documents/[id]/process/route.ts` - SIMPLIFY (remove processing)
- CREATE: `src/app/api/documents/[id]/processing-status/route.ts` - NEW polling endpoint

**What to Keep:**
- Authentication logic
- Document validation
- Existing imports for Supabase client

**What to Remove:**
- `handleStreamingProcess()` function
- `extractBiomarkersFromDocument()` function
- `extractBiomarkersFromDocumentWithStreaming()` function
- Streaming-related code
- OCR/AI service imports (no longer needed in Netlify)

**Tasks:**
1. Simplify POST `/api/documents/[id]/process`:
   - Validate auth + document ownership
   - Update document status to "queued"
   - Trigger Supabase Edge Function via HTTP POST
   - Return 202 Accepted immediately
2. Create GET `/api/documents/[id]/processing-status`:
   - Fetch document status
   - Fetch latest updates from document_processing_updates
   - Return formatted response for polling
3. Update `maxDuration` to 10 (no longer needed since we just trigger)

**Prompt:**
```
I need to convert the Netlify document processing endpoint from synchronous processing to async job queuing.

CONTEXT:
- Current: Netlify function processes document with streaming (times out at 10s)
- New: Netlify function triggers Supabase Edge Function → returns immediately → client polls for status
- File: src/app/api/documents/[id]/process/route.ts

WHAT EXISTS (KEEP):
- Authentication helper: getAuthenticatedUser()
- Supabase client setup
- Document ownership validation
- src/app/api/documents/upload/route.ts (KEEP AS-IS - don't touch)

WHAT TO DELETE (from process/route.ts):
- handleStreamingProcess() function (lines 164-434)
- extractBiomarkersFromDocument() function (lines 437-539)
- extractBiomarkersFromDocumentWithStreaming() function (lines 542-707)
- All streaming logic
- Imports: ocrService, aiBiomarkerService, downloadFileFromStorage, validateFileForProcessing

TASKS:

**1. SIMPLIFY: src/app/api/documents/[id]/process/route.ts**

Replace POST handler with:
```typescript
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Get document ID
    const { id: documentId } = await params
    
    // 2. Authenticate user
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 3. Verify document ownership
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const userSupabase = createClient(supabaseUrl!, supabaseKey!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
    
    const { data: document, error: docError } = await userSupabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()
    
    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    // 4. Update status to queued
    await userSupabase
      .from('documents')
      .update({ 
        status: 'queued',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', documentId)
    
    // 5. Trigger Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    fetch(`${supabaseUrl}/functions/v1/process-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId, userId: user.id })
    }).catch(error => {
      console.error('Failed to trigger edge function:', error)
    })
    
    // 6. Return immediately (don't wait for processing)
    return NextResponse.json({
      success: true,
      message: 'Processing started',
      documentId,
      status: 'queued'
    }, { status: 202 })
    
  } catch (error) {
    console.error('Queue error:', error)
    return NextResponse.json({ error: 'Failed to queue processing' }, { status: 500 })
  }
}
```

**2. CREATE: src/app/api/documents/[id]/processing-status/route.ts**

New polling endpoint:
```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: documentId } = await params
    
    // Auth
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get document
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const userSupabase = createClient(...)
    
    const { data: document } = await userSupabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    // Get processing updates
    const { data: updates } = await userSupabase
      .from('document_processing_updates')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })
    
    // Calculate progress
    const latestUpdate = updates?.[updates.length - 1]
    const progress = calculateProgressFromPhase(latestUpdate?.phase)
    
    return NextResponse.json({
      status: document.status,
      progress,
      currentPhase: latestUpdate?.phase,
      currentMessage: latestUpdate?.message,
      updates: updates || [],
      document: {
        id: document.id,
        filename: document.filename,
        processed_at: document.processed_at
      }
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}

function calculateProgressFromPhase(phase?: string): number {
  const phaseProgress: Record<string, number> = {
    'queued': 5,
    'validation': 10,
    'download': 20,
    'ocr': 40,
    'ai_extraction': 70,
    'saving': 90,
    'complete': 100,
    'error': 0
  }
  return phaseProgress[phase || ''] || 0
}
```

**3. UPDATE: maxDuration**
```typescript
export const maxDuration = 10 // Just triggering, no longer needs 300s
```

REQUIREMENTS:
- Fast response (<1s) for both endpoints
- Proper auth checks
- Clean code (delete all old processing logic)
- Don't modify upload/route.ts

OUTPUT:
- Simplified process endpoint (triggers job, returns 202)
- New polling endpoint (returns status + updates)
- Clean codebase (no unused code)
```

---

### **AGENT 5: Update Mobile App to Poll for Status**

**Goal**: Replace streaming with polling in React Native mobile app

**Files to Modify:**
- `wuksy-mobile/src/lib/document-processing-service.ts`

**What to Keep:**
- Same function signature: `processDocument(documentId, token, onUpdate)`
- Same callback interface: `onUpdate(update: ProcessingUpdate)`
- All helper functions: `calculateProgress()`, `getPhaseDescription()`, etc.
- `wuksy-mobile/src/screens/UploadScreen.tsx` - NO CHANGES (UI stays same)

**Tasks:**
1. Replace XMLHttpRequest streaming with polling fetch
2. Poll `/api/documents/${documentId}/processing-status` every 2 seconds
3. Map polled response to existing `ProcessingUpdate` interface
4. Keep same onUpdate() callback behavior (UI doesn't change)
5. Add timeout after 3 minutes
6. Clean up polling interval properly

**Prompt:**
```
I need to update the mobile upload screen to use polling instead of streaming for document processing status.

CONTEXT:
- Current: Uses XMLHttpRequest streaming in document-processing-service.ts
- New: Poll /api/documents/[id]/processing-status every 2 seconds
- Must maintain same UI experience (no visible changes to user)
- File: wuksy-mobile/src/lib/document-processing-service.ts

WHAT EXISTS (KEEP):
- processDocument() function signature (DON'T CHANGE)
- onUpdate() callback interface (DON'T CHANGE)
- Helper functions: calculateProgress(), getPhaseDescription(), etc. (KEEP)
- UploadScreen.tsx UI rendering (NO CHANGES NEEDED)
- Types in src/types/index.ts (may need to verify ProcessingUpdate type matches)

CURRENT FUNCTION SIGNATURE (MUST KEEP):
```typescript
export async function processDocument(
  documentId: string,
  token: string,
  onUpdate: (update: ProcessingUpdate) => void
): Promise<void>
```

TASKS:

**1. Replace processDocument() implementation**

Change from XMLHttpRequest streaming to polling:

```typescript
export async function processDocument(
  documentId: string,
  token: string,
  onUpdate: (update: ProcessingUpdate) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('🚀 [MOBILE] Starting polling for document:', documentId)
    const startTime = Date.now()
    const maxDuration = 3 * 60 * 1000 // 3 minutes timeout
    let pollCount = 0
    
    const poll = async () => {
      try {
        pollCount++
        const elapsed = Date.now() - startTime
        
        // Timeout check
        if (elapsed > maxDuration) {
          clearInterval(intervalId)
          reject(new Error('Processing timeout (3 minutes)'))
          return
        }
        
        // Fetch status
        const response = await fetch(
          `${API_BASE_URL}/api/documents/${documentId}/processing-status`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log(`📊 [MOBILE] Poll #${pollCount}:`, data.status, data.currentPhase)
        
        // Map to ProcessingUpdate format (for existing UI)
        const update: ProcessingUpdate = {
          status: data.currentMessage || 'Processing...',
          details: {
            phase: data.currentPhase,
            thoughtProcess: data.updates?.find((u: any) => u.details?.thoughtProcess)?.details?.thoughtProcess,
            biomarkersFound: data.updates?.find((u: any) => u.details?.biomarkersFound)?.details?.biomarkersFound,
            confidence: data.updates?.find((u: any) => u.details?.confidence)?.details?.confidence,
          }
        }
        
        // Call existing callback (UI updates automatically)
        onUpdate(update)
        
        // Check if complete
        if (data.status === 'completed') {
          clearInterval(intervalId)
          console.log(`✅ [MOBILE] Processing complete after ${elapsed}ms`)
          resolve()
        } else if (data.status === 'failed') {
          clearInterval(intervalId)
          reject(new Error('Processing failed'))
        }
        
      } catch (error) {
        console.error('❌ [MOBILE] Poll error:', error)
        // Don't reject on single poll failure, retry
        if (pollCount > 5) {
          clearInterval(intervalId)
          reject(error)
        }
      }
    }
    
    // Initial poll
    poll()
    
    // Poll every 2 seconds
    const intervalId = setInterval(poll, 2000)
  })
}
```

**2. Keep existing helper functions** (NO CHANGES):
- calculateProgress()
- getPhaseDescription()
- parseThoughtProcess()
- hasThoughtProcess()
- etc.

**3. Verify ProcessingUpdate type** matches new response:
```typescript
export interface ProcessingUpdate {
  status: string
  details?: ProcessingDetails
}

export interface ProcessingDetails {
  phase?: string
  thoughtProcess?: string
  biomarkersFound?: number
  confidence?: number
  // ... other fields
}
```

REQUIREMENTS:
- Same function signature (UI code doesn't change)
- Poll every 2 seconds
- Timeout after 3 minutes
- Retry failed polls (up to 5 times)
- Clean up interval on complete/error/timeout
- Console logging for debugging
- Map response to existing ProcessingUpdate format

FILES TO MODIFY:
- wuksy-mobile/src/lib/document-processing-service.ts (ONLY THIS FILE)

FILES TO KEEP AS-IS:
- wuksy-mobile/src/screens/UploadScreen.tsx (NO CHANGES)
- wuksy-mobile/src/types/index.ts (verify types match)

OUTPUT:
- Working polling implementation
- Same UI behavior as before
- Test on mobile app (upload small PDF)
```

---

### **AGENT 6: Update Web App to Poll for Status**

**Goal**: Replace streaming with polling in Next.js web app

**Files to Modify:**
- `wuksy-platform/src/app/upload/page.tsx`

**What to Keep:**
- Same UI rendering (AI thought process, biomarkers display)
- Same file upload flow
- uploadFiles() function structure
- All UI components (Cards, progress bars, etc.)

**What to Remove:**
- processDocumentWithStreaming() function (lines 113-253)
- setTimeout navigation (lines 324-327)

**What to Add:**
- New polling-based processDocumentWithPolling() function
- "View Results" button (instead of auto-navigation)

**Prompt:**
```
I need to update the web upload page to use polling instead of streaming for document processing status.

CONTEXT:
- Current: Uses fetch() with ReadableStream in upload/page.tsx
- New: Poll /api/documents/[id]/processing-status every 2 seconds
- Must maintain same AI reasoning display experience
- File: wuksy-platform/src/app/upload/page.tsx

WHAT EXISTS (KEEP):
- UI components: Cards, progress bars, AI thought process display
- File upload logic: uploadFiles() function structure
- State management: files, isUploading, expandedReasoning
- All styling and animations
- Helper functions: parseReasoningText(), toggleReasoning(), getStatusIcon()

WHAT TO DELETE:
- processDocumentWithStreaming() function (lines 113-253)
- Auto-navigation setTimeout (lines 324-327):
```typescript
// DELETE THIS
setTimeout(() => {
  router.push('/documents')
}, 2000)
```

TASKS:

**1. Replace processDocumentWithStreaming() with polling version**

```typescript
const processDocumentWithPolling = async (documentId: string, fileId: string, token: string | undefined) => {
  if (!token) throw new Error('No authentication token available')

  console.log('🚀 Starting polling for document:', documentId)
  const startTime = Date.now()
  const maxDuration = 3 * 60 * 1000 // 3 minutes
  let pollCount = 0

  return new Promise<void>((resolve, reject) => {
    const poll = async () => {
      try {
        pollCount++
        const elapsed = Date.now() - startTime

        // Timeout
        if (elapsed > maxDuration) {
          clearInterval(intervalId)
          reject(new Error('Processing timeout (3 minutes)'))
          return
        }

        // Fetch status
        const response = await fetch(`/api/documents/${documentId}/processing-status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.statusText}`)
        }

        const data = await response.json()
        console.log(`📊 Poll #${pollCount}:`, data.status, data.currentPhase)

        // Calculate progress
        let progressPercentage = data.progress || 0

        // Update file state (same format as before for UI compatibility)
        setFiles(prev => prev.map(f =>
          f.id === fileId
            ? {
                ...f,
                progress: progressPercentage,
                processingStatus: data.currentMessage || 'Processing...',
                processingDetails: {
                  phase: data.currentPhase,
                  thoughtProcess: data.updates?.find((u: any) => u.details?.thoughtProcess)?.details?.thoughtProcess,
                  biomarkersFound: data.updates?.find((u: any) => u.details?.biomarkersFound)?.details?.biomarkersFound,
                  confidence: data.updates?.find((u: any) => u.details?.confidence)?.details?.confidence
                },
                status: data.status === 'completed' ? 'success' as const : 'processing' as const,
                aiMetrics: data.currentPhase ? {
                  phase: data.currentPhase,
                  reasoningTokens: 0,
                  generatedTokens: 0,
                  thoughtProcess: data.updates?.find((u: any) => u.details?.thoughtProcess)?.details?.thoughtProcess,
                  biomarkersFound: data.updates?.find((u: any) => u.details?.biomarkersFound)?.details?.biomarkersFound,
                  confidence: data.updates?.find((u: any) => u.details?.confidence)?.details?.confidence
                } : f.aiMetrics
              }
            : f
        ))

        // Check completion
        if (data.status === 'completed') {
          clearInterval(intervalId)
          console.log(`✅ Processing complete after ${elapsed}ms`)
          resolve()
        } else if (data.status === 'failed') {
          clearInterval(intervalId)
          reject(new Error('Processing failed'))
        }

      } catch (error) {
        console.error('Poll error:', error)
        if (pollCount > 5) {
          clearInterval(intervalId)
          reject(error)
        }
      }
    }

    // Initial poll
    poll()

    // Poll every 2 seconds
    const intervalId = setInterval(poll, 2000)
  })
}
```

**2. Update uploadFiles() function**

Replace line 308:
```typescript
// OLD
await processDocumentWithStreaming(uploadResult.document.id, fileObj.id, session?.access_token)

// NEW
await processDocumentWithPolling(uploadResult.document.id, fileObj.id, session?.access_token)
```

Delete lines 324-327 (auto-navigation):
```typescript
// DELETE THESE LINES
setTimeout(() => {
  router.push('/documents')
}, 2000)
```

**3. Update UI to show "View Results" button** (only show when all files complete)

The existing code already has this button (lines 497-505), so just verify it's visible when allComplete is true.

**4. Add cleanup on component unmount**

Add useEffect for cleanup:
```typescript
useEffect(() => {
  return () => {
    // Cleanup any ongoing polls when component unmounts
    // (polling intervals are already cleaned up in the promise)
  }
}, [])
```

REQUIREMENTS:
- Same UI appearance (users don't notice the change)
- Poll every 2 seconds
- Timeout after 3 minutes
- Show all AI reasoning updates
- No auto-navigation (user clicks "View Results")
- Proper cleanup

FILES TO MODIFY:
- wuksy-platform/src/app/upload/page.tsx (ONLY THIS FILE)

OUTPUT:
- Working polling implementation
- Same beautiful UI
- User can see processing continue even if they navigate away and come back
- Test with small and large PDFs
```

---

### **AGENT 7: Testing & Cleanup**

**Goal**: Test end-to-end flow and clean up old code

**Tasks:**
1. Test upload flow on mobile and web
2. Test with small, medium, and large files
3. Verify AI responses display correctly
4. Clean up unused code
5. Update documentation

**Prompt:**
```
I need to test the new background processing system and clean up any remaining old code.

CONTEXT:
- Migrated from Netlify streaming (10s timeout) to Supabase Edge Functions (150s timeout)
- Both mobile and web apps now use polling
- Need to verify everything works end-to-end

TESTING TASKS:

**1. Test Upload Flow**

Test on Mobile (wuksy-mobile):
- [ ] Small PDF (< 1 MB) - should complete in < 10s
- [ ] Medium PDF (2-5 MB) - should complete in 10-30s
- [ ] Large PDF (5-10 MB) - should complete in 30-60s
- [ ] Image file (JPG) - test OCR
- [ ] Invalid file - test error handling

Test on Web (wuksy-platform):
- [ ] Same file sizes as mobile
- [ ] Multiple files uploaded at once
- [ ] Navigate away during processing, come back (check status persists)

**2. Verify AI Responses**

Check that polling displays:
- [ ] AI thought process / reasoning appears
- [ ] Biomarkers found count shows
- [ ] Confidence percentage displays
- [ ] Progress bar updates smoothly
- [ ] Phase descriptions are correct

**3. Test Edge Cases**

- [ ] Upload fails (network error)
- [ ] Processing timeout (3 minute limit)
- [ ] Duplicate file upload
- [ ] User logs out during processing
- [ ] Multiple documents processing simultaneously

**4. Check Performance**

- [ ] Polling doesn't cause excessive database queries
- [ ] No memory leaks (intervals cleaned up)
- [ ] No console errors
- [ ] Supabase Edge Function doesn't timeout

CLEANUP TASKS:

**1. Remove unused imports**

In wuksy-platform/src/app/api/documents/[id]/process/route.ts:
- [ ] Remove: import { ocrService }
- [ ] Remove: import { aiBiomarkerService }
- [ ] Remove: import { downloadFileFromStorage, validateFileForProcessing }

**2. Update maxDuration**
- [ ] Verify it's set to 10 (not 300) in process/route.ts

**3. Remove debug console.log**
- [ ] Review all files for excessive logging
- [ ] Keep important logs, remove verbose development logs

**4. Verify no streaming code remains**
- [ ] Search for: "XMLHttpRequest" (should only be in document-processing-service.ts polling version)
- [ ] Search for: "ReadableStream" (should be gone from upload/page.tsx)
- [ ] Search for: "handleStreamingProcess" (should be deleted)

**5. Check environment variables**

Netlify (already set):
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] OPENAI_API_KEY

Supabase Edge Function secrets:
```bash
npx supabase secrets list
```
Should show:
- [ ] OPENAI_API_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY

**6. Update netlify.toml**

Since we're no longer streaming, the streaming headers can be simplified (but keep them for other endpoints):
- [ ] Verify netlify.toml still exists
- [ ] Confirm it doesn't break other endpoints

DOCUMENTATION TASKS:

**1. Create test results document**

Create: BACKGROUND_PROCESSING_TEST_RESULTS.md

Include:
- Test date
- Mobile app test results (pass/fail for each scenario)
- Web app test results
- Edge function performance metrics
- Any issues found
- Recommended improvements

**2. Update README (if needed)**

Add note about:
- Background processing architecture
- Supabase Edge Functions usage
- How to deploy edge functions

VERIFICATION CHECKLIST:

- [ ] ✅ Upload works on mobile app
- [ ] ✅ Upload works on web app
- [ ] ✅ AI reasoning appears in real-time (via polling)
- [ ] ✅ Large files complete successfully (no 10s timeout)
- [ ] ✅ Error states handled properly
- [ ] ✅ No console errors
- [ ] ✅ Documents page shows correct status
- [ ] ✅ Can navigate away and come back (polling resumes or shows final status)
- [ ] ✅ Multiple documents can process simultaneously
- [ ] ✅ No memory leaks (polling cleaned up)

OUTPUT:
- Test results document
- Clean codebase (no unused code)
- Verified working system
- List of any remaining issues or improvements needed
```

---

## 📊 **EXECUTION ORDER**

**STRICT ORDER** (dependencies between agents):

1. **AGENT 1** → Setup Supabase Edge Function infrastructure ⏱️ 30 min
2. **AGENT 2** → Create database tables ⏱️ 20 min
3. **AGENT 3** → Migrate processing logic to Edge Function ⏱️ 60 min (MOST COMPLEX)
4. **AGENT 4** → Update Netlify endpoints (trigger + polling) ⏱️ 30 min
5. **AGENT 5** → Update mobile app polling ⏱️ 20 min
6. **AGENT 6** → Update web app polling ⏱️ 20 min
7. **AGENT 7** → Test & cleanup ⏱️ 30 min

**Total Estimated Time: ~3.5 hours**

---

## 🚀 **DEPLOYMENT CHECKLIST**

After all agents complete:

### **1. Deploy Supabase Edge Function**
```bash
cd wuksy-platform
npx supabase functions deploy process-document
```

### **2. Set Supabase Secrets**
```bash
npx supabase secrets set OPENAI_API_KEY=your_key_here
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

### **3. Run Database Migration**
```bash
npx supabase db push
```

### **4. Deploy to Netlify** (automatic via Git)
```bash
git add .
git commit -m "Migrate to Supabase Edge Functions for background processing"
git push origin main
```

### **5. Test Production**
- Upload small file on mobile
- Upload small file on web
- Upload large file (> 10s processing time)
- Verify AI responses appear
- Check Supabase Edge Function logs

---

## ✅ **SUCCESS CRITERIA**

After implementation:
- ✅ Large files (>10s processing) complete successfully
- ✅ AI responses visible in real-time via polling
- ✅ No timeouts on Netlify free tier
- ✅ Works on both mobile and web apps
- ✅ Shared backend architecture (Supabase Edge Functions)
- ✅ Clean codebase (no unused streaming code)
- ✅ 150-second timeout (15x improvement over Netlify)

---

## 🔧 **TROUBLESHOOTING GUIDE**

### **Issue: Edge Function times out (150s)**
**Solution**: For extremely large files (10+ MB), consider:
- Implementing chunked processing
- Adding file size limits (10 MB max)
- Using external OCR service with better performance

### **Issue: Polling causes too many database queries**
**Solution**: 
- Increase polling interval to 3 seconds (from 2)
- Add caching layer
- Use database indexes (already created in Agent 2)

### **Issue: OCR doesn't work in Deno**
**Solution**: 
- Use OCR.space API (free tier: 5000/month)
- Or use Google Cloud Vision API
- Or PDF text extraction only (no images)

---

## 📚 **ADDITIONAL NOTES**

### **Why Supabase Edge Functions?**
- ✅ Free tier: 150-second timeout (vs Netlify 10s)
- ✅ Already using Supabase (no new service)
- ✅ Deno runtime (modern, secure)
- ✅ Direct database access (fast)
- ✅ Built-in monitoring

### **Why Polling over Streaming?**
- ✅ Works with serverless timeouts
- ✅ Resilient to disconnections
- ✅ User can navigate away and come back
- ✅ Simpler error handling
- ✅ Same UX when done right (2s polling feels real-time)

### **Future Improvements**
- WebSockets for true real-time (Supabase Realtime)
- Background job queue (Bull, BeeQueue)
- Progress notifications (push notifications)
- Batch processing for multiple files

---

## 🎯 **READY TO START?**

All agents have clear prompts with:
- ✅ What exists (don't recreate)
- ✅ What to modify
- ✅ What to delete
- ✅ Exact file paths
- ✅ Code examples
- ✅ Requirements
- ✅ Testing criteria

**Execute agents in order 1-7 for clean, working implementation.**

