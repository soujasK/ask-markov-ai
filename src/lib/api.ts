const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = {
  post: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error connecting to backend (${endpoint}):`, error);
      throw error;
    }
  },
};
