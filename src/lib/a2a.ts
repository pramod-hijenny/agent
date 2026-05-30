export interface A2AAgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
  inputModes: string[];
  outputModes: string[];
}

export interface A2AAgentCard {
  protocolVersion: string;
  name: string;
  description: string;
  url: string;
  version: string;
  provider?: {
    organization: string;
    url: string;
  };
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    stateTransitionHistory: boolean;
    extendedAgentCard: boolean;
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: A2AAgentSkill[];
  supportedInterfaces: Array<{
    url: string;
    protocolBinding: "JSONRPC" | "GRPC" | "HTTP+JSON" | string;
    protocolVersion: string;
    tenant?: string;
  }>;
}

export const AGENT_CARD_PATH = "/.well-known/agent-card.json";
