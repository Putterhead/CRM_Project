# CRM App Development To-Do List

## 1. Project Setup
- [ ] Install Node.js and npm on Windows.
- [ ] Install Visual Studio Code (or preferred IDE).
- [ ] Initialize an Electron project:
  - [ ] Run `npm init` in a new folder (e.g., crm-app).
  - [ ] Install Electron: `npm install electron --save-dev`.
  - [ ] Create `main.js` and `index.html` (basic window setup).
  - [ ] Test Electron app: Run `npx electron .` to launch a blank window.
- [ ] Commit changes:
  - [ ] `git add .`
  - [ ] `git commit -m "Initial Electron project setup"`
  - [ ] `git push origin main`

## 2. Database Setup with Encryption
- [ ] Install SQLite and SQLCipher:
  - [ ] `npm install sqlite3`
  - [ ] Install SQLCipher (e.g., via prebuilt binaries or compile for Windows).
- [ ] Create database schema (from PRD):
  - [ ] Write a script to create tables: profiles, contacts, scheduled_contacts, products, profile_products.
  - [ ] Test schema with sample data (e.g., 1 profile).
- [ ] Implement encryption:
  - [ ] Configure SQLCipher with a hardcoded password (e.g., "test123").
  - [ ] Test opening the encrypted database.
- [ ] Replace hardcoded password:
  - [ ] Add a password prompt on app startup.
  - [ ] Save user-defined password securely (e.g., hash it and store locally).
  - [ ] Use it to decrypt the database.
- [ ] Commit changes:
  - [ ] `git add .`
  - [ ] `git commit -m "Database setup with encryption"`
  - [ ] `git push origin main`

## 3. Profile Management
- [ ] Install a CSS framework (e.g., Bootstrap) for simple styling: `npm install bootstrap`.
- [ ] Build basic UI in index.html:
  - [ ] Add a "Profiles" section with a table (Name, Role, Status).
  - [ ] Add an "Add Profile" button and form (First Name, Last Name, Role, etc.).
- [ ] Connect UI to database:
  - [ ] Write JavaScript in main.js to insert a profile into profiles table.
  - [ ] Display profiles in the table on app load.
- [ ] Add search functionality:
  - [ ] Add a search bar to filter profiles by name, company, role, or status.
  - [ ] Update the profiles table dynamically.
- [ ] Test adding, viewing, and searching profiles.
- [ ] Commit changes:
  - [ ] `git add .`
  - [ ] `git commit -m "Profile management UI and functionality"`
  - [ ] `git push origin main`

## 4. Contact Logging
- [ ] Update profile UI:
  - [ ] Add a "Contact History" tab with a table (Date, Type, Details, Value).
  - [ ] Add a "Log Contact" button and form (Date, Type dropdown, Details, Value for Offer Submission).
- [ ] Implement contact logging:
  - [ ] Save contacts to contacts table with 300-char limit on Details.
  - [ ] Show contact history for a selected profile.
  - [ ] Ensure 300-char limit is enforced (e.g., truncate or alert).
- [ ] Test logging a contact (e.g., "Offer Submission" with 500 EUR).
- [ ] Commit changes:
  - [ ] `git add .`
  - [ ] `git commit -m "Contact logging implemented"`
  - [ ] `git push origin main`

## 5. Calendar Integration
- [ ] Install FullCalendar: `npm install @fullcalendar/core @fullcalendar/daygrid`.
- [ ] Add a "Calendar" section to UI:
  - [ ] Display a monthly calendar using FullCalendar.
- [ ] Implement scheduling:
  - [ ] Add a "Schedule Contact" form (Date/Time, Type, Reminder, Details, Value).
  - [ ] Save to scheduled_contacts table.
  - [ ] Load scheduled contacts into the calendar.
- [ ] Add "To-Do" list sidebar:
  - [ ] Show upcoming scheduled contacts (next 7 days).
- [ ] Implement completion:
  - [ ] Add a "Mark Complete" button to move scheduled contacts to contacts table.
- [ ] Add print functionality:
  - [ ] Create a "Print Planned Contacts" button.
  - [ ] Generate a simple HTML table of scheduled contacts for a period (e.g., this month).
  - [ ] Use window.print() to trigger printing.
