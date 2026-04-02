# Proofie Frontend

Modern React-based frontend for the Proofie creative proofing and collaboration tool.

## Features

- **Project Management**: Create and manage creative projects
- **Asset Versioning**: Upload and track multiple versions of creative assets
- **Annotation System**: Pin-point annotations with X/Y coordinates
- **Review Workflows**: Multi-stage approval cycles with feedback
- **Real-time Notifications**: Stay updated with project activity
- **User Profiles**: Manage user information and preferences

## Tech Stack

- **React 18**: UI framework
- **React Router v6**: Client-side routing
- **Zustand**: State management
- **Axios**: HTTP client
- **TailwindCSS**: Styling
- **Lucide React**: Icons
- **React Hot Toast**: Notifications
- **Vite**: Build tool

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build

```bash
npm run build
```

## Environment

The frontend is configured to proxy API requests to `http://localhost:8000/api` during development via Vite's proxy configuration.

## Project Structure

```
src/
├── components/        # Reusable UI components
├── pages/            # Page components
├── stores/           # Zustand state stores
├── services/         # API services
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## Key Components

- **Layout**: Main layout with sidebar and navbar
- **Navbar**: Top navigation with notifications and user menu
- **Sidebar**: Navigation menu
- **Login/Register**: Authentication pages
- **Dashboard**: Overview of projects and activity
- **Projects**: Project management
- **ProjectDetail**: Project-specific view with assets
- **AssetDetail**: Asset versioning and annotations
- **Workflows**: Review cycle management
- **Notifications**: Notification center
- **Profile**: User profile management

## API Integration

All API calls are made through the `api` service in `src/services/api.js`, which includes:
- Automatic token-based authentication
- Error handling and redirects
- Request/response interceptors

## State Management

The app uses Zustand for state management with two main stores:
- **authStore**: Authentication and user state
- **notificationStore**: Notifications and unread count

## Styling

The app uses TailwindCSS for styling with custom utility classes defined in `src/index.css`:
- `.btn-primary`, `.btn-secondary`, `.btn-danger`: Button styles
- `.card`: Card component style
- `.input-field`: Input field style
- `.badge`: Badge styles

## Authentication

- Token-based authentication using Django REST Framework tokens
- Tokens stored in localStorage
- Automatic logout on 401 responses
- Protected routes require authentication

## Deployment

Build the frontend:
```bash
npm run build
```

The `dist` folder contains the production-ready files that can be served by any static file server or integrated with your Django backend.

## Troubleshooting

### API Connection Issues
- Ensure Django backend is running on `http://localhost:8000`
- Check CORS settings in Django
- Verify proxy configuration in `vite.config.js`

### Authentication Issues
- Clear localStorage and try logging in again
- Check token expiration
- Verify backend token endpoint is working

### Build Issues
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear Vite cache: `rm -rf dist .vite`
