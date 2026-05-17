'use client';

import { useState } from 'react';
import { Download, AlertCircle, FileText, FileSpreadsheet, CheckCircle2, User, Calendar, Award, CheckCircle, HelpCircle, Activity } from 'lucide-react';

export default function ReportsClient({ data, role }: { data: any[], role: string }) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(data[0]?.id || '');
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [exportingPdf, setExportingPdf] = useState<string | null>(null); // null, 'global', or employee.id
  const [exportingExcel, setExportingExcel] = useState<string | null>(null); // null, 'global', or employee.id
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedEmployee = data.find(emp => emp.id === selectedEmployeeId) || data[0];

  const calculateScore = (uom: string, target: number, actual: number) => {
    if (isNaN(actual)) return 0;
    if (uom === 'MIN') return Math.min((actual / target) * 100, 100);
    if (uom === 'MAX') return target === 0 ? 0 : Math.min((target / actual) * 100, 100);
    if (uom === 'ZERO_BASED') return actual === 0 ? 100 : 0;
    return 0; 
  };

  const getQuarterProgress = (emp: any, quarter: string) => {
    if (!emp || !emp.goals || emp.goals.length === 0) return { overall: 0, completed: 0, onTrack: 0, pending: 0, total: 0 };
    
    let totalWeight = 0;
    let weightedProgress = 0;
    let completed = 0;
    let onTrack = 0;
    let pending = 0;

    emp.goals.forEach((goal: any) => {
      const ach = goal.achievements?.find((a: any) => a.quarter === quarter);
      const actual = ach ? ach.actualAchievement : 0;
      const status = ach ? ach.status : 'NOT_STARTED';
      
      const progress = calculateScore(goal.uomType, goal.target, actual);
      weightedProgress += progress * (goal.weightage / 100);
      totalWeight += goal.weightage;

      if (status === 'COMPLETED') completed++;
      else if (status === 'ON_TRACK') onTrack++;
      else pending++;
    });

    return {
      overall: totalWeight > 0 ? (weightedProgress / (totalWeight / 100)) : 0,
      completed,
      onTrack,
      pending,
      total: emp.goals.length
    };
  };

  const handleExportPdf = async (emp: any, quarter: string, source: 'global' | 'row') => {
    const loadingKey = source === 'global' ? 'global' : emp.id;
    setExportingPdf(loadingKey);
    setError('');
    setSuccess('');

    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const metrics = getQuarterProgress(emp, quarter);

      // --- BRAND HEADER ---
      doc.setFillColor(139, 92, 246); // Primary GoalForge purple
      doc.rect(0, 0, 210, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(139, 92, 246);
      doc.text('GoalForge', 15, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text('Performance Management System', 15, 27);

      // Report Header Right
      const rightX = 195;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
      doc.text('QUARTERLY PERFORMANCE REPORT', rightX, 22, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated: ${new Date().toLocaleString()}`, rightX, 27, { align: 'right' });

      // Border line
      doc.setDrawColor(229, 231, 235);
      doc.line(15, 32, 195, 32);

      // --- EMPLOYEE METADATA GRID ---
      doc.setFillColor(249, 250, 251); // Gray-50
      doc.rect(15, 36, 180, 28, 'F');
      doc.setDrawColor(243, 244, 246);
      doc.rect(15, 36, 180, 28);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      
      doc.text('Employee Name:', 20, 42);
      doc.text('Manager Name:', 20, 49);
      doc.text('Role/Level:', 20, 56);

      doc.text('Quarter Period:', 120, 42);
      doc.text('Sheet Status:', 120, 49);
      doc.text('Cycle Year:', 120, 56);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(17, 24, 39);
      
      doc.text(emp.name, 55, 42);
      doc.text(emp.managerName || 'None', 55, 49);
      doc.text(emp.role || 'Employee', 55, 56);

      doc.setFont('helvetica', 'bold');
      doc.text(quarter, 155, 42);
      doc.text(emp.sheetStatus, 155, 49);
      doc.setFont('helvetica', 'normal');
      doc.text('2026-2027', 155, 56);

      // --- SUMMARY SCORE BAR ---
      doc.setFillColor(243, 232, 255); // Purple light glow
      doc.rect(15, 68, 180, 16, 'F');
      doc.setDrawColor(216, 180, 254);
      doc.rect(15, 68, 180, 16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(109, 40, 217);
      doc.text('OVERALL COMPLETION SCORE:', 22, 78);
      
      doc.setFontSize(16);
      doc.text(`${metrics.overall.toFixed(1)}%`, 140, 79);

      // Quick summary submetrics
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      doc.text(`Completed: ${metrics.completed}   |   On Track: ${metrics.onTrack}   |   Pending: ${metrics.pending}`, 15, 91);

      // --- GOALS ACHIEVEMENT TABLE ---
      const tableHeaders = [['Goal Title', 'Thrust Area', 'Target', 'Actual', 'Weight', 'Progress', 'Status']];
      const tableBody = emp.goals.map((g: any) => {
        const ach = g.achievements?.find((a: any) => a.quarter === quarter);
        const actual = ach ? ach.actualAchievement : 0;
        const progress = calculateScore(g.uomType, g.target, actual);
        const status = ach ? ach.status.replace('_', ' ') : 'NOT STARTED';

        return [
          g.title,
          g.thrustArea,
          `${g.target} (${g.uomType})`,
          actual,
          `${g.weightage}%`,
          `${progress.toFixed(1)}%`,
          status
        ];
      });

      autoTable(doc, {
        startY: 96,
        head: tableHeaders,
        body: tableBody,
        theme: 'striped',
        headStyles: {
          fillColor: [124, 58, 237],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [55, 65, 81]
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30 },
          2: { cellWidth: 22 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 20 },
          6: { cellWidth: 28 }
        },
        margin: { left: 15, right: 15 }
      });

      // --- MANAGER FEEDBACK COMMENTS ---
      let currentY = (doc as any).lastAutoTable.finalY + 12;

      // Header for Feedback
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text('Manager Check-in Feedback & Comments', 15, currentY);
      
      currentY += 4;
      doc.setDrawColor(229, 231, 235);
      doc.line(15, currentY, 195, currentY);
      currentY += 6;

      let commentsFound = false;

      emp.goals.forEach((g: any) => {
        const ach = g.achievements?.find((a: any) => a.quarter === quarter);
        if (ach && ach.managerComment) {
          commentsFound = true;
          // Check if space exceeds page limit
          if (currentY > 260) {
            doc.addPage();
            currentY = 20;
          }

          // Goal Title mini-header
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(109, 40, 217);
          doc.text(g.title, 15, currentY);
          currentY += 4;

          // Blockquote bar
          doc.setFillColor(249, 250, 251);
          doc.rect(17, currentY, 178, 10, 'F');
          doc.setFillColor(139, 92, 246);
          doc.rect(15, currentY, 2, 10, 'F');

          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          doc.setTextColor(75, 85, 99);
          doc.text(ach.managerComment, 22, currentY + 6);
          currentY += 14;
        }
      });

      if (!commentsFound) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.text('No manager comments or structured feedback logged for this quarter.', 15, currentY);
      }

      // --- FOOTER BRANDING ---
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(229, 231, 235);
        doc.line(15, 282, 195, 282);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text('Generated by GoalForge Performance Management System • Confidential', 15, 287);
        doc.text(`Page ${i} of ${pageCount}`, 195, 287, { align: 'right' });
      }

      doc.save(`${emp.name.replace(/\s+/g, '_')}_Performance_Report_${quarter}.pdf`);
      setSuccess(`PDF Report downloaded successfully for ${emp.name}!`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF Report.');
    } finally {
      setExportingPdf(null);
    }
  };

  const handleExportExcel = async (emp: any, quarter: string, source: 'global' | 'row') => {
    const loadingKey = source === 'global' ? 'global' : emp.id;
    setExportingExcel(loadingKey);
    setError('');
    setSuccess('');

    try {
      const XLSX = await import('xlsx');

      const metrics = getQuarterProgress(emp, quarter);
      const rows: any[] = [];

      // 1. Title/Header metadata rows
      rows.push({ 'GoalForge Performance Report': 'GOALFORGE ENTERPRISE PERFORMANCE REPORT' });
      rows.push({ 'GoalForge Performance Report': `Export Date: ${new Date().toLocaleString()}` });
      rows.push({}); // Empty spacing

      rows.push({
        'GoalForge Performance Report': 'Employee Information',
        '__EMPTY': '',
        '__EMPTY_1': '',
        '__EMPTY_2': 'Performance Summary'
      });

      rows.push({
        'GoalForge Performance Report': 'Employee Name:',
        '__EMPTY': emp.name,
        '__EMPTY_1': 'Quarter Year:',
        '__EMPTY_2': quarter
      });

      rows.push({
        'GoalForge Performance Report': 'Manager Name:',
        '__EMPTY': emp.managerName || 'None',
        '__EMPTY_1': 'Overall Completion Score:',
        '__EMPTY_2': `${metrics.overall.toFixed(1)}%`
      });

      rows.push({
        'GoalForge Performance Report': 'Role/Level:',
        '__EMPTY': emp.role || 'Employee',
        '__EMPTY_1': 'Goals Completed:',
        '__EMPTY_2': `${metrics.completed} / ${metrics.total}`
      });

      rows.push({}); // Spacing row

      // 2. Add Table Headers
      const tableHeaders = [
        'Thrust Area',
        'Goal Title',
        'Goal Description',
        'UoM Type',
        'Target Value',
        'Actual Achievement',
        'Weightage (%)',
        'Progress Score (%)',
        'Check-In Status',
        'Manager Comment'
      ];
      rows.push(tableHeaders);

      // 3. Add Goals Data Rows
      emp.goals.forEach((g: any) => {
        const ach = g.achievements?.find((a: any) => a.quarter === quarter);
        const actual = ach ? ach.actualAchievement : 0;
        const progress = calculateScore(g.uomType, g.target, actual);
        const status = ach ? ach.status.replace('_', ' ') : 'NOT STARTED';
        const comment = ach ? (ach.managerComment || '') : '';

        rows.push([
          g.thrustArea,
          g.title,
          g.description,
          g.uomType,
          g.target,
          actual,
          g.weightage,
          progress.toFixed(1),
          status,
          comment
        ]);
      });

      // Generate Worksheet
      const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: true });

      // Apply Column Auto-sizing widths
      const colWidths = [
        { wch: 18 }, // Thrust Area
        { wch: 30 }, // Goal Title
        { wch: 35 }, // Description
        { wch: 12 }, // UoM
        { wch: 12 }, // Target
        { wch: 18 }, // Actual
        { wch: 12 }, // Weight
        { wch: 18 }, // Progress
        { wch: 15 }, // Status
        { wch: 40 }  // Comment
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${quarter}_Performance`);

      // Save file
      XLSX.writeFile(wb, `${emp.name.replace(/\s+/g, '_')}_Performance_Sheet_${quarter}.xlsx`);
      setSuccess(`Excel Report downloaded successfully for ${emp.name}!`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate Excel Report.');
    } finally {
      setExportingExcel(null);
    }
  };

  // Preview Stats
  const activeMetrics = getQuarterProgress(selectedEmployee, selectedQuarter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ENTERPRISE PERFORMANCE REPORT GENERATOR CARD */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1.5px solid var(--primary-glow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={24} style={{ color: 'var(--primary)' }} />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Enterprise Performance Exporter</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Instantly compile, analyze, and download professional executive reports.</p>
          </div>
        </div>

        {/* Filters Select Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <User size={16} />
              Select Employee
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--background)', color: 'var(--text-primary)', fontWeight: 600 }}
            >
              {data.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <Calendar size={16} />
              Select Quarter
            </label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--background)', color: 'var(--text-primary)', fontWeight: 600 }}
            >
              <option value="Q1">Q1 Quarter Period</option>
              <option value="Q2">Q2 Quarter Period</option>
              <option value="Q3">Q3 Quarter Period</option>
              <option value="Q4">Q4 Quarter Period</option>
            </select>
          </div>
        </div>

        {/* Live Report Preview Section */}
        {selectedEmployee && (
          <div style={{ padding: '1.5rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report Preview Metrics</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedEmployee.name} • {selectedQuarter}</span>
            </div>

            {/* Preview Grid Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Completion Rate</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{activeMetrics.overall.toFixed(1)}%</div>
              </div>

              <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle size={14} style={{ color: 'var(--success)' }} /> Completed
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeMetrics.completed} / {activeMetrics.total}</div>
              </div>

              <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Award size={14} style={{ color: 'var(--primary)' }} /> On Track
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeMetrics.onTrack} / {activeMetrics.total}</div>
              </div>

              <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <HelpCircle size={14} style={{ color: 'var(--warning)' }} /> Pending
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeMetrics.pending} / {activeMetrics.total}</div>
              </div>
            </div>

            {/* Export Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => handleExportPdf(selectedEmployee, selectedQuarter, 'global')}
                disabled={exportingPdf === 'global'}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none',
                  opacity: exportingPdf === 'global' ? 0.7 : 1, cursor: exportingPdf === 'global' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <FileText size={18} />
                {exportingPdf === 'global' ? 'Generating PDF...' : 'Download PDF Report'}
              </button>

              <button
                onClick={() => handleExportExcel(selectedEmployee, selectedQuarter, 'global')}
                disabled={exportingExcel === 'global'}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
                  background: '#10B981', color: 'white', fontWeight: 600, border: 'none',
                  opacity: exportingExcel === 'global' ? 0.7 : 1, cursor: exportingExcel === 'global' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <FileSpreadsheet size={18} />
                {exportingExcel === 'global' ? 'Generating Excel...' : 'Download Excel Report'}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '1rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* FULL EMPLOYEE DIRECTORY SUMMARY TABLE */}
      <div className="glass-panel" style={{ overflow: 'hidden', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Employee</th>
              {role === 'ADMIN' && <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manager</th>}
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Sheet Status</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>Q1 Completion</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>Q2 Completion</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>Q3 Completion</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>Q4 Completion</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>Report Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={role === 'ADMIN' ? 8 : 7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No employee goal sheets found for the current performance period.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 600 }}>{row.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.email}</div>
                  </td>
                  {role === 'ADMIN' && <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{row.managerName}</td>}
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600,
                      background: row.sheetStatus === 'LOCKED' ? 'var(--success-bg)' : row.sheetStatus === 'SUBMITTED' ? 'var(--primary-glow)' : 'var(--warning-bg)',
                      color: row.sheetStatus === 'LOCKED' ? 'var(--success)' : row.sheetStatus === 'SUBMITTED' ? 'var(--primary)' : 'var(--warning)'
                    }}>
                      {row.sheetStatus}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 500 }}>{row.q1}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 500 }}>{row.q2}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 500 }}>{row.q3}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 500 }}>{row.q4}</td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleExportPdf(row, selectedQuarter, 'row')}
                        disabled={exportingPdf !== null}
                        title={`Export PDF for ${row.name}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem',
                          borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)',
                          background: 'transparent', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600,
                          cursor: exportingPdf !== null ? 'not-allowed' : 'pointer', opacity: exportingPdf !== null ? 0.6 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        <FileText size={14} />
                        {exportingPdf === row.id ? 'PDF...' : 'PDF'}
                      </button>

                      <button
                        onClick={() => handleExportExcel(row, selectedQuarter, 'row')}
                        disabled={exportingExcel !== null}
                        title={`Export Excel for ${row.name}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem',
                          borderRadius: 'var(--radius-sm)', border: '1px solid #10B981',
                          background: 'transparent', color: '#10B981', fontSize: '0.75rem', fontWeight: 600,
                          cursor: exportingExcel !== null ? 'not-allowed' : 'pointer', opacity: exportingExcel !== null ? 0.6 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        <FileSpreadsheet size={14} />
                        {exportingExcel === row.id ? 'Excel...' : 'Excel'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
