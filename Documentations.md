🚀 KIVELO App - Backend API Documentation
============================================================================================
📋 Base Information
Base URL: http://localhost:5000/api
Content-Type: application/json
Authentication: Bearer Token (for protected routes)

============================================================================================
                            🔐 AUTHENTICATION ENDPOINTS
============================================================================================
1. Register Parent
============================================================================================
POST /auth/register-parent
Description: Create a new parent account

Request Body:

json
{
  "email": "parent@example.com",
  "password": "password123",
  "name": "John Parent",
  "phone": "+1234567890",
  "dob": "1980-01-01"
}
Success Response (201):

json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "parent@example.com",
    "name": "John Parent",
    "role": "parent",
    "phone": "+1234567890",
    "dob": "1980-01-01"
  },
  "parent": {
    "familyCode": "A1B2C3D4E5F6",
    "subscription": "free"
  },
  "message": "Registration successful! Welcome to KIVELO."
}

============================================================================================
2. Login
============================================================================================
POST /auth/login
Description: Login for both parents and children

Request Body:

json
{
  "email": "user@example.com",
  "password": "password123"
}
Success Response (200):

json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "parent|child",
      "phone": "+1234567890",
      "dob": "1980-01-01"
    },
    // Additional role-specific data:
    // For parent:
    "familyCode": "A1B2C3D4E5F6",
    "subscription": "free",
    // For child:
    "hasSetPassword": false,
    "parentId": "parent_user_id"
  }
}

============================================================================================
3. Generate One-Time Code (Parent Only)
============================================================================================
POST /auth/generate-code
Protected: Yes (Parent role required)
Headers: Authorization: Bearer <parent_token>

Request Body:

json
{
  "childEmail": "child@example.com",
  "childName": "Alice Child"
}
Success Response (201):

json
{
  "success": true,
  "code": "A1B2C3D4",
  "expiresAt": "2024-01-01T12:00:00.000Z",
  "childId": "child_user_id",
  "message": "One-time code generated for Alice Child"
}

============================================================================================
4. Child Login with Code
============================================================================================
POST /auth/child-login-code
Description: Login for child using one-time code

Request Body:

json
{
  "email": "child@example.com",
  "code": "A1B2C3D4"
}
Success Response (200):

json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "child_user_id",
    "email": "child@example.com",
    "name": "Alice Child",
    "role": "child",
    "hasSetPassword": false
  },
  "message": "Login successful with one-time code. Please set your password to continue."
}

============================================================================================
5. Register Child with Code
============================================================================================
POST /auth/register-child-code
Description: Complete child registration with code

Request Body:

json
{
  "code": "A1B2C3D4",
  "email": "child@example.com",
  "name": "Alice Child" // optional
}
Success Response (200):

json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "child_user_id",
    "email": "child@example.com",
    "name": "Alice Child",
    "role": "child",
    "hasSetPassword": false
  },
  "message": "Code verified successfully. Please set your password to continue."
}

============================================================================================
6. Set Child Password
============================================================================================
POST /auth/set-child-password
Protected: Yes (Child role required)
Headers: Authorization: Bearer <child_token>

Request Body:

json
{
  "password": "newpassword123"
}
Success Response (200):

json
{
  "success": true,
  "token": "new_jwt_token_here",
  "message": "Password set successfully. You can now access your account."
}

============================================================================================
7. Verify Token
============================================================================================
GET /auth/verify
Protected: Yes
Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "parent|child"
  },
  "message": "Token is valid"
}

============================================================================================
8. Logout
============================================================================================
POST /auth/logout
Protected: Yes
Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "success": true,
  "message": "Logged out successfully. Please remove the token from client storage."
}
👤 USER MANAGEMENT ENDPOINTS

============================================================================================
9. Get User Profile
============================================================================================
GET /users/profile
Protected: Yes
Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "parent|child",
    "phone": "+1234567890",
    "dob": "1980-01-01",
    "isActive": true,
    "lastLogin": "2024-01-01T12:00:00.000Z"
  }
}

============================================================================================
10. Update Profile
============================================================================================
PUT /users/profile
Protected: Yes
Headers: Authorization: Bearer <token>

Request Body:

