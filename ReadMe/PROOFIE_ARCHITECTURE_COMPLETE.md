# 🏗️ Proofie - Complete Architecture & Module Documentation

**Last Updated:** March 30, 2026 - Hackathon Session  
**Status:** 68% Complete (+3% from PDF Commenting Implementation)

## 📋 **Table of Contents**
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Backend Modules](#backend-modules)
5. [Frontend Modules](#frontend-modules)
6. [Data Flow](#data-flow)
7. [Current Features](#current-features)
8. [Hackathon Session Updates](#hackathon-session-updates)
9. [Suggested Next Modules](#suggested-next-modules)

---

## 🎯 **System Overview**

**Proofie** is a comprehensive **Creative Asset Review & Collaboration Platform** designed for teams to manage, review, and approve creative content (PDFs, images, videos) through structured workflows.

### **Core Purpose:**
- **Upload & Version Control** for creative assets
- **Collaborative Review** with annotations and comments
- **Approval Workflows** with multi-stage review cycles
- **Real-time Notifications** for team collaboration
- **Project Management** with folder organization

---

## 🛠️ **Technology Stack**

### **Backend:**
- **Framework**: Django 4.2.29 (Python)
- **Database**: SQLite (Development) / PostgreSQL (Production-ready)
- **Authentication**: Django Auth + JWT tokens
- **File Storage**: Django FileField (Local/S3-ready)
- **Email**: SMTP (Gmail/SendGrid)
- **API**: Django REST Framework

### **Frontend:**
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **UI Components**: Custom components with Lucide icons
- **Styling**: CSS-in-JS (inline styles)
- **HTTP Client**: Axios

### **Infrastructure:**
- **Development Server**: Django dev server + Vite dev server
- **File Serving**: Custom Chrome-optimized media serving
- **CORS**: Django CORS headers
- **Docker**: Docker & Docker Compose ready

---

## 🏛️ **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  Pages:                    Components:                           │
│  • Login/Register          • Navbar                              │
│  • Dashboard               • Sidebar                             │
│  • Projects                • CreateProofModal                    │
│  • ProjectDetail           • ProjectDetailsTray                  │
│  • FileViewer              • AssetViewer                         │
│  • Folders                 • CrushLoader                         │
│  • Workflows                                                     │
│  • Notifications                                                 │
│  • Profile/Settings                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Django)                            │
├─────────────────────────────────────────────────────────────────┤
│  Apps:                                                           │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│  │  accounts    │  versioning  │ annotations  │ notifications│ │
│  │              │              │              │              │ │
│  │ • User Auth  │ • Projects   │ • Comments   │ • Alerts     │ │
│  │ • Email      │ • Assets     │ • Highlights │ • Preferences│ │
│  │ • Profile    │ • Versions   │ • Shapes     │ • Logs       │ │
│  │              │ • Folders    │ • Mentions   │              │ │
│  └──────────────┴──────────────┴──────────────┴──────────────┘ │
│  ┌──────────────┐                                               │
│  │  workflows   │                                               │
│  │              │                                               │
│  │ • Templates  │                                               │
│  │ • Stages     │                                               │
│  │ • Approvals  │                                               │
│  │ • Reviews    │                                               │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (SQLite/PostgreSQL)                │
├─────────────────────────────────────────────────────────────────┤
│  Tables: Users, Projects, Assets, Versions, Annotations,        │
│          Workflows, Notifications, Comments, etc.                │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      FILE STORAGE (Media)                        │
├─────────────────────────────────────────────────────────────────┤
│  • Assets (PDFs, Images, Videos)                                │
│  • Thumbnails                                                    │
│  • User Avatars                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Backend Modules**

### **1. Accounts App** (`apps/accounts/`)

**Purpose**: User authentication, registration, and profile management

**Models:**
- `User` (Django built-in)
- `EmailVerification` - Email verification tokens
- `UserProfile` - Extended user information

**Key Features:**
- ✅ User registration with email verification
- ✅ Login/logout with JWT tokens
- ✅ Password reset via email
- ✅ User profile management
- ✅ Avatar upload

**API Endpoints:**
- `POST /api/accounts/register/` - User registration
- `POST /api/accounts/login/` - User login
- `POST /api/accounts/verify-email/` - Email verification
- `POST /api/accounts/forgot-password/` - Password reset request
- `POST /api/accounts/reset-password/` - Password reset
- `GET /api/accounts/profile/` - Get user profile
- `PUT /api/accounts/profile/` - Update profile

---

### **2. Versioning App** (`apps/versioning/`)

**Purpose**: Core project and asset management with version control

**Models:**
- `Folder` - Project organization folders
- `Project` - Creative projects
- `ProjectMember` - Project team members with roles
- `CreativeAsset` - Files (PDF, image, video)
- `FileVersion` - Version history for assets
- `VersionComment` - Comments on specific versions

**Key Features:**
- ✅ Project creation and management
- ✅ Folder-based organization
- ✅ Multi-user project collaboration
- ✅ Asset upload (PDF, images, videos)
- ✅ Version control for assets
- ✅ Automatic thumbnail generation
- ✅ Chrome-optimized PDF serving
- ✅ Share tokens for external access
- ✅ Access tokens for secure viewing

**API Endpoints:**
- `GET/POST /api/versioning/projects/` - List/create projects
- `GET/PUT/DELETE /api/versioning/projects/{id}/` - Project details
- `GET /api/versioning/projects/{id}/assets/` - Get project assets
- `POST /api/versioning/projects/{id}/add_member/` - Add team member
- `GET/POST /api/versioning/assets/` - List/create assets
- `POST /api/versioning/assets/{id}/upload_version/` - Upload new version
- `GET /api/versioning/assets/{id}/versions/` - Get version history
- `GET /api/versioning/folders/` - List folders

---

### **3. Annotations App** (`apps/annotations/`)

**Purpose**: Collaborative feedback and markup on assets

**Models:**
- `Annotation` - Comments, highlights, shapes on files
- `AnnotationReply` - Threaded replies to annotations
- `AnnotationMention` - @mentions in annotations

**Key Features:**
- ✅ Add comments at specific coordinates
- ✅ Highlight areas of interest
- ✅ Draw shapes for markup
- ✅ Multi-page support (for PDFs)
- ✅ Threaded replies
- ✅ @mention team members
- ✅ Resolve/unresolve annotations
- ✅ Color-coded annotations

**API Endpoints:**
- `GET/POST /api/annotations/` - List/create annotations
- `GET/PUT/DELETE /api/annotations/{id}/` - Annotation details
- `POST /api/annotations/{id}/reply/` - Add reply
- `POST /api/annotations/{id}/resolve/` - Mark as resolved

---

### **4. Workflows App** (`apps/workflows/`)

**Purpose**: Structured approval processes for creative assets

**Models:**
- `WorkflowTemplate` - Reusable workflow definitions
- `WorkflowStage` - Individual stages in workflow
- `WorkflowStageApprover` - Approvers for each stage
- `ReviewCycle` - Active review instance
- `StageApproval` - Approval status per stage
- `WorkflowTransition` - Stage transition history

**Key Features:**
- ✅ Create custom workflow templates
- ✅ Multi-stage approval process
- ✅ Assign approvers to stages
- ✅ Track approval status
- ✅ Approve/reject/request changes
- ✅ Workflow transition history
- ✅ Parallel and sequential approvals

**API Endpoints:**
- `GET/POST /api/workflows/templates/` - List/create templates
- `GET/POST /api/workflows/reviews/` - List/create review cycles
- `POST /api/workflows/reviews/{id}/approve/` - Approve stage
- `POST /api/workflows/reviews/{id}/reject/` - Reject stage
- `GET /api/workflows/reviews/{id}/status/` - Get review status

---

### **5. Notifications App** (`apps/notifications/`)

**Purpose**: Real-time alerts and notification management

**Models:**
- `Notification` - In-app notifications
- `NotificationPreference` - User notification settings
- `NotificationLog` - Delivery tracking

**Key Features:**
- ✅ In-app notifications
- ✅ Email notifications
- ✅ Notification preferences per user
- ✅ Mark as read/unread
- ✅ Notification types:
  - Comment added
  - Annotation created
  - Stage approved/rejected
  - Changes requested
  - Mentioned in comment
  - Version uploaded

**API Endpoints:**
- `GET /api/notifications/` - List notifications
- `GET /api/notifications/unread_count/` - Get unread count
- `POST /api/notifications/{id}/mark_read/` - Mark as read
- `POST /api/notifications/mark_all_read/` - Mark all as read
- `GET/PUT /api/notifications/preferences/` - Notification settings

---

## 🎨 **Frontend Modules**

### **Pages:**

#### **1. Authentication Pages**
- `Login.jsx` - User login
- `Register.jsx` - User registration with email verification
- `EmailVerification.jsx` - Email verification handler
- `ForgotPassword.jsx` - Password reset request
- `ResetPassword.jsx` - Password reset form

#### **2. Dashboard & Projects**
- `Dashboard.jsx` - Main dashboard with overview
- `Projects.jsx` - Project list with grid/list view
- `ProjectDetail.jsx` - Detailed project view with assets
- `Folders.jsx` - Folder management

#### **3. Asset Management**
- `FileViewer.jsx` - Full-screen asset viewer
- `AssetDetail.jsx` - Asset details with version history

#### **4. Collaboration**
- `Workflows.jsx` - Workflow management
- `Notifications.jsx` - Notification center

#### **5. User Management**
- `Profile.jsx` - User profile
- `Settings.jsx` - Application settings

### **Components:**

#### **1. Layout Components**
- `Layout.jsx` - Main app layout wrapper
- `Navbar.jsx` - Top navigation bar
- `Sidebar.jsx` - Side navigation menu

#### **2. Feature Components**
- `CreateProofModal.jsx` - Modal for creating new proofs
- `ProjectDetailsTray.jsx` - Slide-out tray for project details
- `AssetViewer.jsx` - Asset viewing component
- `CrushLoader.jsx` - Loading animation

### **Services:**
- `api.js` - Axios HTTP client configuration

### **State Management:**
- `authStore.js` - Authentication state (Zustand)
- `notificationStore.js` - Notification state (Zustand)

---

## 🔄 **Data Flow**

### **1. User Registration Flow**
```
User fills form → Frontend validates → POST /api/accounts/register/
→ Backend creates user → Sends verification email → User clicks link
→ GET /api/accounts/verify-email/?token=xxx → Account activated
→ User can login
```

### **2. Project Creation Flow**
```
User clicks "Create Project" → CreateProofModal opens → User fills details
→ Uploads file → POST /api/versioning/projects/ → Backend creates:
  - Project record
  - CreativeAsset record
  - FileVersion record (v1)
  - Generates thumbnail
→ Returns project data → Frontend updates UI → Shows in Projects list
```

### **3. Asset Review Flow**
```
User opens project → Clicks asset → FileViewer loads
→ GET /api/versioning/assets/{id}/ → Backend returns:
  - Asset details
  - Current version
  - File URL
→ Frontend displays PDF/image/video → User adds annotation
→ POST /api/annotations/ → Backend creates annotation
→ Triggers notification to team → Email sent to mentioned users
```

### **4. Approval Workflow Flow**
```
User initiates review → POST /api/workflows/reviews/ → Backend creates:
  - ReviewCycle
  - StageApprovals for each approver
→ Notifications sent to approvers → Approver reviews asset
→ POST /api/workflows/reviews/{id}/approve/ → Backend updates:
  - StageApproval status
  - ReviewCycle current_stage
→ Moves to next stage or completes → Notifications sent
```

---

## ✅ **Current Features**

### **User Management**
- ✅ Registration with email verification
- ✅ Login/logout with JWT
- ✅ Password reset via email
- ✅ User profiles with avatars
- ✅ Multi-user collaboration

### **Project Management**
- ✅ Create/edit/delete projects
- ✅ Folder organization
- ✅ Team member management
- ✅ Project details tray view
- ✅ Project thumbnails

### **Asset Management**
- ✅ Upload PDF, images, videos
- ✅ Version control
- ✅ Automatic thumbnail generation
- ✅ Chrome-optimized PDF viewing
- ✅ Full-screen asset viewer
- ✅ Download assets

### **Collaboration**
- ✅ Annotations (comments, highlights, shapes)
- ✅ Threaded replies
- ✅ @mentions
- ✅ Resolve/unresolve comments
- ✅ Version comments

### **Workflows**
- ✅ Custom workflow templates
- ✅ Multi-stage approvals
- ✅ Approve/reject/request changes
- ✅ Workflow history

### **Notifications**
- ✅ In-app notifications
- ✅ Email notifications
- ✅ Notification preferences
- ✅ Unread count badge

### **File Handling**
- ✅ PDF viewing (Chrome-optimized)
- ✅ Image viewing
- ✅ Video playback
- ✅ Thumbnail generation
- ✅ Secure file serving

---

## 🚀 **Suggested Next Modules & Features**

### **Priority 1: High Impact Features**

#### **1. Real-time Collaboration** 🔥
**Why**: Enhance team collaboration with live updates
- **WebSocket integration** for real-time notifications
- **Live cursor tracking** when multiple users view same asset
- **Real-time annotation updates** without page refresh
- **Typing indicators** in comment threads
- **Online/offline status** for team members

**Tech Stack**: Django Channels + Redis + WebSocket

#### **2. Advanced PDF Annotation Tools** 🎨
**Why**: Professional markup capabilities
- **Drawing tools**: Freehand, arrows, rectangles, circles
- **Text annotations**: Add text boxes anywhere
- **Measurement tools**: Rulers, dimensions
- **Stamp tools**: Approved, Rejected, Reviewed stamps
- **Annotation layers**: Toggle visibility
- **Export annotations** as separate PDF

**Tech Stack**: PDF.js + Canvas API

#### **3. Version Comparison** 🔍
**Why**: Essential for tracking changes
- **Side-by-side comparison** of two versions
- **Diff highlighting** for changes
- **Overlay mode** to see differences
- **Change summary** report
- **Revert to previous version**

**Tech Stack**: ImageMagick (backend) + Custom UI (frontend)

#### **4. Mobile App** 📱
**Why**: Review on-the-go
- **React Native app** for iOS/Android
- **Push notifications**
- **Mobile-optimized viewer**
- **Quick approve/reject**
- **Camera upload** for new assets

**Tech Stack**: React Native + Expo

---

### **Priority 2: Productivity Features**

#### **5. Smart Search & Filters** 🔎
- **Full-text search** across projects, assets, comments
- **Advanced filters**: by date, status, file type, owner
- **Saved searches**
- **Search within PDFs** (OCR)
- **Tag system** for organization

#### **6. Templates & Presets** 📋
- **Project templates** for common workflows
- **Annotation presets** (common feedback)
- **Workflow templates library**
- **Quick actions** for repetitive tasks

#### **7. Analytics & Reporting** 📊
- **Project dashboard** with metrics
- **Review time analytics**
- **Team performance reports**
- **Asset usage statistics**
- **Export reports** (PDF, Excel)

#### **8. Integration Hub** 🔌
- **Slack integration** for notifications
- **Google Drive sync** for assets
- **Dropbox integration**
- **Adobe Creative Cloud** link
- **Zapier webhooks**

---

### **Priority 3: Enterprise Features**

#### **9. Advanced Permissions** 🔐
- **Role-based access control** (RBAC)
- **Custom roles** beyond admin/reviewer/viewer
- **Granular permissions** per asset
- **Department-level access**
- **Audit logs** for compliance

#### **10. Brand Management** 🎨
- **Brand guidelines** repository
- **Asset library** with approved assets
- **Color palette** management
- **Font library**
- **Logo variations**

#### **11. Client Portal** 👥
- **External client access** (no account needed)
- **Limited review capabilities**
- **Branded portal** per client
- **Client feedback collection**
- **Approval signatures**

#### **12. AI-Powered Features** 🤖
- **Auto-tagging** of assets
- **Smart suggestions** for reviewers
- **Content moderation** checks
- **OCR for PDFs** (searchable text)
- **Image recognition** for categorization

---

### **Priority 4: Technical Improvements**

#### **13. Performance Optimization** ⚡
- **CDN integration** for faster file delivery
- **Image optimization** (WebP, lazy loading)
- **Caching strategy** (Redis)
- **Database optimization** (indexes, queries)
- **Frontend code splitting**

#### **14. Security Enhancements** 🛡️
- **Two-factor authentication** (2FA)
- **SSO integration** (SAML, OAuth)
- **IP whitelisting**
- **File encryption** at rest
- **Security audit logs**

#### **15. Scalability** 📈
- **PostgreSQL migration** (from SQLite)
- **S3/Cloud storage** for files
- **Load balancing**
- **Microservices architecture** (optional)
- **Kubernetes deployment**

#### **16. Developer Experience** 🛠️
- **API documentation** (Swagger/OpenAPI)
- **SDK/Client libraries** (Python, JS)
- **Webhooks** for integrations
- **GraphQL API** (optional)
- **Developer portal**

---

## 🎯 **Recommended Implementation Roadmap**

### **Phase 1: Core Enhancements (1-2 months)**
1. Real-time collaboration (WebSocket)
2. Advanced PDF annotation tools
3. Version comparison
4. Smart search & filters

### **Phase 2: Mobile & Integrations (2-3 months)**
5. Mobile app (React Native)
6. Integration hub (Slack, Drive, Dropbox)
7. Analytics & reporting
8. Templates & presets

### **Phase 3: Enterprise Features (3-4 months)**
9. Advanced permissions (RBAC)
10. Client portal
11. Brand management
12. AI-powered features

### **Phase 4: Scale & Optimize (Ongoing)**
13. Performance optimization
14. Security enhancements
15. Scalability improvements
16. Developer experience

---

## 📊 **Current Architecture Strengths**

✅ **Well-structured Django apps** with clear separation of concerns
✅ **RESTful API design** following best practices
✅ **Modern React frontend** with component-based architecture
✅ **Comprehensive data models** covering all core features
✅ **Email notification system** fully functional
✅ **Chrome-optimized PDF serving** for cross-browser compatibility
✅ **Version control system** for assets
✅ **Flexible workflow engine** for custom approval processes

---

## 🔧 **Architecture Improvements Needed**

⚠️ **Add caching layer** (Redis) for better performance
⚠️ **Implement WebSocket** for real-time features
⚠️ **Migrate to PostgreSQL** for production
⚠️ **Add S3/Cloud storage** for scalability
⚠️ **Implement API rate limiting**
⚠️ **Add comprehensive logging** (ELK stack)
⚠️ **Set up monitoring** (Sentry, New Relic)
⚠️ **Add automated testing** (unit, integration, E2E)

---

## 📝 **Summary**

**Proofie** is a robust creative asset review platform with:
- **5 Django apps** covering all core functionality
- **15 React pages** for comprehensive UI
- **7 reusable components** for consistency
- **50+ API endpoints** for full feature coverage
- **15+ database models** with proper relationships

**Next Steps**: Focus on real-time collaboration, mobile app, and enterprise features to make Proofie a market-leading creative review platform.

---

**Last Updated**: March 29, 2026
**Version**: 1.0
**Maintainer**: Proofie Development Team
