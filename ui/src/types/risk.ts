interface Cluster {
  name: string;
  category: string;
}

interface AddressIdentification {
  name: string;
  category: string;
  description: string;
}

interface Exposure {
  category: string;
  value: string;
}

interface RuleTriggered {
  risk: string;
  minThreshold: number;
  maxThreshold: number;
}
interface Trigger {
  category: string;
  percentage: number;
  message: string;
  ruleTriggered?: RuleTriggered;
}

interface PoolMetadata {
  fees?: number;
  tokens: string[];
}

export interface RiskInfo {
  address: string;
  risk: "Low" | "Medium" | "High" | "Severe";
  riskReason?: string;
  cluster?: Cluster;
  addressIdentifications: AddressIdentification[];
  exposures: Exposure[];
  triggers: Trigger[];
  status: "COMPLETE" | "IN_PROGRESS" | "PENDING";
  poolMetadata: PoolMetadata;
}
