import AdminShell from "@/components/admin/AdminShell";
import MessageDetail from "@/components/admin/MessageDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminMessageDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AdminShell>
      <MessageDetail messageId={id} />
    </AdminShell>
  );
}
