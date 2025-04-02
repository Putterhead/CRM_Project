const { ipcRenderer } = require('electron');

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing UI...');

    try {
        // Initialize Bootstrap components
        const addProfileModal = new bootstrap.Modal(document.getElementById('addProfileModal'));

        // DOM Elements
        const profileForm = document.getElementById('profileForm');
        const saveProfileButton = document.getElementById('saveProfile');
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const profilesTableBody = document.getElementById('profilesTableBody');

        if (!profileForm || !saveProfileButton || !searchInput || !searchButton || !profilesTableBody) {
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

        // Handle profile editing (to be implemented)
        window.handleEditProfile = function(id) {
            alert('Edit functionality coming soon!');
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