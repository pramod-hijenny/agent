export type Goal =
  | "cofounders"
  | "mentorship"
  | "fundraising"
  | "customers"
  | "advisors"
  | "feedback"
  | "partnerships"
  | "peer_support"
  | "hiring";

export const GOAL_LABELS: Record<Goal, string> = {
  cofounders: "Cofounders",
  mentorship: "Mentorship",
  fundraising: "Investor or advisor intros",
  customers: "Customers or design partners",
  advisors: "Advisors",
  feedback: "Product feedback",
  partnerships: "Partnerships",
  peer_support: "Founder peers",
  hiring: "Operator or talent network",
};

export type AgentTone = "Friendly" | "Professional" | "Direct" | "Warm" | "Curious";

export interface Permissions {
  can_talk_to_agents: boolean;
  can_recommend_people: boolean;
  can_draft_messages: boolean;
  can_send_without_approval: boolean;
  can_share_phone: boolean;
  can_share_email: boolean;
  can_schedule_meetings: boolean;
  can_discuss_finances: boolean;
  can_discuss_professional: boolean;
}

export const DEFAULT_PERMISSIONS: Permissions = {
  can_talk_to_agents: true,
  can_recommend_people: true,
  can_draft_messages: true,
  can_send_without_approval: false,
  can_share_phone: false,
  can_share_email: false,
  can_schedule_meetings: false,
  can_discuss_finances: false,
  can_discuss_professional: true,
};

export interface Community {
  id: string;
  name: string;
  type: "accelerator" | "founder_community" | "coworking" | "portfolio" | "event";
  city: string;
  description: string;
}

export interface AgentPersona {
  agent_name: string;
  tone: AgentTone;
  agent_intro: string;
  current_mission: string;
  status: "active" | "paused";
  memory: string[];
}

export interface Profile {
  id: string;
  user_id?: string;
  community_id: string;
  full_name: string;
  city: string;
  profession: string;
  company: string;
  role: "Founder" | "Builder" | "Operator" | "Investor" | "Mentor" | "Advisor";
  stage: string;
  bio: string;
  avatar_color: string;
  interests: string[];
  skills: string[];
  goals: Goal[];
  current_ask: string;
  offering: string;
  availability: string;
  likes: string;
  dislikes: string;
  topics_enjoy: string;
  topics_avoid: string;
  agent: AgentPersona;
  permissions: Permissions;
}

export interface IntroRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: number;
  transcript?: TranscriptTurn[];
  summary?: MatchSummary;
}

export interface TranscriptTurn {
  speaker: "user" | "other";
  text: string;
}

export interface MatchSummary {
  match_strength: "Strong" | "Good" | "Light";
  best_connection_type: string;
  mutual_value: string;
  conversation_starter: string;
  suggested_activity: string;
}

export const ALL_INTERESTS = [
  "Startups",
  "AI",
  "B2B SaaS",
  "Developer tools",
  "Design partners",
  "Product strategy",
  "Fundraising",
  "Go-to-market",
  "Growth",
  "Design",
  "Engineering",
  "Operations",
  "Fintech",
  "Healthcare",
  "Climate",
  "Community",
  "Coffee",
  "Mentorship",
  "Investing",
  "AI agents",
] as const;

export const ALL_SKILLS = [
  "Product",
  "Engineering",
  "Design",
  "Sales",
  "Marketing",
  "Fundraising",
  "Operations",
  "AI/ML",
  "Developer relations",
  "Customer discovery",
  "Community",
  "Finance",
] as const;
