import type { Event } from '../../types';
import { CheckCircle, XCircle, Bot } from 'lucide-react';
import { useState } from 'react';

function ExpandableText({ text, className = "text-base leading-relaxed text-slate-700 whitespace-pre-line break-words" }: { text: string | undefined, className?: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  
  // Market Research can be very long, truncate at 200 chars
  const isLong = text.length > 200;
  const displayText = expanded || !isLong ? text : text.slice(0, 200) + '...';

  return (
    <div>
      <p className={className}>{displayText}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-bold mt-2"
        >
          {expanded ? 'Show Less' : 'Read More...'}
        </button>
      )}
    </div>
  );
}

export function EventDetail({ event }: { event: Event }) {
  if (!event) return null;

  const isPendingAI = event.status === 'Draft';
  const hasAudit = event.ai_audit != null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium leading-6 text-slate-900 flex items-center gap-2">
              {event.name}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800`}>
                Status: {event.status}
              </span>
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{event.description}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-500">Requested Budget</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ₹{event.total_requested_budget.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <p className="text-sm font-medium text-indigo-600">AI Suggested (INR)</p>
            <p className="text-2xl font-bold text-indigo-700 mt-1">
              {event.total_ai_suggested_budget > 0
                ? `₹${event.total_ai_suggested_budget.toLocaleString('en-IN')}`
                : 'Pending Audit'}
            </p>
          </div>
          {event.financer_allocated_budget && (
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
              <p className="text-sm font-medium text-emerald-600">Financer Allocated</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                ₹{event.financer_allocated_budget.toLocaleString('en-IN')}
              </p>
            </div>
          )}
        </div>

        {event.coordinator_remarks && (
          <div className="mt-6 bg-amber-50 rounded-lg p-5 border border-amber-200 border-l-4 border-l-amber-500">
            <h4 className="flex items-center text-sm font-bold text-amber-800 mb-2">
              Coordinator Request Remarks
            </h4>
            <p className="text-sm text-amber-700 whitespace-pre-line">{event.coordinator_remarks}</p>
            {event.attachment_url && (
              <a href={event.attachment_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-md shadow-sm w-max transition">
                <span>📎 View Attached Proof Document</span>
              </a>
            )}
          </div>
        )}
      </div>

      <div className="px-6 py-5">
        <h4 className="font-medium text-slate-900 mb-4">Budget Items</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">AI Suggested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">AI Reasoning</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {event.budget_items.map((item) => (
                <tr key={item.id} className={item.ai_suggested_amount !== item.requested_amount && item.ai_suggested_amount !== null ? "bg-red-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.item_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.quantity || 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">₹{item.requested_amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                    {item.ai_suggested_amount != null ? `₹${item.ai_suggested_amount.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={item.ai_reasoning || ''}>
                    {item.ai_reasoning || (isPendingAI ? 'Pending AI Review...' : '-')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasAudit && (
        <div className="px-6 py-5 bg-indigo-50/50 border-t border-indigo-100 flex flex-col gap-4">
          <h4 className="font-medium text-indigo-900 flex items-center gap-2">
            <Bot size={18} />
            BudgetMinds AI Agent Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Historical Context</h5>
                <ExpandableText text={event.ai_audit?.historical_context} />
             </div>
             <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Market Research</h5>
                <ExpandableText text={event.ai_audit?.market_research_data} />
             </div>
          </div>
          <div className="bg-indigo-600 text-white p-4 rounded-lg shadow-sm">
             <h5 className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-3">Executive Compliance Report</h5>
             <ExpandableText text={event.ai_audit?.compliance_report} className="text-base leading-relaxed text-indigo-50 whitespace-pre-line break-words" />
          </div>
        </div>
      )}

      {event.approvals.length > 0 && (
        <div className="px-6 py-5 border-t border-slate-200">
          <h4 className="font-medium text-slate-900 mb-4">Approval History</h4>
          <ul className="space-y-4">
            {event.approvals.map((approval) => (
              <li key={approval.id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  {approval.decision === 'Approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                </div>
                <div>
                  <div className="text-sm">
                    <span className="font-medium text-slate-900">Approver ID {approval.approver_id}</span>
                    <span className="text-slate-500 mx-1">{approval.decision} the budget</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-700 font-serif italic">"{approval.comments}"</div>
                  <div className="mt-2 text-xs text-slate-400">{new Date(approval.created_at).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
