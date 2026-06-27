import { listRules } from "@/lib/actions/rules";
import { RuleList } from "@/components/rules/rule-list";
import { RuleBuilder } from "@/components/rules/rule-builder";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const rules = await listRules();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Risk Rules</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Configure no-code rules for automatic transaction screening
          </p>
        </div>
        <RuleBuilder />
      </div>
      <RuleList rules={rules} />
    </div>
  );
}
