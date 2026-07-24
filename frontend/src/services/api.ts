import type { Event, EventCreate, User } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE_URL}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  // Coordinator
  createEvent: async (event: EventCreate): Promise<Event> => {
    const res = await fetch(`${API_BASE_URL}/events/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
  },

  getEvent: async (id: number): Promise<Event> => {
    const res = await fetch(`${API_BASE_URL}/events/${id}`);
    if (!res.ok) throw new Error('Failed to fetch event');
    return res.json();
  },

  getAllEvents: async (): Promise<Event[]> => {
    const res = await fetch(`${API_BASE_URL}/events/`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  forwardToFinancer: async (id: number, remarks: string = '', attachment_url?: string): Promise<Event> => {
    const response = await fetch(`${API_BASE_URL}/events/${id}/forward/financer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks, attachment_url })
    });
    if (!response.ok) throw new Error('Failed to forward event');
    return response.json();
  },

  // Financer
  getPendingFinancer: async (): Promise<Event[]> => {
    const response = await fetch(`${API_BASE_URL}/events/pending/financer`);
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  },

  financerApprove: async (id: number, approverId: number, comments: string = '', allocated_budget: number): Promise<Event> => {
    const response = await fetch(`${API_BASE_URL}/events/${id}/approve/financer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver_id: approverId, decision: 'Approved', comments, allocated_budget })
    });
    if (!response.ok) throw new Error('Failed to approve event');
    return response.json();
  },

  // Principal
  getPendingPrincipal: async (): Promise<Event[]> => {
    const res = await fetch(`${API_BASE_URL}/events/pending/principal`);
    if (!res.ok) throw new Error('Failed to fetch pending prin events');
    return res.json();
  },

  approvePrincipal: async (id: number, approverId: number, comments: string): Promise<Event> => {
    const res = await fetch(`${API_BASE_URL}/events/${id}/approve/principal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver_id: approverId, decision: 'Approved', comments }),
    });
    if (!res.ok) throw new Error('Failed to approve');
    return res.json();
  },

  rejectEvent: async (id: number, approverId: number, comments: string): Promise<Event> => {
    const res = await fetch(`${API_BASE_URL}/events/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver_id: approverId, decision: 'Rejected', comments }),
    });
    if (!res.ok) throw new Error('Failed to reject');
    return res.json();
  },
};
