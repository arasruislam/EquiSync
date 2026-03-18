export const fetchLiveExchangeRate = async (): Promise<number> => {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      // cache for an hour to avoid spamming the free API
      next: { revalidate: 3600 } 
    });
    const data = await res.json();
    if (data && data.rates && data.rates.BDT) {
      // Rounds to 2 decimal places for neatness
      return Number(data.rates.BDT.toFixed(2));
    }
  } catch (error) {
    console.warn("Failed to fetch live exchange rate, falling back to 120", error);
  }
  return 120; // Safe static fallback
};
