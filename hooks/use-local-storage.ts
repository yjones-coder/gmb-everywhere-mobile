import { useCallback, useEffect, useState } from "react";

import { Business, RecentSearch } from "@/data/mock-businesses";

const SAVED_AUDITS_KEY = "gmb_saved_audits";
const RECENT_SEARCHES_KEY = "gmb_recent_searches";
const COMPARE_LIST_KEY = "gmb_compare_list";

export type LeadStatus = 'Prospect' | 'Contacted' | 'Qualified' | 'Closed' | 'Lost';

export interface SavedAudit {
  id: string;
  business: Business;
  savedAt: number;
  notes?: string;
  leadStatus?: LeadStatus;
}

export function useSavedAudits() {
  const [audits, setAudits] = useState<SavedAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const data = localStorage.getItem(SAVED_AUDITS_KEY);
      if (data) {
        setAudits(JSON.parse(data));
      }
    } catch (error) {
      console.error("Failed to load saved audits:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveAudit = useCallback(async (business: Business, notes?: string, leadStatus: LeadStatus = 'Prospect') => {
    const newAudit: SavedAudit = {
      id: `audit_${Date.now()}`,
      business,
      savedAt: Date.now(),
      notes,
      leadStatus,
    };
    const updated = [newAudit, ...audits];
    setAudits(updated);
    localStorage.setItem(SAVED_AUDITS_KEY, JSON.stringify(updated));
    return newAudit;
  }, [audits]);

  const deleteAudit = useCallback(async (id: string) => {
    const updated = audits.filter((a) => a.id !== id);
    setAudits(updated);
    localStorage.setItem(SAVED_AUDITS_KEY, JSON.stringify(updated));
  }, [audits]);

  const updateAudit = useCallback(async (id: string, updates: Partial<SavedAudit>) => {
    const updated = audits.map((a) => (a.id === id ? { ...a, ...updates } : a));
    setAudits(updated);
    localStorage.setItem(SAVED_AUDITS_KEY, JSON.stringify(updated));
  }, [audits]);

  const isBusinessSaved = useCallback((businessId: string) => {
    return audits.some((a) => a.business.id === businessId);
  }, [audits]);

  return { audits, loading, saveAudit, deleteAudit, updateAudit, isBusinessSaved, refresh: loadAudits };
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    try {
      const data = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (data) {
        setSearches(JSON.parse(data));
      }
    } catch (error) {
      console.error("Failed to load recent searches:", error);
    } finally {
      setLoading(false);
    }
  };

  const addSearch = useCallback(async (query: string, resultCount: number) => {
    // Remove duplicate if exists
    const filtered = searches.filter((s) => s.query.toLowerCase() !== query.toLowerCase());
    const newSearch: RecentSearch = {
      id: `search_${Date.now()}`,
      query,
      timestamp: Date.now(),
      resultCount,
    };
    // Keep only last 10 searches
    const updated = [newSearch, ...filtered].slice(0, 10);
    setSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  }, [searches]);

  const clearSearches = useCallback(async () => {
    setSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const deleteSearch = useCallback(async (id: string) => {
    const updated = searches.filter((s) => s.id !== id);
    setSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  }, [searches]);

  return { searches, loading, addSearch, clearSearches, deleteSearch, refresh: loadSearches };
}

export function useCompareList() {
  const [compareList, setCompareList] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompareList();
  }, []);

  const loadCompareList = async () => {
    try {
      const data = localStorage.getItem(COMPARE_LIST_KEY);
      if (data) {
        setCompareList(JSON.parse(data));
      }
    } catch (error) {
      console.error("Failed to load compare list:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCompare = useCallback(async (business: Business) => {
    if (compareList.length >= 4) {
      return false; // Max 4 businesses
    }
    if (compareList.some((b) => b.id === business.id)) {
      return false; // Already in list
    }
    const updated = [...compareList, business];
    setCompareList(updated);
    localStorage.setItem(COMPARE_LIST_KEY, JSON.stringify(updated));
    return true;
  }, [compareList]);

  const removeFromCompare = useCallback(async (businessId: string) => {
    const updated = compareList.filter((b) => b.id !== businessId);
    setCompareList(updated);
    localStorage.setItem(COMPARE_LIST_KEY, JSON.stringify(updated));
  }, [compareList]);

  const clearCompareList = useCallback(async () => {
    setCompareList([]);
    localStorage.removeItem(COMPARE_LIST_KEY);
  }, []);

  const isInCompareList = useCallback((businessId: string) => {
    return compareList.some((b) => b.id === businessId);
  }, [compareList]);

  return {
    compareList,
    loading,
    addToCompare,
    removeFromCompare,
    clearCompareList,
    isInCompareList,
    refresh: loadCompareList,
  };
}
