# UI Integration Guide

## Overview

The frontend is now fully bound to the FastAPI backend with the following workflow:

1. **Upload** → `/api/v1/process` → **Preview**
2. **Preview** → **Approve Matches** → `/api/v1/reconcile`
3. **Results** → `/api/v1/export` → **Download Excel**

## Architecture

### API Client (`src/react-app/lib/api.ts`)
Handles all HTTP communication with the backend:
- `processFiles()` - Upload two files and get initial processing results
- `reconcileMatches()` - Submit approved matches and get final reconciliation
- `exportToExcel()` - Download Excel export

### State Management (`src/react-app/lib/workflowContext.tsx`)
Global context using React hooks:
- `currentFile` / `previousFile` - File uploads
- `processData` - Raw parsing results
- `approvedMatches` - User-selected matches
- `reconcileData` - Final reconciliation results
- Error states for each step

## Pages

### 1. Upload Page (`/`)
- Drag & drop for both files (Current Year + Previous Year)
- File validation (format, size ≤ 100MB)
- Calls `POST /api/v1/process` when both files uploaded
- Shows error messages on failure

### 2. Data Preview Page (`/preview`)
- Display parsed rows from both sheets
- Show exact matches, suggested matches, unmatched rows
- Show validation issues with formula mismatches
- Summary statistics

### 3. Corrections Page (`/corrections`)
- List all available matches (exact + suggested)
- User can "Approve" individual matches
- "Approve All" button for convenience
- Approved matches shown in review section
- Calls `POST /api/v1/reconcile` when user confirms
- Shows WIP/FAR impacts from calculations

### 4. Results Page (`/results`)
- Summary statistics (matched count, impacts, unmatched)
- Detailed table of final matched results
- Unmatched rows breakdown
- **Download Excel** button calls `POST /api/v1/export`
- "Start New" button resets workflow

## Environment Configuration

### API URL
Set in `.env.local`:
```
VITE_API_URL=http://localhost:8000
```

For production, update to your deployed backend URL.

## Running the UI

```bash
cd ProjectMatchingUi
npm install
npm run dev    # Development server (http://localhost:5173)
npm run build  # Production build
```

## Data Flow

### Step 1: Process Files
**Request:**
```typescript
Form multipart/form-data:
- current_year: File
- previous_year: File
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_year_rows": [...],
    "previous_year_rows": [...],
    "exact_matches": [...],
    "suggested_matches": [...],
    "unmatched_current": [...],
    "unmatched_previous": [...],
    "validation_issues": [...],
    "summary": {...}
  }
}
```

### Step 2: Reconcile Matches
**Request:**
```json
{
  "approved_matches": [
    {
      "current_row_number": 2,
      "previous_row_number": 3,
      "project_name": "Project A",
      "current_values": {...},
      "previous_values": {...}
    }
  ],
  "current_year_rows": [...],
  "previous_year_rows": [...]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "final_matches": [...],
    "unmatched_current": [...],
    "unmatched_previous": [...],
    "summary": {
      "total_wip_impact": 12345.50,
      "total_far_impact": -6789.75,
      "matched_count": 1450,
      "unmatched_current_count": 30,
      "unmatched_previous_count": 25
    }
  }
}
```

### Step 3: Export to Excel
**Request:**
```json
{
  "reconciled_matches": [...],
  "unmatched_current_rows": [...],
  "unmatched_previous_rows": [...],
  "validation_issues": [...],
  "summary": {...}
}
```

**Response:**
Binary Excel file (.xlsx)

## Features Implemented

✅ Two-file upload (drag & drop or click)
✅ File size validation (100 MB limit)
✅ File format validation (.xls, .xlsx, .xlsm)
✅ Real-time processing status
✅ Exact match display with counts
✅ Fuzzy match display with confidence %
✅ Match approval workflow
✅ WIP/FAR impact calculation display
✅ Excel export with project data
✅ Error handling and display
✅ Progress indicators
✅ Responsive design
✅ State persistence across pages

## Troubleshooting

### "Network error"
Check that the backend is running:
```bash
cd ProjectMatchingService
python -m uvicorn app.main:app --reload
```

### "Network error" on MacOS/Linux
Ensure backend is accessible:
```bash
# Update .env.local to match your setup
VITE_API_URL=http://127.0.0.1:8000
```

### Files not uploading
- Check file size (max 100 MB)
- Check file format (.xlsx, .xlsm, .xls only)
- Check browser console for CORS errors

### Matches not appearing
- Verify both sheets were parsed correctly in Preview page
- Check for validation issues reported
- Ensure project names are not empty

## Testing the Full Workflow

1. **Start backend:**
```bash
cd ProjectMatchingService
python -m uvicorn app.main:app --reload
```

2. **Start frontend:**
```bash
cd ProjectMatchingUi
npm run dev
```

3. **Upload test files:**
   - Use `current_100_rows.xlsx` as Current Year
   - Use `Book1.xlsx` as Previous Year

4. **Follow the workflow:**
   - Upload → Preview → Approve → Results → Download

## API Integration Checklist

- [x] processFiles() bound to `POST /api/v1/process`
- [x] reconcileMatches() bound to `POST /api/v1/reconcile`
- [x] exportToExcel() bound to `POST /api/v1/export`
- [x] Error handling with user-friendly messages
- [x] Loading states and progress indicators
- [x] State management across pages
- [x] File upload validation
- [x] Response data parsing
- [x] Blob download handling
- [x] Environment configuration

## Next Steps

1. **Deploy frontend** to production environment
2. **Update `VITE_API_URL`** in production `.env`
3. **Test with real data** from your system
4. **Monitor logs** for any API errors
5. **Optimize performance** if needed (e.g., pagination for large datasets)

## Support

For issues with the backend APIs, refer to:
- `API_WORKFLOW.md` - Complete API documentation
- `RECONCILE_TESTING_GUIDE.md` - Reconcile endpoint testing
- `README.md` - Backend architecture overview
