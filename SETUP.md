# Quick Setup Guide - Foundation CRM

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Environment File
Create a file named `.env` in your project root:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Step 3: Setup Supabase (Optional - works without it)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL from README.md in the SQL Editor
4. Copy your URL and anon key to `.env`

### Step 4: Run the App
```bash
npm start
```

The app will open at `http://localhost:3000`

## 🔑 Default Login Credentials

Try these to explore different roles:

**Admin Access:**
- Username: `Admin User`
- Password: `admin`

**Canvasser (Field Worker):**
- Username: `Canvasser`
- Password: `canvas`

**Sales Manager:**
- Username: `Sales Manager`
- Password: `manager`

**Confirmation Team:**
- Username: `Confirmation Team`
- Password: `confirm`

## 📱 Features to Try First

### As a Canvasser:
1. Click "New Lead" button
2. Fill in the form (Name, Address, Foundation Type required)
3. Upload a property photo (optional)
4. Submit and see your weekly progress update!
5. View "My Leads" to see all your submissions
6. Check the "Lead Hub" to see mapped locations

### As Admin/Manager:
1. See the main dashboard with all statistics
2. Click "Homeowners" to manage new leads
3. Click "Edit" on any lead to update status
4. Mark as "Verified", "Inspection Scheduled", or "Customer"
5. Upload photos by clicking edit mode
6. View "Analytics" to see team leaderboard
7. Check "Tasks" to see pending work

## 🎯 First Task

**Create your first lead:**
1. Login as Canvasser
2. Click "New Lead"
3. Enter:
   - Name: "John Smith"
   - Address: "123 Main St, Cincinnati, OH"
   - Foundation Type: "Concrete Slab"
4. Click "Submit Homeowner"
5. See the success message!
6. Check your weekly progress

**Then manage it as Admin:**
1. Logout
2. Login as Admin User
3. Click "Homeowners"
4. Find John Smith
5. Click "Edit"
6. Mark as "Verified"
7. Watch the status update!

## 🔧 Troubleshooting

**App won't start:**
- Make sure you ran `npm install`
- Check that you're using Node.js 14+
- Try deleting `node_modules` and running `npm install` again

**Supabase errors:**
- The app works fine without Supabase
- It will use local storage automatically
- Check your environment variables if you want to use Supabase

**Google Maps not working:**
- Currently using mock data (intentional for demo)
- Add your Google Maps API key to enable real autocomplete
- See README.md for API integration code

## 📚 Next Steps

1. **Customize the users**: Edit the default users in the code
2. **Add your branding**: Change colors, logos, company name
3. **Setup Supabase**: For production data persistence
4. **Add Google Maps**: For real address autocomplete
5. **Deploy**: Use Vercel, Netlify, or your preferred platform

## 💡 Pro Tips

- **Mobile Testing**: Open on your phone to see mobile-responsive design
- **Weekly Goals**: Canvassers can set custom weekly goals during registration
- **Photo Uploads**: Work best on mobile (camera integration)
- **Search**: Use the search box in customer lists to find leads quickly
- **Filters**: Click status filter buttons to sort leads
- **History**: Each customer has a history showing all changes

## 🎨 Customization Ideas

**Change Colors:**
Edit these Tailwind classes throughout the code:
- `bg-blue-600` → `bg-purple-600` (change primary color)
- `from-blue-900` → `from-purple-900` (change gradients)

**Change Company Name:**
Search and replace "Foundation CRM" with your company name

**Add Your Logo:**
Replace the `<Home>` icon in LoginScreen with your logo:
```jsx
<img src="/your-logo.png" alt="Logo" className="h-12 w-12" />
```

## 📞 Need Help?

Check the main README.md for:
- Complete feature list
- Database schema
- API integration guides
- Security best practices
- Deployment instructions

---

**Enjoy your new CRM system! 🎉**
