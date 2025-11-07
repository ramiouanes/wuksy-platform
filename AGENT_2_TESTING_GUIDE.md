# AGENT 2 - Testing Guide
## How to Test the Database Migration

**Date**: November 7, 2025  
**Migration File**: `supabase/migrations/20251107_add_processing_status_tracking.sql`

---

## 🧪 Quick Test Commands

### 1. Apply the Migration

```bash
cd wuksy-platform
npx supabase db push
```

**Expected Output**:
```
Applying migration 20251107_add_processing_status_tracking.sql...
✓ Migration applied successfully
```

---

## 2. Verify Database Changes

Run these SQL queries in Supabase SQL Editor or via `npx supabase db sql`:

### ✅ Check New Table Exists
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'document_processing_updates';
```

**Expected**: 1 row with `document_processing_updates` table

---

### ✅ Check Table Schema
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'document_processing_updates'
ORDER BY ordinal_position;
```

**Expected Columns**:
1. `id` - uuid
2. `document_id` - uuid
3. `created_at` - timestamp with time zone
4. `phase` - text
5. `message` - text
6. `details` - jsonb

---

### ✅ Check New Columns in Documents Table
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
  AND column_name IN ('processing_started_at', 'processing_completed_at', 'last_update_at');
```

**Expected**: 3 rows with the new timestamp columns

---

### ✅ Check Indexes
```sql
SELECT 
  tablename,
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename IN ('document_processing_updates', 'documents')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Expected Indexes**:
- `idx_processing_updates_document_id` on `document_processing_updates`
- `idx_documents_last_update` on `documents`
- `idx_documents_status` on `documents`

---

### ✅ Check RLS Policies
```sql
SELECT 
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'document_processing_updates'
ORDER BY policyname;
```

**Expected Policies**:
1. `Service role can delete processing updates` (DELETE)
2. `Service role can insert processing updates` (INSERT)
3. `Service role can update processing updates` (UPDATE)
4. `Users can view own document processing updates` (SELECT)

---

### ✅ Check Trigger Exists
```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_document_last_update';
```

**Expected**: 1 row showing the trigger on `document_processing_updates`

---

### ✅ Check Trigger Function Exists
```sql
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'update_document_last_update_timestamp';
```

**Expected**: 1 row showing the function

---

## 3. Test Data Operations

### ✅ Test Insert (As Service Role)
```sql
-- Note: This should be run with service role credentials
-- In production, the Edge Function will do this

INSERT INTO document_processing_updates (
  document_id,
  phase,
  message,
  details
) VALUES (
  (SELECT id FROM documents LIMIT 1),  -- Use existing document
  'queued',
  'Document queued for processing',
  '{"timestamp": "2025-11-07T12:00:00Z"}'::jsonb
)
RETURNING *;
```

**Expected**: 
- 1 row inserted successfully
- `id` and `created_at` auto-generated
- Parent document's `last_update_at` automatically updated (via trigger)

---

### ✅ Test Trigger Functionality
```sql
-- Check if trigger updated parent document
SELECT 
  d.id,
  d.filename,
  d.last_update_at,
  dpu.created_at as update_created_at
FROM documents d
LEFT JOIN document_processing_updates dpu ON dpu.document_id = d.id
WHERE dpu.id IS NOT NULL
ORDER BY dpu.created_at DESC
LIMIT 5;
```

**Expected**: `last_update_at` matches the most recent `created_at` from updates

---

### ✅ Test RLS (As Regular User)
```sql
-- This query should only return updates for documents owned by the current user
SELECT 
  dpu.*,
  d.filename,
  d.user_id
FROM document_processing_updates dpu
JOIN documents d ON d.id = dpu.document_id
WHERE d.user_id = auth.uid();
```

**Expected**: Only updates for current user's documents (RLS enforced)

---

### ✅ Test Phase Constraint
```sql
-- This should FAIL due to CHECK constraint
INSERT INTO document_processing_updates (
  document_id,
  phase,
  message
) VALUES (
  (SELECT id FROM documents LIMIT 1),
  'invalid_phase',  -- Invalid phase
  'This should fail'
);
```

**Expected Error**: 
```
ERROR: new row for relation "document_processing_updates" violates check constraint
```

Valid phases only: `queued`, `validation`, `download`, `ocr`, `ai_extraction`, `saving`, `complete`, `error`

---

## 4. Performance Testing

