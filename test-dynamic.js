
const ADMIN_PIN = "45644779";
const BASE_URL = 'http://localhost:3001/api';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runTest() {
  console.log("🧪 STARTING DYNAMIC IP LIMIT TEST\n");

  // 1. OPEN SYSTEM
  console.log("🔓 [Setup] Opening Voting System...");
  await fetch(`${BASE_URL}/system-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: ADMIN_PIN, isOpen: true })
  });

  // 2. SET STRICT LIMIT (Max 1)
  console.log("🔧 [Action] Setting Max Votes Per IP = 1");
  const res1 = await fetch(`${BASE_URL}/system-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: ADMIN_PIN, newMaxVotes: 1 })
  });
  const data1 = await res1.json();
  console.log(`   ➔ Server Confirmed Limit: ${data1.maxVotesPerIp}`);

  // 3. VOTE #1 (Should Pass)
  console.log("\n🗳️  [Vote 1] Casting first vote...");
  const v1 = await castVote("voter_A", "hard_A");
  console.log(`   ➔ Result: ${v1.success ? '✅ SUCCESS' : '❌ FAILED'} ${v1.error || ''}`);

  // 4. VOTE #2 (Should Fail due to limit 1)
  console.log("🗳️  [Vote 2] Casting second vote (Same IP, Diff Hardware)...");
  const v2 = await castVote("voter_B", "hard_B");
  console.log(`   ➔ Result: ${!v2.success ? '✅ BLOCKED (Expected)' : '❌ PASSED (Unexpected!)'} ${v2.error || ''}`);

  // 5. RELAX LIMIT (Max 5)
  console.log("\n🔧 [Action] Relaxing Panic Mode to Max 5...");
  const res2 = await fetch(`${BASE_URL}/system-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: ADMIN_PIN, newMaxVotes: 5 })
  });
  console.log(`   ➔ Server Confirmed Limit: ${(await res2.json()).maxVotesPerIp}`);

  // 6. VOTE #2 RETRY (Should Pass now)
  console.log("🗳️  [Vote 2 Retry] Casting second vote again...");
  const v3 = await castVote("voter_B", "hard_B");
  console.log(`   ➔ Result: ${v3.success ? '✅ SUCCESS' : '❌ FAILED'} ${v3.error || ''}`);

  // 7. VOTE #3 (Should Pass)
  console.log("🗳️  [Vote 3] Casting third vote...");
  const v4 = await castVote("voter_C", "hard_C");
  console.log(`   ➔ Result: ${v4.success ? '✅ SUCCESS' : '❌ FAILED'} ${v4.error || ''}`);

  console.log("\n🎉 TEST COMPLETE");
}

async function castVote(voterId, hardwareId) {
  try {
    const res = await fetch(`${BASE_URL}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: 'test_cand',
        categoryId: 'TEST_CAT_DYNAMIC',
        fingerprint: 'fp_' + hardwareId,
        voterId: voterId,
        hardwareId: hardwareId
      })
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

runTest();
