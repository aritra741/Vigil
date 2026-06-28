import { generateId } from "@/lib/utils/ids";

export interface MockTx {
  id: string;
  senderCountry: string;
  receiverCountry: string;
  amount: number;
  status: "flagged" | "blocked" | "cleared" | "pending";
  createdAt: Date;
  ruleName: string;
  severity: "critical" | "high" | "medium" | "low";
  senderName: string;
  receiverName: string;
  title: string;
}

const globalRef = global as any;

if (!globalRef.mockTransactions) {
  globalRef.mockTransactions = [
    {
      id: "mock-1",
      senderCountry: "NG",
      receiverCountry: "US",
      amount: 312400,
      status: "flagged",
      createdAt: new Date(Date.now() - 5 * 60000),
      ruleName: "Extreme risk score",
      severity: "critical",
      senderName: "Quantum Payments Ltd",
      receiverName: "Global Supply Co",
      title: "CRITICAL: Extreme risk score",
    },
    {
      id: "mock-2",
      senderCountry: "BR",
      receiverCountry: "US",
      amount: 198700,
      status: "flagged",
      createdAt: new Date(Date.now() - 15 * 60000),
      ruleName: "High-value transfer",
      severity: "high",
      senderName: "TechFlow Solutions",
      receiverName: "Pacific Trade Ltd",
      title: "HIGH: High-value transfer",
    },
    {
      id: "mock-3",
      senderCountry: "IN",
      receiverCountry: "GB",
      amount: 167300,
      status: "flagged",
      createdAt: new Date(Date.now() - 40 * 60000),
      ruleName: "SWIFT large transfer",
      severity: "high",
      senderName: "Apex Digital LLC",
      receiverName: "EuroConnect GmbH",
      title: "HIGH: SWIFT large transfer",
    },
    {
      id: "mock-4",
      senderCountry: "VN",
      receiverCountry: "DE",
      amount: 89200,
      status: "flagged",
      createdAt: new Date(Date.now() - 120 * 60000),
      ruleName: "High-risk origin",
      severity: "medium",
      senderName: "Quantum Payments Ltd",
      receiverName: "EuroConnect GmbH",
      title: "MEDIUM: High-risk origin",
    },
    {
      id: "mock-5",
      senderCountry: "KE",
      receiverCountry: "US",
      amount: 45000,
      status: "flagged",
      createdAt: new Date(Date.now() - 360 * 60000),
      ruleName: "Wire transfer threshold",
      severity: "low",
      senderName: "TechFlow Solutions",
      receiverName: "Global Supply Co",
      title: "LOW: Wire transfer threshold",
    },
  ];
}

export function getMockTransactions(): MockTx[] {
  return globalRef.mockTransactions;
}

export function addMockTransaction(tx: Omit<MockTx, "id" | "createdAt">) {
  const newTx: MockTx = {
    ...tx,
    id: generateId(),
    createdAt: new Date(),
  };
  globalRef.mockTransactions.unshift(newTx);
  // Cap at 100 entries to prevent memory overflow
  globalRef.mockTransactions = globalRef.mockTransactions.slice(0, 100);
  return newTx;
}