json
{
  "name": "Updated Name",
  "phone": "+0987654321",
  "dob": "1980-01-01"
}
Success Response (200):

json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    // Updated user object
  }
}

--------------------------------------------------------------------------------------------
11. Update Password
============================================================================================
PUT /users/update-password
Protected: Yes
Headers: Authorization: Bearer <token>

Request Body:

json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
Success Response (200):

json
{
  "success": true,
  "message": "Password updated successfully"
}


--------------------------------------------------------------------------------------------
👨‍👩‍👧‍👦 PARENT-SPECIFIC ENDPOINTS
--------------------------------------------------------------------------------------------
12. Get Parent's Children
============================================================================================
GET /parents/children
Protected: Yes (Parent role required)
Headers: Authorization: Bearer <parent_token>

Success Response (200):

json
{
  "success": true,
  "children": [
    {
      "id": "child_id",
      "name": "Child Name",
      "email": "child@example.com",
      "hasSetPassword": true,
      "lastLogin": "2024-01-01T12:00:00.000Z",
      "points": 150,
      "completedActivities": 5
    }
  ]
}

--------------------------------------------------------------------------------------------
13. Get Child Details
============================================================================================
GET /parents/child/:childId
Protected: Yes (Parent role required)
Headers: Authorization: Bearer <parent_token>

Success Response (200):

json
{
  "success": true,
  "child": {
    "id": "child_id",
    "name": "Child Name",
    "email": "child@example.com",
    "points": 150,
    "completedActivities": 5,
    "currentStreak": 3,
    "limits": {
      "dailyScreenTime": 120,
      "maxActivitiesPerDay": 5
    },
    "recentActivities": [
      {
        "activityName": "Read a Book",
        "completedAt": "2024-01-01T10:00:00.000Z",
        "pointsEarned": 50
      }
    ]
  }
}

--------------------------------------------------------------------------------------------
14. Update Child Limits
============================================================================================
PUT /parents/child/:childId/limits
Protected: Yes (Parent role required)
Headers: Authorization: Bearer <parent_token>

Request Body:

json
{
  "dailyScreenTime": 90,
  "maxActivitiesPerDay": 3
}
Success Response (200):

json
{
  "success": true,
  "message": "Child limits updated successfully"
}

--------------------------------------------------------------------------------------------
🧒 CHILD-SPECIFIC ENDPOINTS
============================================================================================
15. Get Child's Activities
--------------------------------------------------------------------------------------------
GET /children/activities
Protected: Yes (Child role required)
Headers: Authorization: Bearer <child_token>

Success Response (200):

json
{
  "success": true,
  "activities": [
    {
      "id": "activity_id",
      "title": "Read a Book",
      "description": "Read for 30 minutes",
      "category": "education",
      "points": 50,
      "duration": 30,
      "assignedBy": "Parent Name",
      "dueDate": "2024-01-02T00:00:00.000Z",
      "completed": false,
      "completedAt": null
    }
  ]
}

--------------------------------------------------------------------------------------------
16. Complete Activity
============================================================================================
POST /children/activities/:activityId/complete
Protected: Yes (Child role required)
Headers: Authorization: Bearer <child_token>

Success Response (200):

json
{
  "success": true,
  "message": "Activity completed successfully!",
  "pointsEarned": 50,
  "newTotalPoints": 200
}

--------------------------------------------------------------------------------------------
17. Get Child Progress
============================================================================================
GET /children/progress
Protected: Yes (Child role required)
Headers: Authorization: Bearer <child_token>

Success Response (200):

json
{
  "success": true,
  "progress": {
    "totalPoints": 200,
    "completedActivities": 4,
    "currentStreak": 3,
    "weeklyGoal": 7,
    "weeklyCompleted": 3,
    "level": 2,
    "pointsToNextLevel": 50
  }
}

--------------------------------------------------------------------------------------------
🎯 ACTIVITY MANAGEMENT ENDPOINTS
============================================================================================
18. Create Activity
============================================================================================
POST /activities
Protected: Yes (Parent role required)
Headers: Authorization: Bearer <parent_token>

Request Body:

json
{
  "title": "Read a Book",
  "description": "Read for 30 minutes",
  "category": "education",
  "points": 50,
  "duration": 30,
  "assignedTo": ["child_id_1", "child_id_2"],
  "dueDate": "2024-01-02T00:00:00.000Z"
}
Success Response (201):

