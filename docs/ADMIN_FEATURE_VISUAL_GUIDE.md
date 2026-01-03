# Admin User Management - Feature Overview

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD (Web UI)                     │
│  http://localhost:5000/admin                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Overview    │  │    Users     │  │   Actions    │           │
│  │  Statistics  │  │   Browser    │  │   Executor   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    API Requests (JWT + API Key)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      EXPRESS BACKEND                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Admin Routes (/api/v1/admin)                  │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │  GET    /users                  → List users               │  │
│  │  GET    /users/:id              → Get details              │  │
│  │  GET    /users/:id/activity-logs → Activity history       │  │
│  │  GET    /users/statistics/overview → Statistics          │  │
│  │  PUT    /users/:id              → Edit user               │  │
│  │  PUT    /users/:id/ban          → Ban/unban user          │  │
│  │  PUT    /users/:id/status       → Toggle active status    │  │
│  │  POST   /users/:id/reset-password → Reset password        │  │
│  │  POST   /users/:id/force-logout → Sign out all sessions   │  │
│  │  DELETE /users/:id/delete       → Delete permanently      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Admin Middleware Stack                         │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │  requireAdminAuth       → JWT validation                   │  │
│  │  requirePermission()    → Role-based access control        │  │
│  │  auditMiddleware        → Log all actions                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   Database Queries & Logging
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      MONGODB DATABASE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │  User Collection     │  │  AuditLog Collection │             │
│  ├──────────────────────┤  ├──────────────────────┤             │
│  │  _id                 │  │  _id                 │             │
│  │  name                │  │  userId (admin)      │             │
│  │  email               │  │  action              │             │
│  │  role                │  │  targetUserId        │             │
│  │  isActive            │  │  details             │             │
│  │  banned        [NEW] │  │  ipAddress           │             │
│  │  banReason     [NEW] │  │  timestamp           │             │
│  │  bannedAt      [NEW] │  │                      │             │
│  │  lastLogin           │  │  [AUTO-POPULATED]    │             │
│  │  createdAt           │  │                      │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Admin Dashboard Tabs

### Tab 1: Overview
```
┌─────────────────────────────────────────────────────┐
│  📊 Overview Statistics                              │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │    1,250    │  │     450     │  │     800     │  │
│  │ Total Users │  │   Parents   │  │  Children   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │     892     │  │      12     │  │     156     │  │
│  │Active Users │  │   Banned    │  │New This Mo. │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                       │
│  ┌──────────────────────────────────────────────────┐│
│  │  📈 Daily Signups Chart (30 days)               ││
│  │                                                  ││
│  │    [Chart showing signup trend over time]       ││
│  │                                                  ││
│  └──────────────────────────────────────────────────┘│
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Tab 2: Users
```
┌─────────────────────────────────────────────────────┐
│  🔍 Search & Filter                                  │
├─────────────────────────────────────────────────────┤
│  📧 Search: ________________                         │
│  Role: [All roles ▼]  Status: [All ▼]  [Search]    │
├─────────────────────────────────────────────────────┤
│  User List (50 per page)                            │
├─────────────────────────────────────────────────────┤
│  Name        │ Email           │ Role    │ Status   │
│  ─────────────────────────────────────────────────  │
│  John Smith  │ john@ex.com     │ Parent  │ Active   │
│  [Quick Actions]                                    │
│  ─────────────────────────────────────────────────  │
│  Jane Doe    │ jane@ex.com     │ Child   │ Inactive │
│  [Quick Actions]                                    │
│  ─────────────────────────────────────────────────  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Tab 3: Actions
```
┌─────────────────────────────────────────────────────┐
│  ⚙️ Admin Actions                                    │
├─────────────────────────────────────────────────────┤
│  User ID: ________________ [Auto-filled from Users] │
│                                                       │
│  Quick Actions Available:                           │
│  ┌──────────────────────────────────────────────┐   │
│  │ ✏️  Edit User                                │   │
│  │ 🚫 Ban User                                  │   │
│  │ 🔐 Reset Password                            │   │
│  │ 👋 Force Logout                              │   │
│  │ 📋 Activity Logs                             │   │
│  │ 🗑️  Delete User (Permanent)                 │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  Result Display Area:                               │
│  [Success messages / Error messages / Logs shown]   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Operation Details

### Operation 1: Ban User
```
User selects "Ban User" → Modal opens
│
├─ Reason input: "Violating community guidelines"
│
└─ Click "Ban User"
    │
    └─ API: PUT /api/v1/admin/users/{id}/ban
        ├─ Update: User.banned = true
        ├─ Save: User.banReason & banReason
        ├─ Log: AuditLog entry created
        └─ Result: User cannot login
```

### Operation 2: Reset Password
```
User selects "Reset Password" → Modal opens
│
├─ Temp password input: "TempPass123!"
│
└─ Click "Reset"
    │
    └─ API: POST /api/v1/admin/users/{id}/reset-password
        ├─ Hash: bcrypt(tempPassword)
        ├─ Set: User.password = hashed
        ├─ Flag: User.mustChangePassword = true
        ├─ Log: AuditLog entry
        └─ Return: Temp password (show once)
