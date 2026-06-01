import { useState, useCallback } from "react";
import { AxiosResponse } from "axios";

export const useApi = <TData = unknown>() => {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (endpointFn: (params?: Record<string, unknown>) => Promise<AxiosResponse<TData>>, params: Record<string, unknown> = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await endpointFn(params);
      setData(response.data);
      return response.data;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: string }; message?: string })?.response?.data || (err as Error)?.message || "An unknown error occurred";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, error, isLoading, execute };
};