'use client';

import { useState } from 'react';
import { Target } from 'lucide-react';
import SharedGoalModal from './SharedGoalModal';

export default function TeamActions({ employees }: { employees: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
          background: 'var(--primary)', color: 'white', fontWeight: 600,
          transition: 'all 0.2s ease', boxShadow: 'var(--shadow-md)'
        }}
      >
        <Target size={18} />
        Create Shared Goal
      </button>

      <SharedGoalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        employees={employees} 
      />
    </>
  );
}
