import { notFound } from 'next/navigation';
import { getCustomerWithDepositsAction } from '@/lib/admin-actions-customers';
import CustomerDetailPage from '@/components/admin/CustomerDetailPage';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: PageProps) {
  const { id } = await params;
  const customerId = parseInt(id, 10);
  
  if (isNaN(customerId)) {
    notFound();
  }

  const { customer, error } = await getCustomerWithDepositsAction(customerId);
  
  if (error || !customer) {
    notFound();
  }

  return <CustomerDetailPage customer={customer} />;
}
