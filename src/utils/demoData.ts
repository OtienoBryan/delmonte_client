export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  policyNumber: string;
  policyType: string;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  premium: number;
  startDate: string;
  endDate: string;
  riskScore: number;
  claims: number;
  address: string;
}

export const clients: Client[] = [{
  id: '1',
  name: 'John Kamau',
  email: 'john.kamau@example.com',
  phone: '+254 712 345 678',
  policyNumber: 'KE-2023-10045',
  policyType: 'Life Insurance',
  status: 'active',
  premium: 1250.50,
  startDate: '2022-03-15',
  endDate: '2032-03-14',
  riskScore: 2,
  claims: 0,
  address: 'Kenyatta Avenue 42, Nairobi'
}, {
  id: '2',
  name: 'Ann Wanjiku',
  email: 'ann.wanjiku@example.com',
  phone: '+254 723 456 789',
  policyNumber: 'KE-2023-10089',
  policyType: 'Health Insurance',
  status: 'active',
  premium: 420.75,
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  riskScore: 1,
  claims: 2,
  address: 'Moi Avenue 15, Mombasa'
}, {
  id: '3',
  name: 'James Omondi',
  email: 'james.omondi@example.com',
  phone: '+254 734 567 890',
  policyNumber: 'KE-2022-08734',
  policyType: 'Property Insurance',
  status: 'pending',
  premium: 850.00,
  startDate: '2022-08-01',
  endDate: '2023-07-31',
  riskScore: 3,
  claims: 1,
  address: 'Oginga Odinga Road 29, Kisumu'
}, {
  id: '4',
  name: 'Mary Atieno',
  email: 'mary.atieno@example.com',
  phone: '+254 745 678 901',
  policyNumber: 'KE-2021-05623',
  policyType: 'Retirement Plan',
  status: 'active',
  premium: 3200.00,
  startDate: '2021-05-10',
  endDate: '2051-05-09',
  riskScore: 1,
  claims: 0,
  address: 'Koinange Street 8, Nairobi'
}, {
  id: '5',
  name: 'Peter Mwangi',
  email: 'peter.mwangi@example.com',
  phone: '+254 756 789 012',
  policyNumber: 'KE-2022-11456',
  policyType: 'Life Insurance',
  status: 'expired',
  premium: 980.25,
  startDate: '2012-11-20',
  endDate: '2022-11-19',
  riskScore: 2,
  claims: 0,
  address: 'Kisii Town Plaza, Kisii'
}, {
  id: '6',
  name: 'Grace Wambui',
  email: 'grace.wambui@example.com',
  phone: '+254 767 890 123',
  policyNumber: 'KE-2023-02178',
  policyType: 'Health Insurance',
  status: 'active',
  premium: 390.50,
  startDate: '2023-02-01',
  endDate: '2023-12-31',
  riskScore: 1,
  claims: 3,
  address: 'Eldoret Town Center, Eldoret'
}, {
  id: '7',
  name: 'David Kiprop',
  email: 'david.kiprop@example.com',
  phone: '+254 778 901 234',
  policyNumber: 'KE-2022-09345',
  policyType: 'Property Insurance',
  status: 'cancelled',
  premium: 1100.00,
  startDate: '2022-09-15',
  endDate: '2023-09-14',
  riskScore: 4,
  claims: 2,
  address: 'Nakuru Business Center, Nakuru'
}, {
  id: '8',
  name: 'Sarah Achieng',
  email: 'sarah.achieng@example.com',
  phone: '+254 789 012 345',
  policyNumber: 'KE-2023-03567',
  policyType: 'Retirement Plan',
  status: 'active',
  premium: 2800.75,
  startDate: '2023-03-01',
  endDate: '2053-02-28',
  riskScore: 1,
  claims: 0,
  address: 'Thika Road Mall, Nairobi'
}];

export const dashboardStats = {
  totalClients: 2543,
  activePolicies: 2189,
  pendingPolicies: 187,
  monthlyRevenue: 4875000,
  newClientsThisMonth: 42,
  renewalRate: 92.5,
  averagePremium: 2150.25,
  claimsProcessed: 98,
  claimsPending: 33,
  averageClaimValue: 22450.75
};

export const requests = {
  unscheduled: 10,
  pending: 3,
  inTransit: 3,
  completed: 5,
  
};

export const recentActivity = [{
  id: '1',
  type: 'new_policy',
  client: 'Brian Otieno',
  policyNumber: 'KE-2023-10234',
  date: '2023-08-15T09:23:12',
  details: 'New life insurance policy created'
}, {
  id: '2',
  type: 'claim_filed',
  client: 'James Omondi',
  policyNumber: 'KE-2022-08734',
  date: '2023-08-14T16:45:30',
  details: 'Property damage claim filed'
}, {
  id: '3',
  type: 'payment',
  client: 'Ann Wanjiku',
  policyNumber: 'KE-2023-10089',
  date: '2023-08-14T11:12:05',
  details: 'Premium payment received'
}, {
  id: '4',
  type: 'policy_update',
  client: 'Peter Mwangi',
  policyNumber: 'KE-2022-11456',
  date: '2023-08-13T14:30:45',
  details: 'Coverage amount increased'
}, {
  id: '5',
  type: 'claim_approved',
  client: 'Grace Wambui',
  policyNumber: 'KE-2023-02178',
  date: '2023-08-12T10:15:22',
  details: 'Medical claim approved'
}];

export const statusColors = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};