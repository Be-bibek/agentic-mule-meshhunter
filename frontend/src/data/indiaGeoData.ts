export interface StateRiskData {
  id: string;
  name: string;
  code: string;
  riskScore: number;
  activeMules: number;
  volume: string;
  volumeNum: number;
  primaryVector: string;
  hotspots: string[];
  leaStatus: 'Red Notice' | 'Quarantine Active' | 'High Surveillance' | 'Standard Monitoring';
}

export interface CyberHotspot {
  id: string;
  name: string;
  state: string;
  coordinates: [number, number]; // [longitude, latitude]
  riskScore: number;
  activeMules: number;
  volume: string;
  volumeNum: number;
  category: 'Phishing Nexus' | 'Sim-Swap Hub' | 'Crypto OTC Sink' | 'Shell Corp Relay' | 'Neo-Bank Exploit' | 'Hawala Corridor';
  description: string;
}

export interface LaunderingCorridorHop {
  hotspotId: string;
  role: 'Ingress Point' | 'Layering Mule' | 'Shell Intermediate' | 'Terminal Cashout';
  amount: string;
}

export interface CorridorFlowArc {
  id?: string;
  from: string;
  to: string;
  amount: string;
  rail: 'UPI' | 'RTGS' | 'IMPS';
}

export interface LaunderingCorridor {
  threatId: string;
  threatName: string;
  totalLaundered: string;
  keyNodes: string[];
  flowArcs: CorridorFlowArc[];
  hops: LaunderingCorridorHop[];
}

