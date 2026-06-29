"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatRelative, countryFlag } from "@/lib/utils/format";
import { SURFACE } from "@/lib/design/tokens";
import { StatusPill } from "@/components/ui/status-pill";
import { RiskPill } from "@/components/ui/risk-pill";
import type { Transaction } from "@/lib/db/schema";

interface TransactionTableProps {
  rows: Transaction[];
  highlightedIds?: string[];
}

export function TransactionTable({ rows, highlightedIds = [] }: TransactionTableProps) {
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ border: `1px solid ${SURFACE.border}` }}
    >
      <Table>
        <TableHeader>
          <TableRow
            className="hover:bg-transparent border-0"
            style={{ backgroundColor: SURFACE.card, borderBottom: `1px solid ${SURFACE.border}` }}
          >
            {["Time", "Amount", "Sender", "Receiver", "Rail", "Risk", "Status"].map((h) => (
              <TableHead
                key={h}
                className="h-8 py-0 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-600"
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((tx) => (
            <TableRow
              key={tx.id}
              className="border-0 h-10 hover:bg-[#1a1a1a] transition-colors duration-700"
              style={{
                backgroundColor: highlightedIds.includes(tx.id) ? "#171329" : SURFACE.card,
                borderBottom: `1px solid ${SURFACE.border}`,
              }}
            >
              <TableCell className="py-1.5 text-[11px] font-mono text-zinc-500">
                {tx.createdAt ? formatRelative(tx.createdAt) : "—"}
              </TableCell>
              <TableCell className="py-1.5 text-[12px] font-mono text-zinc-200 tabular-nums">
                {formatCurrency(tx.amount, tx.currency)}
              </TableCell>
              <TableCell className="py-1.5">
                <div className="text-[12px] text-zinc-300 leading-tight">{tx.senderName}</div>
                <div className="text-[10px] font-mono text-zinc-600">
                  {countryFlag(tx.senderCountry)} {tx.senderCountry}
                </div>
              </TableCell>
              <TableCell className="py-1.5">
                <div className="text-[12px] text-zinc-300 leading-tight">{tx.receiverName}</div>
                <div className="text-[10px] font-mono text-zinc-600">
                  {countryFlag(tx.receiverCountry)} {tx.receiverCountry}
                </div>
              </TableCell>
              <TableCell className="py-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-500 bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                  {tx.paymentRail}
                </span>
              </TableCell>
              <TableCell className="py-1.5">
                <RiskPill score={tx.riskScore} />
              </TableCell>
              <TableCell className="py-1.5">
                <StatusPill status={tx.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
