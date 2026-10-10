# 🎬 Video Streaming Backend — MERN Stack

A RESTful video streaming backend built with **Node.js, Express.js, MongoDB, and Mongoose**. This project provides the core backend functionality for a video-sharing platform, including user authentication, video uploads, HTTP range-based streaming, likes, comments, and channel subscriptions.

## 🛠️ Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white" alt="Mongoose" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="npm" />
</p>

## ✨ Features

- **Authentication & Authorization:** User registration and login with JWT-based authentication and bcrypt password hashing.
- **Video Uploads:** Upload video files using Multer with configurable file-size limits and supported-format validation.
- **Video Streaming:** HTTP byte-range streaming with partial content responses (`206 Partial Content`), enabling browser playback and seeking.
- **Video Management:** Create, browse, search, update, and delete videos.
- **Pagination:** Retrieve videos in manageable pages.
- **Likes:** Toggle likes on videos for authenticated users.
- **Comments:** Add, retrieve, and delete comments.
- **Channel Subscriptions:** Subscribe to and unsubscribe from other users.
- **User Profiles:** Retrieve channel information and public videos.
- **Video Visibility:** Support for public and unlisted videos.
- **Error Handling:** Centralized API error handling and meaningful HTTP status codes.
- **MongoDB Integration:** Store users, video metadata, likes, subscriptions, and comments.

## 📁 Project Structure

```text
video-streaming/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── upload.middleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Video.js
│   │   └── Comment.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── video.routes.js
│   │   ├── comment.routes.js
│   │   └── user.routes.js
│   ├── utils/
│   │   └── asyncHandler.js
│   ├── app.js
│   └── server.js
├── uploads/
│   └── .gitkeep
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## ⚙️ Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) — version 18 or later
- [npm](https://www.npmjs.com/)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) or a [MongoDB Atlas](https://www.mongodb.com/atlas) database
- [Postman](https://www.postman.com/) or another API client for testing endpoints

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ajinkya029/video-streaming.git
cd video-streaming
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file from the example:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Configure the values in `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/video_streaming
JWT_SECRET=your_generated_random_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
MAX_VIDEO_SIZE_MB=500
```

Generate a secure JWT secret using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the generated value into `JWT_SECRET`. If you're using MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

**Security:** Never commit your `.env` file or expose your JWT secret in a public repository.

### 4. Start the server

Development mode with automatic restarts:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

The server will be available at:

```text
http://localhost:5000
```

Verify that the API is running:

```http
GET http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "video-streaming-api"
}
```

## 📡 API Documentation

**Base URL:** `http://localhost:5000/api`

Protected routes require the following HTTP header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### 🔐 Authentication

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Log in and receive a JWT | No |
| GET | `/auth/me` | Get the authenticated user | Yes |

**Register request body:**

```json
{
  "username": "developer",
  "email": "developer@example.com",
  "password": "StrongPassword123"
}
```

**Login request body:**

```json
{
  "email": "developer@example.com",
  "password": "StrongPassword123"
}
```

Successful registration and login return a user object and a JWT token.

### 🎥 Videos

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/videos` | List public videos | No |
| POST | `/videos` | Upload a video | Yes |
| GET | `/videos/:id` | Get video details | No |
| GET | `/videos/:id/stream` | Stream a video | No |
| PATCH | `/videos/:id` | Update video metadata | Yes, owner only |
| DELETE | `/videos/:id` | Delete a video | Yes, owner only |
| POST | `/videos/:id/like` | Toggle a video like | Yes |

**Browse and search examples:**

```http
GET /api/videos?page=1&limit=12
GET /api/videos?q=music
GET /api/videos?owner=USER_ID
```

**Upload a video**

Send a `multipart/form-data` request to `POST /api/videos` with the following fields:

| Field | Type | Required |
|---|---|---|
| `video` | Video file | Yes |
| `title` | Text | Yes |
| `description` | Text | No |
| `tags` | JSON array or comma-separated text | No |
| `thumbnailUrl` | URL | No |
| `visibility` | `public` or `unlisted` | No |

Example using cURL:

```bash
curl -X POST http://localhost:5000/api/videos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=My First Video" \
  -F "description=My video streaming demo" \
  -F 'tags=["demo","mern"]' \
  -F "video=@./sample.mp4"
```

### 💬 Comments

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/videos/:id/comments` | List video comments | No |
| POST | `/videos/:id/comments` | Add a comment | Yes |
| DELETE | `/comments/:id` | Delete your comment | Yes, owner only |

**Add a comment:**

```json
{
  "text": "Great video!"
}
```

### 👥 Users and Subscriptions

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/users/:id` | Get a user profile | No |
| GET | `/users/:id/videos` | Get a user's public videos | No |
| POST | `/users/:id/subscribe` | Toggle a subscription | Yes |

## ▶️ Video Streaming

The streaming endpoint supports HTTP byte-range requests, allowing compatible video players to request specific portions of a video file.

```http
GET /api/videos/VIDEO_ID/stream
Range: bytes=0-1048575
```

A successful range request returns:

```http
HTTP/1.1 206 Partial Content
Accept-Ranges: bytes
Content-Range: bytes 0-1048575/TOTAL_FILE_SIZE
Content-Type: video/mp4
```

This supports seeking and progressive playback without requiring the entire file to be downloaded first.

### React video player example

```jsx
function VideoPlayer({ videoId }) {
  const streamUrl =
    `http://localhost:5000/api/videos/${videoId}/stream`;

  return (
    <video
      controls
      preload="metadata"
      src={streamUrl}
      style={{
        width: "100%",
        maxWidth: "900px",
        backgroundColor: "#000"
      }}
    >
      Your browser does not support HTML5 video.
    </video>
  );
}

export default VideoPlayer;
```

## 🧪 Testing the API

You can test the endpoints using Postman:

1. Register a new user.
2. Log in and copy the returned JWT token.
3. Set the `Authorization: Bearer YOUR_JWT_TOKEN` header for protected requests.
4. Upload a sample video using `multipart/form-data`.
5. Retrieve the uploaded video's ID from the response.
6. Test video playback using `/api/videos/VIDEO_ID/stream`.
7. Test likes, comments, video updates, deletion, and subscriptions.

## 🔒 Security Considerations

- Passwords are hashed using bcrypt before storage.
- Protected endpoints validate JWT tokens.
- Users can only update or delete their own videos and comments.
- Uploads are restricted by configured file-size limits and MIME types.
- Environment variables keep secrets and configuration outside source code.
- CORS can be configured through `CLIENT_ORIGIN`.

For a production deployment, add rate limiting, stricter upload validation, HTTPS, moderation, secure token lifecycle management, and additional security monitoring.

## 🚧 Future Improvements

- React frontend with a responsive video browsing interface
- Video thumbnail generation
- Cloud storage using Amazon S3 or an equivalent provider
- HLS/DASH adaptive bitrate streaming
- Video transcoding with FFmpeg
- Video recommendations and watch history
- Playlists and saved videos
- Channel avatars and profile editing
- Automated API tests
- Docker-based development and deployment

## ⚠️ Current Limitations

This repository implements the **backend API**, not a complete MERN application with a finished React frontend.

Videos are stored on the local filesystem. HTTP range streaming supports progressive playback and seeking, but adaptive bitrate streaming, video transcoding, cloud storage, and production-grade content delivery are not included.

## 👨‍💻 Author

**Ajinkya Dhatrak**

GitHub: [ajinkya029](https://github.com/ajinkya029)

Replace the placeholder links with your profile details.

## 📄 License

This project is available under the MIT License. Add a `LICENSE` file to the repository if you intend to distribute it under that license.
