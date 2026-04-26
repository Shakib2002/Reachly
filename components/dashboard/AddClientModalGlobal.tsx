'use client';

import { useClientStore } from '@/lib/clientStore';
import AddClientModalInner from '@/components/crm/AddClientModal';

export default function AddClientModalGlobal() {
  const { addModalOpen, setAddModalOpen } = useClientStore();
  if (!addModalOpen) return null;
  return <AddClientModalInner onClose={() => setAddModalOpen(false)} />;
}
