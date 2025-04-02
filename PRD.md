# CRM App Product Requirements Document (PRD)

## 1. Overview

### 1.1 Purpose
A lightweight, locally-hosted Customer Relationship Management (CRM) application designed for a single user to manage up to 500 prospects and customers. The app enables tracking of interactions, scheduling future contacts, filtering by product/service interest, and reporting on sales metrics, with all data stored locally in an encrypted database.

### 1.2 Target Audience
- User: Solo entrepreneur or sales professional (single user).
- Use Case: Managing sales prospects/customers offline on a Windows machine.

### 1.3 Platform
Windows desktop application.

### 1.4 Key Constraints
- No cloud storage; all data saved locally.
- MVP to be completed within 2 weeks by the user (self-built).

## 2. Features

### 2.1 Prospect/Customer Management

#### Description
Manage profiles for prospects and customers with detailed information and search capabilities.

#### Fields
- Name: First Name, Last Name
- Company Name: Optional text
- Email Address: Text
- Phone Number: Text
- Address: Optional (Street, City, State, ZIP)
- Role: Text (e.g., CEO, Sales Manager)
- Status: Dropdown (Prospect, Customer, Inactive)
- Notes: Free text

#### Functionality
- Add, edit, delete, and view profiles.
- Search by name, company, status, or role.
- Sort by name, date added, status, or role.

### 2.2 Contact Logging

#### Description
Log past interactions and offers submitted to prospects/customers, with a special category for offer submissions that include a value.

#### Fields
- Contact Date: Auto-populated (editable)
- Contact Type: Dropdown (Call, Email, Meeting, Offer Submission)
- Contact Details: Text (300-character limit)
- Value (EUR): Numeric field (only for "Offer Submission" type, default 0 for others)

#### Functionality
- Log new contacts tied to a profile.
- View contact history in a timeline or list.
- Edit or delete past contacts.
- Print planned contacts for a user-defined period (e.g., next 7 days, this month).
- "Offer Submission" contacts contribute to "Opportunity Value" calculations.

### 2.3 Calendar Integration

#### Description
Schedule and manage future contacts with a built-in calendar.

#### Fields (Scheduled Contacts)
- Date and Time: Datepicker and time selector
- Contact Type: Dropdown (Call, Email, Meeting, Offer Submission)
- Reminder: Optional (e.g., 1 day before, 1 hour before)
- Description: Text (300-character limit)
- Value (EUR): Numeric field (only for "Offer Submission" type, default 0 for others)

#### Functionality
- Add, edit, or delete scheduled contacts.
- Display upcoming contacts on a calendar (monthly, weekly, daily) and in a "To-Do" list.
- Mark scheduled contacts as completed (moves to contact history with current date).
- Print planned contacts for a specified period.

### 2.4 Product/Service Interest Tracking

#### Description
Track which products/services prospects/customers are interested in and filter accordingly.

#### Fields
- Products/Services: Multi-select dropdown or checkboxes

#### Functionality
- Associate products/services with each profile.
- Filter profiles by product/service interest (e.g., "Show all interested in ECDH").
- Display interest summary on the dashboard.

### 2.5 Admin Panel

#### Description
Manage the list of available products/services securely.

#### Features
- Add, edit, or delete products/services (name, description).
- Password-protected access (user-defined).

#### Functionality
- Updates propagate to product/service selections in profiles.
- Confirmation required when deleting products tied to profiles.

### 2.6 Local Data Storage

#### Description
Store all data locally in an encrypted SQLite database.

#### Features
- Database: SQLite with SQLCipher encryption.
- Security: Mandatory encryption with a user-defined password (required on startup).
- Backup: Automatic backup on app close (e.g., crm_data_backup_[timestamp].db) in the same folder.
- Manual Export: Option to export data (e.g., .db or .csv).

#### Functionality
- Save all changes locally.
- Load encrypted data on startup after password entry.

