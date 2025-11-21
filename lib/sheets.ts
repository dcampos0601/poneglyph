/**
 * Mocked Google Sheets data access.
 * TODO: Replace with real Sheets API integration.
 */

export type RouteType = "Warm" | "Direct Affinity" | "Cold";
export type WorkStatus = "Pending" | "In Progress" | "Closed in HubSpot" | "Lost";
export type PriorityLevel = "High" | "Medium" | "Low";
export type FitScoreLevel = "High" | "Medium" | "Low";

export interface Lead {
  leadId: string;
  accountId: string;
  accountName: string;
  domain: string;
  country: string;
  market: string;
  aumBucket: "<1B" | "1-3B" | "3-5B" | ">5B";
  residentialExposure: boolean;
  multifamilyExposure: boolean;
  affordableOnly: boolean;
  sunbeltFlag: boolean;
  fitScore: FitScoreLevel;
  excludeFlag?: boolean;
  notesAnalyst?: string;
  leadName: string;
  title: string;
  email: string;
  linkedInUrl?: string;
  routeType: RouteType;
  leadOwner: string;
  priority: PriorityLevel;
  workStatus: WorkStatus;
  lastTouchDate: string | null;
  hubspotContactId?: string;
  hubspotContactUrl?: string;
  sourceList: string;
  notesInternal?: string;
  evidenceUrl?: string;
}

export interface LeadFilters {
  routeType?: RouteType;
  fitScore?: FitScoreLevel;
  workStatus?: WorkStatus;
  market?: string;
  search?: string;
}

const mockLeads: Lead[] = [
  {
    leadId: "LD-001",
    accountId: "AC-100",
    accountName: "Blackstone Capital Partners",
    domain: "blackstone.com",
    country: "United States",
    market: "US - Sunbelt",
    aumBucket: ">5B",
    residentialExposure: true,
    multifamilyExposure: true,
    affordableOnly: false,
    sunbeltFlag: true,
    fitScore: "High",
    leadName: "Sara Jenkins",
    title: "Managing Director, Capital Markets",
    email: "sara.jenkins@blackstone.com",
    linkedInUrl: "https://linkedin.com/in/sara-jenkins",
    routeType: "Warm",
    leadOwner: "Martin",
    priority: "High",
    workStatus: "Pending",
    lastTouchDate: null,
    hubspotContactId: "123",
    hubspotContactUrl: "https://app.hubspot.com/contacts/123/record/456",
    sourceList: "Preqin",
    notesInternal: "Need Vista LP warm intro from Ana G.",
    evidenceUrl: "https://docs.google.com/document/d/blackstone-brief",
  },
  {
    leadId: "LD-002",
    accountId: "AC-205",
    accountName: "Greystar Global",
    domain: "greystar.com",
    country: "United States",
    market: "US - Sunbelt",
    aumBucket: ">5B",
    residentialExposure: true,
    multifamilyExposure: true,
    affordableOnly: false,
    sunbeltFlag: true,
    fitScore: "High",
    leadName: "Mateo Barros",
    title: "VP, Investments LATAM",
    email: "mateo.barros@greystar.com",
    linkedInUrl: "https://linkedin.com/in/mateobarros",
    routeType: "Direct Affinity",
    leadOwner: "Capitan",
    priority: "High",
    workStatus: "In Progress",
    lastTouchDate: "2025-11-17",
    hubspotContactId: "456",
    hubspotContactUrl: "https://app.hubspot.com/contacts/456/record/321",
    sourceList: "SFR",
    notesInternal: "Shared Sunbelt memo already; follow up on Monday.",
  },
  {
    leadId: "LD-003",
    accountId: "AC-330",
    accountName: "Andean Pension Fund A",
    domain: "fondosandinos.cl",
    country: "Chile",
    market: "Chile - Santiago",
    aumBucket: "3-5B",
    residentialExposure: true,
    multifamilyExposure: true,
    affordableOnly: false,
    sunbeltFlag: false,
    fitScore: "Medium",
    leadName: "Daniela Ibanez",
    title: "Chief Investment Officer",
    email: "daniela@fondosandinos.cl",
    linkedInUrl: "https://linkedin.com/in/danielaibanez",
    routeType: "Warm",
    leadOwner: "Lucia",
    priority: "Medium",
    workStatus: "Pending",
    lastTouchDate: null,
    hubspotContactId: "789",
    hubspotContactUrl: "https://app.hubspot.com/contacts/789/record/111",
    sourceList: "Manual",
    notesInternal: "Waiting on updated charter before intro.",
  },
  {
    leadId: "LD-004",
    accountId: "AC-480",
    accountName: "Orion Capital Advisors",
    domain: "orioncapital.mx",
    country: "Mexico",
    market: "Mexico - CDMX",
    aumBucket: "1-3B",
    residentialExposure: true,
    multifamilyExposure: true,
    affordableOnly: false,
    sunbeltFlag: false,
    fitScore: "Medium",
    leadName: "Rodrigo Caceres",
    title: "Head of Acquisitions",
    email: "rcaceres@orioncapital.mx",
    linkedInUrl: "https://linkedin.com/in/rodrigocaceres",
    routeType: "Cold",
    leadOwner: "Martin",
    priority: "Low",
    workStatus: "Lost",
    lastTouchDate: "2025-10-22",
    hubspotContactId: "901",
    hubspotContactUrl: "https://app.hubspot.com/contacts/901/record/444",
    sourceList: "CoStar",
    notesInternal: "Paused mandate after rate spike.",
  },
  {
    leadId: "LD-005",
    accountId: "AC-512",
    accountName: "Sunfield Partners",
    domain: "sunfieldpartners.com",
    country: "Brazil",
    market: "Brazil - Sao Paulo",
    aumBucket: "3-5B",
    residentialExposure: true,
    multifamilyExposure: true,
    affordableOnly: false,
    sunbeltFlag: true,
    fitScore: "High",
    leadName: "Isabella Costa",
    title: "Director of Capital Markets",
    email: "isabella.costa@sunfieldpartners.com",
    linkedInUrl: "https://linkedin.com/in/isabellacosta",
    routeType: "Direct Affinity",
    leadOwner: "Martin",
    priority: "High",
    workStatus: "Pending",
    lastTouchDate: "2025-11-10",
    hubspotContactId: "654",
    hubspotContactUrl: "https://app.hubspot.com/contacts/654/record/222",
    sourceList: "Preqin",
    notesInternal: "Met at LAVCA - ready for follow-up deck.",
  },
  {
    leadId: "LD-006",
    accountId: "AC-612",
    accountName: "Southern Sunbelt REIT",
    domain: "southernsunbeltreit.com",
    country: "United States",
    market: "US - Sunbelt",
    aumBucket: "3-5B",
    residentialExposure: true,
    multifamilyExposure: true,
    affordableOnly: false,
    sunbeltFlag: true,
    fitScore: "High",
    leadName: "Emily Rojas",
    title: "SVP Investor Relations",
    email: "emily.rojas@southernsunbeltreit.com",
    linkedInUrl: "https://linkedin.com/in/emilyrojas",
    routeType: "Cold",
    leadOwner: "Capitan",
    priority: "Medium",
    workStatus: "Closed in HubSpot",
    lastTouchDate: "2025-11-05",
    hubspotContactId: "345",
    hubspotContactUrl: "https://app.hubspot.com/contacts/345/record/999",
    sourceList: "SFR",
    notesInternal: "Already converted to HubSpot, waiting on legal.",
  },
];

