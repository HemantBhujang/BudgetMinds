import { useState, useEffect } from 'react';
import type { User, Event } from '../../types';
import { api } from '../../services/api';
import { EventDetail } from '../common/EventDetail';

export function FinancerDashboard({ user }: { user: User }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [allocatedBudgets, setAllocatedBudgets] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const pending = await api.getPendingFinancer();
      setEvents(pending);
      const initialBudgets: Record<number, number> = {};
      pending.forEach((e: Event) => {
        initialBudgets[e.id] = e.total_ai_suggested_budget;
      });
      setAllocatedBudgets(initialBudgets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.financerApprove(id, user.id, comments[id] || 'Approved by Financer', allocatedBudgets[id] || 0);
      setEvents(events.filter(e => e.id !== id));
    } catch (e) {
      console.error(e);
      alert("Approval failed");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.rejectEvent(id, user.id, comments[id] || 'Rejected by Financer');
      setEvents(events.filter(e => e.id !== id));
    } catch (e) {
      console.error(e);
      alert("Rejection failed");
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-500">Loading pending requests...</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Pending Financer Approval</h2>
      {events.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm text-slate-500">
          No events pending your approval.
        </div>
      ) : (
        events.map(event => (
          <div key={event.id} className="mb-12 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <EventDetail event={event} />
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Financer Comments</label>
                  <textarea
                    rows={2}
                    placeholder="Required for rejections, optional for approvals..."
                    value={comments[event.id] || ''}
                    onChange={e => setComments({...comments, [event.id]: e.target.value})}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Final Allocated Total Budget (INR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={allocatedBudgets[event.id] || ''}
                    onChange={e => setAllocatedBudgets({...allocatedBudgets, [event.id]: Number(e.target.value)})}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  />
                  <p className="mt-1 text-xs text-slate-500">You may override the AI suggested total here.</p>
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => handleReject(event.id)}
                  className="bg-white text-red-600 border border-red-200 font-medium py-2 px-6 rounded-md hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(event.id)}
                  className="bg-indigo-600 text-white font-medium py-2 px-6 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Approve & Forward to Principal
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
