// script.js

// Note: This script assumes i18n is handled similarly to the example, but for simplicity, we've omitted full i18n implementation.
// You can extend it if needed. Focus is on core functionality.

// ── ISO 3166-1 alpha-2 country codes (used for flag detection) ──────────
const COUNTRY_CODES = new Set([
    'AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ',
    'BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ',
    'CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ',
    'DE','DJ','DK','DM','DO','DZ',
    'EC','EE','EG','EH','ER','ES','ET',
    'FI','FJ','FK','FM','FO','FR',
    'GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY',
    'HK','HM','HN','HR','HT','HU',
    'ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT',
    'JE','JM','JO','JP',
    'KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ',
    'LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY',
    'MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ',
    'NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ',
    'OM',
    'PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY',
    'QA',
    'RE','RO','RS','RU','RW',
    'SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ',
    'TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ',
    'UA','UG','UM','US','UY','UZ',
    'VA','VC','VE','VG','VI','VN','VU',
    'WF','WS',
    'YE','YT',
    'ZA','ZM','ZW'
]);

// Convert a 2-letter country code into its flag emoji (regional indicator symbols)
function getFlagEmoji(countryCode) {
    return [...countryCode.toUpperCase()]
        .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
        .join('');
}

// Validate & normalize a token into an ISO country code (handles the common "UK" alias for GB)
function normalizeCountryToken(token) {
    if (!token || token.length !== 2) return null;
    let upper = token.toUpperCase();
    if (upper === 'UK') upper = 'GB';
    return COUNTRY_CODES.has(upper) ? upper : null;
}

// Try to detect a country code from the filename first, then fall back to the config's remote host(s)
function detectCountryCode(filename, content) {
    const nameNoExt = filename.replace(/\.[^/.]+$/, '');
    const filenameTokens = nameNoExt.split(/[^a-zA-Z]+/).filter(Boolean);
    for (const token of filenameTokens) {
        const code = normalizeCountryToken(token);
        if (code) return code;
    }

    const remoteHosts = [...content.matchAll(/^remote\s+(\S+)/gm)].map(m => m[1]);
    for (const host of remoteHosts) {
        const hostTokens = host.split(/[^a-zA-Z]+/).filter(Boolean);
        for (const token of hostTokens) {
            const code = normalizeCountryToken(token);
            if (code) return code;
        }
    }

    return null;
}

// ── Hostname → IP resolution (uses Google's DNS-over-HTTPS JSON API) ────
function isIpAddress(host) {
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true; // IPv4
    if (host.includes(':') && /^[0-9a-fA-F:]+$/.test(host)) return true; // IPv6
    return false;
}

async function resolveHostToIp(host) {
    try {
        const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`);
        const data = await response.json();
        if (data && Array.isArray(data.Answer)) {
            const aRecord = data.Answer.find(a => a.type === 1);
            if (aRecord) return aRecord.data;
        }
    } catch (e) {
        console.error('DNS resolution failed for', host, e);
    }
    return null;
}

async function resolveRemoteHostsToIp(content) {
    const hosts = new Set();
    for (const match of content.matchAll(/^remote\s+(\S+)/gm)) {
        const host = match[1];
        if (!isIpAddress(host)) hosts.add(host);
    }

    if (hosts.size === 0) return content;

    const resolvedMap = {};
    await Promise.all([...hosts].map(async (host) => {
        const ip = await resolveHostToIp(host);
        if (ip) resolvedMap[host] = ip;
    }));

    if (Object.keys(resolvedMap).length === 0) return content;

    return content.replace(/^(remote\s+)(\S+)/gm, (fullMatch, prefix, host) => {
        return resolvedMap[host] ? prefix + resolvedMap[host] : fullMatch;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const btnAdapt = document.getElementById('btnAdapt');
    const btnClear = document.getElementById('btnClear');
    const outputArea = document.getElementById('outputArea');
    const btnDownloadAll = document.getElementById('btnDownloadAll');

    const chkAuthEnable = document.getElementById('chkAuthEnable');
    const authFields = document.getElementById('authFields');
    const authUser = document.getElementById('authUser');
    const authPass = document.getElementById('authPass');

    const chkCountryFlag = document.getElementById('chkCountryFlag');
    const chkResolveIp = document.getElementById('chkResolveIp');

    let filesData = [];
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

    // Toggle inline authentication fields
    chkAuthEnable.addEventListener('change', () => {
        authFields.classList.toggle('hidden', !chkAuthEnable.checked);
    });

    // Adapt (add auth / detect country / resolve IP, depending on enabled options)
    btnAdapt.addEventListener('click', async () => {
        if (filesData.length === 0) {
            showNotification('Please upload at least one file', 'error');
            return;
        }

        const authEnabled = chkAuthEnable.checked;
        const countryFlagEnabled = chkCountryFlag.checked;
        const resolveIpEnabled = chkResolveIp.checked;

        const username = authUser.value.trim();
        const password = authPass.value.trim();

        if (authEnabled && (!username || !password)) {
            showNotification('Please provide username and password', 'error');
            return;
        }

        outputArea.innerHTML = '';
        modifiedFiles = [];

        const originalBtnContent = btnAdapt.innerHTML;
        btnAdapt.disabled = true;
        if (resolveIpEnabled) {
            showNotification('Resolving hostnames, this may take a moment...', 'info');
        }

        try {
            for (const fileData of filesData) {
                const originalContent = fileData.content;
                let content = originalContent;

                if (authEnabled) {
                    const authRegex = /<auth-user-pass>[\s\S]*?<\/auth-user-pass>/i;
                    const newAuth = `<auth-user-pass>\n${username}\n${password}\n</auth-user-pass>`;

                    if (authRegex.test(content)) {
                        content = content.replace(authRegex, newAuth);
                    } else {
                        content = content.trim() + '\n\n' + newAuth;
                    }
                }

                let flagPrefix = '';
                if (countryFlagEnabled) {
                    const code = detectCountryCode(fileData.name, originalContent);
                    if (code) {
                        flagPrefix = getFlagEmoji(code) + ' ';
                    }
                }

                if (resolveIpEnabled) {
                    content = await resolveRemoteHostsToIp(content);
                }

                const modName = fileData.name.replace(/(\.conf|\.ovpn)$/, '-mod$1');
                const outputName = flagPrefix + modName;
                modifiedFiles.push({ name: outputName, content });

                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);

                const div = document.createElement('div');
                div.classList.add('output-file');
                div.innerHTML = `
                    <span>${outputName}</span>
                    <a href="${url}" download="${outputName}" class="download-link">Download</a>
                `;
                outputArea.appendChild(div);
            }

            btnDownloadAll.style.display = modifiedFiles.length > 0 ? 'flex' : 'none';
        } finally {
            btnAdapt.disabled = false;
            btnAdapt.innerHTML = originalBtnContent;
        }
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
        authUser.value = '';
        authPass.value = '';
        chkAuthEnable.checked = true;
        authFields.classList.remove('hidden');
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