json
{
  "success": true,
  "message": "Activity created successfully",
  "activity": {
    "id": "activity_id",
    "title": "Read a Book",
    "description": "Read for 30 minutes",
    "category": "education",
    "points": 50,
    "duration": 30,
    "assignedTo": ["child_id_1", "child_id_2"],
    "dueDate": "2024-01-02T00:00:00.000Z"
  }
}

--------------------------------------------------------------------------------------------
19. Get Family Activities
============================================================================================
GET /activities
Protected: Yes
Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "success": true,
  "activities": [
    {
      "id": "activity_id",
      "title": "Activity Title",
      "description": "Activity Description",
      "category": "education",
      "points": 50,
      "assignedTo": ["Child Name 1", "Child Name 2"],
      "dueDate": "2024-01-02T00:00:00.000Z",
      "completed": false
    }
  ]
}

--------------------------------------------------------------------------------------------
⚠️ ERROR RESPONSES
============================================================================================
All endpoints may return these common error responses:

400 Bad Request:

json
{
  "success": false,
  "message": "Validation error message"
}
401 Unauthorized:

json
{
  "success": false,
  "message": "Access denied. No token provided."
}
403 Forbidden:

json
{
  "success": false,
  "message": "Only parents can perform this action"
}
404 Not Found:

json
{
  "success": false,
  "message": "User not found"
}
409 Conflict:

json
{
  "success": false,
  "message": "User already exists with this email"
}
500 Internal Server Error:

json
{
  "success": false,
  "message": "Server error message"
}

--------------------------------------------------------------------------------------------
🔧 AXIOS EXAMPLES
============================================================================================
Setup Axios Instance
javascript
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add token to requests automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
Usage Examples
javascript
// Login
const login = async (email, password) => {
  try {
    const response = await API.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Get user profile
const getProfile = async () => {
  try {
    const response = await API.get('/users/profile');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Create activity (parent)
const createActivity = async (activityData) => {
  try {
    const response = await API.post('/activities', activityData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Complete activity (child)
const completeActivity = async (activityId) => {
  try {
    const response = await API.post(`/children/activities/${activityId}/complete`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

============================================================================================
📱 MOBILE APP FLOW
============================================================================================
Parent Flow:
Register/Login → Get token
Generate codes for children
Create activities
Monitor children's progress
Manage family settings

Child Flow:
Login with code → Set password
View assigned activities
Complete activities
Track progress and rewards
View achievements
====================================================================================================

MORE COMPREHENSIVELY

====================================================================================================

🚀 KIVELO App - Complete Backend API Documentation
--------------------------------------------------------------------------------------------
📋 Project Overview
--------------------------------------------------------------------------------------------
Base URL: http://localhost:5000/api
Content-Type: application/json
Authentication: Bearer Token (for protected routes)

This documentation covers the complete backend API for the KIVELO application, supporting both parent and child accounts with activity tracking, progress monitoring, and family management features.
--------------------------------------------------------------------------------------------
🏗️ Technical Setup & Architecture
--------------------------------------------------------------------------------------------
Project Structure
text
family-wellness-backend/
├── controllers/
│   ├── authControllers.js
│   ├── userControllers.js
│   └── ...
├── models/
│   ├── User.js
│   ├── Parent.js
│   ├── Child.js
│   └── Activity.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── parents.js
│   ├── children.js
│   └── activities.js
├── middleware/
│   └── authMiddleware.js
├── server.js
└── package.json
Backend Stack
Runtime: Node.js
Framework: Express.js 
Database: MongoDB with Mongoose
Authentication: JWT (JSON Web Tokens)
Password Hashing: bcryptjs

============================================================================================
                                🔐 AUTHENTICATION ENDPOINTS
============================================================================================
1. Register Parent
============================================================================================
POST /auth/register-parent
Description: Create a new parent account

Request Body:

json
{
  "email": "parent@example.com",
  "password": "password123",
  "name": "John Parent",
  "phone": "+1234567890",
  "dob": "1980-01-01"
}
Success Response (201):

json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "parent@example.com",
    "name": "John Parent",
    "role": "parent",
    "phone": "+1234567890",
    "dob": "1980-01-01"
  },
  "parent": {
    "familyCode": "A1B2C3D4E5F6",
    "subscription": "free"
  },
  "message": "Registration successful! Welcome to KIVELO."
}

============================================================================================
2. Login
============================================================================================
POST /auth/login
Description: Login for both parents and children

Request Body:

json
{
  "email": "user@example.com",
  "password": "password123"
}
Success Response (200):

json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "parent|child",
      "phone": "+1234567890",
      "dob": "1980-01-01"
    },
    "familyCode": "A1B2C3D4E5F6",
    "subscription": "free",
    "hasSetPassword": false,
    "parentId": "parent_user_id"
  }
}

============================================================================================
3. Generate One-Time Code (Parent Only)
============================================================================================
POST /auth/generate-code
Protected: Yes (Parent role required)
Headers: Authorization: Bearer <parent_token>

Request Body:

json
{
  "childEmail": "child@example.com",
  "childName": "Alice Child"
}
Success Response (201):

json
{
  "success": true,
  "code": "A1B2C3D4",
  "expiresAt": "2024-01-01T12:00:00.000Z",
  "childId": "child_user_id",
  "message": "One-time code generated for Alice Child"
}

============================================================================================
4. Child Login with Code
============================================================================================
POST /auth/child-login-code
Description: Login for child using one-time code

Request Body:

json
{
  "email": "child@example.com",
  "code": "A1B2C3D4"
}
Success Response (200):

json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "child_user_id",
    "email": "child@example.com",
    "name": "Alice Child",
    "role": "child",
    "hasSetPassword": false
  },
  "message": "Login successful with one-time code. Please set your password to continue."
}

============================================================================================
5. Set Child Password
============================================================================================
POST /auth/set-child-password
Protected: Yes (Child role required)
Headers: Authorization: Bearer <child_token>

Request Body:

json
{
  "password": "newpassword123"
}
Success Response (200):

json
{
  "success": true,
  "token": "new_jwt_token_here",
  "message": "Password set successfully. You can now access your account."
}

============================================================================================
6. Verify Token
============================================================================================
GET /auth/verify
Protected: Yes
Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "parent|child"
  },
  "message": "Token is valid"
}

============================================================================================
7. Logout
============================================================================================
POST /auth/logout
Protected: Yes
Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "success": true,
  "message": "Logged out successfully. Please remove the token from client storage."
}

