# Admin User Management System

## Overview

The admin user management system provides comprehensive tools for administrators to manage, monitor, and control user accounts in the Kivelo Family Wellness application. All admin features are protected by role-based access control middleware.

## Access & Authentication

**Admin Dashboard URL**: `http://localhost:5000/admin`

**Requirements**:
- Must have admin JWT token in `localStorage` under key `adminToken`
- Token must have appropriate permissions
- All admin routes require `x-api-key` header in requests

**Getting Admin Access**:
1. Create super admin account via POST `/api/v1/admin/setup-super-admin`
2. Login with super admin credentials via POST `/api/v1/admin/login`
3. Token returned will be automatically used in dashboard

## Admin Dashboard Features

### 1. **Overview Tab**
Displays comprehensive user statistics and trends:
- **Total Users, Parents, Children** - Overall user distribution
- **Active Users** - Users with login activity
- **Banned Users** - Count of suspended accounts
- **New This Month** - Recent signup trend
- **Daily Signups Chart** - Visual trend of new registrations

**Endpoint**: `GET /api/v1/admin/users/statistics/overview`
- Query: `?days=30` (default 30)
- Returns: User statistics and daily signup data

### 2. **Users Tab**
Browse and manage all users with advanced filtering:

**Features**:
- Search by name or email
- Filter by role (Parent/Child)
- Filter by status (Active/Inactive)
- View user details: name, email, role, account status, join date, last login

**Quick Actions**: Per-user action buttons to access advanced operations

**Endpoint**: `GET /api/v1/admin/users`
- Query params:
  - `page` (default 1)
  - `limit` (default 10)
  - `role` (parent/child)
  - `isActive` (true/false)
  - `search` (name or email)

### 3. **Actions Tab**
Perform targeted admin actions on specific users:

**Available Actions**:

#### Edit User Details
- **Description**: Change user name and email
- **Endpoint**: `PUT /api/v1/admin/users/{id}`
- **Body**:
  ```json
  {
    "name": "New Name",
    "email": "newemail@example.com"
  }
  ```

#### Ban/Unban User
- **Description**: Suspend or restore user account with optional reason
- **Endpoint**: `PUT /api/v1/admin/users/{id}/ban`
- **Body**:
  ```json
  {
    "banned": true,
    "reason": "Violating community guidelines"
  }
  ```
- **Effect**: User cannot login; all sessions invalidated

#### Force Password Reset
- **Description**: Set temporary password, user must change on next login
- **Endpoint**: `POST /api/v1/admin/users/{id}/reset-password`
- **Body**:
  ```json
  {
    "tempPassword": "TempPass123!"
  }
  ```
- **User Experience**: User logs in with temp password, prompted to create new one

#### Force Logout
- **Description**: Invalidate all sessions, force logout from all devices
- **Endpoint**: `POST /api/v1/admin/users/{id}/force-logout`
- **Effect**: Clears refresh tokens, user must login again

#### View Activity Logs
- **Description**: See all login, logout, password change, and admin actions
- **Endpoint**: `GET /api/v1/admin/users/{id}/activity-logs`
- **Query params**:
  - `days` (default 30)
  - `limit` (default 50)
- **Returns**: List of all audit log entries for user

#### Delete User Permanently
- **Description**: Completely remove user and all associated data
- **Endpoint**: `DELETE /api/v1/admin/users/{id}/delete`
- **Body**:
  ```json
  {
    "confirmDelete": true
  }
  ```
- **Warning**: Irreversible! Deletes:
  - User account
  - Parent/Child records
  - Activities
  - All related data

## User Statistics Endpoint

**Full Endpoint**: `GET /api/v1/admin/users/statistics/overview`

**Query Parameters**:
- `days` (integer, default 30) - Period to analyze

**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "totalParents": 450,
    "totalChildren": 800,
    "activeUsers": 892,
    "bannedUsers": 12,
    "newUsersThisPeriod": 156,
    "usersWithoutLogin": 234,
    "suspiciousAccounts": 5,
    "usersByRole": [
      { "_id": "parent", "count": 450 },
      { "_id": "child", "count": 800 }
    ],
    "dailySignups": [
      { "_id": "2026-01-01", "count": 5 },
      { "_id": "2026-01-02", "count": 8 }
    ],
    "period": "30 days"
  }
}
```

## User Details Endpoint

**Endpoint**: `GET /api/v1/admin/users/{id}`

**Response**:
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "parent",
    "isActive": true,
    "banned": false,
    "createdAt": "2025-12-01T10:30:00Z",
    "lastLogin": "2026-01-03T08:15:00Z",
    "parent": {
      "familyCode": "ABC123",
      "children": ["child_id_1", "child_id_2"]
    }
  }
}
```

## User List Endpoint

**Endpoint**: `GET /api/v1/admin/users`

**Query Parameters**:
- `page` (integer, default 1)
- `limit` (integer, default 10)
- `role` (string) - "parent" or "child"
- `isActive` (boolean) - "true" or "false"
- `search` (string) - Search name or email

