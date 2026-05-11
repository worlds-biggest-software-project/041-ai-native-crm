"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MeetingSummaryOutput } from "@/server/services/ai/prompts";

interface MeetingSummaryCardProps {
  summary: MeetingSummaryOutput;
  onRegenerate?: () => void;
}

const sentimentConfig = {
  positive: { label: "Positive", className: "bg-green-100 text-green-800" },
  neutral: { label: "Neutral", className: "bg-gray-100 text-gray-800" },
  negative: { label: "Negative", className: "bg-red-100 text-red-800" },
} as const;

export function MeetingSummaryCard({
  summary,
  onRegenerate,
}: MeetingSummaryCardProps) {
  const sentiment = sentimentConfig[summary.sentiment];

  return (
    <div className="space-y-4 rounded-lg border p-6">
      {/* Summary */}
      <div>
        <h3 className="mb-2 text-lg font-semibold">Meeting Summary</h3>
        <p className="text-sm text-muted-foreground">{summary.summary}</p>
      </div>

      {/* Sentiment Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Sentiment:</span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sentiment.className}`}
        >
          {sentiment.label}
        </span>
      </div>

      {/* Key Points */}
      {summary.key_points.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">Key Points</h4>
          <ul className="list-inside list-disc space-y-1">
            {summary.key_points.map((point, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {summary.action_items.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">Action Items</h4>
          <ul className="space-y-2">
            {summary.action_items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                  aria-label={`Action item: ${item.description}`}
                />
                <div className="text-sm">
                  <span>{item.description}</span>
                  {item.assignee && (
                    <span className="ml-2 text-muted-foreground">
                      ({item.assignee})
                    </span>
                  )}
                  {item.due_date && (
                    <span className="ml-2 text-muted-foreground">
                      Due: {item.due_date}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Topics */}
      {summary.topics.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">Topics</h4>
          <div className="flex flex-wrap gap-2">
            {summary.topics.map((topic, index) => (
              <Badge key={index} variant="secondary">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Regenerate Button */}
      {onRegenerate && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            Regenerate Summary
          </Button>
        </div>
      )}
    </div>
  );
}
