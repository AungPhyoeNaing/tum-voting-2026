import { Candidate, CategoryId } from './types';

export const CANDIDATES: Candidate[] = [
  // --- KING Candidates (10) ---
  { id: 'k1', number: '01', name: 'မောင်သူရစံ', class: '01', categoryId: CategoryId.KING, quote: "Innovation distinguishes between a leader and a follower.", bio: "Passionate about cloud computing and cybersecurity." },
  { id: 'k2', number: '02', name: 'မောင်ဖြိုးကိုကို', class: '02', categoryId: CategoryId.KING, quote: "Code is poetry, leadership is art.", bio: "Full-stack developer by night, student leader by day." },
  { id: 'k3', number: '03', name: 'မောင်ထူးလင်းထက်', class: '03', categoryId: CategoryId.KING, quote: "Simplicity is the ultimate sophistication.", bio: "An advocate for clean code and cleaner campuses." },
  { id: 'k4', number: '04', name: 'မောင်ကောင်းထက်ညီ', class: '04', categoryId: CategoryId.KING, quote: "Stay hungry, stay foolish.", bio: "Aiming to bring more hackathons to campus." },
  { id: 'k5', number: '05', name: 'မောင်အောင်ရဲရင့်ကျော်', class: '05', categoryId: CategoryId.KING, quote: "The future belongs to those who prepare for it today.", bio: "Machine Learning enthusiast." },
  { id: 'k6', number: '06', name: 'မောင်အောင်ဖုန်းပြည့်', class: '06', categoryId: CategoryId.KING, quote: "Success is not final, failure is not fatal.", bio: "President of the Coding Club." },
  { id: 'k7', number: '07', name: 'မောင်မင်းပြည့်ဖြိုး', class: '07', categoryId: CategoryId.KING, quote: "Knowledge is power.", bio: "Dedicated to peer tutoring programs." },
  { id: 'k8', number: '08', name: 'မောင်မင်းသုကျော်', class: '08', categoryId: CategoryId.KING, quote: "Network your net worth.", bio: "Cisco certified dreamer." },
  { id: 'k9', number: '09', name: 'မောင်ရောင်စဉ်လင်းလက်', class: '09', categoryId: CategoryId.KING, quote: "Just do it.", bio: "Sports captain and tech geek." },
  { id: 'k10', number: '10', name: 'မောင်ထက်ဖြိုးအောင်', class: '10', categoryId: CategoryId.KING, quote: "There is no spoon.", bio: "Virtual reality explorer." },

  // --- QUEEN Candidates (9) ---
  { id: 'q1', number: '01', name: 'မမြစွာလွင်', class: '01', categoryId: CategoryId.QUEEN, quote: "Empowerment through technology.", bio: "Leading the Women in Tech initiative." },
  { id: 'q2', number: '02', name: 'မသဲဖြူစိုး', class: '02', categoryId: CategoryId.QUEEN, quote: "Dream big, work hard.", bio: "Balancing algorithms and athletics." },
  { id: 'q3', number: '03', name: 'မဌေးအိလှိုင်', class: '03', categoryId: CategoryId.QUEEN, quote: "Design is intelligence made visible.", bio: "UX enthusiast." },
  { id: 'q4', number: '04', name: 'မအိမ့်မှုးဖြူဇင်', class: '04', categoryId: CategoryId.QUEEN, quote: "Believe you can and you're halfway there.", bio: "Student council secretary." },
  { id: 'q5', number: '05', name: 'မနန်းမိုနွံဟွမ်', class: '05', categoryId: CategoryId.QUEEN, quote: "Creativity takes courage.", bio: "Graphic design lead." },
  { id: 'q6', number: '06', name: 'မအိအိလွင်', class: '06', categoryId: CategoryId.QUEEN, quote: "Be the change.", bio: "Environmental club president." },
  { id: 'q7', number: '07', name: 'မဟန်နီကို', class: '07', categoryId: CategoryId.QUEEN, quote: "Connect, collaborate, create.", bio: "Networking specialist." },
  { id: 'q8', number: '08', name: 'မနန်ဖွေးလောဝ်', class: '08', categoryId: CategoryId.QUEEN, quote: "Grace under pressure.", bio: "Public speaking champion." },
  { id: 'q9', number: '09', name: 'မဇူးဇူအောင်', class: '09', categoryId: CategoryId.QUEEN, quote: "Logic will get you from A to B. Imagination will take you everywhere.", bio: "Algorithm ace." },

  // --- MISTER Candidates (8) ---
  { id: 'm1', number: '01', name: 'မောင်စစ်မင်းနိုင်', class: '01', categoryId: CategoryId.MISTER, quote: "I'm just Ken... enough.", bio: "Bringing charm and AI expertise." },
  { id: 'm2', number: '02', name: 'မောင်ညဏ်လင်း', class: '02', categoryId: CategoryId.MISTER, quote: "Laughter is the best debugger.", bio: "Class clown." },
  { id: 'm3', number: '03', name: 'မောင်သာထက်စံ', class: '03', categoryId: CategoryId.MISTER, quote: "Bringing sexy back to code.", bio: "Musician and coder." },
  { id: 'm4', number: '04', name: 'မောင်ဝေဖြိုး', class: '04', categoryId: CategoryId.MISTER, quote: "I see everything.", bio: "Data analyst with vision." },
  { id: 'm5', number: '05', name: 'မောင်မျိုးသီဟကျော်', class: '05', categoryId: CategoryId.MISTER, quote: "With great power comes great responsibility.", bio: "Web crawler." },
  { id: 'm6', number: '06', name: 'မောင်ဟိန်းလင်း', class: '06', categoryId: CategoryId.MISTER, quote: "I am Iron Man.", bio: "Tech genius billionaire (in making)." },
  { id: 'm7', number: '07', name: 'မောင်ခန့်မင်းကျော်', class: '07', categoryId: CategoryId.MISTER, quote: "I can do this all day.", bio: "Class representative." },
  { id: 'm8', number: '08', name: 'မောင်အောင်ဘုန်းခန့်', class: '08', categoryId: CategoryId.MISTER, quote: "I'm Batman.", bio: "Cybersecurity specialist." },

  // --- MISS Candidates (7) ---
  { id: 'ms1', number: '01', name: 'မသွန်းရတီထွန်း', class: '01', categoryId: CategoryId.MISS, quote: "Data tells a story.", bio: "Data Science major." },
  { id: 'ms2', number: '02', name: 'မရှင်းရှင်းသန့်', class: '02', categoryId: CategoryId.MISS, quote: "Shake it off, code it up.", bio: "Web wizard." },
  { id: 'ms3', number: '03', name: 'မစီစီလျာခေါန်ရိန်', class: '03', categoryId: CategoryId.MISS, quote: "Thank u, next (bug).", bio: "Vocal about variable naming." },
  { id: 'ms4', number: '04', name: 'မယွန်းနဒီဇော်', class: '04', categoryId: CategoryId.MISS, quote: "Kill 'em with kindness.", bio: "Community manager." },
  { id: 'ms5', number: '05', name: 'မအိအိအောင်', class: '05', categoryId: CategoryId.MISS, quote: "Duh.", bio: "Alternative thinker." },
  { id: 'ms6', number: '06', name: 'မထက်ဆုရတီ', class: '06', categoryId: CategoryId.MISS, quote: "New rules.", bio: "Defining new protocols." },
  { id: 'ms7', number: '07', name: 'မစံထိပ်ထားခင်', class: '07', categoryId: CategoryId.MISS, quote: "Hear me roar.", bio: "Network administrator." },
];

export const CATEGORIES = [
  { id: CategoryId.KING, label: 'KING', color: 'bg-blue-600' },
  { id: CategoryId.QUEEN, label: 'QUEEN', color: 'bg-pink-600' },
  { id: CategoryId.MISTER, label: 'MISTER', color: 'bg-teal-600' },
  { id: CategoryId.MISS, label: 'MISS', color: 'bg-purple-600' },
];