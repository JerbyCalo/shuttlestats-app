# 🏸 ShuttleStats

A modern badminton training tracker built with Firebase and deployed on Vercel.

## Features

- **Training Session Tracking**: Record and analyze your badminton training sessions
- **Performance Analytics**: Visual charts showing your progress over time
- **Match Recording**: Keep track of your competitive matches
- **Schedule Management**: Plan and organize your training sessions
- **Real-time Sync**: All data synced across devices using Firebase Firestore
- **User Authentication**: Secure login with email/password or Google

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (ES6 modules)
- **Backend**: Firebase Firestore (NoSQL database)
- **Authentication**: Firebase Auth
- **Hosting**: Vercel
- **Charts**: Custom SVG-based line charts
- User registration and login
- Role-based access (Player vs Coach)
- Secure local storage of user data

### Dashboard

- **Role-based UI:** Different interfaces for players and coaches
- **Sliding Navigation:** Modern sidebar that slides in/out with hamburger menu
- **Responsive Design:** Works on desktop, tablet, and mobile devices
- **Quick Actions:** Easy access to common features
- **Performance Charts:** Visual representation of training data
- **Activity Feed:** Recent training and match activities

### Player Features

- Personal progress tracking
- Achievement system
- Goal setting and monitoring
- Training session logging
- Match recording

### Coach Features

- Player management
- Training plan creation
- Performance monitoring
- Feedback system
- Detailed reports

## 🗂️ Project Structure

```
ShuttleStats/
├── index.html              # Landing page with login/signup
├── dashboard.html          # Main dashboard interface
├── css/
│   ├── style.css          # Landing page styles
│   └── dashboard-style.css # Dashboard styles
├── js/
│   └── app.js             # Main application logic
└── assets/                # Images, icons, etc. (for future use)
```

## 🚀 Getting Started

1. **Download/Clone** the project files
2. **Open** `index.html` in your web browser
3. **Login** using demo accounts or create a new account
4. **Explore** the dashboard features

### Demo Accounts

| Role   | Email                   | Password    |
| ------ | ----------------------- | ----------- |
| Player | practice@gmail.com      | password123 |
| Coach  | coachpractice@gmail.com | password123 |

## 💻 Technical Details

### Built With

- **HTML5** - Structure and semantics
- **CSS3** - Styling, animations, and responsive design
- **Vanilla JavaScript** - Application logic and interactivity
- **LocalStorage API** - Data persistence

### Key JavaScript Classes

- `AuthManager` - Handles authentication and user management
- `ModalManager` - Manages modal dialogs
- `SidebarManager` - Controls sliding navigation
- `LandingPage` - Manages landing page functionality
- `DashboardPage` - Handles dashboard features

### Features

- **No Dependencies** - Pure web technologies, no frameworks required
- **Offline Capable** - Works without internet connection
- **Cross-Browser Compatible** - Supports modern browsers
- **Mobile Responsive** - Touch-friendly interface

## 🎯 Navigation Features

### Sliding Sidebar

- **Hidden by default** for clean interface
- **Click hamburger button** to reveal navigation
- **Animated transitions** with smooth slide effects
- **Auto-close on mobile** when selecting menu items
- **Keyboard shortcuts** (Escape to close)
- **Backdrop overlay** prevents interaction with main content

### User Experience

- **Role-based menus** show relevant options
- **Visual feedback** with hover states and animations
- **Accessible design** with proper ARIA labels
- **Touch-friendly** controls for mobile devices

## 📱 Responsive Design

- **Desktop:** Full sidebar and expanded interface
- **Tablet:** Optimized spacing and touch targets
- **Mobile:** Collapsible navigation and stacked layout

## 🔧 Customization

The application is built with clean, modular code that's easy to customize:

1. **Styling:** Modify CSS files to change appearance
2. **Features:** Add new functionality in `app.js`
3. **Layout:** Update HTML structure as needed
4. **Data:** Currently uses localStorage, easily replaceable with API calls

## 🌐 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

---

**ShuttleStats** - Making badminton training more organized, efficient, and data-driven! 🏸

---

## Firebase Setup (Auth + Firestore)

ShuttleStats now uses Firebase for authentication and data.

- Create a Firebase project and enable Email/Password and Google sign-in in Authentication.
- Add your deployment domains (Vercel preview/prod and localhost) to Authorized domains.
- Create a Web App and copy config into `js/firebase-config.js` (already populated for this repo).
- Firestore: start in production mode and add rules similar to below.

Suggested security rules (paste in Firebase Console > Firestore Rules):

```
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		function isSignedIn() { return request.auth != null; }
		function isOwner() { return request.auth != null && request.auth.uid == resource.data.userId; }
		function isOwnerWrite() { return request.auth != null && request.auth.uid == request.resource.data.userId; }

		// User profile: users/{uid}
		match /users/{uid} {
			allow read, write: if request.auth != null && request.auth.uid == uid;
		}

		// Collections scoped by userId
		match /training_sessions/{id} {
			allow read: if isSignedIn() && isOwner();
			allow create, update: if isSignedIn() && isOwnerWrite();
			allow delete: if isSignedIn() && isOwner();
		}

		match /matches/{id} {
			allow read: if isSignedIn() && isOwner();
			allow create, update: if isSignedIn() && isOwnerWrite();
			allow delete: if isSignedIn() && isOwner();
		}

		match /schedule_sessions/{id} {
			allow read: if isSignedIn() && isOwner();
			allow create, update: if isSignedIn() && isOwnerWrite();
			allow delete: if isSignedIn() && isOwner();
		}

		match /goals/{id} {
			allow read: if isSignedIn() && isOwner();
			allow create, update: if isSignedIn() && isOwnerWrite();
			allow delete: if isSignedIn() && isOwner();
		}
	}
}
```

Notes:
- Ensure each document has a `userId` field matching the authenticated user.
- If Firestore asks for an index on first run, follow the link to create it.

## Deployment (Vercel)

- `vercel.json` redirects `/` to `index.html` and sets basic security headers.
- Add a `404.html` (included) for clean not-found handling.
- If you later add CSP, externalize inline scripts or use nonces to avoid breaking pages.

## Frontend Structure Update

- Feature pages (`training.html`, `matches.html`, `schedule.html`, `dashboard.html`) are driven by ES modules (`auth-service`, `data-service`, and page-specific managers). The legacy `js/app.js` is no longer included on these pages to prevent duplication.
- Landing page (`index.html`) links to `login.html` for authentication, removing modal duplication.
