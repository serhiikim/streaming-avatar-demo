const PROXY_URL = import.meta.env.VITE_PROXY_URL || '/api/webhook';

export async function proxyWebhook(payload: any): Promise<void> {
  try {
    console.log('Proxying webhook request:', payload);
    
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Proxy error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Proxy call failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Proxy success response:', result);
  } catch (error) {
    console.error('Proxy call failed:', error);
    throw error;
  }
} 