// Utility Functions
const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Toast Notifications
const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    
    toast.className = `${bgColor} text-white px-6 py-4 rounded-lg shadow-lg mb-4 flex items-center toast-enter`;
    toast.innerHTML = `
        <i class="fas fa-${icon} mr-3"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Trigger enter animation
    setTimeout(() => {
        toast.classList.remove('toast-enter');
    }, 10);
    
    // Remove toast after delay
    setTimeout(() => {
        toast.classList.add('toast-exit-active');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
};

// Loading Overlay
const showLoading = () => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
};

const hideLoading = () => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
};

// File Upload Handling
const initFileUpload = () => {
    const dropzone = document.querySelector('.dropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropzone.classList.add('dragover');
    }

    function unhighlight() {
        dropzone.classList.remove('dragover');
    }

    dropzone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
};

// Form Validation
const validateForm = (form) => {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value) {
            isValid = false;
            field.classList.add('border-red-500');
            
            // Add error message
            const errorMessage = field.nextElementSibling?.classList.contains('error-message') 
                ? field.nextElementSibling 
                : document.createElement('p');
            
            if (!field.nextElementSibling?.classList.contains('error-message')) {
                errorMessage.className = 'text-red-500 text-sm mt-1 error-message';
                field.parentNode.insertBefore(errorMessage, field.nextSibling);
            }
            errorMessage.textContent = `${field.getAttribute('placeholder') || 'This field'} is required`;
        } else {
            field.classList.remove('border-red-500');
            const errorMessage = field.nextElementSibling;
            if (errorMessage?.classList.contains('error-message')) {
                errorMessage.remove();
            }
        }
    });

    return isValid;
};

// Modal Handling
const initModals = () => {
    document.querySelectorAll('[data-modal-target]').forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.querySelector(button.dataset.modalTarget);
            if (modal) {
                modal.classList.remove('hidden');
            }
        });
    });

    document.querySelectorAll('[data-modal-close]').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    });
};

// Table Sorting
const initTableSort = () => {
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const table = header.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const column = header.dataset.sort;
            const ascending = header.classList.contains('sort-asc');

            // Update sort indicators
            table.querySelectorAll('th').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });
            header.classList.toggle('sort-asc', !ascending);
            header.classList.toggle('sort-desc', ascending);

            // Sort rows
            rows.sort((a, b) => {
                const aValue = a.querySelector(`td[data-${column}]`).dataset[column];
                const bValue = b.querySelector(`td[data-${column}]`).dataset[column];
                return ascending 
                    ? bValue.localeCompare(aValue, undefined, {numeric: true})
                    : aValue.localeCompare(bValue, undefined, {numeric: true});
            });

            // Update table
            tbody.innerHTML = '';
            rows.forEach(row => tbody.appendChild(row));
        });
    });
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initFileUpload();
    initModals();
    initTableSort();

    // Add form validation to all forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!validateForm(form)) {
                e.preventDefault();
            }
        });
    });
});

// Export utilities for use in other scripts
window.utils = {
    formatNumber,
    formatDate,
    showToast,
    showLoading,
    hideLoading,
    validateForm
};
