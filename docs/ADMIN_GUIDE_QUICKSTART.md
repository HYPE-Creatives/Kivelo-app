# 🔐 Admin Panel - Quick Start Guide

## ✨ What's New?

Your admin panel now has **enterprise-grade security** to protect against hackers and keep your family wellness data safe.

**Key Security Features:**
- 🔒 HTTP-only cookies (tokens cannot be stolen by hackers)
- 🚫 Rate limiting (automatic 15-minute lockout after 5 wrong passwords)
- 📋 Audit logging (every admin action is logged)
- 👋 Secure logout (clears all sessions immediately)
- ⚡ Session management (sessions expire automatically for security)

---

## 🚀 Getting Started

### Step 1: Navigate to Login
Open your browser and go to:
```
http://localhost:5000/admin-login.html
```
Or in production:
```
https://your-domain.com/admin-login.html
```

### Step 2: Enter Your Credentials
- **Email:** Your admin email address
- **Password:** Your admin password
- **Keep me logged in:** Optional (keeps session for 7 days)

**Security Note:** Your password is never stored in your browser. Only a secure session token is stored (in HTTP-only cookies).

### Step 3: Access the Dashboard
After successful login, you'll be redirected to:
```
http://localhost:5000/admin
```

---

## 📊 Dashboard Tabs

### 👀 Overview Tab
See at a glance:
- Total number of users
- Parents vs. Children breakdown
- Active users count
- Banned users
- New users this month
- Daily signup trend chart

### 👥 Users Tab
Manage all users:
- **Search:** Find users by name or email
- **Filter by Role:** Parents, Children, or All
- **Filter by Status:** Active or Inactive
- **Quick Actions:** Select any user to manage them

### ⚙️ Actions Tab
Perform admin operations on selected user:
- **✏️ Edit User:** Change name and email
- **🚫 Ban User:** Suspend account with reason
- **🔐 Reset Password:** Set temporary password
- **👋 Force Logout:** Sign out user from all devices
- **📋 Activity Logs:** View user's login history (30 days)
- **🗑️ Delete User:** Permanently remove user (irreversible!)

---

## 🛡️ Security Features Explained

### 🔒 HTTP-Only Cookies
**What it does:** Protects your session token from hackers stealing it.

**How to verify:**
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Cookies"
4. Look for "kivelo_admin_refresh"
5. Note: You won't see the cookie value in JavaScript (that's GOOD!)

### 🚫 Rate Limiting (Brute Force Protection)
**What it does:** Prevents hackers from guessing your password.

**How it works:**
- 1st wrong password: Can try again
- 2nd wrong password: Can try again
- 3rd wrong password: Can try again
- 4th wrong password: Can try again
- 5th wrong password: **Locked for 15 minutes**

**15-minute lockout countdown** is displayed on the login page.

### 📋 Audit Logging
**What it does:** Records every admin action for security review.

**What's logged:**
- ✅ Login/Logout times
- ✅ Users banned/unbanned
- ✅ Passwords reset
- ✅ Force logouts issued
- ✅ User deletions
- ✅ User details edited
- ✅ Admin's IP address
- ✅ Admin's browser info

**Access logs:**
1. Go to "Actions" tab
2. Enter User ID
3. Click "📋 Activity Logs"
4. See all their activity from past 30 days

### 👋 Secure Logout
**What it does:** Completely clears your session.

**To logout:**
1. Click "🚪 Logout Securely" button (top right)
2. Your session is immediately invalidated
3. All devices are logged out
4. Redirected to login page

**Why secure logout matters:**
- If you forget to logout, session expires automatically (default: 1 hour)
- Even if someone gains access to your device, they cannot access your session
- All your actions are logged, so suspicious activity is detected

---

## 🎯 Common Tasks

### Edit a User's Profile
1. Go to **Users** tab
2. Search for the user
3. Click **Quick Actions**
4. Click **✏️ Edit User**
5. Change name/email
6. Click **Save**

### Ban a User for Suspicious Activity
1. Go to **Users** tab
2. Find the user
3. Click **Quick Actions**
4. Click **🚫 Ban User**
5. Enter reason (e.g., "Reported for harassment")
6. Click **Ban User**

### Force a User to Change Password
1. Go to **Users** tab
2. Find the user
3. Click **Quick Actions**
4. Click **🔐 Reset Password**
5. Enter a temporary password
6. Click **Reset**
7. User will be required to change it on next login

### View User Activity History
1. Go to **Users** tab
2. Find the user
3. Click **Quick Actions**
4. Scroll down and click **📋 Activity Logs**
5. See all login attempts, password changes, etc.

### Force Logout a User from All Devices
1. Go to **Users** tab
2. Find the user
3. Click **Quick Actions**
4. Click **👋 Force Logout**
5. User is immediately signed out from all their devices

### Delete a User Permanently
⚠️ **WARNING: This cannot be undone!**

1. Go to **Actions** tab
2. Enter User ID
3. Click **🗑️ Delete User**
4. Type "confirm" in the dialog
5. Click **Delete**
6. User and all their data are gone forever

---

## 🔍 Security Best Practices