// 28 Indian States & Key Territories with curated cyber risk metrics
export const INDIA_STATES_RISK: Record<string, StateRiskData> = {
  'Jharkhand': {
    id: 'JH',
    name: 'Jharkhand',
    code: 'JH',
    riskScore: 99,
    activeMules: 142,
    volume: '₹8.4 Cr',
    volumeNum: 84000000,
    primaryVector: 'Social Engineering & KYC Phishing',
    hotspots: ['Jamtara', 'Deoghar', 'Giridih'],
    leaStatus: 'Red Notice'
  },
  'Haryana': {
    id: 'HR',
    name: 'Haryana',
    code: 'HR',
    riskScore: 96,
    activeMules: 118,
    volume: '₹6.8 Cr',
    volumeNum: 68000000,
    primaryVector: 'Mewat SIM Swapping & Fast UPI Funnel',
    hotspots: ['Nuh (Mewat)', 'Gurugram', 'Faridabad'],
    leaStatus: 'Red Notice'
  },
  'Gujarat': {
    id: 'GJ',
    name: 'Gujarat',
    code: 'GJ',
    riskScore: 94,
    activeMules: 98,
    volume: '₹14.2 Cr',
    volumeNum: 142000000,
    primaryVector: 'Crypto OTC Sinks & Diamond Bourse Hawala',
    hotspots: ['Surat', 'Ahmedabad', 'Rajkot'],
    leaStatus: 'Quarantine Active'
  },
  'Maharashtra': {
    id: 'MH',
    name: 'Maharashtra',
    code: 'MH',
    riskScore: 92,
    activeMules: 164,
    volume: '₹18.6 Cr',
    volumeNum: 186000000,
    primaryVector: 'Corporate Shell VPAs & High-value RTGS Layering',
    hotspots: ['Mumbai (BKC)', 'Pune', 'Thane'],
    leaStatus: 'Quarantine Active'
  },
  'Delhi': {
    id: 'DL',
    name: 'NCT of Delhi',
    code: 'DL',
    riskScore: 95,
    activeMules: 135,
    volume: '₹12.4 Cr',
    volumeNum: 124000000,
    primaryVector: 'Extortion Ingress & Carding Merchant Funnels',
    hotspots: ['Central Delhi', 'Rohini', 'Dwarka'],
    leaStatus: 'Red Notice'
  },
  'West Bengal': {
    id: 'WB',
    name: 'West Bengal',
    code: 'WB',
    riskScore: 91,
    activeMules: 86,
    volume: '₹7.1 Cr',
    volumeNum: 71000000,
    primaryVector: 'Cross-border Hawala & Micro-Smurfing',
    hotspots: ['Kolkata', 'Siliguri', 'North 24 Parganas'],
    leaStatus: 'High Surveillance'
  },
  'Bihar': {
    id: 'BR',
    name: 'Bihar',
    code: 'BR',
    riskScore: 88,
    activeMules: 74,
    volume: '₹5.2 Cr',
    volumeNum: 52000000,
    primaryVector: 'AEPS Biometric Spoofing & Rural Mule Procurement',
    hotspots: ['Patna', 'Gaya', 'Nawada'],
    leaStatus: 'High Surveillance'
  },
  'Karnataka': {
    id: 'KA',
    name: 'Karnataka',
    code: 'KA',
    riskScore: 87,
    activeMules: 82,
    volume: '₹9.8 Cr',
    volumeNum: 98000000,
    primaryVector: 'Neo-bank Exploitation & Tech Payroll Laundering',
    hotspots: ['Bengaluru Urban', 'Mangaluru'],
    leaStatus: 'Quarantine Active'
  },
  'Telangana': {
    id: 'TG',
    name: 'Telangana',
    code: 'TG',
    riskScore: 86,
    activeMules: 67,
    volume: '₹6.5 Cr',
    volumeNum: 65000000,
    primaryVector: 'Offshore Gaming Funnels & Shell Merchant VPAs',
    hotspots: ['Hyderabad (Cyberabad)', 'Warangal'],
    leaStatus: 'High Surveillance'
  },
  'Rajasthan': {
    id: 'RJ',
    name: 'Rajasthan',
    code: 'RJ',
    riskScore: 84,
    activeMules: 61,
    volume: '₹4.9 Cr',
    volumeNum: 49000000,
    primaryVector: 'Call-center Syndicates & Fake Payment Gateways',
    hotspots: ['Jaipur', 'Alwar', 'Bharatpur'],
    leaStatus: 'High Surveillance'
  },
  'Uttar Pradesh': {
    id: 'UP',
    name: 'Uttar Pradesh',
    code: 'UP',
    riskScore: 85,
    activeMules: 112,
    volume: '₹8.9 Cr',
    volumeNum: 89000000,
    primaryVector: 'Distributed P2P Mule Rings & Student Account Renting',
    hotspots: ['Noida', 'Lucknow', 'Kanpur', 'Mathura'],
    leaStatus: 'High Surveillance'
  },
  'Punjab': {
    id: 'PB',
    name: 'Punjab',
    code: 'PB',
    riskScore: 80,
    activeMules: 48,
    volume: '₹3.8 Cr',
    volumeNum: 38000000,
    primaryVector: 'Visa Immigration Scams & Fake Overseas Gateways',
    hotspots: ['Chandigarh/Mohali', 'Ludhiana'],
    leaStatus: 'Standard Monitoring'
  },
  'Tamil Nadu': {
    id: 'TN',
    name: 'Tamil Nadu',
    code: 'TN',
    riskScore: 75,
    activeMules: 52,
    volume: '₹4.2 Cr',
    volumeNum: 42000000,
    primaryVector: 'Ecommerce Chargeback Fraud & Mule VPAs',
    hotspots: ['Chennai', 'Coimbatore'],
    leaStatus: 'Standard Monitoring'
  },
  'Kerala': {
    id: 'KL',
    name: 'Kerala',
    code: 'KL',
    riskScore: 78,
    activeMules: 41,
    volume: '₹3.9 Cr',
    volumeNum: 39000000,
    primaryVector: 'Overseas Remittance Layering & Hawala Ingress',
    hotspots: ['Kochi', 'Kozhikode'],
    leaStatus: 'Standard Monitoring'
  },
  'Madhya Pradesh': {
    id: 'MP',
    name: 'Madhya Pradesh',
    code: 'MP',
    riskScore: 79,
    activeMules: 44,
    volume: '₹3.5 Cr',
    volumeNum: 35000000,
    primaryVector: 'Shell POS Terminal Aggregations',
    hotspots: ['Indore', 'Bhopal'],
    leaStatus: 'Standard Monitoring'
  },
  'Odisha': {
    id: 'OD',
    name: 'Odisha',
    code: 'OD',
    riskScore: 77,
    activeMules: 36,
    volume: '₹2.7 Cr',
    volumeNum: 27000000,
    primaryVector: 'Gaming Micro-deposits & Remote UPI Drains',
    hotspots: ['Bhubaneswar', 'Cuttack'],
    leaStatus: 'Standard Monitoring'
  },
  'Andhra Pradesh': {
    id: 'AP',
    name: 'Andhra Pradesh',
    code: 'AP',
    riskScore: 73,
    activeMules: 39,
    volume: '₹2.9 Cr',
    volumeNum: 29000000,
    primaryVector: 'Loan App Fraud & Identity Leasing',
    hotspots: ['Visakhapatnam', 'Vijayawada'],
    leaStatus: 'Standard Monitoring'
  },
  'Assam': {
    id: 'AS',
    name: 'Assam',
    code: 'AS',
    riskScore: 71,
    activeMules: 28,
    volume: '₹1.8 Cr',
    volumeNum: 18000000,
    primaryVector: 'Border Crossings & Prepaid Wallet Farming',
    hotspots: ['Guwahati', 'Silchar'],
    leaStatus: 'Standard Monitoring'
  }
};

