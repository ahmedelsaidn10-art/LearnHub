# Backend integration notes

The app currently uses the local course catalog and browser storage. The active storage keys are kept in `js/services/learning-service.js`; do not rename them during the current frontend work, because existing browser data uses those keys.

When the backend is ready:

1. Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL`.
2. Match the proposed routes in `app-config.js` to the final backend routes and agree on response shapes.
3. Replace the local service calls with the prepared `*FromApi` functions in `course-service.js` and `learning-service.js`. The page modules currently use synchronous local storage, so their initial data loading and save handlers must be made asynchronous during that switch.
4. Remove `local-storage.js` and the local service implementations only after the API-backed pages are connected and verified.

Proposed routes (not yet connected):

- `GET /api/courses`
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/me/courses`, `POST /api/me/courses`, `DELETE /api/me/courses/:courseId`
- `GET /api/me/saved-courses`, `PUT /api/me/saved-courses/:courseId`, `DELETE /api/me/saved-courses/:courseId`
- `GET /api/me/course-progress/:courseId`, `PUT /api/me/course-progress/:courseId`

The route names and payload contracts are proposals until the backend is designed. Never store passwords or long-lived authentication tokens in localStorage; use the backend's secure session mechanism.

Expected response shapes for the prepared course and learning functions:

- `GET /api/courses` returns an array of courses or `{ "courses": [...] }`.
- `GET /api/me/courses` and `GET /api/me/saved-courses` return `{ "courseIds": ["..."] }`.
- `GET /api/me/course-progress/:courseId` returns `{ "completedLessonIds": ["..."] }`.
- Login and registration requests return a JSON object; login accepts `{ "email", "password", "rememberMe" }`. Session state should be sent with secure cookies.