- [ ] Test scheduling, completing, and printing contacts.
- [ ] Commit changes:
  - [ ] `git add .`
  - [ ] `git commit -m "Calendar integration with scheduling and printing"`
  - [ ] `git push origin main`

## 6. Product/Service Tracking
- [ ] Update profile UI:
  - [ ] Add a "Product/Service Interest" tab with a multi-select dropdown.
- [ ] Populate products:
  - [ ] Insert sample products into products table (e.g., "ECDH", "Product B").
  - [ ] Load products into the dropdown.
- [ ] Implement interest tracking:
  - [ ] Save selections to profile_products table.
  - [ ] Display selected products for a profile.
- [ ] Add filtering:
  - [ ] Add a dropdown on the dashboard to filter profiles by product (e.g., "Show ECDH prospects").
  - [ ] Query profile_products and update the profiles table.
- [ ] Test adding and filtering product interest.
- [ ] Commit changes:
  - [ ] `git add .`
  - [ ] `git commit -m "Product/service tracking and filtering"`
  - [ ] `git push origin main`

## 7. Admin Panel
- [ ] Build admin panel:
  - [ ] Add an "Admin" button and section (table of products with Add/Edit/Delete).
  - [ ] Require password entry (use the user-defined password from startup).
- [ ] Implement product management:
  - [ ] Add, edit, and delete products in the products table.
  - [ ] Update dropdowns in profile UI dynamically.
- [ ] Test adding and deleting a product.
- [ ] Commit changes:
  - [ ] `git add .`
  - [ ] `git commit -m "Admin panel for product management"`
  - [ ] `git push origin main`

## 8. Dashboard
- [ ] Install Chart.js: `npm install chart.js`.
- [ ] Build dashboard UI:
  - [ ] Add a "Dashboard" section with placeholders for metrics.
- [ ] Implement metrics:
  - [ ] Number of contacts this month (query contacts).
  - [ ] Number of meetings this month (past and scheduled).
  - [ ] Number of interested profiles per product (query profile_products).
  - [ ] Number of offers submitted (month, quarter, year) from `contacts` where `type = 'Offer Submission'`.
  - [ ] Opportunity value (sum value_eur from contacts for quarter and year).
- [ ] Visualize data:
  - [ ] Use Chart.js to create a bar chart for product interest.
- [ ] Test dashboard with sample data.
- [ ] Commit changes:
  - [ ] `git add .`
  - [ ] `git commit -m "Dashboard with metrics and charts"`
  - [ ] `git push origin main`

## 9. Backup and Polish
- [ ] Implement backup:
  - [ ] On app close, copy crm_data.db to crm_data_backup_[timestamp].db.
- [ ] Polish UI:
  - [ ] Fix layout issues with Bootstrap.
  - [ ] Ensure consistent styling across sections.
- [ ] Test backup and UI responsiveness.
- [ ] Commit changes:
  - [ ] `git add .`
  - [ ] `git commit -m "Backup and UI polish"`
  - [ ] `git push origin main`

## 10. Testing
- [ ] Test core features:
  - [ ] Add/edit/delete profiles, contacts, scheduled contacts, products.
  - [ ] Filter by product, search by role, print planned contacts.
- [ ] Test dashboard:
  - [ ] Verify all metrics update correctly with sample data.
- [ ] Test edge cases:
  - [ ] 500 profiles, long contact details, missing password.
- [ ] Test encryption:
  - [ ] Ensure data is inaccessible without the correct password.
- [ ] Commit changes:
  - [ ] `git add .`
  - [ ] `git commit -m "Comprehensive testing completed"`
  - [ ] `git push origin main`

## 11. Deployment and Documentation
- [ ] Package the app:
  - [ ] Install electron-builder: `npm install electron-builder --save-dev`.
  - [ ] Configure package.json for Windows .exe build.
  - [ ] Run `npx electron-builder` to create an executable.
- [ ] Write a basic user guide:
  - [ ] Create a README.md with steps: "Enter password, add profile, log contact…".
- [ ] Test the .exe on Windows and finalize.
- [ ] Commit changes:
  - [ ] `git add .`
  - [ ] `git commit -m "App packaged and documented"`
  - [ ] `git push origin main`

## Notes
- Tools: Use VS Code and npm for dependencies.
- Prioritization: Focus on Sections 1-5 for a functional core, then 6-9 for full features, and 10-11 for polish.
