import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealDetail } from "@/components/deals/deal-detail";

interface DealDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({
  params,
}: DealDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      {/* Deal Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Deal Details</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Acme Corp</span>
            <span>&middot;</span>
            <Badge variant="secondary">Qualification</Badge>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Edit
          </Button>
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DealDetail dealId={id} />
        </TabsContent>

        <TabsContent value="activity">
          <div className="py-8 text-center text-sm text-muted-foreground">
            Activity timeline will be displayed here.
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <div className="py-8 text-center text-sm text-muted-foreground">
            Associated contacts will be displayed here.
          </div>
        </TabsContent>

        <TabsContent value="ai-insights">
          <div className="py-8 text-center text-sm text-muted-foreground">
            AI-generated insights and recommendations will be displayed here.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