### 2.7 Dashboard

#### Description
Provide a quick overview of key metrics for sales tracking.

#### Metrics
- Number of Interested Prospects/Customers per Product/Service: Bar chart or list.
- Number of Contacts Made This Month: Total count.
- Number of Meetings (Past and Planned) This Month: Separate counts.
- Number of Offers Submitted: Counts for month, quarter, year.
- Opportunity Value (EUR): Sum of "Value (EUR)" from "Offer Submission" contacts for current quarter and year.
- Suggested Extra: "Top 5 Active Prospects" (based on recent contacts or opportunity value).

#### Functionality
- Refreshable stats with filters (e.g., by month, quarter).

## 3. User Interface (UI)

### 3.1 Main Dashboard
- Stats overview (as per 2.7).
- Search bar (name, company, role, status).
- Buttons: Add Profile, View Calendar, Admin Settings.

### 3.2 Profile View
- Tabs: Details, Contact History, Scheduled Contacts, Product/Service Interest.
- Buttons: Edit, Delete, Log Contact, Schedule Contact.

### 3.3 Calendar View
- Monthly grid with clickable dates.
- Sidebar with "Upcoming Contacts" and "Print Planned Contacts" button.

### 3.4 Admin Panel
- Table of products/services with Add/Edit/Delete buttons.
- Password prompt on entry.

## 4. Technical Requirements

### 4.1 Frontend
- Framework: Electron (JavaScript/HTML/CSS).
- UI Style: Simple and functional.

### 4.2 Backend
- Database: SQLite with SQLCipher for encryption.

### 4.3 Libraries
- Calendar: FullCalendar.
- Charts: Chart.js (for dashboard).
- Encryption: SQLCipher.

### 4.4 Future Considerations
- Design database schema for potential cloud sync (e.g., unique IDs, updated_at timestamps).

## 5. Database Schema

```sql
-- Profiles Table
CREATE TABLE profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    role TEXT,
    status TEXT NOT NULL,
    notes TEXT
);

-- Contacts Table (Past Interactions)
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., Call, Email, Meeting, Offer Submission
    details TEXT(300),
    value_eur REAL DEFAULT 0, -- For Offer Submission
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- Scheduled Contacts Table
CREATE TABLE scheduled_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    date_time TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., Call, Email, Meeting, Offer Submission
    reminder TEXT,
    details TEXT(300),
    value_eur REAL DEFAULT 0, -- For Offer Submission
    completed INTEGER DEFAULT 0,
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- Products Table
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
);

-- Profile-Product Interest Table (Many-to-Many)
CREATE TABLE profile_products (
    profile_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    PRIMARY KEY (profile_id, product_id)
);
```

## 6. Development Timeline (2-Week MVP)

### Week 1
#### Day 1-3: Setup & Core
- Install Electron, SQLite, SQLCipher.
- Create database schema and test encryption.
- Build UI for profiles (add/view with role).

#### Day 4-6: Contacts & Calendar
- Add contact logging (with "Offer Submission" and value).
- Build calendar with scheduling and print feature.

### Week 2
#### Day 7-9: Products & Admin
- Add product/service tracking and filtering.
- Build admin panel with password protection.

#### Day 10-12: Dashboard & Polish
- Create dashboard with metrics (offers, opportunity value).
- Add search by role and backup on close.

#### Day 13-14: Testing & Deployment
- Test functionality (e.g., 300-char limit, encryption).
- Package as .exe for Windows.
- Write basic user guide.

## 7. Success Criteria
- MVP supports up to 500 profiles with all features functional.
- Data is encrypted and password-protected.
- Dashboard accurately reflects metrics (e.g., opportunity value from offers).
- App runs smoothly on Windows with no crashes.

## 8. Future Enhancements
- Cloud Sync: Add REST API compatibility for cloud integration.
- Additional Reports: Exportable reports (e.g., CSV of all offers).
