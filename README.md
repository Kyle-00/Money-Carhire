# Money Carhire

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Admin Access](#admin-access)
- [Features in Detail](#features-in-detail)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Money Carhire is a full-featured car rental platform designed for the Kenyan market. The application allows customers to browse luxury vehicles, submit booking requests, and receive real-time confirmations. Administrators can manage bookings, update vehicle availability, and track rental performance through an interactive dashboard.

### Why This Architecture

The system is built using a hybrid approach combining:

- **Object-Oriented Programming (OOP)** – for stateful business entities (Vehicles, Bookings, Fleet Management)
- **Functional Programming (FP)** – for pure, stateless helper functions (formatting, validation, business logic)

This separation ensures:

- **Maintainability** – each file is small (under 150 lines) and focused on a single responsibility
- **Testability** – pure functions are easily unit-tested
- **Scalability** – new features can be added without affecting existing code
- **Readability** – clear separation of concerns makes the codebase easy to navigate

---

## Key Features

### For Customers

- **Browse Fleet** – view all available vehicles with images, pricing, and specifications
- **Real-Time Availability** – check vehicle availability based on selected dates
- **Booking Requests** – submit bookings with pickup/delivery options
- **Instant Confirmation** – receive email confirmation within 2 hours (via EmailJS or mailto: fallback)
- **WhatsApp Support** – quick chat support via floating WhatsApp button
- **Dark Mode** – toggle between light and dark themes

### For Admin/Owner

- **Secure Authentication** – username + password login with session management
- **Booking Dashboard** – real-time overview of all bookings with filters
- **Interactive Charts** – visual booking activity with axis and day labels
- **Fleet Management** – update vehicle status (Available/Booked/Maintenance)
- **Date-Range Availability** – vehicles are only marked booked for overlapping dates
- **CSV Export** – export booking data for offline analysis
- **Quick Stats** – most popular car, today's bookings, average rental days
- **Status Management** – change booking status (Pending/Confirmed/Completed/Cancelled)
- **Keyboard Shortcut** – Ctrl+Shift+A for quick admin access

### Technical Highlights

- **Modular Architecture** – separated into helpers, services, classes, and UI modules
- **Real-Time Updates** – Firebase Firestore for live data synchronization
- **Responsive Design** – mobile-first approach for all devices
- **Progressive Enhancement** – email fallback when EmailJS is unavailable
- **Local Storage** – persistent dark mode and vehicle availability

---

## Technology Stack

| Technology | Purpose |
| --- | --- |
| HTML5/CSS3 | Structure and styling with custom properties |
| JavaScript (ES2021+) | Core functionality with modules |
| Firebase Firestore | Real-time database for bookings |
| Firebase Analytics | Usage tracking (optional) |
| EmailJS | Email notifications |
| Font Awesome | Icons and visual elements |
| Jest | Unit testing |
| Babel | ES module transpilation for testing |
| Vite | Build tool and development server |

---

## Project Structure

```text
Money-Carhire/
├── config.js                  # Configuration (Firebase, EmailJS, Admin)
├── vehicles.json              # Vehicle data (static)
├── index.html                 # Homepage
├── booking.html                # Booking form
├── contact.html                # Contact page
├── admin.html                  # Admin dashboard
├── admin-fleet.html           # Fleet management panel
├── admin-login.html           # Admin login page
├── style.css                   # Global styles
├── responsive.css             # Responsive styles
├── package.json                # Dependencies and scripts
├── babel.config.js            # Babel configuration
├── .gitignore                  # Git ignore file
├── README.md                   # Documentation
│
├── scripts/
│   ├── app.js                  # Main orchestrator
│   ├── admin-guard.js          # Authentication guard
│   │
│   ├── helpers/                # Functional Programming (Pure Functions)
│   │   ├── dom-helpers.js          # DOM manipulation utilities
│   │   ├── format-helpers.js       # Formatting functions
│   │   ├── validation-helpers.js   # Validation functions
│   │   └── business-helpers.js     # Business logic functions
│   │
│   ├── services/                # API and External Services
│   │   ├── firebase-service.js     # Firebase CRUD operations
│   │   ├── email-service.js        # EmailJS integration with fallback
│   │   └── vehicle-service.js      # Vehicle data operations
│   │
│   ├── classes/                 # Object-Oriented Programming
│   │   ├── Vehicle.js              # Vehicle entity
│   │   ├── Booking.js              # Booking entity
│   │   ├── FleetManager.js         # Fleet management (Singleton)
│   │   └── AdminDashboard.js       # Admin dashboard logic
│   │
│   └── ui/                      # UI Components
│       ├── dark-mode.js            # Dark mode toggle
│       ├── navbar.js               # Navigation menu
│       ├── hero-ui.js              # Hero section date picker
│       ├── testimonials.js         # Testimonial slider
│       ├── common-ui.js            # Common components (back-to-top, lazy load)
│       ├── fleet-ui.js             # Fleet display and filtering
│       ├── booking-ui.js           # Booking form with availability check
│       ├── admin-ui.js             # Admin login and fleet management
│       └── contact.js              # Contact form
│
├── assets/                    # Images and media
│   └── images/
│       ├── G-wagon.jpg
│       ├── BMW X6.jpg
│       ├── range roverr sport.webp
│       ├── benz E350.jpg
│       ├── audi a5.jpg
│       ├── mazda cx5.jpg
│       ├── mark x.jpg
│       ├── toyota fielder.jpg
│       ├── mazda axela.jpg
│       └── mazda demio.jpg
│
├── tests/                      # Unit tests
│   └── helpers.test.js            # Helper function tests
│
└── dist/                       # Build output (when using Vite)
```

---

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account (for Firestore)
- EmailJS account (for email notifications)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Kyle-00/money-carhire.git
cd money-carhire
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Firebase

1. Go to the Firebase Console.
2. Create a new project (or use an existing one).
3. Enable Firestore Database.
4. Copy your Firebase config.
5. Update `config.js` with your credentials:

```javascript
// config.js
firebase: {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

### Step 4: Configure EmailJS

1. Sign up at EmailJS.
2. Create a service and two templates (customer and owner).
3. Update `config.js` with your credentials:

```javascript
// config.js
emailjs: {
  publicKey: 'YOUR_PUBLIC_KEY',
  serviceId: 'YOUR_SERVICE_ID',
  customerTemplate: 'TEMPLATE_CUSTOMER',
  ownerTemplate: 'TEMPLATE_OWNER',
  ownerEmail: 'your-email@example.com'
}
```

### Step 5: Set Admin Credentials

Update `config.js` with your admin credentials:

```javascript
// config.js
admin: {
  username: 'owner',  // Change this
  password: 'CHANGE_ME'  // Change this to a strong password
}
```

### Step 6: Run the Application

**Development (using Live Server):**

```bash
npx live-server
```

---

## Configuration

### `config.js` – Complete Configuration

```javascript
window.CONFIG = {
  // Firebase Configuration
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  },

  // EmailJS Configuration
  emailjs: {
    publicKey: 'YOUR_PUBLIC_KEY',
    serviceId: 'YOUR_SERVICE_ID',
    customerTemplate: 'template_ho9ezeu',
    ownerTemplate: 'template_jtnrwul',
    ownerEmail: 'moneycarhire@gmail.com'
  },

  // Admin Configuration
  admin: {
    username: 'owner',     // Admin username
    password: 'CHANGE_ME'  // Admin password
  },

  // Business Rules
  deliveryFee: 1000  // KSh 1,000 delivery fee
};
```

> **Security note:** Real Firebase and EmailJS keys, along with the admin password, should never be committed to a public repository. Use environment variables or a gitignored config for production credentials.

---

## Admin Access

### Login Credentials

- **Username:** as configured in `config.js`
- **Password:** as configured in `config.js`

### Access Methods

- Admin Login Page: `/admin-login.html`
- Keyboard Shortcut: press Ctrl+Shift+A on any page
- Direct Navigation: use the "Admin" link in the navigation

### Admin Pages

- Dashboard: `/admin.html` – view and manage bookings
- Fleet Management: `/admin-fleet.html` – update vehicle availability

### Session Management

- Session persists via `sessionStorage`
- Auto-redirects to login if not authenticated
- Logout clears session and redirects to login

---

## Features in Detail

### Date-Range Availability

Unlike traditional systems that mark vehicles as simply "Booked" or "Available", Money Carhire uses intelligent date-range checking:

- Vehicles are only blocked for overlapping dates
- Example: a confirmed booking for June 23–25 leaves the vehicle still available for June 20–22
- Multiple bookings are allowed for the same vehicle as long as dates don't overlap
- Real-time availability message shown on the booking form
- Next booking dates displayed on car cards

### Admin Dashboard Charts

The booking activity chart displays 7 days of data with:

- **Axis Line** – bottom border for visual reference
- **Day Labels** – Mon, Tue, Wed, etc. below each bar
- **Color Coding** – green bars for confirmed bookings, gold for pending-only
- **Tooltips** – hover to see booking count and confirmed count
- **Responsive** – height adjusts for mobile/tablet views

### Booking Statuses

| Status | Description |
| --- | --- |
| Pending | New booking awaiting admin confirmation |
| Confirmed | Booking confirmed, car blocked for those dates |
| Completed | Rental completed successfully |
| Cancelled | Booking cancelled, car released for those dates |

### Email Notifications

Two email types are sent:

- **Customer Email** – booking confirmation and details
- **Owner Email** – notification of new booking

**Fallback:** if EmailJS fails, a `mailto:` window opens with the booking details.

---

## Development

### Coding Standards

- **JavaScript:** ES2021+ with modules
- **CSS:** custom properties with dark mode support
- **HTML:** semantic HTML5 with accessibility attributes
- **Naming:** camelCase for variables/functions, PascalCase for classes

### File Guidelines

| Type | Max Lines | Purpose |
| --- | --- | --- |
| Helpers | 50–80 | Pure functions only |
| Services | 80–120 | External API wrappers |
| Classes | 120–150 | OOP entities with state |
| UI | 80–120 | Component initialization |
| App | 100–150 | Orchestrator only |

### Adding a New Feature

1. Add to Helpers (if pure function) → `scripts/helpers/`
2. Add to Services (if API call) → `scripts/services/`
3. Add to Classes (if stateful) → `scripts/classes/`
4. Add to UI (if component) → `scripts/ui/`
5. Import in `app.js` → register in `_initUI()` or `init()`

---

## Testing

### Unit Tests (Jest + Babel)

The system includes unit tests for helper functions using Jest with Babel for ES module support.

**Running Tests:**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch
```

**Test Coverage:**

Current tests cover:

- `formatKSh()` – currency formatting
- `daysBetween()` – date difference calculation
- `validateEmail()` – email validation
- `validatePhone()` – phone number validation

**Test File Example:**

```javascript

// tests/helpers.test.js
import { formatKSh, validateEmail } from '../scripts/helpers/format-helpers.js';

describe('formatKSh', () => {
  test('formats numbers with Kenyan Shilling prefix', () => {
    expect(formatKSh(50000)).toBe('KSh 50,000');
  });
});
```

---

## Deployment

### Option 1: Deploy to Firebase Hosting

```bash
# Build the project
npm run build

# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting

# Deploy
firebase deploy
```

### Option 2: Deploy to Netlify/Vercel

1. Push code to GitHub.
2. Connect repository to Netlify/Vercel.
3. Configure build command: `npm run build`
4. Publish directory: `dist/`

### Option 3: Manual Deployment

1. Build the project: `npm run build`
2. Upload the `dist/` folder to your web server.
3. Ensure `config.js` is properly configured for production.

---

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature`
3. Make changes following coding standards.
4. Write tests for new functionality.
5. Commit changes with clear messages:
   - `feat:` – new feature
   - `fix:` – bug fix
   - `refactor:` – code restructure
   - `chore:` – maintenance tasks
   - `docs:` – documentation updates
   - `style:` – CSS/formatting changes
6. Push and open a Pull Request.

### Commit Message Format

```text
<type>(scope): <description>

<optional body>

<optional footer>
```

Example:

```text
feat(booking): add real-time availability check

- Add date overlap detection in FleetManager
- Show availability message on booking form
- Disable submit button when unavailable
```

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