// Precise Geographical Hubs across India
export const CYBER_HOTSPOTS: CyberHotspot[] = [
  {
    id: 'jamtara',
    name: 'Jamtara',
    state: 'Jharkhand',
    coordinates: [86.80, 23.96],
    riskScore: 99,
    activeMules: 68,
    volume: '₹4.8 Cr',
    volumeNum: 48000000,
    category: 'Phishing Nexus',
    description: 'National epicentre for credential harvest, bulk SMS spoofing, and initial mule account provisioning.'
  },
  {
    id: 'mewat',
    name: 'Nuh (Mewat)',
    state: 'Haryana',
    coordinates: [77.01, 28.11],
    riskScore: 97,
    activeMules: 59,
    volume: '₹3.9 Cr',
    volumeNum: 39000000,
    category: 'Sim-Swap Hub',
    description: 'Specialised in high-velocity biometric SIM clones and fast sub-₹10k micro-UPI transfers.'
  },
  {
    id: 'surat',
    name: 'Surat',
    state: 'Gujarat',
    coordinates: [72.83, 21.17],
    riskScore: 94,
    activeMules: 46,
    volume: '₹9.4 Cr',
    volumeNum: 94000000,
    category: 'Crypto OTC Sink',
    description: 'Rapid off-ramping into Tether (USDT) OTC desks and jewellery/diamond trade settlement invoices.'
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    coordinates: [72.57, 23.02],
    riskScore: 90,
    activeMules: 38,
    volume: '₹5.6 Cr',
    volumeNum: 56000000,
    category: 'Shell Corp Relay',
    description: 'Network of ephemeral GST-registered shell entities routing bulk merchant settlements.'
  },
  {
    id: 'mumbai',
    name: 'Mumbai (BKC)',
    state: 'Maharashtra',
    coordinates: [72.87, 19.07],
    riskScore: 93,
    activeMules: 84,
    volume: '₹14.2 Cr',
    volumeNum: 142000000,
    category: 'Shell Corp Relay',
    description: 'High-ticket RTGS tranche dispersals through neo-banking API aggregators and shell escrow accounts.'
  },
  {
    id: 'delhi',
    name: 'Delhi NCR',
    state: 'Delhi',
    coordinates: [77.20, 28.61],
    riskScore: 96,
    activeMules: 78,
    volume: '₹11.1 Cr',
    volumeNum: 111000000,
    category: 'Phishing Nexus',
    description: 'Inflow capital funnel from compromised payment links and corporate phishing extortion.'
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    coordinates: [77.59, 12.97],
    riskScore: 88,
    activeMules: 51,
    volume: '₹7.8 Cr',
    volumeNum: 78000000,
    category: 'Neo-Bank Exploit',
    description: 'Exploitation of automated KYC on neo-banking apps to instantiate ephemeral corporate wallets.'
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad (Cyberabad)',
    state: 'Telangana',
    coordinates: [78.48, 17.38],
    riskScore: 87,
    activeMules: 44,
    volume: '₹5.4 Cr',
    volumeNum: 54000000,
    category: 'Hawala Corridor',
    description: 'Gaming app settlement loops channeling high-frequency transactions to offshore accounts.'
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    coordinates: [88.36, 22.57],
    riskScore: 92,
    activeMules: 56,
    volume: '₹6.2 Cr',
    volumeNum: 62000000,
    category: 'Hawala Corridor',
    description: 'Border-adjacent cash-out networks and rapid P2P crypto arbitrage operations.'
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    coordinates: [75.78, 26.91],
    riskScore: 85,
    activeMules: 35,
    volume: '₹3.7 Cr',
    volumeNum: 37000000,
    category: 'Phishing Nexus',
    description: 'Illicit technical support call centers funnelling merchant refunds to proxy mules.'
  },
  {
    id: 'patna',
    name: 'Patna',
    state: 'Bihar',
    coordinates: [85.13, 25.59],
    riskScore: 89,
    activeMules: 47,
    volume: '₹4.3 Cr',
    volumeNum: 43000000,
    category: 'Sim-Swap Hub',
    description: 'Aadhaar Enabled Payment System (AEPS) fingerprint cloning and rural bank account recruitment.'
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    coordinates: [73.85, 18.52],
    riskScore: 82,
    activeMules: 31,
    volume: '₹2.8 Cr',
    volumeNum: 28000000,
    category: 'Neo-Bank Exploit',
    description: 'Syndicates renting university student bank credentials for temporary pass-through staging.'
  },
  {
    id: 'kochi',
    name: 'Kochi',
    state: 'Kerala',
    coordinates: [76.27, 9.93],
    riskScore: 79,
    activeMules: 26,
    volume: '₹2.9 Cr',
    volumeNum: 29000000,
    category: 'Hawala Corridor',
    description: 'Layering inbound foreign remittance tranches across fragmented family accounts.'
  },
  {
    id: 'lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    coordinates: [80.94, 26.84],
    riskScore: 86,
    activeMules: 49,
    volume: '₹4.7 Cr',
    volumeNum: 47000000,
    category: 'Shell Corp Relay',
    description: 'Bulk FASTag and prepaid card wallet balance cycling to bypass financial reporting limits.'
  }
];