### ✅ Test Index Usage
```sql
-- This query should use the index (check EXPLAIN ANALYZE output)
EXPLAIN ANALYZE
SELECT *
FROM document_processing_updates
WHERE document_id = (SELECT id FROM documents LIMIT 1)
ORDER BY created_at DESC;
```

**Expected**: 
- Query plan shows `Index Scan using idx_processing_updates_document_id`
- Fast execution time (< 5ms for small datasets)

---

### ✅ Test Polling Query Performance
```sql
-- Simulate the polling query that mobile/web apps will use
EXPLAIN ANALYZE
SELECT 
  d.id,
  d.status,
  d.filename,
  d.last_update_at,
  (
    SELECT json_agg(
      json_build_object(
        'phase', phase,
        'message', message,
        'details', details,
        'created_at', created_at
      ) ORDER BY created_at ASC
    )
    FROM document_processing_updates
    WHERE document_id = d.id
  ) as updates
FROM documents d
WHERE d.id = (SELECT id FROM documents LIMIT 1);
```

**Expected**: 
- Uses indexes efficiently
- Returns document info + all updates in single query
- Fast execution (< 10ms)

---

## 5. Rollback Testing (Optional)

If you need to rollback the migration:

### ⚠️ Rollback Steps
```sql
-- Run the DOWN migration (uncomment lines in migration file)

-- 1. Drop trigger and function
DROP TRIGGER IF EXISTS trigger_update_document_last_update ON document_processing_updates;
DROP FUNCTION IF EXISTS update_document_last_update_timestamp();

-- 2. Drop RLS policies
DROP POLICY IF EXISTS "Users can view own document processing updates" ON document_processing_updates;
DROP POLICY IF EXISTS "Service role can insert processing updates" ON document_processing_updates;
DROP POLICY IF EXISTS "Service role can update processing updates" ON document_processing_updates;
DROP POLICY IF EXISTS "Service role can delete processing updates" ON document_processing_updates;

-- 3. Drop indexes
DROP INDEX IF EXISTS idx_processing_updates_document_id;
DROP INDEX IF EXISTS idx_documents_last_update;
DROP INDEX IF EXISTS idx_documents_status;

-- 4. Drop table
DROP TABLE IF EXISTS document_processing_updates;

-- 5. Remove columns from documents table
ALTER TABLE documents DROP COLUMN IF EXISTS processing_started_at;
ALTER TABLE documents DROP COLUMN IF EXISTS processing_completed_at;
ALTER TABLE documents DROP COLUMN IF EXISTS last_update_at;
```

---

## 6. Integration Test Checklist

Once AGENT 3 completes the Edge Function:

- [ ] Edge Function can insert processing updates
- [ ] Trigger automatically updates `documents.last_update_at`
- [ ] RLS allows users to see only their updates
- [ ] Polling queries are fast (< 50ms)
- [ ] Multiple updates for same document work correctly
- [ ] Foreign key prevents orphaned updates
- [ ] CASCADE delete removes updates when document deleted

---

## 🎯 Success Criteria

✅ **All tables and columns created**  
✅ **All indexes created and used by queries**  
✅ **All RLS policies active and enforcing security**  
✅ **Trigger updates parent document automatically**  
✅ **CHECK constraint enforces valid phases**  
✅ **Foreign key prevents data inconsistency**  
✅ **Queries perform efficiently**  
✅ **No errors during migration**

---

## 🚨 Troubleshooting

### Issue: Migration fails with "table already exists"
**Solution**: Migration is idempotent (uses `IF NOT EXISTS`). Re-run is safe.

### Issue: RLS policies not working
**Solution**: Check that RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'document_processing_updates';
```

### Issue: Trigger not firing
**Solution**: Verify trigger exists and function is correct:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_document_last_update';
```

### Issue: Foreign key constraint fails
**Solution**: Ensure `documents` table exists and has proper structure:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' AND column_name = 'id';
```

---

## 📞 Need Help?

If you encounter issues:

1. Check Supabase dashboard → Database → Logs
2. Run verification queries above
3. Check migration file syntax
4. Verify Supabase CLI version: `npx supabase --version`

---

## ✅ Ready for AGENT 3

Once all tests pass, AGENT 3 can proceed with implementing the Supabase Edge Function that will:
- Write to `document_processing_updates` table
- Update `documents` table status and timestamps
- Use the indexes for efficient queries

---

**Testing Time**: ~5 minutes  
**Critical Tests**: 5  
**Optional Tests**: 3

