// Main Application Logic
document.addEventListener('DOMContentLoaded', function() {
    initializeToasts();
    initializeNavigation();
    initializeWorkoutPlanHandlers();
    initializeAccountHandlers();
    initializeProgressTracking();
});

// Navigation Handling
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('.section');
    
    // Hide all sections except the first one
    sections.forEach((section, index) => {
        if (index === 0) {
            section.classList.remove('d-none');
        } else {
            section.classList.add('d-none');
        }
    });

    // Add click handlers to nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Show corresponding section
            const targetSection = link.getAttribute('data-section');
            showSection(targetSection);
        });
    });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('d-none');
    });
    
    // Show the target section
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.remove('d-none');
        
        // If showing workout plan section, check if we should show the plan
        if (sectionId === 'generate') {
            const workoutPlanContainer = document.getElementById('workoutPlanContainer');
            if (workoutPlanContainer) {
                const hasWorkoutPlan = workoutPlanContainer.querySelector('#workoutPlan').children.length > 0;
                workoutPlanContainer.style.display = hasWorkoutPlan ? 'block' : 'none';
            }
        }
    }
}

// Account Handling
function initializeAccountHandlers() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsUpdate);
    }
}

function handleLogout(e) {
    e.preventDefault();
    
    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin' // Important for handling cookies
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Logout failed');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            showToast('Success', 'Logged out successfully', 'success');
            // Redirect to index page after a short delay
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            throw new Error(data.message || 'Logout failed');
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        showToast('Error', 'Failed to logout: ' + error.message, 'error');
    });
}

function handleProfileUpdate(e) {
    e.preventDefault();
    // Add profile update logic here
    showToast('Info', 'Profile update functionality coming soon', 'info');
}

function handleSettingsUpdate(e) {
    e.preventDefault();
    // Add settings update logic here
    showToast('Info', 'Settings update functionality coming soon', 'info');
}

// Toast Handling
function initializeToasts() {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
}

function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center border-0 bg-${type}`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    const toastContent = `
        <div class="d-flex">
            <div class="toast-body text-white">
                <strong>${title}:</strong> ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastElement.innerHTML = toastContent;
    toastContainer.appendChild(toastElement);
    
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Workout Plan Handling
function initializeWorkoutPlanHandlers() {
    const workoutForm = document.getElementById('workoutForm');
    if (workoutForm) {
        workoutForm.addEventListener('submit', handleWorkoutPlanGeneration);
    }

    const downloadBtn = document.getElementById('downloadPDF');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handlePlanDownload);
    }
}

