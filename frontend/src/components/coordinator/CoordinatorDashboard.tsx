import { useState, useEffect } from 'react';
import type { User, Event, EventCreate, BudgetItem } from '../../types';
import { api } from '../../services/api';
import { storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { EventDetail } from '../common/EventDetail';

export function CoordinatorDashboard({ user }: { user: User }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Omit<BudgetItem, 'id'>[]>([{ item_name: '', quantity: 1, requested_amount: 0 }]);
  const [forwardingId, setForwardingId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState<{ [eventId: number]: string }>({});
  const [attachments, setAttachments] = useState<{ [eventId: number]: File | null }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a full app, this would fetch from GET /api/events
    // For now we just rely on local state.
  }, []);

  const handleAddItem = () => {
    setItems([...items, { item_name: '', quantity: 1, requested_amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || items.length === 0) return;

    setLoading(true);
    try {
      const newEvent: EventCreate = {
        coordinator_id: user.id,
        name,
        description,
        items: items.map(item => ({...item, requested_amount: Number(item.requested_amount)}))
      };
      
      const created = await api.createEvent(newEvent);
      setEvents([created, ...events]);
      
      // Reset form
      setName('');
      setDescription('');
      setItems([{ item_name: '', quantity: 1, requested_amount: 0 }]);
    } catch (error) {
      console.error("Failed to create event", error);
      alert("Error creating event");
    } finally {
      setLoading(false);
    }
  };

  // Poll for updates on the latest event
  useEffect(() => {
    if (events.length === 0) return;
    const pendingEvent = events[0];
    if (pendingEvent.status === 'Draft') {
      const interval = setInterval(async () => {
        try {
          const updated = await api.getEvent(pendingEvent.id);
          if (updated.status !== 'Draft') {
            setEvents(events.map(e => e.id === updated.id ? updated : e));
            clearInterval(interval);
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [events]);

  const handleForward = async (eventId: number) => {
    setForwardingId(eventId);
    try {
      let attachment_url: string | undefined = undefined;
      const file = attachments[eventId];
      if (file) {
        const fileRef = ref(storage, `attachments/${eventId}-${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
        attachment_url = await getDownloadURL(fileRef);
      }
      const forwarded = await api.forwardToFinancer(eventId, remarks[eventId] || '', attachment_url);
      setEvents(events.map(e => e.id === eventId ? forwarded : e));
    } catch (error) {
      console.error(error);
      alert("Failed to forward");
    } finally {
      setForwardingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Budget Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Event Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Budget Items</label>
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-center mb-2">
                <input type="text" required placeholder="Item Name" value={item.item_name} onChange={e => {
                  const newItems = [...items];
                  newItems[index].item_name = e.target.value;
                  setItems(newItems);
                }} className="flex-1 rounded-md border-slate-300 p-2 border focus:border-indigo-500" />
                <input type="number" required min="1" step="1" placeholder="Qty" value={item.quantity || 1} onChange={e => {
                  const newItems = [...items];
                  newItems[index].quantity = Number(e.target.value);
                  setItems(newItems);
                }} className="w-20 rounded-md border-slate-300 p-2 border focus:border-indigo-500" title="Quantity" />
                <input type="number" required min="0" step="0.01" placeholder="Total Amt" value={item.requested_amount || ''} onChange={e => {
                  const newItems = [...items];
                  newItems[index].requested_amount = Number(e.target.value);
                  setItems(newItems);
                }} className="w-32 rounded-md border-slate-300 p-2 border focus:border-indigo-500" title="Total Amount for Qty" />
                <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
              </div>
            ))}
            <button type="button" onClick={handleAddItem} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Add Item</button>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400">
              {loading ? 'Running AI Audit...' : 'Submit to AI Auditor'}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-2">Your Recent Events</h2>
        {events.length === 0 ? (
          <p className="text-slate-500 italic text-center py-8">No events created yet.</p>
        ) : (
          events.map(event => (
            <div key={event.id} className="mb-8">
              <EventDetail event={event} />
              {event.status === 'AI_Audited' && (
                <div className="mt-6 flex flex-col gap-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                              Forward to Financer <span className="text-xs font-normal text-slate-500">(Add remarks if not satisfied)</span>
                            </label>
                            <textarea
                              rows={2}
                              placeholder="e.g. The AI reduced the software subscription budget too much, we need at least ₹15000."
                              value={remarks[event.id] || ''}
                              onChange={(e) => setRemarks({...remarks, [event.id]: e.target.value})}
                              className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            <div className="mt-2">
                              <label className="block text-xs font-medium text-slate-500 mb-1">Attach Proof Document (Optional PDF)</label>
                              <input 
                                type="file" 
                                accept="application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  setAttachments({...attachments, [event.id]: file});
                                }}
                                className="text-sm text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                              />
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleForward(event.id)}
                            disabled={forwardingId === event.id}
                            className="inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors w-full sm:w-auto self-end"
                          >
                            {forwardingId === event.id ? 'Forwarding...' : 'Confirm & Forward to Financer'}
                          </button>
                        </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
