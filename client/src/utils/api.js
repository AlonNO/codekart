import { supabase } from './supabase';

const SERVER_URL = import.meta.env.PROD
  ? 'https://codekart-server.onrender.com'
  : 'http://localhost:3001';

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

export async function buyItem(itemKey) {
  const token = await getToken();
  const res = await fetch(`${SERVER_URL}/api/store/buy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ itemKey }),
  });
  return res.json();
}

export async function equipItem(itemKey) {
  const token = await getToken();
  const res = await fetch(`${SERVER_URL}/api/store/equip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ itemKey }),
  });
  return res.json();
}