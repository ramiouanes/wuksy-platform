# Admin Console - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Set Your Admin Password
Create or update your `.env.local` file in the project root:

```bash
# Add this line with your secure password
ADMIN_PASSWORD=your_secure_password_here
```

**Default Password**: `wuksy-admin-2024` (if not set)  
⚠️ **IMPORTANT**: Change this before deploying to production!

### Step 2: Start Your Development Server
```bash
npm run dev
```

### Step 3: Access the Admin Console
1. Open your browser and go to: `http://localhost:3000/admin/login`
2. Enter your admin password
3. Click "Access Platform"
4. You're in! 🎉

## 📋 What You Can Do

### Overview Tab
- See total counts for all your data
- Quick stats at a glance
- Real-time numbers

### Subscribers Tab
- View all email signups from your coming-soon page
- Search by email
- Filter by status (pending/confirmed/unsubscribed)
- Export to CSV
- Delete subscribers

### Users Tab
- Manage registered users
- Search by name or email
- See consent status
- View login history
- Export user data

### Documents Tab
- View all uploaded health documents
- Filter by processing status
- Track file sizes
- Delete documents

### Analyses Tab
- See all AI health analyses
- View health scores
- Check analysis categories
- Track when analyses were created

### Biomarkers Tab
- Browse your biomarker database
- Search by name
- Filter by category
- See all biomarker details

## 🔒 Security Features

✅ Password-protected access  
✅ Secure session management  
✅ HTTP-only cookies  
✅ Middleware protection on all routes  
✅ Auto-redirect for unauthorized access  

## 📱 Quick Actions

### Export Data
Click the "Export CSV" button on any tab to download data:
- Subscribers list with emails and metadata
- Users list with consent information
- Perfect for email campaigns or backups

### Delete Items
- Click the trash icon on any row
- Confirm the deletion
- Item is permanently removed

### Search & Filter
- Type in the search box for instant results
- Use filters to narrow down data
- Results update automatically

### Refresh Data
- Click the "Refresh" button to reload
- Gets the latest data from the database
- No need to reload the page

## 🎯 Common Tasks

### Export All Email Subscribers
1. Click on "Subscribers" tab
2. Click "Export CSV" button
3. CSV file downloads automatically
4. Use for email marketing campaigns

### Find a Specific User
1. Go to "Users" tab
2. Type name or email in search box
3. Results filter automatically

### Check Latest Signups
1. Go to "Subscribers" tab
2. Data is sorted by newest first
3. See recent signups at the top

### Monitor Document Processing
1. Go to "Documents" tab
2. Filter by "processing" or "failed"
3. Track upload status

## 🛠️ Troubleshooting

### Can't Login?
- Check your password is correct
- Verify `ADMIN_PASSWORD` in `.env.local`
- Restart your dev server after changing env vars

### No Data Showing?
- Make sure your Supabase connection is working
- Check Supabase credentials in `.env.local`
- Verify database tables exist

### Export Not Working?
- Check browser console for errors
- Ensure you have data to export
- Try refreshing the page

## 📝 Tips & Tricks

💡 **Use Search**: Instead of scrolling through pages, use the search bar  
💡 **Filter First**: Apply filters before exporting to get specific data  
💡 **Regular Exports**: Export subscriber lists regularly for backups  
💡 **Monitor Stats**: Check the Overview tab daily to track growth  
💡 **Secure Password**: Use a password manager for your admin password  

## 🔐 Production Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Use a strong, unique password (16+ characters)
- [ ] Store password in environment variables
- [ ] Never commit password to git
- [ ] Test all features in staging
- [ ] Enable HTTPS in production
- [ ] Monitor admin access logs
- [ ] Keep admin URL private
- [ ] Consider adding 2FA (future enhancement)

## 📞 Need Help?

If you encounter issues:
1. Check the main `ADMIN_CONSOLE_README.md` for detailed docs
2. Review error messages in browser console
3. Verify environment variables are set correctly
4. Restart dev server after config changes

## 🎨 Keyboard Shortcuts

Coming soon! Future enhancements may include:
- Keyboard navigation
- Quick search (Cmd/Ctrl + K)
- Bulk selection
- And more!

---

**Happy Administrating! 🚀**

For detailed documentation, see `ADMIN_CONSOLE_README.md`

