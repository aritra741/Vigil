import { relations } from "drizzle-orm";
import {
  tenants,
  tenantUsers,
  transactions,
  rules,
  alerts,
  auditLogs,
  reports,
} from "./schema";

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(tenantUsers),
  transactions: many(transactions),
  rules: many(rules),
  alerts: many(alerts),
  auditLogs: many(auditLogs),
  reports: many(reports),
}));

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenantId],
    references: [tenants.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [transactions.tenantId],
    references: [tenants.id],
  }),
  alerts: many(alerts),
}));

export const rulesRelations = relations(rules, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [rules.tenantId],
    references: [tenants.id],
  }),
  alerts: many(alerts),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [alerts.tenantId],
    references: [tenants.id],
  }),
  transaction: one(transactions, {
    fields: [alerts.transactionId],
    references: [transactions.id],
  }),
  rule: one(rules, {
    fields: [alerts.ruleId],
    references: [rules.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  tenant: one(tenants, {
    fields: [reports.tenantId],
    references: [tenants.id],
  }),
}));
