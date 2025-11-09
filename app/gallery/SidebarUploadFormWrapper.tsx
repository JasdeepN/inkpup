'use client';
import SidebarUploadForm from '../../components/admin/client/SidebarUploadForm';
import React from 'react';

export default function SidebarUploadFormWrapper({ canMutate, category }: { canMutate: boolean, category: string }) {
  return <SidebarUploadForm canMutate={canMutate} category={category} />;
}
