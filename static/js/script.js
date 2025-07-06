function customizeTemplate(templateName) {
    fetch('/select_template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = 'customize.html';
        } else {
            alert("Failed to select template");
        }
    });
}


    // --- Upload Data Page Logic (upload.html) ---
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const previewTableBody = document.getElementById('previewTableBody');
    const recordCountSpan = document.getElementById('recordCount');
    const progressSection = document.getElementById('progressSection');
    const progressBar = document.getElementById('progressBar');
    const totalCountSpan = document.getElementById('totalCount');
    const sentCountSpan = document.getElementById('sentCount');
    const failedCountSpan = document.getElementById('failedCount');
    const sendBtn = document.getElementById('sendBtn');

    let uploadedData = []; // To store parsed data

    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFileUpload();
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    function handleFileUpload() {
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload_data', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                uploadedData = data.data;
                displayPreview(uploadedData);
                previewSection.style.display = 'block';
                progressSection.style.display = 'none'; // Hide progress if showing
            } else {
                alert('Upload failed: ' + data.message);
                previewSection.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            alert('An error occurred during file upload.');
            previewSection.style.display = 'none';
        });
    }

    function displayPreview(data) {
        previewTableBody.innerHTML = '';
        recordCountSpan.textContent = `${data.length} records`;
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${row['Student Name'] || ''}</td>
                <td>${row['Email Address'] || ''}</td>
                <td>${row['Course/Program'] || ''}</td>
                <td>${row['Completion Date'] || ''}</td>
                <td><span class="badge bg-secondary">Pending</span></td>
            `;
            previewTableBody.appendChild(tr);
        });
    }

    function clearData() {
        uploadedData = [];
        previewTableBody.innerHTML = '';
        recordCountSpan.textContent = '0 records';
        previewSection.style.display = 'none';
        fileInput.value = ''; // Clear the file input
        progressSection.style.display = 'none';
    }

    function sendCertificates() {
        if (uploadedData.length === 0) {
            alert('No data to send. Please upload a file first.');
            return;
        }

        sendBtn.disabled = true; // Disable button during sending
        progressSection.style.display = 'block';
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';
        totalCountSpan.textContent = uploadedData.length;
        sentCountSpan.textContent = '0';
        failedCountSpan.textContent = '0';

        fetch('/send_certificates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ students: uploadedData }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Certificates sent: ${data.sent}, Failed: ${data.failed}`);
                progressBar.style.width = '100%';
                progressBar.textContent = '100%';
                sentCountSpan.textContent = data.sent;
                failedCountSpan.textContent = data.failed;

                // Update status in preview table
                data.results.forEach(result => {
                    const email = result.email;
                    const status = result.status;
                    const rows = previewTableBody.querySelectorAll('tr');
                    rows.forEach(row => {
                        if (row.children[2].textContent === email) { // Assuming email is in the 3rd column
                            const statusCell = row.children[5]; // Status is in the 6th column
                            statusCell.innerHTML = `<span class="badge bg-${status === 'sent' ? 'success' : 'danger'}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
                        }
                    });
                });

            } else {
                alert('Sending failed: ' + data.message);
                progressBar.style.width = '0%';
                progressBar.textContent = '0%';
            }
            sendBtn.disabled = false; // Re-enable button
        })
        .catch(error => {
            console.error('Error sending certificates:', error);
            alert('An error occurred while sending certificates.');
            sendBtn.disabled = false; // Re-enable button
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
        });
    }

    // --- Customize Template Page Logic (customize.html) ---
    const logoUpload = document.getElementById('logoUpload');
    const fontSelect = document.getElementById('fontSelect');
    const textColor = document.getElementById('textColor');
    const alignLeft = document.getElementById('alignLeft');
    const alignCenter = document.getElementById('alignCenter');
    const alignRight = document.getElementById('alignRight');
    const certTitle = document.getElementById('certTitle');
    const certDescription = document.getElementById('certDescription');

    const previewLogo = document.getElementById('previewLogo');
    const previewTitle = document.getElementById('previewTitle');
    const previewDescription = document.getElementById('previewDescription');
    const certificatePreview = document.getElementById('certificatePreview');

    function applyCustomizations() {
        // Apply font
        certificatePreview.style.fontFamily = fontSelect.value;

        // Apply text color
        previewTitle.style.color = textColor.value;
        previewDescription.style.color = textColor.value;

        // Apply text alignment
        if (alignLeft.checked) {
            previewTitle.style.textAlign = 'left';
            previewDescription.style.textAlign = 'left';
        } else if (alignCenter.checked) {
            previewTitle.style.textAlign = 'center';
            previewDescription.style.textAlign = 'center';
        } else if (alignRight.checked) {
            previewTitle.style.textAlign = 'right';
            previewDescription.style.textAlign = 'right';
        }

        // Apply title and description
        previewTitle.textContent = certTitle.value;
        previewDescription.textContent = certDescription.value;
    }

    // Event listeners for customization options
    if (logoUpload) {
        logoUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewLogo.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (fontSelect) fontSelect.addEventListener('change', applyCustomizations);
    if (textColor) textColor.addEventListener('input', applyCustomizations); // Use 'input' for live update
    if (alignLeft) alignLeft.addEventListener('change', applyCustomizations);
    if (alignCenter) alignCenter.addEventListener('change', applyCustomizations);
    if (alignRight) alignRight.addEventListener('change', applyCustomizations);
    if (certTitle) certTitle.addEventListener('input', applyCustomizations);
    if (certDescription) certDescription.addEventListener('input', applyCustomizations);

    // Initial application of customizations when page loads
    if (certificatePreview) {
        applyCustomizations();
    }

    function saveTemplate() {
        // In a real application, you would send these customization settings to the backend
        // to be saved in a database or as a template configuration file.
        // For now, it just logs the current settings.
        const templateSettings = {
            logo: previewLogo.src, // This would be the URL/path after upload
            font: fontSelect.value,
            textColor: textColor.value,
            textAlign: document.querySelector('input[name="textAlign"]:checked').value,
            title: certTitle.value,
            description: certDescription.value
        };
        console.log("Template settings saved (simulated):", templateSettings);
        alert("Template settings saved!");
        // You might want to redirect back to templates.html or show a success message
    }

    function previewTemplate() {
        // The live preview already updates as changes are made.
        // This function could be used to open a larger, dedicated preview modal if needed.
        alert("Live preview is already active on the right side!");
    }

    // --- Templates Page Logic (templates.html) ---
    function selectTemplate(templateId) {
        // This function is for the "Preview" button on the templates page
        // It should ideally fetch details of the template and display them in a modal
        const modalTitle = document.getElementById('modalTitle');
        const modalImage = document.getElementById('modalImage');
        const modalDescription = document.getElementById('modalDescription');
        const selectFromModalBtn = document.getElementById('selectFromModal');

        let title = "";
        let description = "";
        let imageUrl = "";

        switch (templateId) {
            case 'classic':
                title = "Classic Certificate";
                description = "A traditional and elegant certificate design, perfect for formal recognitions.";
                imageUrl = "/placeholder.svg?height=400&width=600"; // Replace with actual image
                break;
            case 'modern':
                title = "Modern Certificate";
                description = "A clean and minimalist design with contemporary aesthetics, suitable for modern achievements.";
                imageUrl = "/placeholder.svg?height=400&width=600"; // Replace with actual image
                break;
            case 'academic':
                title = "Academic Certificate";
                description = "Designed for educational institutions, featuring a scholarly and distinguished look.";
                imageUrl = "/placeholder.svg?height=400&width=600"; // Replace with actual image
                break;
            case 'corporate':
                title = "Corporate Certificate";
                description = "A professional and business-oriented design, ideal for corporate training and awards.";
                imageUrl = "/placeholder.svg?height=400&width=600"; // Replace with actual image
                break;
            default:
                title = "Unknown Template";
                description = "No description available.";
                imageUrl = "/placeholder.svg";
        }

        modalTitle.textContent = title + " Preview";
        modalImage.src = imageUrl;
        modalDescription.textContent = description;

        // Set the data-template-id on the select button in the modal
        selectFromModalBtn.setAttribute('data-template-id', templateId);

        const templateModal = new bootstrap.Modal(document.getElementById('templateModal'));
        templateModal.show();
    }

    // Event listener for the "Select This Template" button inside the modal
    const selectFromModalBtn = document.getElementById('selectFromModal');
    if (selectFromModalBtn) {
        selectFromModalBtn.addEventListener('click', () => {
            const templateId = selectFromModalBtn.getAttribute('data-template-id');
            customizeTemplate(templateId); // Use the existing customizeTemplate function
            const templateModal = bootstrap.Modal.getInstance(document.getElementById('templateModal'));
            if (templateModal) templateModal.hide();
        });
    }

    // --- Status Page Logic (status.html) ---
    // Dummy data for status table
    const statusData = [
        { id: 1, name: "Sumit Kourav", email: "sumitkourav77@example.com", course: "Web Development", date: "2024-07-01", status: "sent" },
        { id: 2, name: "Prince Kumar", email: "princekumar77@example.com", course: "Backend Development", date: "2024-07-01", status: "sent" },
        { id: 3, name: "Priyanshi Mandlio", email: "priyanshi77@example.com", course: "Designer", date: "2024-06-30", status: "failed", reason: "Invalid email" },
        { id: 4, name: "Tanuj Sharma", email: "tanuj77@example.com", course: "Worker", date: "2024-06-29", status: "sent" },
        { id: 5, name: "Anjali Singh", email: "anjali.s@example.com", course: "Data Science", date: "2024-07-02", status: "pending" },
        { id: 6, name: "Rahul Verma", email: "rahul.v@example.com", course: "Mobile App Dev", date: "2024-07-02", status: "sent" },
        { id: 7, name: "Sneha Gupta", email: "sneha.g@example.com", course: "UI/UX Design", date: "2024-06-28", status: "failed", reason: "Mailbox full" },
        // Add more dummy data as needed
    ];

    const statusTableBody = document.getElementById('statusTableBody');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const totalStatusCount = document.getElementById('totalStatusCount');
    const sentStatusCount = document.getElementById('sentStatusCount');
    const failedStatusCount = document.getElementById('failedStatusCount');
    const pendingStatusCount = document.getElementById('pendingStatusCount');
    const pagination = document.getElementById('pagination');

    let currentPage = 1;
    const rowsPerPage = 10;

    function renderStatusTable(data) {
        statusTableBody.innerHTML = '';
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedData = data.slice(start, end);

        paginatedData.forEach((item, index) => {
            const tr = document.createElement('tr');
            let statusBadgeClass = '';
            switch (item.status) {
                case 'sent': statusBadgeClass = 'bg-success'; break;
                case 'failed': statusBadgeClass = 'bg-danger'; break;
                case 'pending': statusBadgeClass = 'bg-warning'; break;
            }
            tr.innerHTML = `
                <td>${start + index + 1}</td>
                <td>${item.name}</td>
                <td>${item.email}</td>
                <td>${item.course}</td>
                <td>${item.date}</td>
                <td><span class="badge ${statusBadgeClass}">${item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewDetails(${item.id})">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    ${item.status === 'failed' ? `<button class="btn btn-sm btn-warning ms-1" onclick="openResendModal('${item.name}', '${item.email}', ${item.id})">
                        <i class="fas fa-redo"></i>
                    </button>` : ''}
                </td>
            `;
            statusTableBody.appendChild(tr);
        });
        updatePagination(data.length);
        updateStatusCounts(data);
    }

    function updateStatusCounts(data) {
        totalStatusCount.textContent = data.length;
        sentStatusCount.textContent = data.filter(item => item.status === 'sent').length;
        failedStatusCount.textContent = data.filter(item => item.status === 'failed').length;
        pendingStatusCount.textContent = data.filter(item => item.status === 'pending').length;
    }

    function updatePagination(totalRows) {
        pagination.innerHTML = '';
        const pageCount = Math.ceil(totalRows / rowsPerPage);

        for (let i = 1; i <= pageCount; i++) {
            const li = document.createElement('li');
            li.classList.add('page-item');
            if (i === currentPage) {
                li.classList.add('active');
            }
            const a = document.createElement('a');
            a.classList.add('page-link');
            a.href = '#';
            a.textContent = i;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                applyFilters();
            });
            li.appendChild(a);
            pagination.appendChild(li);
        }
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterStatus = statusFilter.value;
        const filterDate = dateFilter.value;

        let filteredData = statusData.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm) || item.email.toLowerCase().includes(searchTerm);
            const matchesStatus = filterStatus === '' || item.status === filterStatus;
            const matchesDate = filterDate === '' || checkDateFilter(item.date, filterDate);
            return matchesSearch && matchesStatus && matchesDate;
        });
        currentPage = 1; // Reset to first page on filter change
        renderStatusTable(filteredData);
    }

    function checkDateFilter(itemDate, filter) {
        const today = new Date();
        const itemDateTime = new Date(itemDate);

        switch (filter) {
            case 'today':
                return itemDateTime.toDateString() === today.toDateString();
            case 'week':
                const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
                return itemDateTime >= firstDayOfWeek;
            case 'month':
                return itemDateTime.getMonth() === today.getMonth() && itemDateTime.getFullYear() === today.getFullYear();
            default:
                return true;
        }
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (dateFilter) dateFilter.addEventListener('change', applyFilters);

    function clearFilters() {
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = '';
        if (dateFilter) dateFilter.value = '';
        applyFilters();
    }

    function refreshStatus() {
        // In a real app, this would fetch fresh data from the backend
        alert('Refreshing status (simulated)...');
        applyFilters(); // Re-render with current filters
    }

    function exportData() {
        // In a real app, this would trigger a backend endpoint to generate and download a file
        alert('Exporting data (simulated)...');
        // Example: window.location.href = '/export_status';
    }

    let currentResendId = null; // To store the ID of the certificate to resend

    function openResendModal(name, email, id) {
        document.getElementById('resendStudentName').textContent = name;
        document.getElementById('resendStudentEmail').textContent = email;
        currentResendId = id;
        const resendModal = new bootstrap.Modal(document.getElementById('resendModal'));
        resendModal.show();
    }

    function confirmResend() {
        if (currentResendId !== null) {
            alert(`Resending certificate for ID: ${currentResendId} (simulated)`);
            // In a real app, send an AJAX request to backend to resend
            // e.g., fetch('/resend_certificate', { method: 'POST', body: JSON.stringify({ id: currentResendId }) });
            const resendModal = bootstrap.Modal.getInstance(document.getElementById('resendModal'));
            if (resendModal) resendModal.hide();
            currentResendId = null; // Clear the ID
            refreshStatus(); // Refresh table after simulated resend
        }
    }

    function viewDetails(id) {
        alert(`Viewing details for certificate ID: ${id} (simulated)`);
        // In a real app, this would open a modal or navigate to a detail page
    }

    // Initial render of the status table when the page loads
    if (statusTableBody) {
        applyFilters();
    }

    // --- Login Page Logic (login.html) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            event.stopPropagation();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Simple client-side validation (replace with actual backend authentication)
            if (username === 'admin' && password === 'admin') { // Dummy credentials
                alert('Login successful!');
                window.location.href = 'dashboard.html'; // Redirect to dashboard
            } else {
                alert('Invalid username or password.');
                loginForm.classList.add('was-validated'); // Show validation feedback
            }
        }, false);
    }
    
   function handleFileUpload() {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    fetch('/upload_data', {
        method: 'POST',
        body: formData
    })
    .then(async (response) => {
        const text = await response.text();
        console.log("Raw response:", text); // 🔍 Debug output

        try {
            const data = JSON.parse(text);

            if (response.ok && data.success) {
                uploadedData = data.data;
                displayPreview(uploadedData);
                previewSection.style.display = 'block';
                progressSection.style.display = 'none';
            } else {
                alert('Upload failed: ' + (data.message || 'Unknown error.'));
                previewSection.style.display = 'none';
            }
        } catch (e) {
            console.error("JSON parse error:", e);
            alert("Server response could not be parsed. Check console.");
            console.log("Unparsable response text:", text);
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        alert('An error occurred during file upload.');
        previewSection.style.display = 'none';
    });
}
function refreshStatus() {
    fetch('/get_status_log')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                populateStatusTable(data.data);
            } else {
                alert("Failed to load status.");
            }
        });
}