============================================================================================
                                👤 USER MANAGEMENT ENDPOINTS
============================================================================================
8. Get User Profile
============================================================================================
GET /users/profile
Protected: Yes
Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "parent|child",
    "phone": "+1234567890",
    "dob": "1980-01-01",
    "isActive": true,
    "lastLogin": "2024-01-01T12:00:00.000Z"
  }
}

============================================================================================
9. Update Profile
============================================================================================
PUT /users/profile
Protected: Yes
Headers: Authorization: Bearer <token>

Request Body:

json
{
  "name": "Updated Name",
  "phone": "+0987654321",
  "dob": "1980-01-01"
}
Success Response (200):

json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "Updated Name",
    "phone": "+0987654321",
    "dob": "1980-01-01"
  }
}
============================================================================================
                        👨‍👩‍👧‍👦 PARENT-SPECIFIC ENDPOINTS
============================================================================================
10. Get Parent's Children
============================================================================================
GET /parents/children
Protected: Yes (Parent role required)
Headers: Authorization: Bearer <parent_token>

Success Response (200):

json
{
  "success": true,
  "children": [
    {
      "id": "child_id",
      "name": "Child Name",
      "email": "child@example.com",
      "hasSetPassword": true,
      "lastLogin": "2024-01-01T12:00:00.000Z",
      "points": 150,
      "completedActivities": 5
    }
  ]
}

============================================================================================
11. Get Child Details
============================================================================================
GET /parents/child/:childId
Protected: Yes (Parent role required)
Headers: Authorization: Bearer <parent_token>

Success Response (200):

json
{
  "success": true,
  "child": {
    "id": "child_id",
    "name": "Child Name",
    "email": "child@example.com",
    "points": 150,
    "completedActivities": 5,
    "currentStreak": 3,
    "limits": {
      "dailyScreenTime": 120,
      "maxActivitiesPerDay": 5
    },
    "recentActivities": [
      {
        "activityName": "Read a Book",
        "completedAt": "2024-01-01T10:00:00.000Z",
        "pointsEarned": 50
      }
    ]
  }
}

