# WUKSY Admin Console

## Overview

A comprehensive admin dashboard for managing all aspects of the WUKSY application. The admin console provides a centralized interface for viewing and managing users, subscribers, documents, health analyses, biomarkers, and more.

## Features

### 🔐 Authentication
- Secure password-based authentication
- Cookie-based session management
- Protected routes via middleware
- Auto-redirect for unauthenticated users

### 📊 Dashboard Overview
- Real-time statistics for all major data types
- Total counts for:
  - Registered Users
  - Email Subscribers
  - Documents
  - Health Analyses
  - Biomarkers
  - Biomarker Readings
- Quick action buttons

### 👥 User Management
- View all registered users
- Search by name or email
- View user consent status (data & research)
- See demographic profiles
- Track last login times
- Delete users (with confirmation)
- Export user data to CSV
- Pagination support

### 📧 Email Subscriber Management
- View all email subscriptions from the coming-soon page
- Filter by status (pending, confirmed, unsubscribed)
- Search by email address
- View subscription metadata (IP, user agent, timestamp)
- Update subscriber status
- Delete subscribers
- Export to CSV
- Pagination support

### 📄 Document Management
- View all uploaded documents
- Filter by status (uploading, processing, completed, failed)
- See file sizes and upload dates
- View associated user information
- Delete documents
- Track processing status
- Pagination support

### 🔬 Health Analyses Management
- View all AI-generated health analyses
- See health scores and categories
- View associated users and documents
- Track creation dates
- Delete analyses
- Pagination support

### 🧬 Biomarker Database
- Browse all biomarkers in the system
- Search by biomarker name
- Filter by category
- View biomarker units and status
- See biomarker metadata
- Pagination support

## Access

### Admin Login
- **URL**: `/admin/login`
- **Default Password**: Set via `ADMIN_PASSWORD` environment variable
  - Default: `wuksy-admin-2024` (change this in production!)

### Admin Dashboard
- **URL**: `/admin`
- Accessible only after authentication

## API Endpoints

All admin API endpoints are protected and require authentication:

### Stats & Overview
- `GET /api/admin/stats` - Get dashboard statistics

### User Management
- `GET /api/admin/users?page=1&limit=50&search=` - List users
- `DELETE /api/admin/users` - Delete a user

### Subscriber Management
- `GET /api/admin/subscribers?page=1&limit=50&search=&status=` - List subscribers
- `DELETE /api/admin/subscribers` - Delete a subscriber
- `PATCH /api/admin/subscribers` - Update subscriber status

### Document Management
- `GET /api/admin/documents?page=1&limit=50&status=` - List documents
- `DELETE /api/admin/documents` - Delete a document

### Analysis Management
- `GET /api/admin/analyses?page=1&limit=50` - List health analyses
- `DELETE /api/admin/analyses` - Delete an analysis

### Biomarker Management
- `GET /api/admin/biomarkers?page=1&limit=50&search=&category=` - List biomarkers

### Data Export
- `GET /api/admin/export?type=subscribers` - Export subscribers to CSV
- `GET /api/admin/export?type=users` - Export users to CSV

## Security

### Middleware Protection
- All admin routes are protected by middleware
- Non-authenticated requests are redirected to `/admin/login`
- API calls return 401 Unauthorized without authentication
- Session cookies are HTTP-only and secure in production

### Public Routes
The following routes are publicly accessible:
- `/` - Root (redirects to coming-soon)
- `/coming-soon` - Landing page
- `/admin/login` - Admin login page
- `/api/subscribe` - Email subscription endpoint
- `/api/admin/login` - Login endpoint
- `/api/admin/logout` - Logout endpoint
- `/api/admin/check` - Auth check endpoint

### Protected Routes
All other routes require admin authentication:
- `/admin` - Admin dashboard
- `/app/*` - Application routes
- All other API routes

## Usage

### 1. Login
1. Navigate to `/admin/login`
2. Enter the admin password
3. Click "Access Platform"
4. You'll be redirected to the admin dashboard

### 2. Navigate Tabs
Use the tab navigation to switch between different sections:
- Overview - Dashboard with statistics
- Subscribers - Email subscriptions management
- Users - Registered users management
- Documents - Uploaded documents management
- Analyses - Health analyses management
- Biomarkers - Biomarker database

### 3. Search & Filter
- Use the search bar to find specific items
- Apply filters (status, category) to narrow results
- Results update automatically

### 4. Pagination
- Navigate through pages using Previous/Next buttons
- See total count and current page
- 50 items per page by default

### 5. Actions
- **Refresh** - Reload current data
- **Export** - Download data as CSV
- **Delete** - Remove items (with confirmation)

### 6. Logout
- Click the "Logout" button in the header
- You'll be redirected to the coming-soon page

## Environment Variables

```bash
# Admin password (CHANGE THIS IN PRODUCTION!)
ADMIN_PASSWORD=your_secure_password_here

# Supabase credentials (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## File Structure

```
mvp-2/project/src/
├── app/
│   ├── admin/
│   │   ├── page.tsx              # Main admin dashboard
│   │   ├── layout.tsx            # Admin layout
│   │   └── login/
│   │       └── page.tsx          # Admin login page
│   └── api/
│       └── admin/
│           ├── stats/route.ts     # Stats endpoint
│           ├── users/route.ts     # Users endpoint
│           ├── subscribers/route.ts # Subscribers endpoint
│           ├── documents/route.ts  # Documents endpoint
│           ├── analyses/route.ts   # Analyses endpoint
│           ├── biomarkers/route.ts # Biomarkers endpoint
│           ├── export/route.ts     # Export endpoint
│           ├── login/route.ts      # Login endpoint
│           ├── logout/route.ts     # Logout endpoint
│           └── check/route.ts      # Auth check endpoint
└── middleware.ts                   # Route protection
```

## Future Enhancements

Potential features to add:
- [ ] Bulk operations (delete multiple items)
- [ ] Advanced filtering options
- [ ] Real-time updates with WebSockets
- [ ] User impersonation for debugging
- [ ] Detailed analytics and charts
- [ ] Email notification system
- [ ] Activity logs and audit trail
- [ ] Role-based access control (multiple admin levels)
- [ ] Biomarker editing capabilities
- [ ] Document preview/viewer
- [ ] Analysis detail view
- [ ] User profile editing
- [ ] Backup and restore functionality

## Support

For issues or questions about the admin console, please refer to the main project documentation or contact the development team.

## Security Notes

⚠️ **IMPORTANT**: 
- Change the default admin password immediately in production
- Use a strong, unique password
- Store the password securely (e.g., environment variables)
- Never commit passwords to version control
- Consider implementing 2FA for production environments
- Regularly review access logs
- Keep the admin console URL private

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Maintained By**: WUKSY Development Team

