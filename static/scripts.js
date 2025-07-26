// Bengali alert system for success/error messages
function showAlert(message, type = 'danger') {
    const alertBox = document.getElementById('alert-box');
    if (alertBox) {
        alertBox.innerHTML = `<div class="alert alert-${type} alert-dismissible fade-in" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
        setTimeout(() => { alertBox.innerHTML = ''; }, 5000);
    }
}

// Download report as PDF or Excel (dashboard/report page)
function downloadReport(format) {
    fetch(`/export/${format}`)
        .then(response => {
            if (!response.ok) throw new Error('Export failed');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `master_report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(() => showAlert('রিপোর্ট ডাউনলোড ব্যর্থ হয়েছে', 'danger'));
}

// Auto-save indicator for section forms
function showAutoSaveIndicator(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    let indicator = document.createElement('span');
    indicator.className = 'spinner';
    indicator.style.marginLeft = '8px';
    field.parentNode.appendChild(indicator);
    setTimeout(() => { indicator.remove(); }, 1200);
}

// Keyboard accessibility for navigation
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('focus', () => link.classList.add('outline', 'outline-2', 'outline-blue-400'));
        link.addEventListener('blur', () => link.classList.remove('outline', 'outline-2', 'outline-blue-400'));
    });
});

// Dynamic dashboard: show/hide section cards based on period selection
function updateDashboardSections(selectedType, selectedYear) {
    // Example: show/hide cards, update stats, etc.
    // This function should be called after period selector changes
    // ...implementation depends on backend data...
}

// Bengali success message for save
function showSaveSuccess() {
    showAlert('সেভ সফল হয়েছে!', 'success');
}
