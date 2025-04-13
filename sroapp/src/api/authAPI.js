const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export async function checkOrCreateUser(email, name) {
  const response = await fetch(`${BASE_URL}/auth/check-or-create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, name }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'User sync failed');
  return result;
}