// Active Laundering Corridors associated with the Threat Accounts
export const THREAT_CORRIDORS: Record<string, LaunderingCorridor> = {
  'ACC-88219': {
    threatId: 'ACC-88219',
    threatName: 'Hydra Layering Nexus',
    totalLaundered: '₹42,80,000',
    keyNodes: ['delhi', 'mewat', 'jamtara', 'surat', 'mumbai'],
    flowArcs: [
      { id: 'arc-88219-1', from: 'delhi', to: 'mewat', amount: '₹42,80,000', rail: 'UPI' },
      { id: 'arc-88219-2', from: 'mewat', to: 'jamtara', amount: '₹38,50,000', rail: 'IMPS' },
      { id: 'arc-88219-3', from: 'jamtara', to: 'surat', amount: '₹34,20,000', rail: 'RTGS' },
      { id: 'arc-88219-4', from: 'surat', to: 'mumbai', amount: '₹28,60,000', rail: 'UPI' }
    ],
    hops: [
      { hotspotId: 'delhi', role: 'Ingress Point', amount: '₹42,80,000' },
      { hotspotId: 'mewat', role: 'Layering Mule', amount: '₹38,50,000' },
      { hotspotId: 'jamtara', role: 'Shell Intermediate', amount: '₹34,20,000' },
      { hotspotId: 'surat', role: 'Terminal Cashout', amount: '₹28,60,000' },
      { hotspotId: 'mumbai', role: 'Terminal Cashout', amount: '₹14,20,000' }
    ]
  },
  'ACC-41092': {
    threatId: 'ACC-41092',
    threatName: 'Velox Smurfing Hub',
    totalLaundered: '₹28,50,000',
    keyNodes: ['bengaluru', 'hyderabad', 'pune', 'ahmedabad'],
    flowArcs: [
      { id: 'arc-41092-1', from: 'bengaluru', to: 'hyderabad', amount: '₹28,50,000', rail: 'UPI' },
      { id: 'arc-41092-2', from: 'hyderabad', to: 'pune', amount: '₹24,10,000', rail: 'IMPS' },
      { id: 'arc-41092-3', from: 'pune', to: 'ahmedabad', amount: '₹18,90,000', rail: 'RTGS' }
    ],
    hops: [
      { hotspotId: 'bengaluru', role: 'Ingress Point', amount: '₹28,50,000' },
      { hotspotId: 'hyderabad', role: 'Layering Mule', amount: '₹24,10,000' },
      { hotspotId: 'pune', role: 'Shell Intermediate', amount: '₹18,90,000' },
      { hotspotId: 'ahmedabad', role: 'Terminal Cashout', amount: '₹28,50,000' }
    ]
  },
  'ACC-77401': {
    threatId: 'ACC-77401',
    threatName: 'Shadow-Hop Cyclic Nexus',
    totalLaundered: '₹34,20,000',
    keyNodes: ['kolkata', 'patna', 'lucknow', 'jaipur', 'delhi'],
    flowArcs: [
      { id: 'arc-77401-1', from: 'kolkata', to: 'patna', amount: '₹34,20,000', rail: 'IMPS' },
      { id: 'arc-77401-2', from: 'patna', to: 'lucknow', amount: '₹31,00,000', rail: 'UPI' },
      { id: 'arc-77401-3', from: 'lucknow', to: 'jaipur', amount: '₹29,40,000', rail: 'UPI' },
      { id: 'arc-77401-4', from: 'jaipur', to: 'delhi', amount: '₹27,80,000', rail: 'RTGS' }
    ],
    hops: [
      { hotspotId: 'kolkata', role: 'Ingress Point', amount: '₹34,20,000' },
      { hotspotId: 'patna', role: 'Layering Mule', amount: '₹31,00,000' },
      { hotspotId: 'lucknow', role: 'Shell Intermediate', amount: '₹29,40,000' },
      { hotspotId: 'jaipur', role: 'Layering Mule', amount: '₹27,80,000' },
      { hotspotId: 'delhi', role: 'Terminal Cashout', amount: '₹34,20,000' }
    ]
  },
  'ACC-39205': {
    threatId: 'ACC-39205',
    threatName: 'Ghost Merchant Outflow',
    totalLaundered: '₹19,40,000',
    keyNodes: ['mumbai', 'surat', 'ahmedabad'],
    flowArcs: [
      { id: 'arc-39205-1', from: 'mumbai', to: 'surat', amount: '₹19,40,000', rail: 'UPI' },
      { id: 'arc-39205-2', from: 'surat', to: 'ahmedabad', amount: '₹16,50,000', rail: 'RTGS' }
    ],
    hops: [
      { hotspotId: 'mumbai', role: 'Ingress Point', amount: '₹19,40,000' },
      { hotspotId: 'surat', role: 'Layering Mule', amount: '₹16,50,000' },
      { hotspotId: 'ahmedabad', role: 'Terminal Cashout', amount: '₹19,40,000' }
    ]
  },
  'ACC-19482': {
    threatId: 'ACC-19482',
    threatName: 'Dormant Spike Ingress',
    totalLaundered: '₹16,10,000',
    keyNodes: ['kochi', 'bengaluru', 'delhi'],
    flowArcs: [
      { id: 'arc-19482-1', from: 'kochi', to: 'bengaluru', amount: '₹16,10,000', rail: 'RTGS' },
      { id: 'arc-19482-2', from: 'bengaluru', to: 'delhi', amount: '₹14,80,000', rail: 'IMPS' }
    ],
    hops: [
      { hotspotId: 'kochi', role: 'Ingress Point', amount: '₹16,10,000' },
      { hotspotId: 'bengaluru', role: 'Layering Mule', amount: '₹14,80,000' },
      { hotspotId: 'delhi', role: 'Terminal Cashout', amount: '₹16,10,000' }
    ]
  }
};