```

### Operation 3: View Activity Logs
```
User selects "Activity Logs" → Fetches logs
│
└─ API: GET /api/v1/admin/users/{id}/activity-logs
    │
    └─ Query AuditLog collection:
        ├─ userId = {id} (user's own actions)
        ├─ targetUserId = {id} (admin actions on user)
        └─ Last 30 days
    │
    └─ Display:
        ├─ Action type (LOGIN, LOGOUT, etc.)
        ├─ Timestamp
        ├─ Details (if applicable)
```

---

## 📈 Data Flow: User Suspension

```
Admin Dashboard
      │
      │ 1. Clicks "Ban User" in Actions tab
      ▼
Modal Dialog
      │
      │ 2. Enters reason & clicks Ban
      ▼
PUT /api/v1/admin/users/{id}/ban
      │
      ▼ (Backend)
Middleware Stack
  ├─ requireAdminAuth (validate JWT)
  ├─ requirePermission('users') (check role)
  ├─ apiKey middleware (validate x-api-key)
      │
      ▼
toggleUserBan Controller
  ├─ Find User by ID
  ├─ Update: { banned: true, banReason: reason }
  ├─ Create AuditLog entry
  └─ Return success response
      │
      ▼
MongoDB
  ├─ User collection updated
  └─ AuditLog collection updated
      │
      ▼
Response to Dashboard
  │
  ▼
Show Success Message
  │
  ▼
User's next login attempt:
  └─ JWT validation fails (banned check)
  └─ User cannot access app
```

---

## 🛡️ Security Layers

```
┌─────────────────────────────────────────────────┐
│  1. API Key Validation                           │
│     ├─ x-api-key header required                │
│     └─ Validated before route processing        │
├─────────────────────────────────────────────────┤
│  2. JWT Authentication (requireAdminAuth)       │
│     ├─ Bearer token required                    │
│     └─ Verified signature                       │
├─────────────────────────────────────────────────┤
│  3. Role-Based Access (requirePermission)       │
│     ├─ Admin account required                   │
│     └─ users permission required                │
├─────────────────────────────────────────────────┤
│  4. Request Validation                          │
│     ├─ User ID validation                       │
│     ├─ Confirmation for destructive ops        │
│     └─ Email format validation                  │
├─────────────────────────────────────────────────┤
│  5. Audit Logging                               │
│     ├─ All actions logged                       │
│     ├─ Timestamp & IP recorded                  │
│     └─ Admin ID tracked                         │
└─────────────────────────────────────────────────┘
```

---

## 📋 User Statistics Response

```javascript
{
  "success": true,
  "data": {
    // Basic Counts
    "totalUsers": 1250,
    "totalParents": 450,
    "totalChildren": 800,
    "activeUsers": 892,
    "bannedUsers": 12,
    "newUsersThisPeriod": 156,
    
    // Advanced Metrics
    "usersWithoutLogin": 234,
    "suspiciousAccounts": 5,
    
    // Breakdown by Role
    "usersByRole": [
      { "_id": "parent", "count": 450 },
      { "_id": "child", "count": 800 }
    ],
    
    // Trend Data
    "dailySignups": [
      { "_id": "2026-01-01", "count": 5 },
      { "_id": "2026-01-02", "count": 8 },
      { "_id": "2026-01-03", "count": 12 }
    ],
    
    "period": "30 days"
  }
}
```

---

## 🔄 User Deletion Workflow

```
Step 1: Find User
│
├─ GET /api/v1/admin/users?search=email
│ └─ Returns user list
│
Step 2: Confirm Delete
│
├─ User clicks "Delete User"
├─ Modal shows warning
├─ User must type "confirm"
│
Step 3: Execute Delete
│
├─ DELETE /api/v1/admin/users/{id}/delete
│
Step 4: Cleanup Cascade
│
├─ Delete User document
├─ Delete Parent record (if parent)
├─ Delete Child record (if child)
├─ Delete Activities (user's activities)
├─ Create AuditLog entry
│ └─ action: "USER_DELETED"
│ └─ details: { email, role }
│
Step 5: Success
│
├─ Show success message
├─ Refresh user list (if open)
└─ Data completely removed (cannot be recovered)
```

---

## 🚀 Quick Start Commands

### 1. Create Super Admin
```bash
curl -X POST http://localhost:5000/api/v1/admin/setup-super-admin \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@kivelo.com","password":"Pass123!"}'
```

### 2. Login & Get Token
```bash
curl -X POST http://localhost:5000/api/v1/admin/login \
  -H "x-api-key: your-api-key" \
  -d '{"email":"admin@kivelo.com","password":"Pass123!"}'
```

### 3. Access Dashboard
```
Open: http://localhost:5000/admin
Paste token from login response
Dashboard ready to use!
```

---

## 📊 Statistics Example Query

```bash
curl -X GET http://localhost:5000/api/v1/admin/users/statistics/overview?days=30 \
  -H "Authorization: Bearer <admin_token>" \
  -H "x-api-key: your-api-key"
```

**Returns**: Complete user statistics for past 30 days

---

## ✨ Key Capabilities Summary

| Feature | Capability | API Endpoint |
|---------|-----------|-------------|
| View Users | List & filter 1000s of users | GET /users |
| Search | Find by name or email | GET /users?search= |
| Statistics | 9 different user metrics | GET /users/statistics/overview |
| Activity Logs | 90+ day history per user | GET /users/:id/activity-logs |
| Ban | Suspend without deleting | PUT /users/:id/ban |
| Password | Force reset with temp pwd | POST /users/:id/reset-password |
| Logout | Sign out all sessions | POST /users/:id/force-logout |
| Edit | Change name/email | PUT /users/:id |
| Delete | Permanent removal | DELETE /users/:id/delete |
| Audit | Track all actions | Auto-logged |

---

This admin system provides enterprise-grade user management for the Kivelo platform! 🎉

