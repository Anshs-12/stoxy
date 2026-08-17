const API_BASE = '/api/v2';

export async function getAnalysis(kind, payload) {
  const response = await fetch(`${API_BASE}/analyze/${kind}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const content = await response.text();
  if (!response.ok) throw new Error(content || 'Stoxy AI could not complete this analysis.');
  return content;
}