============================================================================================
12. Update Child Limits
============================================================================================
PUT /parents/child/:childId/limits
Protected: Yes (Parent role required)
Headers: Authorization: Bearer <parent_token>

Request Body:

json
{
  "dailyScreenTime": 90,
  "maxActivitiesPerDay": 3
}
Success Response (200):

json
{
  "success": true,
  "message": "Child limits updated successfully"
}

============================================================================================
                                🧒 CHILD-SPECIFIC ENDPOINTS
============================================================================================
13. Get Child's Activities
============================================================================================
GET /children/activities
Protected: Yes (Child role required)
Headers: Authorization: Bearer <child_token>

Success Response (200):

json
{
  "success": true,
  "activities": [
    {
      "id": "activity_id",
      "title": "Read a Book",
      "description": "Read for 30 minutes",
      "category": "education",
      "points": 50,
      "duration": 30,
      "assignedBy": "Parent Name",
      "dueDate": "2024-01-02T00:00:00.000Z",
      "completed": false,
      "completedAt": null
    }
  ]
}

============================================================================================
14. Complete Activity
============================================================================================
POST /children/activities/:activityId/complete
Protected: Yes (Child role required)
Headers: Authorization: Bearer <child_token>

Success Response (200):

json
{
  "success": true,
  "message": "Activity completed successfully!",
  "pointsEarned": 50,
  "newTotalPoints": 200
}

============================================================================================
15. Get Child Progress
============================================================================================
GET /children/progress
Protected: Yes (Child role required)
Headers: Authorization: Bearer <child_token>

Success Response (200):

json
{
  "success": true,
  "progress": {
    "totalPoints": 200,
    "completedActivities": 4,
    "currentStreak": 3,
    "weeklyGoal": 7,
    "weeklyCompleted": 3,
    "level": 2,
    "pointsToNextLevel": 50
  }
}

============================================================================================
                                🎯 ACTIVITY MANAGEMENT ENDPOINTS
============================================================================================
16. Create Activity
POST /activities
Protected: Yes (Parent role required)
Headers: Authorization: Bearer <parent_token>

Request Body:

json
{
  "title": "Read a Book",
  "description": "Read for 30 minutes",
  "category": "education",
  "points": 50,
  "duration": 30,
  "assignedTo": ["child_id_1", "child_id_2"],
  "dueDate": "2024-01-02T00:00:00.000Z"
}
Success Response (201):

json
{
  "success": true,
  "message": "Activity created successfully",
  "activity": {
    "id": "activity_id",
    "title": "Read a Book",
    "description": "Read for 30 minutes",
    "category": "education",
    "points": 50,
    "duration": 30,
    "assignedTo": ["child_id_1", "child_id_2"],
    "dueDate": "2024-01-02T00:00:00.000Z"
  }
}

17. Get Family Activities
GET /activities
Protected: Yes
Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "success": true,
  "activities": [
    {
      "id": "activity_id",
      "title": "Activity Title",
      "description": "Activity Description",
      "category": "education",
      "points": 50,
      "assignedTo": ["Child Name 1", "Child Name 2"],
      "dueDate": "2024-01-02T00:00:00.000Z",
      "completed": false
    }
  ]
}

============================================================================================
                                    ⚠️ ERROR HANDLING
============================================================================================
Standard Error Responses
400 Bad Request:

json
{
  "success": false,
  "message": "Validation error message"
}
401 Unauthorized:

json
{
  "success": false,
  "message": "Access denied. No token provided."
}
403 Forbidden:

json
{
  "success": false,
  "message": "Only parents can perform this action"
}
404 Not Found:

json
{
  "success": false,
  "message": "User not found"
}
409 Conflict:

json
{
  "success": false,
  "message": "User already exists with this email"
}
500 Internal Server Error:

json
{
  "success": false,
  "message": "Server error during processing. Please try again."
}

============================================================================================
                                🔧 FRONTEND INTEGRATION GUIDE
============================================================================================

