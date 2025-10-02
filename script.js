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
            alert('Please upload at least one file.');
            return;
        }
        if (!username || !password) {
            alert('Please provide username and password.');
            return;
        }

        outputArea.innerHTML = '';
        modifiedFiles = [];

        filesData.forEach((fileData) => {
            let content = fileData.content;

            // Check if <auth-user-pass> block exists
            const authRegex = /<auth-user-pass>[\s\S]*?<\/auth-user-pass>/i;
            const newAuth = `<auth-user-pass>\n${username}\n${password}\n</auth-user-pass>`;

            if (authRegex.test(content)) {
                // Replace existing block
                content = content.replace(authRegex, newAuth);
            } else {
                // Append new block
                content += `\n${newAuth}`;
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
            alert('No files to download.');
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