import { VoteState, UserVotes } from '../types';

const API_URL = '/api';
const VOTER_ID_KEY = 'it_fresher_voter_id';
const USER_VOTE_KEY = 'it_fresher_user_votes';

// Generates or retrieves a persistent unique ID for this browser
const getVoterId = (): string => {
  let id = localStorage.getItem(VOTER_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(VOTER_ID_KEY, id);
  }
  return id;
};

// Helper to normalize OS for cross-browser matching
const getOS = (): string => {
  const ua = navigator.userAgent;
  if (/Windows/.test(ua)) return 'Windows';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Other';
};

const isBlockedBrowser = (): boolean => {
  const ua = navigator.userAgent;
  // Block Firefox (Privacy), Opera (VPN), and UC Browser (Proxy)
  // These browsers allow easy IP bypassing or fingerprint spoofing.
  return /firefox|fxios|opr\/|opera|ucbrowser/i.test(ua);
};

// Captures data that stays the same even if the user switches browsers on the same phone
const getHardwareProfile = (): string => {
  // 1. Screen Resolution (Usually consistent across browsers on same device)
  const { width, height } = screen;
  
  // 2. CPU Concurrency (Supported in modern Chrome & Firefox)
  const threads = navigator.hardwareConcurrency || 'unknown';
  
  // 3. Timezone (e.g., "Asia/Yangon")
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // 4. OS Platform (Normalized)
  const os = getOS();

  // CROSS-BROWSER FINGERPRINT
  // We explicitly exclude pixelRatio and colorDepth as they can vary by browser settings/zoom.
  return `${width}x${height}|${os}|${timezone}|${threads}`;
};

// Generates a robust device fingerprint using hardware attributes and Canvas rendering
const getDeviceFingerprint = (): string => {
  // 1. Basic Hardware & Browser Attributes
  const { userAgent, language, hardwareConcurrency, deviceMemory } = navigator as any;
  const { width, height, colorDepth, pixelDepth } = screen;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // 2. Canvas Fingerprinting (Harder to spoof)
  // Different GPUs and drivers render text/graphics with slight variations
  let canvasHash = '';
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      
      // Text with various features
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125,1,62,20);
      ctx.fillStyle = "#069";
      ctx.fillText("VoteThem-v2-Fingerprint", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("VoteThem-v2-Fingerprint", 4, 17);
      
      canvasHash = canvas.toDataURL().slice(-100); // Take a slice of the base64 data
    }
  } catch (e) {
    canvasHash = 'canvas-blocked';
  }
  
  const rawId = `${userAgent}|${language}|${hardwareConcurrency}|${deviceMemory}|${width}x${height}|${colorDepth}|${pixelDepth}|${timezone}|${canvasHash}`;
  
  // Simple hash function for the string
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
    const char = rawId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

export const getUserVotes = (): UserVotes => {
  const stored = localStorage.getItem(USER_VOTE_KEY);
  return stored ? JSON.parse(stored) : {};
};

export const hasVotedInCategory = (categoryId: string): boolean => {
  const userVotes = getUserVotes();
  return !!userVotes[categoryId];
};

export const castVote = async (candidateId: string, categoryId: string): Promise<{ success: boolean; error?: string }> => {
  // 0. Security Block: Restricted Browsers (Firefox, Opera, UC)
  if (isBlockedBrowser()) {
    return { success: false, error: 'သူငယ်ချင်းရေ Security Issues လေးတွေရှိတာကြောင့်မို့ ဒီ Browser နဲ့ မ vote ပါနဲ့နော်. Please use Chrome,Edge,Safari,Samaung or other NORMAL browsers. ပြန်ပြီး QR scan မလုပ်ချင်ရင် www.totumdy.com ကို ဝင်ပြီး Voteလို့ရပါတယ် . ကျေးဇူးပါနော်' };
  }

  // 1. Client-side check
  if (hasVotedInCategory(categoryId)) {
    return { success: false, error: 'You have already voted in this category (Device Check).' };
  }

  try {
    // 2. Send vote to Node.js Backend with Double-Check Fingerprint
    const response = await fetch(`${API_URL}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        candidateId, 
        categoryId, 
        fingerprint: getDeviceFingerprint(),
        voterId: getVoterId(),
        hardwareId: getHardwareProfile()
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        console.error(`API Error (${response.status})`);
        return { 
          success: false, 
          error: data?.error || `Server Error (${response.status})` 
        };
    }

    if (data && data.success) {
      // 3. Update local state on success
      const userVotes = getUserVotes();
      userVotes[categoryId] = candidateId;
      localStorage.setItem(USER_VOTE_KEY, JSON.stringify(userVotes));
      return { success: true };
    } else {
      return { success: false, error: data?.error || 'Unknown error' };
    }
  } catch (error) {
    console.error('Network Error:', error);
    return { success: false, error: 'Network error. Is the server running?' };
  }
};

export const getVoteStats = async (): Promise<VoteState> => {
  try {
    const response = await fetch(`${API_URL}/stats`);
    if (response.ok) {
      return await response.json();
    }
    console.error('Failed to fetch stats');
    return {};
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {};
  }
};

export const resetAllVotes = async () => {
  const confirmed = confirm("Are you sure? This will wipe the database permanently.");
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/reset`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json();

    if (data.success) {
      localStorage.removeItem(USER_VOTE_KEY);
      window.location.reload();
    } else {
      alert(data.error || 'Failed to reset database.');
    }
  } catch (error) {
    console.error(error);
    alert('Error connecting to backend. Is the server running?');
  }
};