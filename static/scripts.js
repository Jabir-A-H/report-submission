// --- Lightweight UI Enhancements ---
document.addEventListener('DOMContentLoaded', function() {
  // Initialize lightweight interactions
  initBasicAnimations();
  initFormEnhancements();
  initLoadingStates();
});

// Basic Animation System
function initBasicAnimations() {
  // Simple intersection observer for fade-in effects
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -20px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
      }
    });
  }, observerOptions);

  // Observe main content areas
  document.querySelectorAll('.modern-card, .page-header').forEach(el => {
    observer.observe(el);
  });
}

// Simple Form Interactions
function initFormEnhancements() {
  // Basic focus/blur for inputs
  document.querySelectorAll('.modern-input').forEach(input => {
    input.addEventListener('focus', function() {
      this.style.borderColor = '#3b82f6';
    });

    input.addEventListener('blur', function() {
      if (!this.value) {
        this.style.borderColor = '#e2e8f0';
      }
    });
  });

  // Simple button hover effects
  document.querySelectorAll('.modern-btn').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-1px)';
    });

    btn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
}

// Loading States
function initLoadingStates() {
  // Add loading spinner to forms on submit
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function() {
      const submitBtn = this.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        showLoadingState(submitBtn);
      }
    });
  });
}

function showLoadingState(button) {
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `
    <div class="modern-spinner w-5 h-5 mr-2"></div>
    প্রসেসিং...
  `;
  
  setTimeout(() => {
    button.disabled = false;
    button.innerHTML = originalText;
  }, 2000);
}

// --- City Report Override Form Logic ---
window.initCityReportOverrideForm = function() {
  const sectionSelect = document.getElementById('section-select');
  const categoryDiv = document.getElementById('category-div');
  const categorySelect = document.getElementById('category-select');
  const fieldSelect = document.getElementById('field-select');
  const prevValueSpan = document.getElementById('prev-value');
  if (!sectionSelect || !fieldSelect) return;
  const data = window.cityReportOverrideData || {};
  const sectionFields = data.sectionFields || {};
  const sectionCategories = data.sectionCategories || {};
  const aggData = data.aggData || {};

  function updateCategoryAndField() {
    const section = sectionSelect.value;
    // Show/hide category
    if (["courses","organizational","personal","meetings","extras"].includes(section)) {
      categoryDiv.style.display = '';
      // Populate category
      const cats = sectionCategories[section] || [];
      categorySelect.innerHTML = '<option value="">-- Select Category --</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
      categorySelect.required = true;
    } else {
      categoryDiv.style.display = 'none';
      categorySelect.innerHTML = '';
      categorySelect.required = false;
    }
    // Populate field
    const fields = Array.isArray(sectionFields[section]) ? sectionFields[section] : [];
    fieldSelect.innerHTML = '<option value="">-- Select Field --</option>' + fields.map(f => `<option value="${f}">${f}</option>`).join('');
    fieldSelect.value = '';
    // Set hidden category input
    setCategoryHiddenInput();
  }

  function setCategoryHiddenInput() {
    const section = sectionSelect.value;
    const cat = categorySelect.value;
    const hiddenInput = document.getElementById('category-hidden-input');
    if (hiddenInput) {
      if (["courses","organizational","personal","meetings","extras"].includes(section)) {
        hiddenInput.value = cat || '';
      } else {
        hiddenInput.value = '';
      }
    }
  }

  function updatePrevValue() {
    const section = sectionSelect.value;
    const field = fieldSelect.value;
    let prev = '';
    if (["courses","organizational","personal","meetings","extras"].includes(section)) {
      const cat = categorySelect.value;
      if (cat && field) {
        prev = aggData[section] && aggData[section][cat] ? aggData[section][cat][field] : '';
      }
    } else if (section === 'header' && field) {
      prev = aggData.header ? aggData.header[field] : '';
    } else if (section === 'comments' && field) {
      prev = aggData.comments ? aggData.comments[field] : '';
    }
    prevValueSpan.textContent = prev !== undefined ? `Prev: ${prev}` : '';
  }

  sectionSelect.addEventListener('change', () => {
    updateCategoryAndField();
    updatePrevValue();
    setCategoryHiddenInput();
  });
  if (categorySelect) {
    categorySelect.addEventListener('change', updatePrevValue);
    categorySelect.addEventListener('change', setCategoryHiddenInput);
  }
  fieldSelect.addEventListener('change', updatePrevValue);

  // Initial setup
  updateCategoryAndField();
  updatePrevValue();
  setCategoryHiddenInput();

  // AJAX submit for override form
  const overrideForm = document.getElementById('override-form');
  if (overrideForm) {
    overrideForm.onsubmit = function(e) {
      e.preventDefault();
      const form = e.target;
      fetch("/city_report/override", {
        method: "POST",
        body: new FormData(form)
      }).then(r => {
        if (r.ok) location.reload();
        else alert("Failed to save override");
      });
    };
  }
};
// Auto-init if form is present and data is loaded
if (document.getElementById('override-form') && window.cityReportOverrideData) {
  window.initCityReportOverrideForm();
}
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
