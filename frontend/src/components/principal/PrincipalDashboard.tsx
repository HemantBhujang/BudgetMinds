import { useState, useEffect } from 'react';
import type { User, Event } from '../../types';
import { api } from '../../services/api';
import { EventDetail } from '../common/EventDetail';

export function PrincipalDashboard({ user }: { user: User }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'reports'>('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const pending = await api.getPendingPrincipal();
      const all = await api.getAllEvents();
      setEvents(pending);
      setAllEvents(all.filter(e => e.status === 'Approved'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.approvePrincipal(id, user.id, comments[id] || 'Approved by Principal');
      setEvents(events.filter(e => e.id !== id));
    } catch (e) {
      console.error(e);
      alert("Approval failed");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.rejectEvent(id, user.id, comments[id] || 'Rejected by Principal');
      setEvents(events.filter(e => e.id !== id));
    } catch (e) {
      console.error(e);
      alert("Rejection failed");
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-500">Loading requests...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold text-slate-900">Principal Overview</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'pending' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            Pending Approvals
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            Approved Reports
          </button>
        </div>
      </div>

      {activeTab === 'pending' && (
        <div>
          {events.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm text-slate-500">
              No events pending your approval.
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="mb-12 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <EventDetail event={event} />
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Final Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Final remarks for the approved application..."
                    value={comments[event.id] || ''}
                    onChange={e => setComments({...comments, [event.id]: e.target.value})}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border mb-4"
                  />
                  <div className="flex gap-4 justify-end">
                    <button
                      onClick={() => handleReject(event.id)}
                      className="bg-white text-red-600 border border-red-200 font-medium py-2 px-6 rounded-md hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Reject Event
                    </button>
                    <button
                      onClick={() => handleApprove(event.id)}
                      className="bg-indigo-600 text-white font-medium py-2 px-6 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Finalize Approval
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="print:m-0">
          <div className="mb-6 flex justify-between items-center print:hidden">
            <h3 className="text-xl font-bold text-slate-900">All Approved Budgets</h3>
            <button 
              onClick={() => window.print()}
              className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Generate PDF Report
            </button>
          </div>
          
          <div className="print:block space-y-12">
            {allEvents.length === 0 ? (
              <p className="text-slate-500 text-center py-8 print:hidden">No approved events available.</p>
            ) : (
              allEvents.map(event => (
                <div key={event.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none print:break-inside-avoid">
                  <div className="border-b-4 border-indigo-600 p-4 bg-slate-50 print:bg-transparent">
                    <h3 className="text-2xl font-bold text-slate-900">Official Budget Report</h3>
                    <p className="text-slate-500">Event ID: #{event.id} | Status: {event.status}</p>
                  </div>
                  <EventDetail event={event} />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
