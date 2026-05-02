import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { Shield } from 'lucide-react';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'history'>('history');
  
  // History State
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventBudget, setEventBudget] = useState('');
  const [eventOutcome, setEventOutcome] = useState('');
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Users State (For calling Backend API)
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Coordinator');
  const [newUserName, setNewUserName] = useState('');
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/history');
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setHistoryList(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingHistory(true);
    try {
      // Calling Python backend to save historical data securely using Admin SDK
      const response = await fetch('http://localhost:8000/api/admin/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          eventDate,
          totalBudgetINR: Number(eventBudget),
          businessOutcome: eventOutcome
        })
      });

      if (!response.ok) throw new Error("Backend save failed");

      setEventName('');
      setEventDate('');
      setEventBudget('');
      setEventOutcome('');
      fetchHistory();
    } catch (error) {
      console.error("Error adding history:", error);
      alert("Failed to add historic data. Ensure backend is running.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingUser(true);
    try {
      // Calling Python backend to create Firebase user using Admin SDK
      const response = await fetch('http://localhost:8000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          name: newUserName,
          role: newUserRole
        })
      });
      
      if (!response.ok) throw new Error("Failed backend user creation");
      
      alert("User successfully created!");
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
    } catch (error) {
      console.error(error);
      alert("Failed to create user. Backend might not be configured yet.");
    } finally {
      setLoadingUser(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="bg-slate-800 text-white p-2 rounded-lg"><Shield size={24} /></div>
        <h2 className="text-2xl font-bold text-slate-900">System Administrator</h2>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium rounded-md ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          Historical Event Data
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium rounded-md ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          User Management
        </button>
      </div>

      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Historic Record</h3>
            <form onSubmit={handleAddHistory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Event Name</label>
                <input required type="text" value={eventName} onChange={e => setEventName(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Date/Year (e.g. 2023)</label>
                <input required type="text" value={eventDate} onChange={e => setEventDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Actual Cost (INR ₹)</label>
                <input required type="number" value={eventBudget} onChange={e => setEventBudget(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Business Outcome / Notes</label>
                <textarea required rows={3} value={eventOutcome} onChange={e => setEventOutcome(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 p-2 border" />
              </div>
              <button disabled={loadingHistory} type="submit" className="w-full bg-indigo-600 text-white font-medium py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                {loadingHistory ? 'Saving...' : 'Save Record to Firebase'}
              </button>
            </form>
          </div>
          
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cost (INR)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Outcome</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {historyList.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.eventName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.eventDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">₹{Number(item.totalBudgetINR).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={item.businessOutcome}>{item.businessOutcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {historyList.length === 0 && <div className="p-8 text-center text-slate-500">No historic data found in Firebase bucket.</div>}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Provision New User</h3>
          <p className="text-sm text-slate-500 mb-6">Create credentials for staff. No public signup is permitted.</p>
          
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <input required type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input required type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Temporary Password</label>
              <input required minLength={6} type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Role</label>
              <select required value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 p-2 border bg-white">
                <option value="Coordinator">Coordinator</option>
                <option value="Financer">Financer</option>
                <option value="Principal">Principal</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
            <button disabled={loadingUser} type="submit" className="w-full bg-slate-800 text-white font-medium py-2 rounded-md hover:bg-slate-900 mt-4 disabled:opacity-50">
              {loadingUser ? 'Provisioning...' : 'Create Application User'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