### Do's ✅
- ✅ Use a strong password (12+ characters, mix of upper/lower/numbers/symbols)
- ✅ Logout when you're done (click "Logout Securely")
- ✅ Monitor activity logs regularly
- ✅ Report suspicious activity immediately
- ✅ Keep your browser and OS updated
- ✅ Use a password manager to store your admin password

### Don'ts ❌
- ❌ Don't share your admin password with anyone
- ❌ Don't use the same password for multiple accounts
- ❌ Don't logout and immediately close the browser (logout button redirects you)
- ❌ Don't access admin panel on public WiFi without VPN
- ❌ Don't leave browser open and unattended
- ❌ Don't write password on sticky notes

---

## 📞 Troubleshooting

### "Invalid email or password" Error
- ✅ Check that you're typing the correct email
- ✅ Check that caps lock is OFF
- ✅ Verify your password is correct
- ✅ Try copying-pasting password from password manager

### "Account Locked - 15 minute lockout"
- ✅ You entered wrong password 5 times
- ✅ Wait 15 minutes before trying again
- ✅ Check the countdown timer
- ✅ If you forgot your password, contact IT admin

### 403 Unauthorized Error
- ✅ Your admin account may be deactivated
- ✅ Your permissions may have been removed
- ✅ Contact IT admin to restore access

### Dashboard Won't Load / "401 Unauthorized"
- ✅ Your session may have expired
- ✅ Close browser and login again
- ✅ Clear browser cookies and login again
- ✅ Try incognito/private browsing mode

### Can't Find User in Search
- ✅ Check spelling of name/email
- ✅ Try searching by different field
- ✅ User may have been deleted
- ✅ Refresh page and try again

---

## 🚨 Security Incident Response

### If You Suspect Unauthorized Access
1. **Logout immediately** - Click "Logout Securely"
2. **Change your password** - Use a strong new password
3. **Check Activity Logs** - Look for suspicious actions
4. **Alert IT Team** - Report the incident
5. **Enable 2FA** - (If available) Add extra security layer
6. **Review User Changes** - Check if any users were inappropriately modified

### If You Forgot Your Password
1. Contact IT admin
2. Request password reset
3. IT admin will set temporary password
4. You'll be asked to change it on next login

### If You Suspect Brute Force Attack
- Multiple failed login attempts from different IPs
- Alert IT team immediately
- Consider temporarily disabling user accounts
- Review audit logs for suspicious patterns

---

## 🎓 Understanding the Dashboard

### Overview Stats
- **Total Users:** Sum of all parents + children
- **Parents:** Users with role "parent"
- **Children:** Users with role "child"
- **Active Users:** Users with `isActive: true`
- **New This Month:** Users created in last 30 days
- **Banned:** Users with `banned: true`

### User Badges
- 🟢 **Green (Active):** User account is active
- 🔴 **Red (Inactive):** User account is deactivated
- 🔵 **Blue (Parent):** User role is "parent"
- 🟣 **Purple (Child):** User role is "child"

### Chart Interpretation
- **Daily Signups Line Chart:** Track user growth over time
- Peaks indicate promotion periods or viral growth
- Valleys may indicate seasonal patterns
- Monitor trends to plan capacity

---

## 📊 Dashboard Statistics

### User Statistics
- Total active users
- Parent/child ratio
- Monthly growth rate
- Banned users count
- Last login trends

### Security Metrics
- Failed login attempts (24 hours)
- Suspicious IP addresses
- Account lockouts
- Unusual activity patterns

### Usage Analytics
- Most active hours
- Popular features
- Device types
- Geographic distribution (if tracked)

---

## 🔄 Workflow Examples

### Onboarding a New Parent
1. Parent signs up through app
2. Check **Overview** to confirm new user added
3. Parent logs in successfully
4. Activity log shows their first login
5. No action needed unless verification required

### Handling a Report (User Misbehavior)
1. Receive report from parent/child
2. Go to **Users** tab
3. Find problematic user
4. Review their activity logs
5. If severe: Ban user with reason logged
6. If moderate: Reset password, warn user
7. Document incident in notes

### Investigating Account Access Issues
1. User reports login problems
2. Go to **Users** tab
3. Click **Quick Actions** → **Activity Logs**
4. Check: Last login time, failed attempts
5. If many failed attempts: Account may be compromised
6. Solution: Force logout + password reset
7. User must login again with new password

---

## 📞 Support & Help

**Questions?**
- Check this guide first
- Contact IT admin
- Email: admin@family-wellness.com

**Report Security Issues**
- Alert IT team immediately
- Do NOT post on public forums
- Use secure communication channel

**Feature Requests**
- Submit through official channels
- Include use case and benefits
- Security team will review

---

## ✅ Checklist for First Login

After logging in for the first time, verify:

- [ ] Login page worked
- [ ] Dashboard loaded successfully
- [ ] Can see Overview statistics
- [ ] Can search Users tab
- [ ] Can view user details
- [ ] Can access Actions
- [ ] Can click logout button
- [ ] Logout button redirects to login
- [ ] Cannot access /admin after logout
- [ ] Must login again to access

---

**Security is everyone's responsibility.** Thank you for helping keep the Kivelo family wellness app secure!

🔐 **Stay Safe. Stay Secure. Protect Families.** 🔐

---

*Last Updated: 2024-01-21*  
*Version: 1.0.0*  
*For Admins Only - Keep This Confidential*
