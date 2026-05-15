import { useState, useCallback } from "react";

export const useApi = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (endpointFn: (params?: any) => Promise<any>, params: any = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await endpointFn(params);
      setData(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data || err.message || "An unknown error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, error, isLoading, execute };
};