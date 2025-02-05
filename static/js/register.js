document.addEventListener('DOMContentLoaded', function() {
    initializeRegisterForm();
    initializeToasts();
});

function initializeRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            showToast('Please fill in all required fields', 'warning');
            return;
        }

        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Validate passwords match
        if (data.password !== data.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        // Remove confirm password before sending
        delete data.confirmPassword;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } else {
                showToast(result.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast('An error occurred during registration', 'error');
        }
    });
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${getToastBackground(type)} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas ${getToastIcon(type)} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function getToastBackground(type) {
    switch (type) {
        case 'success': return 'success';
        case 'error': return 'danger';
        case 'warning': return 'warning';
        default: return 'primary';
    }
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}
