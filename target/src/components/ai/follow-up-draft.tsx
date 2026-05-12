"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FollowUpDraftProps {
  draft: {
    subject: string;
    bodyText: string;
  };
  onSend?: () => void;
  onDiscard?: () => void;
}

export function FollowUpDraft({
  draft,
  onSend,
  onDiscard,
}: FollowUpDraftProps) {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.bodyText);

  return (
    <div className="space-y-4 rounded-lg border p-6">
      <h3 className="text-lg font-semibold">Follow-Up Draft</h3>

      {/* Subject */}
      <div className="space-y-1">
        <label
          htmlFor="follow-up-subject"
          className="text-sm font-medium text-muted-foreground"
        >
          Subject
        </label>
        <Input
          id="follow-up-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
        />
      </div>

      {/* Body */}
      <div className="space-y-1">
        <label
          htmlFor="follow-up-body"
          className="text-sm font-medium text-muted-foreground"
        >
          Body
        </label>
        <textarea
          id="follow-up-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Email body"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        {onSend && (
          <Button size="sm" onClick={onSend}>
            Send
          </Button>
        )}
        {onDiscard && (
          <Button variant="outline" size="sm" onClick={onDiscard}>
            Discard
          </Button>
        )}
      </div>
    </div>
  );
}
