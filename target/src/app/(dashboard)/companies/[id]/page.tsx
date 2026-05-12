import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({
  params,
}: CompanyDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Company Details</h1>
          <p className="text-muted-foreground">
            View and manage company information.
          </p>
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
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="rounded-lg border p-6">
            <h3 className="mb-4 text-lg font-semibold">Company Information</h3>
            <p className="text-sm text-muted-foreground">
              Company detail view will be implemented here.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Company ID: {id}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <div className="py-8 text-center text-sm text-muted-foreground">
            Associated contacts will be displayed here.
          </div>
        </TabsContent>

        <TabsContent value="deals">
          <div className="py-8 text-center text-sm text-muted-foreground">
            Associated deals will be displayed here.
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="py-8 text-center text-sm text-muted-foreground">
            Activity timeline will be displayed here.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