Axios Setup & Configuration 
javascript
import axios from 'axios';

// Create Axios instance with base configuration
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
Fetch API Alternative
javascript
// Base fetch function with auth handling
const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`http://localhost:5000/api${url}`, config);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};
Usage Examples
Authentication Service:

javascript
// authService.js
export const authService = {
  // Parent registration
  registerParent: async (userData) => {
    try {
      const response = await API.post('/auth/register-parent', userData);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // User login
  login: async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await API.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    return API.post('/auth/logout');
  }
};
Parent Service:

javascript
// parentService.js
export const parentService = {
  // Generate one-time code for child
  generateChildCode: async (childEmail, childName) => {
    const response = await API.post('/auth/generate-code', {
      childEmail,
      childName
    });
    return response.data;
  },

  // Get all children
  getChildren: async () => {
    const response = await API.get('/parents/children');
    return response.data;
  },

  // Create activity for children
  createActivity: async (activityData) => {
    const response = await API.post('/activities', activityData);
    return response.data;
  }
};
Child Service:

javascript
// childService.js
export const childService = {
  // Get assigned activities
  getActivities: async () => {
    const response = await API.get('/children/activities');
    return response.data;
  },

  // Complete an activity
  completeActivity: async (activityId) => {
    const response = await API.post(`/children/activities/${activityId}/complete`);
    return response.data;
  },

  // Get progress
  getProgress: async () => {
    const response = await API.get('/children/progress');
    return response.data;
  }
};

============================================================================================
                            📱 MOBILE APP IMPLEMENTATION FLOW
============================================================================================
Parent User Journey
-----------------------------------------------------------------------------------------------
Registration → POST /auth/register-parent
Login → POST /auth/login
Create Child Accounts → POST /auth/generate-code
Setup Activities → POST /activities
Monitor Progress → GET /parents/children & GET /parents/child/:childId
-----------------------------------------------------------------------------------------------


Child User Journey
-----------------------------------------------------------------------------------------------
Activate Account → POST /auth/child-login-code
Set Password → POST /auth/set-child-password
View Activities → GET /children/activities
Complete Tasks → POST /children/activities/:activityId/complete
Track Progress → GET /children/progress


============================================================================================
                            🔒 SECURITY CONSIDERATIONS
============================================================================================
JWT Tokens: Store securely (HTTP-only cookies recommended for web)
Password Policy: Minimum 6 characters, hashed with bcrypt
Input Validation: All endpoints validate input data
Role-Based Access: Parent/child role enforcement
CORS: Configured for mobile app domains

============================================================================================
                                🚀 TESTING & DEPLOYMENT
============================================================================================
Local Development Testing
bash
# Start backend server
npm run dev

# Test endpoints using:
# 1. Postman collection
# 2. Mobile app integration
# 3. Automated tests
-----------------------------------------------------------------------------------------------

Sample Test Data
-----------------------------------------------------------------------------------------------
Parent Account:
Email: demo.parent@example.com
Password: password123

Child Account:
Email: demo.child@example.com
One-time Code: A1B2C3D4
-----------------------------------------------------------------------------------------------

============================================================================================
                                    💡 SUPPORT & TROUBLESHOOTING
============================================================================================
Common Issues
401 Errors: Check token validity and expiration
403 Errors: Verify user role permissions
400 Errors: Validate request body format
Network Errors: Confirm backend server is running

-----------------------------------------------------------------------------------------------
Getting Help
-----------------------------------------------------------------------------------------------
Backend API Documentation ✓ (This Document)
Server Logs: Check console for detailed errors
Postman Collection: Use provided examples

This document provides complete integration guidance for the KIVELO mobile app backend API. All endpoints follow RESTful conventions and include proper error handling for robust mobile application development.

Document Version: 1.0
Last Updated: 2024-01-01
Backend Compatibility: Node.js + Express.js
Frontend Compatibility: React Native, Flutter, iOS, Android


============================================================================================
                                    📄 Download Information
============================================================================================
This comprehensive document includes:

✅ Complete API endpoint documentation
✅ Request/response examples for all operations
✅ Frontend integration code (Axios & Fetch)
✅ Error handling guidelines
✅ Security implementation details
✅ Mobile app workflow specifications
✅ Testing and troubleshooting guide
