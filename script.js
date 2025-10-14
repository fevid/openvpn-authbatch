// script.js

// Note: This script assumes i18n is handled similarly to the example, but for simplicity, we've omitted full i18n implementation.
// You can extend it if needed. Focus is on core functionality.

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const btnAdapt = document.getElementById('btnAdapt');
    const btnClear = document.getElementById('btnClear');
    const outputArea = document.getElementById('outputArea');
    const btnDownloadAll = document.getElementById('btnDownloadAll');
    const btnAuthToggle = document.getElementById('btnAuthToggle');
    const modalAuth = document.getElementById('modalAuth');
    const authClose = document.getElementById('authClose');
    const authOk = document.getElementById('authOk');
    const authCancel = document.getElementById('authCancel');
    const authUser = document.getElementById('authUser');
    const authPass = document.getElementById('authPass');

    let filesData = [];
    let username = '';
    let password = '';
    let modifiedFiles = [];

    // Handle multiple file upload
    fileInput.addEventListener('change', (e) => {
        filesData = [];
        fileList.innerHTML = '';
        const files = Array.from(e.target.files);
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                filesData[index] = { name: file.name, content: event.target.result };
                const p = document.createElement('p');
                p.textContent = file.name;
                fileList.appendChild(p);
            };
            reader.readAsText(file);
        });
    });

    // Open auth modal
    btnAuthToggle.addEventListener('click', () => {
        modalAuth.classList.add('active');
        authUser.value = username;
        authPass.value = password;
    });

    // Close auth modal
    authClose.addEventListener('click', closeAuthModal);
    authCancel.addEventListener('click', closeAuthModal);

    function closeAuthModal() {
        modalAuth.classList.remove('active');
    }

    // Apply auth
    authOk.addEventListener('click', () => {
        username = authUser.value.trim();
        password = authPass.value.trim();
        closeAuthModal();
    });

    // Adapt (add auth)
btnAdapt.addEventListener('click', () => {
    if (filesData.length === 0) {
        showNotification('Please upload at least one file', 'error');
        return;
    }
    if (!username || !password) {
        showNotification('Please provide username and password', 'error');
        return;
    }

    outputArea.innerHTML = '';
    modifiedFiles = [];

    filesData.forEach((fileData) => {
        let content = fileData.content;

        // Check if <auth-user-pass> block exists and replace it
        const authRegex = /<auth-user-pass>[\s\S]*?<\/auth-user-pass>/i;
        const newAuth = `<auth-user-pass>\n${username}\n${password}\n</auth-user-pass>`;

        if (authRegex.test(content)) {
            // Replace existing block
            content = content.replace(authRegex, newAuth);
        } else {
            // Simply append new block at the end
            content = content.trim() + '\n\n' + newAuth;
        }

        const modName = fileData.name.replace(/(\.conf|\.ovpn)$/, '-mod$1');
        modifiedFiles.push({ name: modName, content });

        // Create download link for individual file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const div = document.createElement('div');
        div.classList.add('output-file');
        div.innerHTML = `
            <span>${modName}</span>
            <a href="${url}" download="${modName}" class="download-link">Download</a>
        `;
        outputArea.appendChild(div);
    });

    // Show Download All button
    btnDownloadAll.style.display = modifiedFiles.length > 0 ? 'flex' : 'none';
});

    // Download all as ZIP
    btnDownloadAll.addEventListener('click', () => {
        if (modifiedFiles.length === 0) {
            showNotification('No files to download.', 'error');
            return;
        }

        const zip = new JSZip();
        modifiedFiles.forEach(file => {
            zip.file(file.name, file.content);
        });

        zip.generateAsync({ type: 'blob' }).then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'openvpn-configs-mod.zip';
            a.click();
            URL.revokeObjectURL(url);
        });
    });

    btnClear.addEventListener('click', () => {
        fileInput.value = '';
        fileList.innerHTML = '';
        outputArea.innerHTML = '';
        filesData = [];
        modifiedFiles = [];
        username = '';
        password = '';
        btnDownloadAll.style.display = 'none';
    });

});
function showNotification(message, type = 'success') {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '1rem',
        color: 'white',
        fontWeight: '600',
        zIndex: '10000',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
    });
    
    // Set background based on type
    const backgrounds = {
        success: 'linear-gradient(135deg, #00d4aa 0%, #00b4d8 100%)',
        error: 'linear-gradient(135deg, #ff6b6b 0%, #c46539 100%)',
        info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    notification.style.background = backgrounds[type] || backgrounds.success;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}