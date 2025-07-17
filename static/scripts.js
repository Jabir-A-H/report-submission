// Handle form submission and alerts
function showAlert(message, type = 'danger') {
    const alertBox = document.getElementById('alert-box');
    if (alertBox) {
        alertBox.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
    }
}

// Download report as PDF or Excel
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
        .catch(() => showAlert('Failed to export report.'));
}
