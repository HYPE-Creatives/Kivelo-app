# Kivelo Family Wellness App - AI Agent Instructions

## Architecture Overview

**Monorepo Structure**: Workspace contains two separate projects:
- `kivelo-backend/` - Node.js/Express REST API (port 5000)
- `kivelo-frontend/` - Expo/React Native mobile app

**Data Flow**: Frontend uses fallback API URLs (`localhost:5000` → `family-wellness.onrender.com`) with automatic retry logic in `AuthContext.tsx`. Backend requires `x-api-key` header for all requests (see `middleware/apiKey.js`).

## Role-Based Access System

**Critical Pattern**: The app has **parent** and **child** user roles with distinct access patterns.

- **User Model** (`models/User.js`): Base user with role field
- **Parent Model** (`models/Parent.js`): Has unique `familyCode` for family linking
- **Child Model** (`models/Child.js`): References parent, uses one-time codes for registration

**Middleware Stack**:
- `middleware/auth.js` - JWT verification, attaches `req.user`
- `middleware/roleCheck.js` - Role guards (`isParent`, `isChild`, `hasAccessToChild`)
- `middleware/apiKey.js` - API key validation for all backend requests

**Pattern Example**: Parents can access child data only if they own that child:
```javascript
router.get('/child/:childId/mood', auth, hasAccessToChild, getChildMood);
```

## Authentication Flow

### Parent Registration
1. POST `/api/v1/auth/register-parent` → Creates User + Parent with auto-generated `familyCode`
2. Returns JWT access token + HTTP-only refresh token cookie
3. Frontend stores user + tokens in AsyncStorage (`AuthContext.tsx`)

### Child Registration (Two-Step)
1. **Parent generates code**: POST `/api/v1/auth/generate-code` with child details → returns 1-hour expiring code
2. **Child uses code**: POST `/api/v1/auth/child-login-code` → logs in, then POST `/api/v1/auth/child-set-password` to set permanent password

**Frontend Implementation**: See `app/(dashboard)/parent/settings.tsx` for parent-side code generation UI.

## Frontend Navigation Structure

**Expo Router file-based routing**:
```
app/
├── (auth)/          # Unauthenticated screens (login, register)
├── (dashboard)/
│   ├── parent/      # Parent-only tabs (home, journal, ai-insight, settings)
│   └── child/       # Child-only tabs (home, ai-helper, games, chat, settings)
└── _layout.tsx      # Root with AuthProvider wrapper
```

**Child Navigation Structure** (5 tabs):
- `home` - Dashboard with quick access cards (mood, activities, achievements, learning)
- `ai-helper` - AI counselor with mood-based responses and chat interface
- `games` - Fun activities and educational games
- `chat` - Chat with AI, siblings, and parents (family messaging)
- `settings` - Profile, password, schedule, mood history, logout button

**Hidden Child Routes** (accessible via navigation, not in tabs):
- `mood` - Mood check-in screen
- `activities` - Activity list with completion tracking
- `achievements` - Gamification stats and badges
- `learning` - Learning articles browser
- `schedule` - Daily schedule (placeholder)

**Auth Guard Pattern**: Each layout checks `useAuth()` role and redirects:
```tsx
if (role !== "parent") return <Redirect href="/(auth)/login" />;
```

**Context Providers**:
- `AuthContext` - Global auth state, login/logout, user data
- `MoodContext` - Child mood tracking (check-ins, history, stats)
- `GamificationContext` - Points, streaks, badges, levels (child only)
- `ActivityContext` - Activity management, completion tracking (child gets assigned, parent creates)
- `LearningContext` - Learning articles with categories/filters

**Child Layout Providers**: All child-specific contexts (Mood, Gamification, Activity, Learning) are wrapped in `app/(dashboard)/child/_layout.tsx`.

## Key Development Commands

### Backend (from `kivelo-backend/`)
```powershell
npm run dev          # Starts nodemon on port 5000
npm test             # Jest test suite
npm run migrate:ps   # Run DB migrations (PowerShell script)
```

### Frontend (from `kivelo-frontend/`)
```powershell
npm start            # Expo dev server
npm run android      # Launch Android emulator
npm run ios          # Launch iOS simulator
npm run web          # Web version
```

## Database Patterns

