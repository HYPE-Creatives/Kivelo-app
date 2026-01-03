# Admin User Management - Quick Start Guide

## 🚀 Getting Started

### 1. Create Super Admin Account

Run this once to initialize the system:

```bash
curl -X POST http://localhost:5000/api/v1/admin/setup-super-admin \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "System Administrator",
    "email": "admin@kivelo.com",
    "password": "SecurePassword123!"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Super admin created successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "_id": "admin_id",
    "name": "System Administrator",
    "email": "admin@kivelo.com",
    "role": "super_admin"
  }
}
```

### 2. Login to Admin Dashboard

**Via API**:
```bash
curl -X POST http://localhost:5000/api/v1/admin/login \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kivelo.com",
    "password": "SecurePassword123!"
  }'
```

**Via Web Dashboard**:
1. Open `http://localhost:5000/admin`
2. Login button will redirect to login page
3. Enter admin credentials
4. Token automatically stored in localStorage

### 3. Access Admin Dashboard

**URL**: `http://localhost:5000/admin`

**Features Available**:
- Overview: User statistics and trends
- Users: Browse and filter all users
- Actions: Perform admin operations

---

## 📊 Dashboard Tabs Explained

### Overview Tab
Shows high-level statistics:
- **Total Users**: Sum of all parent and child accounts
- **Parents**: Count of parent-role users
- **Children**: Count of child-role users
- **Active Users**: Users with login activity in past 30 days
- **New This Month**: Recent registrations
- **Banned**: Suspended accounts

**Chart**: Daily signup trend over selected period

### Users Tab
Find and select users for management:
- **Search**: By name or email
- **Filter by Role**: Parent only, Child only, or all
- **Filter by Status**: Active, Inactive, or all
- **Quick Actions**: Select user to perform admin operations

### Actions Tab
Perform operations on selected user:
1. Enter User ID or click "Quick Actions" from Users tab
2. Choose action:
   - ✏️ **Edit User** - Change name/email
   - 🚫 **Ban User** - Suspend account
   - 🔐 **Reset Password** - Force password change
   - 👋 **Force Logout** - Sign out all sessions
   - 📋 **Activity Logs** - View user history
   - 🗑️ **Delete User** - Permanently remove

---

## 🛠️ Common Admin Tasks

### Task 1: Find a User by Email

1. Go to **Users** tab
2. Type email in search box
3. Click **🔍 Search**
4. Click user to access Actions

### Task 2: Suspend User Account

1. Navigate to **Actions** tab
2. Enter User ID (or use Quick Actions)
3. Click **🚫 Ban User**
4. Enter reason (e.g., "Policy violation")
5. Confirm - User cannot login

### Task 3: Reset User Password

1. Go to **Actions** tab
2. Select user
3. Click **🔐 Reset Password**
4. System generates temporary password
5. Share with user securely
6. User must change password on next login

### Task 4: View User Activity

1. Go to **Actions** tab
2. Select user
3. Click **📋 Activity Logs**
4. View all logins, logouts, password changes
5. Identify suspicious patterns

### Task 5: Permanently Delete User

⚠️ **This cannot be undone!**

1. Go to **Actions** tab
2. Select user
3. Click **🗑️ Delete User**
4. Type "confirm" to proceed
5. All user data removed

---

## 📱 API Reference for Developers

### Get All Users
```bash
GET /api/v1/admin/users?page=1&limit=50&role=parent&isActive=true
Authorization: Bearer <token>
x-api-key: <key>
```

### Get User Details
```bash
GET /api/v1/admin/users/{userId}
Authorization: Bearer <token>
x-api-key: <key>
```

### Ban User
```bash
PUT /api/v1/admin/users/{userId}/ban
Authorization: Bearer <token>
x-api-key: <key>

{
  "banned": true,
  "reason": "Violating terms"
}
```

### Reset User Password
```bash
POST /api/v1/admin/users/{userId}/reset-password
Authorization: Bearer <token>
x-api-key: <key>

{
  "tempPassword": "TempPass123!"
}
```

### Force Logout
```bash
POST /api/v1/admin/users/{userId}/force-logout
Authorization: Bearer <token>
x-api-key: <key>
```

### Get User Statistics
```bash
GET /api/v1/admin/users/statistics/overview?days=30
Authorization: Bearer <token>
x-api-key: <key>
```

### Get Activity Logs
```bash
GET /api/v1/admin/users/{userId}/activity-logs?days=30&limit=50
Authorization: Bearer <token>
x-api-key: <key>
```

### Delete User
```bash
DELETE /api/v1/admin/users/{userId}/delete
Authorization: Bearer <token>
x-api-key: <key>

{
  "confirmDelete": true
}
```

---

## 🔐 Security & Best Practices

### Do's ✅
- Always verify user identity before sensitive actions
- Keep admin account credentials secure
- Regularly review admin activity logs
- Inform users before banning/deleting accounts
- Use strong admin passwords
- Logout from shared computers
- Document reasons for all actions

### Don'ts ❌
- Share admin credentials
- Perform actions without verification
- Leave admin dashboard open
- Delete user accounts without backup
- Change user passwords without notification
- Grant admin access to unauthorized personnel

---

## ⚠️ Important Notes

1. **Banning vs Deleting**:
   - **Ban**: User data preserved, can be unban
   - **Delete**: Permanent, all data removed

2. **Force Logout**:
   - Happens immediately on user's device
   - User must login again
   - Good for security concerns

3. **Password Reset**:
   - Temporary password must be communicated securely
   - User prompted to change on next login
   - Old password no longer works

4. **Audit Trail**:
   - All admin actions logged
   - Timestamp, IP, and reason recorded
   - Available for compliance audits

5. **Performance**:
   - Dashboard loads first 50 users per page
   - Statistics calculated for 30-day window
   - Charts updated in real-time

---

## 🆘 Troubleshooting

### Dashboard not loading?
- Check if admin token is in localStorage
- Verify browser console for errors
- Try logout and login again
- Restart backend server

### User not found?
- Verify correct User ID
- Try searching by email instead
- Check if user has been deleted
- Ensure no typos in ID

### Action failed?
- Check network in browser DevTools
- Verify x-api-key and token are valid
- Check admin has "users" permission
- Review error message in dashboard

### Password reset not working?
- Ensure temporary password meets requirements
- Check user can actually login
- Try forcing logout first
- Verify user email is accessible

---

## 📞 Support

For issues or questions:
1. Check ADMIN_USER_MANAGEMENT.md for detailed docs
2. Review API response error messages
3. Check server logs for backend errors
4. Contact development team

