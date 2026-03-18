export const emitSocketEvent = async (event: string, data?: any) => {
  try {
    const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005';
    await fetch(`${url}/api/socket/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, data }),
      // Don't wait for this in the background if possible, or fast fail
      signal: AbortSignal.timeout(2000)
    });
  } catch (error) {
    console.warn(`[Socket Emit] Failed to broadcast '${event}':`, error);
  }
};
