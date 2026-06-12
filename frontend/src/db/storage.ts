export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  ltv: number;
  healthScore: number;
  tags: string[]; // ['VIP', 'High Spender', 'Frequent', 'Inactive', 'New']
  lastActivityAt: string;
  createdAt: string;
  avatarUrl?: string;
  purchaseHistory: Array<{
    id: string;
    items: string;
    totalValue: number;
    date: string;
  }>;
  campaignTimeline: Array<{
    id: string;
    campaignName: string;
    date: string;
    action: string; // 'Received', 'Opened', 'Clicked', 'Converted'
    channel: string;
  }>;
}

export interface Order {
  id: string;
  customerId: string;
  items: string;
  totalValue: number;
  status: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  channel: 'WhatsApp' | 'SMS' | 'Email' | 'RCS';
  messageTemplate: string;
  audienceSegmentName: string;
  audienceSize: number;
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED';
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  readCount: number;
  clickedCount: number;
  convertedCount: number;
  failedCount: number;
  createdAt: string;
}

export interface Communication {
  id: string;
  campaignId: string;
  customerId: string;
  channel: string;
  recipient: string;
  state: 'SENT' | 'DELIVERED' | 'FAILED' | 'OPENED' | 'READ' | 'CLICKED' | 'CONVERTED';
  content: string;
  updatedAt: string;
}

export interface DbSchema {
  users: User[];
  customers: Customer[];
  orders: Order[];
  campaigns: Campaign[];
  communications: Communication[];
}
