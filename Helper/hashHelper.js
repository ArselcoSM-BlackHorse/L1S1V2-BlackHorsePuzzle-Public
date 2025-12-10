/**
 * Fungsi utilitas untuk mengubah ArrayBuffer (hasil dari hashing)
 * menjadi string heksadesimal yang mudah disimpan.
 */
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Menghitung hash SHA-256 dari string input menggunakan Web Crypto API.
 */
//export async function sha256(str) {
window.sha256 = async function(str) {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
      console.error("Web Crypto API tidak tersedia.");
      return ""; 
  }
  const buffer = new TextEncoder("utf-8").encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return bufferToHex(hash);
}

/**
 * Menyimpan data game ke Local Storage setelah di-hash untuk verifikasi.
 */
//export async function saveGameData(gameData) {
window.saveGameData = async function(gameData) {
    try {
        const dataString = JSON.stringify(gameData);
        const checksum = await sha256(dataString);
        
        localStorage.setItem('gameData', dataString);
        localStorage.setItem('checksum', checksum);
        console.log("✅ Game saved with checksum:", checksum);
        
        return { success: true, checksum };
    } catch (e) {
        console.error("❌ Failed to save game data:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Memuat data game dari Local Storage dan memverifikasi integritasnya.
 */
//export async function loadGameData() {
window.loadGameData = async function() {
    const savedDataString = localStorage.getItem('gameData');
    const savedChecksum = localStorage.getItem('checksum');

    if (!savedDataString || !savedChecksum) {
        console.log("📭 No saved data found.");
        return { success: false, data: null, reason: 'no_data' };
    }

    try {
        const calculatedChecksum = await sha256(savedDataString);
        
        if (calculatedChecksum === savedChecksum) {
            console.log("✅ Game data verified and loaded successfully.");
            return { 
                success: true, 
                data: JSON.parse(savedDataString),
                verified: true 
            };
        } else {
            console.error("🚨 VERIFICATION FAILED: Game data tampered or corrupted!");
            return { 
                success: false, 
                data: null, 
                reason: 'tampered',
                verified: false 
            };
        }
    } catch (e) {
        console.error("❌ Failed to load or verify game data:", e);
        return { success: false, data: null, reason: 'error', error: e.message };
    }
}

/**
 * Verifikasi data game dengan email-specific key
 */
//export async function saveGameDataWithEmail(email, gameData) {
window.saveGameDataWithEmail = async function(email, gameData) {
    try {
        const emailKey = `gameData-${email}`;
        const checksumKey = `checksum-${email}`;
        
        const dataString = JSON.stringify(gameData);
        const checksum = await sha256(dataString + email); // Include email in hash
        
        localStorage.setItem(emailKey, dataString);
        localStorage.setItem(checksumKey, checksum);
        console.log(`✅ Game saved for ${email} with checksum:`, checksum);
        
        return { success: true, checksum };
    } catch (e) {
        console.error("❌ Failed to save game data:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Load dan verifikasi data dengan email-specific key
 */
//export async function loadGameDataWithEmail(email) {
window.loadGameDataWithEmail = async function(email) {
    const emailKey = `gameData-${email}`;
    const checksumKey = `checksum-${email}`;
    
    const savedDataString = localStorage.getItem(emailKey);
    const savedChecksum = localStorage.getItem(checksumKey);

    if (!savedDataString || !savedChecksum) {
        console.log(`📭 No saved data found for ${email}.`);
        return { success: false, data: null, reason: 'no_data' };
    }

    try {
        const calculatedChecksum = await sha256(savedDataString + email);
        
        if (calculatedChecksum === savedChecksum) {
            console.log(`✅ Game data verified for ${email}`);
            return { 
                success: true, 
                data: JSON.parse(savedDataString),
                verified: true 
            };
        } else {
            console.error(`🚨 VERIFICATION FAILED for ${email}: Data tampered!`);
            
            // ✅ TAMBAHKAN USER WARNING
            showCheatWarning();

            return { 
                success: false, 
                data: null, 
                reason: 'tampered',
                verified: false 
            };
        }
    } catch (e) {
        console.error("❌ Failed to verify game data:", e);
        return { success: false, data: null, reason: 'error', error: e.message };
    }
}

/**
 * ✅ TAMBAHKAN: Show cheat warning to user
 */
function showCheatWarning() {
    // Create warning overlay
    const warningDiv = document.createElement('div');
    warningDiv.id = 'cheat-warning';
    warningDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;

    warningDiv.innerHTML = `
        <div style="background: #ff0000; padding: 20px; border-radius: 10px; text-align: center; max-width: 400px;">
            <h2>🚨 Data Integrity Violation Detected</h2>
            <p>Your game data has been tampered with or corrupted.</p>
            <p><strong>Your progress will be reset for security reasons.</strong></p>
            <button id="cheat-warning-ok" style="
                background: white;
                color: #ff0000;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                margin-top: 10px;
            ">OK, Reset My Data</button>
        </div>
    `;

    document.body.appendChild(warningDiv);
    
    // Handle OK button
    document.getElementById('cheat-warning-ok').onclick = () => {
        document.body.removeChild(warningDiv);
        // Trigger data reset (akan dipanggil dari game scene)
        if (window.handleCheatDetection) {
            window.handleCheatDetection();
        }
    };
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (document.getElementById('cheat-warning')) {
            document.body.removeChild(warningDiv);
        }
    }, 10000);
}

/**
 * ✅ TAMBAHKAN: Global cheat detection handler
 */
window.handleCheatDetection = async function(email) {
    console.warn('🚨 Handling cheat detection for:', email);
    
    try {
        // Clear tampered local data
        if (email) {
            localStorage.removeItem(`gameData-${email}`);
            localStorage.removeItem(`checksum-${email}`);
        }
        
        // Clear all game-related localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('gameData-') || key.startsWith('checksum-') || key.startsWith('score_')) {
                localStorage.removeItem(key);
            }
        });

        // Reset to backend data if possible
        if (email && window.syncProgressFromBackend) {
            await window.syncProgressFromBackend(email);
            console.log('✅ Data reset from backend');
        }
        
        // Reload page to ensure clean state
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Failed to handle cheat detection:', error);
        // Force reload as fallback
        window.location.reload();
    }
};

/**
 * ✅ TAMBAHKAN: Load dengan backward compatibility
 */
//export async function loadGameDataWithFallback(email) {
window.loadGameDataWithFallback = async function(email) {
    // Try new hash-protected method first
    const hashResult = await loadGameDataWithEmail(email);
    
    if (hashResult.success) {
        return hashResult;
    }
    
    // Fallback to old localStorage method
    console.log('🔄 Falling back to legacy localStorage method');
    
    const legacyKey = `gameData-${email}`;
    const legacyData = localStorage.getItem(legacyKey);
    
    if (legacyData) {
        try {
            const parsedData = JSON.parse(legacyData);
            console.log('⚠️ Using legacy data (no hash protection)');
            
            // Migrate to hash-protected storage
            await saveGameDataWithEmail(email, parsedData);
            console.log('✅ Legacy data migrated to hash protection');
            
            return {
                success: true,
                data: parsedData,
                verified: false, // Legacy data is not hash-verified
                migrated: true
            };
        } catch (error) {
            console.error('❌ Failed to parse legacy data:', error);
        }
    }
    
    return { success: false, data: null, reason: 'no_data' };
}

// =======================================================
// 🛠 DEBUG MODE – hanya aktif di LOCALHOST
// Fungsi ini aman dan tidak akan muncul untuk pemain
// =======================================================

if (window.location.hostname === "localhost") {

    /** 
     * @preserve
     * Fungsi ini dipertahankan namanya walau di-obfuscate
     */
    window.testAllCheatCases = async function(email) {
        console.log("===== 🧪 STARTING FULL SECURITY TEST =====");

        const emailKey = `gameData-${email}`;
        const checksumKey = `checksum-${email}`;

        const originalData = localStorage.getItem(emailKey);
        const originalChecksum = localStorage.getItem(checksumKey);

        if (!originalData || !originalChecksum) {
            console.error("❌ Tidak ada data untuk email ini. Simpan game dulu!");
            return;
        }

        console.log("📦 Original Data:", originalData);
        console.log("🔐 Original Checksum:", originalChecksum);

        // ------------------------------------------------------
        // 1. TEST NORMAL (data asli)
        // ------------------------------------------------------
        console.log("\n1️⃣ TEST NORMAL LOAD");
        let test1 = await window.loadGameDataWithEmail(email);
        console.log("✔️ Normal Load Result:", test1);

        // ------------------------------------------------------
        // 2. TEST DATA DIRUSAK
        // ------------------------------------------------------
        console.log("\n2️⃣ TEST DATA TAMPER");
        localStorage.setItem(emailKey, '{"score":999999,"level":999}');
        let test2 = await window.loadGameDataWithEmail(email);
        console.log("🚨 Tamper Load Result:", test2);

        // Restore original data
        localStorage.setItem(emailKey, originalData);

        // ------------------------------------------------------
        // 3. EMAIL DIPALSUKAN
        // ------------------------------------------------------
        console.log("\n3️⃣ TEST EMAIL DIPALSUKAN");
        const fakeEmail = "fakeuser@example.com";
        const fakeKey = `gameData-${fakeEmail}`;
        const fakeChecksum = `checksum-${fakeEmail}`;

        // masukkan data asli ke email palsu
        localStorage.setItem(fakeKey, originalData);
        localStorage.setItem(fakeChecksum, originalChecksum);

        let test3 = await window.loadGameDataWithEmail(fakeEmail);
        console.log("🕵️ Fake Email Load Result:", test3);

        // bersihkan palsu
        localStorage.removeItem(fakeKey);
        localStorage.removeItem(fakeChecksum);

        // ------------------------------------------------------
        // 4. KEY DIGANTI
        // ------------------------------------------------------
        console.log("\n4️⃣ TEST KEY RENAMED / DICOPY");
        const changedKey = `gameData-hacker123`;
        const changedChecksum = `checksum-hacker123`;

        localStorage.setItem(changedKey, originalData);
        localStorage.setItem(changedChecksum, originalChecksum);

        let test4 = await window.loadGameDataWithEmail("hacker123");
        console.log("🎭 Renamed Key Load Result:", test4);

        // bersihkan
        localStorage.removeItem(changedKey);
        localStorage.removeItem(changedChecksum);

        // ------------------------------------------------------
        // 5. CHECKSUM DIHANCURKAN
        // ------------------------------------------------------
        console.log("\n5️⃣ TEST CHECKSUM RUSAK / DIHANCURKAN");
        localStorage.setItem(checksumKey, "abcdef1234567890");

        let test5 = await window.loadGameDataWithEmail(email);
        console.log("💥 Destroyed Checksum Load Result:", test5);

        // kembalikan checksum asli
        localStorage.setItem(checksumKey, originalChecksum);

        console.log("\n===== ✅ FULL TEST COMPLETED =====");
    };

    console.log("🔧 Debug Mode ACTIVE (localhost only). Gunakan: testAllCheatCases(\"email\")");
}