function populateStatusTable(statusList) {
    const tableBody = document.getElementById("statusTableBody");
    tableBody.innerHTML = "";
    let sentCount = 0, failedCount = 0;

    statusList.forEach((entry, index) => {
        const row = document.createElement("tr");

        const statusBadge = entry.status === "sent"
            ? '<span class="badge bg-success">Sent</span>'
            : '<span class="badge bg-danger">Failed</span>';

        if (entry.status === "sent") sentCount++;
        else failedCount++;

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.email}</td>
            <td>${entry.course}</td>
            <td>${entry.date}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openResendModal('${entry.name}', '${entry.email}')">
                    <i class="fas fa-redo-alt"></i> Resend
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById("totalStatusCount").textContent = statusList.length;
    document.getElementById("sentStatusCount").textContent = sentCount;
    document.getElementById("failedStatusCount").textContent = failedCount;
    document.getElementById("pendingStatusCount").textContent = 0;
}
function openResendModal(name, email) {
    document.getElementById("resendStudentName").textContent = name;
    document.getElementById("resendStudentEmail").textContent = email;
    const modal = new bootstrap.Modal(document.getElementById("resendModal"));
    modal.show();
}

function confirmResend() {
    const name = document.getElementById("resendStudentName").textContent;
    const email = document.getElementById("resendStudentEmail").textContent;

    // You could send a POST to your server here to re-generate and re-send
    alert(`Resending to ${name} (${email})...`);
    // modal.hide();
}

function updateDashboardStats() {
    fetch('/get_dashboard_stats')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const stats = data.stats;
                document.getElementById("sentCount").textContent = stats.total_sent;
                document.getElementById("failCount").textContent = stats.total_failed;
                document.getElementById("uploadCount").textContent = stats.total_uploads;
                document.getElementById("templateCount").textContent = stats.templates;
            }
        })
        .catch(err => console.error("Failed to load dashboard stats", err));
}

