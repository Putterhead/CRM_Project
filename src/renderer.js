const { ipcRenderer } = require('electron');

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing UI...');

    try {
        // Initialize Bootstrap components
        const addProfileModal = new bootstrap.Modal(document.getElementById('addProfileModal'));
        const editProfileModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        const logContactModal = new bootstrap.Modal(document.getElementById('logContactModal'));
        const contactHistoryModal = new bootstrap.Modal(document.getElementById('contactHistoryModal'));

        // DOM Elements
        const profileForm = document.getElementById('profileForm');
        const editProfileForm = document.getElementById('editProfileForm');
        const contactForm = document.getElementById('contactForm');
        const saveProfileButton = document.getElementById('saveProfile');
        const updateProfileButton = document.getElementById('updateProfile');
        const saveContactButton = document.getElementById('saveContact');
        const addContactBtn = document.getElementById('addContactBtn');
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const profilesTableBody = document.getElementById('profilesTableBody');
        const contactHistoryTableBody = document.getElementById('contactHistoryTableBody');
        const contactHistoryName = document.getElementById('contactHistoryName');

        if (!profileForm || !editProfileForm || !contactForm || !saveProfileButton || 
            !updateProfileButton || !saveContactButton || !searchInput || !searchButton || 
            !profilesTableBody || !contactHistoryTableBody || !contactHistoryName) {
            console.error('Required DOM elements not found');
            return;
        }

        // Load initial profiles
        loadProfiles();

        // Event Listeners
        saveProfileButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Save button clicked');
            handleSaveProfile(addProfileModal);
        });

        updateProfileButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Update button clicked');
            handleUpdateProfile(editProfileModal);
        });

        saveContactButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Save contact button clicked');
            handleSaveContact(logContactModal);
        });

        addContactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const profileId = document.getElementById('contactProfileId').value;
            showLogContactModal(profileId);
        });
        
        searchButton.addEventListener('click', handleSearch);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearch();
        });

        // Load all profiles from the database
        async function loadProfiles() {
            console.log('Loading profiles...');
            try {
                const profiles = await ipcRenderer.invoke('database-operation', {
                    operation: 'all',
                    sql: 'SELECT * FROM profiles ORDER BY created_at DESC'
                });
                console.log('Profiles loaded:', profiles);
                displayProfiles(profiles);
            } catch (error) {
                console.error('Error loading profiles:', error);
                alert('Failed to load profiles');
            }
        }

        // Display profiles in the table
        function displayProfiles(profiles) {
            if (!Array.isArray(profiles)) {
                console.error('Invalid profiles data:', profiles);
                return;
            }

            profilesTableBody.innerHTML = '';
            
            profiles.forEach(profile => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${profile.first_name || ''} ${profile.last_name || ''}</td>
                    <td>${profile.company || ''}</td>
                    <td>${profile.role || ''}</td>
                    <td>${profile.email || ''}</td>
                    <td>${profile.phone || ''}</td>
                    <td><span class="badge bg-${getStatusBadgeColor(profile.status || 'unknown')}">${profile.status || 'Unknown'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-info btn-action" onclick="handleViewContacts(${profile.id})">
                            Contacts
                        </button>
                        <button class="btn btn-sm btn-outline-primary btn-action" onclick="handleEditProfile(${profile.id})">
                            Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-action" onclick="handleDeleteProfile(${profile.id})">
                            Delete
                        </button>
                    </td>
                `;
                profilesTableBody.appendChild(row);
            });
        }

        // Handle profile form submission
        async function handleSaveProfile(modal) {
            console.log('Handling save profile...');
            
            // Form validation
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const status = document.getElementById('status').value;

            if (!firstName || !lastName || !status) {
                alert('First name, last name, and status are required');
                return;
            }

            const formData = {
                first_name: firstName,
                last_name: lastName,
                company: document.getElementById('company').value.trim(),
                role: document.getElementById('role').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                status: status
            };

            console.log('Form data:', formData);

            try {
                await ipcRenderer.invoke('database-operation', {
                    operation: 'run',
                    sql: `INSERT INTO profiles (first_name, last_name, company, role, email, phone, status) 
                          VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    params: [formData.first_name, formData.last_name, formData.company, formData.role, 
                            formData.email, formData.phone, formData.status]
                });

                // Reset form and close modal
                profileForm.reset();
                modal.hide();

                // Reload profiles
                await loadProfiles();
            } catch (error) {
                console.error('Error saving profile:', error);
                alert('Failed to save profile: ' + error.message);
            }
        }

        // Handle profile update
        async function handleUpdateProfile(modal) {
            console.log('Handling update profile...');
            
            // Form validation
            const firstName = document.getElementById('editFirstName').value.trim();
            const lastName = document.getElementById('editLastName').value.trim();
            const status = document.getElementById('editStatus').value;
            const profileId = document.getElementById('editProfileId').value;

            if (!firstName || !lastName || !status || !profileId) {
                alert('First name, last name, and status are required');
                return;
            }

            const formData = {
                id: profileId,
                first_name: firstName,
                last_name: lastName,
                company: document.getElementById('editCompany').value.trim(),
                role: document.getElementById('editRole').value.trim(),
                email: document.getElementById('editEmail').value.trim(),
                phone: document.getElementById('editPhone').value.trim(),
                status: status
            };

            console.log('Update form data:', formData);

            try {
                await ipcRenderer.invoke('database-operation', {
                    operation: 'run',
                    sql: `UPDATE profiles 
                          SET first_name = ?, last_name = ?, company = ?, 
                              role = ?, email = ?, phone = ?, status = ?
                          WHERE id = ?`,
                    params: [formData.first_name, formData.last_name, formData.company, 
                            formData.role, formData.email, formData.phone, 
                            formData.status, formData.id]
                });

                // Reset form and close modal
                editProfileForm.reset();
                modal.hide();

                // Reload profiles
                await loadProfiles();
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile: ' + error.message);
            }
        }

        // Handle search
        async function handleSearch() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            console.log('Searching for:', searchTerm);
            
            try {
                const searchPattern = `%${searchTerm}%`;
                const profiles = await ipcRenderer.invoke('database-operation', {
                    operation: 'all',
                    sql: `SELECT * FROM profiles 
                          WHERE LOWER(first_name) LIKE ? 
                          OR LOWER(last_name) LIKE ? 
                          OR LOWER(company) LIKE ? 
                          OR LOWER(email) LIKE ?
                          OR LOWER(status) LIKE ?`,
                    params: [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
                });
                
                displayProfiles(profiles);
            } catch (error) {
                console.error('Error searching profiles:', error);
                alert('Failed to search profiles: ' + error.message);
            }
        }

        // Handle profile deletion
        window.handleDeleteProfile = async function(id) {
            if (!id || !confirm('Are you sure you want to delete this profile?')) {
                return;
            }

            try {
                await ipcRenderer.invoke('database-operation', {
                    operation: 'run',
                    sql: 'DELETE FROM profiles WHERE id = ?',
                    params: [id]
                });
                await loadProfiles();
            } catch (error) {
                console.error('Error deleting profile:', error);
                alert('Failed to delete profile: ' + error.message);
            }
        }

        // Handle profile editing
        window.handleEditProfile = async function(id) {
            if (!id) return;

            try {
                const [profile] = await ipcRenderer.invoke('database-operation', {
                    operation: 'all',
                    sql: 'SELECT * FROM profiles WHERE id = ?',
                    params: [id]
                });

                if (!profile) {
                    throw new Error('Profile not found');
                }

                // Populate edit form
                document.getElementById('editProfileId').value = profile.id;
                document.getElementById('editFirstName').value = profile.first_name || '';
                document.getElementById('editLastName').value = profile.last_name || '';
                document.getElementById('editCompany').value = profile.company || '';
                document.getElementById('editRole').value = profile.role || '';
                document.getElementById('editEmail').value = profile.email || '';
                document.getElementById('editPhone').value = profile.phone || '';
                document.getElementById('editStatus').value = profile.status || 'Lead';

                // Show modal
                editProfileModal.show();
            } catch (error) {
                console.error('Error loading profile for edit:', error);
                alert('Failed to load profile: ' + error.message);
            }
        }

        // Handle viewing contact history
        window.handleViewContacts = async function(id) {
            if (!id) return;

            try {
                // Get profile details
                const [profile] = await ipcRenderer.invoke('database-operation', {
                    operation: 'all',
                    sql: 'SELECT * FROM profiles WHERE id = ?',
                    params: [id]
                });

                if (!profile) {
                    throw new Error('Profile not found');
                }

                // Set profile name in modal
                contactHistoryName.textContent = `Contacts for ${profile.first_name} ${profile.last_name}`;
                
                // Store profile ID for new contacts
                document.getElementById('contactProfileId').value = profile.id;

                // Get contact history
                const contacts = await ipcRenderer.invoke('database-operation', {
                    operation: 'all',
                    sql: `SELECT * FROM contacts 
                          WHERE profile_id = ? 
                          ORDER BY date DESC, created_at DESC`,
                    params: [id]
                });

                // Display contacts
                displayContacts(contacts);

                // Show modal
                contactHistoryModal.show();
            } catch (error) {
                console.error('Error loading contact history:', error);
                alert('Failed to load contact history: ' + error.message);
            }
        }

        // Display contacts in the table
        function displayContacts(contacts) {
            if (!Array.isArray(contacts)) {
                console.error('Invalid contacts data:', contacts);
                return;
            }

            contactHistoryTableBody.innerHTML = '';
            
            contacts.forEach(contact => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(contact.date)}</td>
                    <td>${contact.type || ''}</td>
                    <td>${contact.details || ''}</td>
                    <td>${formatCurrency(contact.value_eur)}</td>
                `;
                contactHistoryTableBody.appendChild(row);
            });
        }

        // Show log contact modal
        function showLogContactModal(profileId) {
            if (!profileId) return;

            // Set today's date as default
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('contactDate').value = today;
            
            // Reset form
            contactForm.reset();
            document.getElementById('contactProfileId').value = profileId;
            document.getElementById('contactDate').value = today;
            
            // Hide contact history modal and show log contact modal
            contactHistoryModal.hide();
            logContactModal.show();
        }

        // Handle saving new contact
        async function handleSaveContact(modal) {
            console.log('Handling save contact...');
            
            // Form validation
            const profileId = document.getElementById('contactProfileId').value;
            const date = document.getElementById('contactDate').value;
            const type = document.getElementById('contactType').value;
            const details = document.getElementById('contactDetails').value.trim();
            const value = parseFloat(document.getElementById('contactValue').value) || 0;

            if (!profileId || !date || !type || !details) {
                alert('Please fill in all required fields');
                return;
            }

            if (details.length > 300) {
                alert('Details must be 300 characters or less');
                return;
            }

            try {
                await ipcRenderer.invoke('database-operation', {
                    operation: 'run',
                    sql: `INSERT INTO contacts (profile_id, date, type, details, value_eur) 
                          VALUES (?, ?, ?, ?, ?)`,
                    params: [profileId, date, type, details, value]
                });

                // Reset form and close modal
                contactForm.reset();
                modal.hide();

                // Refresh contact history
                handleViewContacts(profileId);
            } catch (error) {
                console.error('Error saving contact:', error);
                alert('Failed to save contact: ' + error.message);
            }
        }

        // Utility function to format date
        function formatDate(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString();
        }

        // Utility function to format currency
        function formatCurrency(value) {
            return new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR'
            }).format(value);
        }

    } catch (error) {
        console.error('Error initializing UI:', error);
        alert('Failed to initialize application: ' + error.message);
    }
});

// Utility function to get badge color based on status
function getStatusBadgeColor(status) {
    switch (status.toLowerCase()) {
        case 'lead':
            return 'info';
        case 'customer':
            return 'success';
        case 'inactive':
            return 'secondary';
        default:
            return 'primary';
    }
}