export const MOCK_LEAD_OWNERS = Array.from(
  new Set(mockLeads.map((lead) => lead.leadOwner)),
);

export const MOCK_MARKETS = Array.from(
  new Set(mockLeads.map((lead) => lead.market)),
);

const priorityRank: Record<PriorityLevel, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

export async function getLeadsForOwner(
  owner: string | undefined,
  filters: LeadFilters = {},
): Promise<Lead[]> {
  const normalizedSearch = filters.search?.toLowerCase().trim();

  const filtered = mockLeads
    .filter((lead) => (owner ? lead.leadOwner === owner : true))
    .filter((lead) => {
      if (filters.routeType && lead.routeType !== filters.routeType) {
        return false;
      }
      if (filters.fitScore && lead.fitScore !== filters.fitScore) {
        return false;
      }
      if (filters.workStatus && lead.workStatus !== filters.workStatus) {
        return false;
      }
      if (filters.market && lead.market !== filters.market) {
        return false;
      }
      if (normalizedSearch) {
        const haystack = `${lead.accountName} ${lead.leadName} ${lead.title}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority];
      if (priorityDelta !== 0) return priorityDelta;

      const dateA = a.lastTouchDate ? new Date(a.lastTouchDate).getTime() : 0;
      const dateB = b.lastTouchDate ? new Date(b.lastTouchDate).getTime() : 0;
      return dateA - dateB;
    })
    .map((lead) => ({ ...lead }));

  return new Promise((resolve) => {
    setTimeout(() => resolve(filtered), 150);
  });
}

export async function markLeadWorkedToday(leadId: string): Promise<Lead | null> {
  const target = mockLeads.find((lead) => lead.leadId === leadId);
  if (!target) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);
  target.lastTouchDate = today;
  if (target.workStatus === "Pending") {
    target.workStatus = "In Progress";
  }

  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...target }), 120);
  });
}
