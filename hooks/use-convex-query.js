import { useQuery, useMutation, useAction } from "convex/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useConvexQuery = (query, ...args) => {
  // Check if we should skip the query
  const shouldSkip = args[0] === "skip";
  
  // Use the underlying useQuery hook, but handle skipping
  const result = useQuery(query, shouldSkip ? "skip" : args[0]);
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use effect to handle the state changes based on the query result
  useEffect(() => {
    if (shouldSkip) {
      setIsLoading(false);
      setData(null);
      return;
    }

    if (result === undefined) {
      setIsLoading(true);
    } else {
      try {
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  }, [result]);

  return {
    data,
    isLoading,
    error,
  };
};

export const useConvexActionTrigger = (action) => {
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const actionFn = useAction(action);

  const trigger = async (args = {}) => {
    setIsLoading(true);
    try {
      const response = await actionFn(args);
      setData(response);
      setError(null);
      return response;
    } catch (err) {
      setError(err);
      console.error("Action error:", err);
      toast.error(err.message || "Action failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    trigger,
    data,
    isLoading,
    error,
  };
};

export const useConvexMutation = (mutation) => {
  const mutationFn = useMutation(mutation);
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (...args) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await mutationFn(...args);
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      toast.error(err.message || "Mutation failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutate,
    data,
    isLoading,
    error,
  };
};

export const useConvexAction = (action, ...args) => {
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const actionFn = useAction(action);

  useEffect(() => {
    if (args[0] === "skip") {
      setIsLoading(false);
      return;
    }

    const runAction = async () => {
      setIsLoading(true);
      try {
        const actionArgs = args[0] || {};
        const response = await actionFn(actionArgs);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err);
        console.error("Action error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    runAction();
  }, [JSON.stringify(args)]);

  return {
    data,
    isLoading,
    error,
  };
};
