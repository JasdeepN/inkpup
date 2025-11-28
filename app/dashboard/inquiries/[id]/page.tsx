import { notFound } from 'next/navigation';
import { getInquiryAction } from '@/lib/admin-actions-inquiries';
import InquiryDetailPage from '@/components/admin/InquiryDetailPage';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

export default async function InquiryPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  
  const inquiryId = parseInt(id, 10);
  
  if (isNaN(inquiryId)) {
    notFound();
  }
  
  const { inquiry, error } = await getInquiryAction(inquiryId);
  
  if (error || !inquiry) {
    notFound();
  }
  
  // Determine the back URL based on the 'from' param
  const backUrl = from 
    ? `/dashboard/inquiries?status=${from}`
    : '/dashboard/inquiries';
  
  return (
    <div className="admin-shell">
      <InquiryDetailPage 
        inquiry={inquiry} 
        backUrl={backUrl}
        fromStatus={from}
      />
    </div>
  );
}
