'use client';
import UploadForm from '../UploadForm';
import React from 'react';

export default function SidebarUploadForm({ canMutate, category }: { canMutate: boolean, category: string }) {
  return <UploadForm canMutate={canMutate} category={category} />;
}
