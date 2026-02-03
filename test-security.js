const API_URL = 'http://localhost:3001/api';

    async function castVote(name, payload, ip = null) {
    console.log(`\n--- Testing: ${name} ---`);
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (ip) headers['X-Forwarded-For'] = ip;

        const res = await fetch(`${API_URL}/vote`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log(`Status: ${res.status} | Result:`, data);
        return { status: res.status, data };
    } catch (e) {
        console.error("Connection error. Is the server running?");
    }
}

async function resetDB() {
    console.log("--- Resetting Database ---");
    try {
        const res = await fetch(`${API_URL}/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: '45644779' })
        });
        const data = await res.json();
        console.log("Reset result:", data);
    } catch (e) {
        console.error("Failed to reset DB. Is the server running?");
    }
}

async function runTests() {
    await resetDB();

    const categoryId = 'KING';
    const candidateId = 'k1';

    // SCENARIO 1: Legitimate User (Safari) - IP 1.2.3.4
    await castVote("User 1 (Safari)", {
        candidateId, categoryId, 
        voterId: 'chrome_id_123', 
        fingerprint: 'fp_chrome', 
        hardwareId: 'hw_iphone_15_pro'
    }, '1.2.3.4');

    // SCENARIO 2: Browser Switcher (Same IP)
    await castVote("User 1 (Switching to Chrome - SHOULD BLOCK)", {
        candidateId, categoryId, 
        voterId: 'safari_id_456', 
        fingerprint: 'fp_safari', 
        hardwareId: 'hw_iphone_15_pro'
    }, '1.2.3.4');

    // SCENARIO 5: Same Hardware, DIFFERENT IP (e.g., switched to 4G)
    // This effectively tests: "Identical device status but different IP"
    await castVote("User 1 (Switched Network - Same Hardware - WILL ALLOW)", {
        candidateId, categoryId, 
        voterId: 'safari_id_789', // New Browser Session
        fingerprint: 'fp_safari_new', 
        hardwareId: 'hw_iphone_15_pro' // Same Hardware
    }, '5.6.7.8');
}

runTests();
