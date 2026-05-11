import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactDetail } from "@/components/contacts/contact-detail";

interface ContactDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({
  params,
}: ContactDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      {/* Contact Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Contact Details</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>contact@example.com</span>
            <span>&middot;</span>
            <span>Acme Corp</span>
            <Badge variant="secondary">Lead</Badge>
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
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ContactDetail contactId={id} />
        </TabsContent>

        <TabsContent value="activity">
          <div className="py-8 text-center text-sm text-muted-foreground">
            Activity timeline will be displayed here.
          </div>
        </TabsContent>

        <TabsContent value="deals">
          <div className="py-8 text-center text-sm text-muted-foreground">
            Associated deals will be displayed here.
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="py-8 text-center text-sm text-muted-foreground">
            Tasks related to this contact will be displayed here.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
