import AdminShell from "@/components/admin/AdminShell";
import MessageList from "@/components/admin/MessageList";
import { AdminPageHeading } from "@/components/admin/AdminPageHeading";

export default function AdminMessagesPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <AdminPageHeading titleKey="messagesTitle" />
      </div>
      <MessageList />
    </AdminShell>
  );
}
