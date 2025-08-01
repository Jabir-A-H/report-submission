// Month selector toggle for both zone and city report types
function setupMonthSelectorToggle(typeSelectId, monthWrapperId, isWrapperSpan = false) {
  var typeSelect = document.getElementById(typeSelectId);
  var monthWrapper = document.getElementById(monthWrapperId);
  function toggleMonthSelector() {
    if (!typeSelect || !monthWrapper) return;
    var type = typeSelect.value;
    // For zone report, monthWrapper is a span; for city report, it's the select itself
    if (type === 'মাসিক') {
      monthWrapper.style.display = '';
    } else {
      monthWrapper.style.display = 'none';
    }
  }
  if (typeSelect && monthWrapper) {
    typeSelect.addEventListener('change', toggleMonthSelector);
    toggleMonthSelector();
  }
}
document.addEventListener('DOMContentLoaded', function() {
  setupMonthSelectorToggle('report-type-select', 'month-select-wrapper', true); // zone report
  setupMonthSelectorToggle('city-report-type-select', 'city-month-select', false); // city report
});
// Download dropdown toggle logic (global)
document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('downloadDropdownBtn');
  var dropdown = document.getElementById('downloadDropdown');
  var container = document.getElementById('downloadDropdownContainer');
  if (btn && dropdown) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!container.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
    // Hide dropdown on link click
    // PDF v1 triggers print
    var pdfV1 = document.getElementById('downloadPdfV1Link');
    if (pdfV1) {
      pdfV1.addEventListener('click', function(e) {
        e.preventDefault();
        dropdown.classList.add('hidden');
        window.print();
      });
    }
    // Hide dropdown on link click (except PDF v1, already handled)
    dropdown.querySelectorAll('a:not(#downloadPdfV1Link)').forEach(function(link) {
      link.addEventListener('click', function() {
        dropdown.classList.add('hidden');
      });
    });
  }
});
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