**MongoDB/Mongoose** with embedded and referenced relationships:
- Users embed role-specific data (`parent.familyCode`, `childDetails`)
- Parent/Child models reference User via `user` field (1-to-1)
- Parent has array of Child ObjectIds for fast lookup

**Index Strategy**: Unique indexes on `email`, `familyCode`, compound indexes for `family` + `role` queries.

## API Conventions

**Request Format**:
```javascript
{
  headers: {
    'Authorization': 'Bearer <jwt>',
    'x-api-key': '<api-key>',     // Required for all requests
    'Content-Type': 'application/json'
  }
}
```

**Response Format**:
```javascript
{
  success: boolean,
  message?: string,
  data?: any,
  token?: string  // For auth endpoints
}
```

**Error Handling**: Centralized in `middleware/errorHandler.js`, returns consistent JSON with status codes.

## File Upload Pattern

**Backend**: Uses Cloudinary for image storage (avatars, etc.)
- `services/cloudinaryService.js` - Handles uploads from disk or memory buffer
- `middleware/uploadMiddleware.js` - Multer configuration for multipart/form-data
- Files temporarily stored in `uploads/avatars/` before Cloudinary upload

**Frontend**: Uses Expo's image picker + base64 or FormData for uploads.

## Environment Variables

**Backend** (`kivelo-backend/.env`):
```
MONGODB_URI=<connection-string>
JWT_SECRET=<secret>
API_KEYS={"mobile":"<key>","web":"<key>"}
CLOUDINARY_URL=<cloudinary-config>
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

**Frontend**: Uses Expo environment system, API URLs hardcoded in `AuthContext.tsx`.

## Testing Strategy

- Backend: Jest tests in `__tests__/` directory
- Frontend: React Native Testing Library (setup in `__tests__/`)
- **No test mocks for role checks** - use real JWT tokens in tests

## Common Gotchas

1. **API Key Required**: All backend requests need `x-api-key` header, not just JWT (handled by backend middleware, not needed in frontend)
2. **Role Checks**: Use middleware (`isParent`, `isChild`) instead of inline checks
3. **Child Access**: Parents can't access arbitrary children - always use `hasAccessToChild` middleware
4. **One-Time Codes**: Expire in 1 hour, single-use only (`isCodeUsed` flag)
5. **AsyncStorage**: Frontend stores `kivelo_user`, `kivelo_access_token` keys
6. **Socket.io**: Initialized but underutilized - available at `utils/socket.js`
7. **Mood Tracking**: Child-only feature, requires authentication. Trust zones auto-calculated from moodScore (1-10)

## Adding New Features

**Backend Route Checklist**:
- [ ] Add controller in `controllers/`
- [ ] Import middleware: `auth`, role check, audit logger
- [ ] Add route in `routes/`, mount in `server.js`
- [ ] Add Swagger docs (JSDoc format)
- [ ] Update `docs/Documentations.md` if needed
**Frontend Screen Checklist**:
- [ ] Create file in `app/(dashboard)/{role}/`
- [ ] Import `useAuth()` for user context (or `useMood()` for mood features)
- [ ] Add API call to context provider (e.g., `AuthContext.tsx`, `MoodContext.tsx`)
- [ ] Handle loading states + error messages
- [ ] Update tab navigation in `_layout.tsx`

## Mood Tracking Feature

**Backend Endpoints** (`routes/mood.js`):
- `POST /api/v1/mood/checkin` - Submit mood (child only, requires emoji/text/voice/drawing)
- `GET /api/v1/mood/history?period=week&limit=50` - Get mood history
- `GET /api/v1/mood/today` - Check if child logged mood today
- `GET /api/v1/mood/stats` - Get mood statistics
- `PUT /api/v1/mood/:id` - Update mood entry
- `DELETE /api/v1/mood/:id` - Delete mood entry

**Trust Zones** (auto-calculated from moodScore 1-10):
- Green: 8-10 (happy/great)
- Yellow: 6-7 (okay/good)
- Orange: 4-5 (down)
- Red: 1-3 (sad/distressed)

**Frontend Pattern**:
```tsx
const { submitMood, getMoodHistory, getTodayMood } = useMood();
await submitMood({ emoji: "😊", textNote: "Great day!", moodScore: 9 });
```

**Rewards**: Child earns 10 points per mood check-in, updates streak counter.

## Gamification & Activities System

**Backend Endpoints** (`routes/gamification.js`, `routes/activity.js`):
- `GET /api/v1/gamification/stats` - Get points, streak, badges, level (child only)
- `GET /api/v1/gamification/badges` - Get available badges
- `POST /api/v1/gamification/award-points` - Parent awards points to child
- `POST /api/v1/gamification/rewards/redeem` - Child redeems reward (child only)
- `GET /api/v1/activity` - Get user activities (child: assigned, parent: created)
- `POST /api/v1/activity/:id/complete` - Mark activity complete (child only)

**Activity Categories**: education, physical, creative, chores, social, mindfulness
**Difficulty Levels**: easy, medium, hard

**Frontend Screens**:
- `app/(dashboard)/child/home.tsx` - Dashboard with stats bar (points, streak, badges) + 4 quick access cards
- `app/(dashboard)/child/settings.tsx` - Settings hub with profile, password, schedule, mood history, and logout button
- `app/(dashboard)/child/ai-helper.tsx` - AI chat with mood-based counseling and conversation interface
- `app/(dashboard)/child/chat.tsx` - Family messaging (AI, siblings, parents) with tabs and contact list
- `app/(dashboard)/child/activities.tsx` - Activity list with filter tabs (all/pending/completed)
- `app/(dashboard)/child/achievements.tsx` - Gamification stats, badges, level progress
- `app/(dashboard)/child/learning.tsx` - Learning articles with category filters
- `app/(dashboard)/child/mood.tsx` - Mood check-in with emoji selection (hidden from tabs)
- `app/(dashboard)/child/schedule.tsx` - Placeholder (coming soon, accessible from settings)

**Frontend Pattern**:
```tsx
const { stats, getStats, refreshStats } = useGamification();
const { activities, completeActivity } = useActivity();
await completeActivity(activityId);
await refreshStats(); // Update points after completion
```

**Points System**: 
- Mood check-in: 10 points
- Activity completion: Points vary by activity
- Level calculation: `Math.floor(points / 100) + 1`

## Learning Hub Feature

**Backend Endpoints** (`routes/learning.js`):
- `GET /api/v1/learning/articles?category=X&difficulty=Y&page=1&limit=10` - Get articles with filters
- `GET /api/v1/learning/articles/:id` - Get article with quiz questions
- `POST /api/v1/learning/articles/:id/complete` - Mark article complete

**Article Categories**: parenting, child_development, education, health, behavior
**Difficulty Levels**: beginner, intermediate, advanced

**Frontend Pattern**:
```tsx
const { articles, getArticles, markComplete } = useLearning();
await getArticles({ category: 'education', limit: 10 });
await markComplete(articleId);
```

## AI Helper & Chat System

**AI Helper Features**:
- Mood-based personalized greetings (detects today's mood check-in)
- Real-time chat interface with conversation history
- Quick action buttons (feeling good, need support, homework help, ask questions)
- Counseling responses based on mood score (1-10 scale)
- Safe and private conversations

**Chat System Structure** (`app/(dashboard)/child/chat.tsx`):
- **Two tabs**: AI Helper and Family
- **AI Tab**: Quick action cards for mood support, homework help, general chat, questions
- **Family Tab**: Contact list with parents and siblings (future feature)
- **Contact Types**: ai (AI Friend), parent (Mom/Dad), sibling (brothers/sisters)
- Online status indicators and last message preview

**Mood-Based AI Responses**:
- Happy (8-10): Encouraging and celebratory
- Okay (6-7): Supportive and curious
- Down (4-5): Empathetic and listening
- Sad (1-3): Comforting and caring

**Settings Screen Features**:
- Profile management (name, email display)
- Password change access
- App features quick access (schedule, mood history)
- Notification settings
- Help center and app info
- **Logout button** (requires confirmation to discourage frequent logouts)

## Design Patterns

**Child UI Philosophy**:
- Clean, uncluttered interface with only 5 bottom tabs
- Large, colorful cards with emojis for visual appeal
- Hidden routes for secondary features (accessible via home cards or settings)
- Logout hidden in settings to discourage frequent sign-outs
- Mood-aware AI that adapts to child's emotional state

## Documentation

- `docs/Documentations.md` - API endpoint reference (500+ lines)
- `docs/WORKFLOW.md` - Git workflow for this repo
- Swagger docs available at `http://localhost:5000/api-docs` when backend running