**Response**:
```json
{
  "success": true,
  "users": [
    {
      "_id": "id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "parent",
      "isActive": true,
      "createdAt": "2025-12-01T00:00:00Z",
      "lastLogin": "2026-01-03T10:00:00Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 1250
  }
}
```

## Audit Logging

All admin actions are logged in the AuditLog collection:

**Tracked Actions**:
- `USER_BANNED` - User banned
- `USER_UNBANNED` - User unbanned
- `FORCE_PASSWORD_RESET` - Password reset initiated
- `FORCE_LOGOUT` - User forced logout
- `USER_DELETED` - User permanently deleted
- `USER_DETAILS_UPDATED` - User info edited

**Audit Log Entry**:
```json
{
  "_id": "log_id",
  "userId": "admin_id",
  "action": "USER_BANNED",
  "targetUserId": "user_id",
  "details": { "reason": "Violating guidelines" },
  "ipAddress": "192.168.1.1",
  "timestamp": "2026-01-03T10:30:00Z"
}
```

## Security Considerations

1. **Admin-Only Access**: All endpoints require admin authentication and "users" permission
2. **Audit Trail**: Every action is logged with admin ID, timestamp, and IP address
3. **Confirmation Required**: Destructive actions (ban, delete) require explicit confirmation
4. **Password Reset**: Sets temporary password; user must change on next login
5. **Force Logout**: Invalidates all refresh tokens
6. **Ban System**: Prevents login while preserving all user data

## Permission Model

Admins can have specific permissions:
- `users` - Manage users (required for all user management)
- `audit` - View audit logs
- `analytics` - View system analytics
- `settings` - Modify system settings
- `admins` - Manage other admins (super admin only)

**Required Permissions for User Management**:
- All user endpoints require `permissions.users = true`

## API Key Requirements

All admin endpoints require:
```javascript
headers: {
  'Authorization': 'Bearer <admin_jwt_token>',
  'x-api-key': '<api_key>',
  'Content-Type': 'application/json'
}
```

## Example Workflows

### Workflow 1: Suspend User for Policy Violation

```javascript
// 1. Find user by email
const users = await fetch('/api/v1/admin/users?search=violator@example.com', {
  headers: { 'Authorization': 'Bearer TOKEN', 'x-api-key': 'KEY' }
});
const userId = users.users[0]._id;

// 2. Ban user with reason
await fetch(`/api/v1/admin/users/${userId}/ban`, {
  method: 'PUT',
  headers: { 'Authorization': 'Bearer TOKEN', 'x-api-key': 'KEY' },
  body: JSON.stringify({ banned: true, reason: "Violating community guidelines" })
});

// 3. Check activity logs
await fetch(`/api/v1/admin/users/${userId}/activity-logs`, {
  headers: { 'Authorization': 'Bearer TOKEN', 'x-api-key': 'KEY' }
});
```

### Workflow 2: Reset Forgotten Password

```javascript
// 1. Generate temp password
const tempPassword = "TempPass" + Math.random().toString(36).substr(2, 9);

// 2. Set temp password
await fetch(`/api/v1/admin/users/${userId}/reset-password`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer TOKEN', 'x-api-key': 'KEY' },
  body: JSON.stringify({ tempPassword })
});

// 3. Communicate temp password to user (out of band)
// User logs in with temp password, system prompts for new password
```

### Workflow 3: Investigate Suspicious Activity

```javascript
// 1. View user details
const user = await fetch(`/api/v1/admin/users/${userId}`, {
  headers: { 'Authorization': 'Bearer TOKEN', 'x-api-key': 'KEY' }
});

// 2. Get activity logs (90 days)
const logs = await fetch(`/api/v1/admin/users/${userId}/activity-logs?days=90`, {
  headers: { 'Authorization': 'Bearer TOKEN', 'x-api-key': 'KEY' }
});

// 3. Get system statistics
const stats = await fetch(`/api/v1/admin/users/statistics/overview?days=30`, {
  headers: { 'Authorization': 'Bearer TOKEN', 'x-api-key': 'KEY' }
});

// 4. Identify suspicious patterns (multiple failed logins, unusual IP, etc.)
```

## Error Responses

**Missing User**:
```json
{
  "success": false,
  "message": "User not found"
}
```

**Unauthorized**:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Insufficient Permissions**:
```json
{
  "success": false,
  "message": "Forbidden - User doesn't have users permission"
}
```

**Validation Error**:
```json
{
  "success": false,
  "message": "Confirmation required to delete user"
}
```

## Future Enhancements

- [ ] Bulk user actions (ban multiple, export CSV)
- [ ] User role changes (promote child to parent)
- [ ] Advanced filtering (by signup date, last login, location)
- [ ] Email notifications to users of admin actions
- [ ] Two-factor authentication for admin account
- [ ] Admin action approval workflow
- [ ] User behavior analytics and patterns
- [ ] Automated suspicious activity detection

## Dashboard Keyboard Shortcuts

- **Ctrl+F** - Focus search in Users tab
- **Tab** - Navigate between tabs
- **Enter** - Submit forms

