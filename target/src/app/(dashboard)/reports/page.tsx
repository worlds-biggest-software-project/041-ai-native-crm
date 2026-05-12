"use client";

const kpiCards = [
  { label: "Total Deals", value: "127", change: "+12%" },
  { label: "Total Value", value: "$2.4M", change: "+8%" },
  { label: "Avg Deal Size", value: "$18.9K", change: "+3%" },
  { label: "Win Rate", value: "34%", change: "+2%" },
];

const funnelStages = [
  {
    name: "Lead",
    count: 45,
    totalValue: 850000,
    width: 100,
    color: "bg-blue-500",
  },
  {
    name: "Qualified",
    count: 32,
    totalValue: 640000,
    width: 80,
    color: "bg-blue-400",
  },
  {
    name: "Proposal",
    count: 20,
    totalValue: 480000,
    width: 60,
    color: "bg-indigo-500",
  },
  {
    name: "Negotiation",
    count: 15,
    totalValue: 320000,
    width: 45,
    color: "bg-indigo-400",
  },
  {
    name: "Closed Won",
    count: 10,
    totalValue: 200000,
    width: 30,
    color: "bg-green-500",
  },
  {
    name: "Closed Lost",
    count: 5,
    totalValue: 90000,
    width: 15,
    color: "bg-red-400",
  },
];

const staleDeals = [
  {
    name: "Enterprise License - Acme Corp",
    stage: "Proposal",
    daysSinceUpdate: 21,
    owner: "Alice Johnson",
  },
  {
    name: "Annual Contract - Globex",
    stage: "Negotiation",
    daysSinceUpdate: 18,
    owner: "Bob Smith",
  },
  {
    name: "Starter Plan - Initech",
    stage: "Qualified",
    daysSinceUpdate: 16,
    owner: "Alice Johnson",
  },
  {
    name: "Premium Upgrade - Umbrella Co",
    stage: "Lead",
    daysSinceUpdate: 15,
    owner: "Carol Davis",
  },
  {
    name: "Consulting Package - Wonka",
    stage: "Proposal",
    daysSinceUpdate: 14,
    owner: "Bob Smith",
  },
];

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your CRM performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {card.value}
            </p>
            <p className="mt-1 text-sm text-green-600">
              {card.change} from last month
            </p>
          </div>
        ))}
      </div>

      {/* Funnel Chart Section */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Pipeline Funnel</h2>
        <p className="mb-4 text-sm text-gray-500">
          Deal distribution across stages
        </p>
        <div className="space-y-3">
          {funnelStages.map((stage) => (
            <div key={stage.name} className="flex items-center gap-4">
              <span className="w-28 shrink-0 text-sm font-medium text-gray-700">
                {stage.name}
              </span>
              <div className="flex-1">
                <div
                  className={`${stage.color} h-8 rounded transition-all`}
                  style={{ width: `${stage.width}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-sm text-gray-600">
                {stage.count} deals
              </span>
              <span className="w-20 shrink-0 text-right text-sm font-medium text-gray-900">
                {formatCurrency(stage.totalValue)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Volume Section */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Activity Volume</h2>
        <div className="mt-4 flex h-48 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50">
          <p className="text-sm text-gray-400">
            Activity volume chart &mdash; wire to recharts
          </p>
        </div>
      </div>

      {/* Stale Deals Table */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Stale Deals</h2>
        <p className="mb-4 text-sm text-gray-500">
          Deals with no activity in the last 14 days
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Deal Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Days Stale
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staleDeals.map((deal) => (
                <tr key={deal.name} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {deal.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {deal.stage}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      {deal.daysSinceUpdate}d
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {deal.owner}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