function handleWorkoutPlanGeneration(e) {
    e.preventDefault();
    
    const form = e.target;
    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        showToast('Error', 'Please fill in all required fields', 'error');
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Convert numeric fields
    data.age = parseInt(data.age);
    data.weight = parseFloat(data.weight);
    data.height = parseFloat(data.height);
    
    // Show loading spinner
    toggleLoading(true);
    
    try {
        const response = await fetch('/generate_plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.error || 'Failed to generate workout plan');
        }
        if (responseData.success && responseData.plan) {
            displayWorkoutPlan(responseData.plan);
            showToast('Success', 'Workout plan generated successfully!', 'success');
        } else {
            throw new Error(responseData.error || 'Failed to generate workout plan');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error', error.message, 'error');
    } finally {
        toggleLoading(false);
    }
}

function displayWorkoutPlan(plan) {
    const container = document.getElementById('workoutPlanContainer');
    const planContainer = document.getElementById('workoutPlan');
    
    if (!container || !planContainer) return;
    
    // Clear previous plan
    planContainer.innerHTML = '';
    
    // Create plan HTML
    const planHtml = plan.map((day, index) => {
        const isRestDay = day.type === 'rest';
        return `
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <div class="card-header ${isRestDay ? 'bg-success' : 'bg-primary'} text-white">
                        <h5 class="card-title mb-0">${day.day || `Day ${index + 1}`}</h5>
                    </div>
                    <div class="card-body">
                        ${isRestDay ? `
                            <div class="rest-day-activities">
                                <h6 class="mb-2">Active Rest Day</h6>
                                <ul class="list-group list-group-flush">
                                    ${day.activities.map(activity => `
                                        <li class="list-group-item">
                                            <p class="mb-0">${activity.activity}</p>
                                            ${activity.duration ? `<small class="text-muted">Duration: ${activity.duration}</small><br>` : ''}
                                            ${activity.intensity ? `<small class="text-muted">Intensity: ${activity.intensity}</small>` : ''}
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : `
                            <ul class="list-group list-group-flush">
                                ${day.exercises.map(exercise => `
                                    <li class="list-group-item">
                                        <h6 class="mb-1">${exercise.name}</h6>
                                        <p class="mb-1">
                                            ${exercise.sets ? `Sets: ${exercise.sets}` : ''}
                                            ${exercise.reps ? `<br>Reps: ${exercise.reps}` : ''}
                                            ${exercise.time ? `<br>Time: ${exercise.time}` : ''}
                                            ${exercise.rest ? `<br>Rest: ${exercise.rest}` : ''}
                                        </p>
                                        ${exercise.tips ? `<small class="text-muted">Tips: ${exercise.tips}</small>` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    planContainer.innerHTML = planHtml;
    container.style.display = 'block';
}

function handlePlanDownload() {
    const element = document.getElementById('workoutPlanContainer');
    if (!element) return;
    
    const opt = {
        margin: 1,
        filename: 'workout-plan.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
}

function toggleLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const generateBtn = document.getElementById('generateBtn');
    
    if (spinner) {
        spinner.classList.toggle('d-none', !show);
    }
    
    if (generateBtn) {
        generateBtn.disabled = show;
    }
}

// Progress Tracking
function initializeProgressTracking() {
    const progressForm = document.getElementById('progressForm');
    if (progressForm) {
        progressForm.addEventListener('submit', handleProgressSubmit);
    }

    const energyLevel = document.getElementById('energyLevel');
    const energyLevelValue = document.getElementById('energyLevelValue');
    if (energyLevel && energyLevelValue) {
        energyLevel.addEventListener('input', (e) => {
            energyLevelValue.textContent = e.target.value;
        });
    }

    // Initialize charts
    initializeCharts();
}

function handleProgressSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        showToast('Error', 'Please fill in all required fields', 'error');
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Convert numeric fields
    data.currentWeight = parseFloat(data.currentWeight);
    data.completedWorkouts = parseInt(data.completedWorkouts);
    data.energyLevel = parseInt(data.energyLevel);
    
    // Save progress data
    saveProgress(data);
}

function saveProgress(data) {
    // Get existing progress data
    let progressData = JSON.parse(localStorage.getItem('workoutProgress') || '[]');
    
    // Add new data point with timestamp
    progressData.push({
        ...data,
        timestamp: new Date().toISOString()
    });
    
    // Save to localStorage
    localStorage.setItem('workoutProgress', JSON.stringify(progressData));
    
    // Update charts
    updateCharts();
    
    // Show success message
    showToast('Success', 'Progress saved successfully!', 'success');
}

function initializeCharts() {
    // Weight Chart
    const weightCtx = document.getElementById('weightChart');
    if (weightCtx) {
        window.weightChart = new Chart(weightCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Weight (kg)',
                    data: [],
                    borderColor: '#6a11cb',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }
    
    // Workout Chart
    const workoutCtx = document.getElementById('workoutChart');
    if (workoutCtx) {
        window.workoutChart = new Chart(workoutCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Workouts Completed',
                    data: [],
                    backgroundColor: '#2575fc'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 7
                    }
                }
            }
        });
    }
    
    // Load initial data
    updateCharts();
}

function updateCharts() {
    const progressData = JSON.parse(localStorage.getItem('workoutProgress') || '[]');
    
    if (progressData.length === 0) return;
    
    // Process data for charts
    const labels = progressData.map(d => new Date(d.timestamp).toLocaleDateString());
    const weights = progressData.map(d => d.currentWeight);
    const workouts = progressData.map(d => d.completedWorkouts);
    
    // Update Weight Chart
    if (window.weightChart) {
        window.weightChart.data.labels = labels;
        window.weightChart.data.datasets[0].data = weights;
        window.weightChart.update();
    }
    
    // Update Workout Chart
    if (window.workoutChart) {
        window.workoutChart.data.labels = labels;
        window.workoutChart.data.datasets[0].data = workouts;
        window.workoutChart.update();
    }
}
