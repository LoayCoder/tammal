/**
 * useOrgTree — single read-only hook that fetches the full org structure
 * (branches, divisions, departments, sites) in parallel, caches them via
 * React Query, and exposes derived selectors that reuse the cache.
 *
 * Consumers that only need read access to org data should prefer this hook
 * over individual useBranches/useDivisions/useDepartments/useSites hooks.
 * The individual CRUD hooks remain the canonical way to mutate org entities.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Branch } from './useBranches';
import type { Division } from './useDivisions';
import type { Department } from './useDepartments';
import type { Site } from './useSites';

export interface OrgTree {
  branches: Branch[];
  divisions: Division[];
  departments: Department[];
  sites: Site[];
  isLoading: boolean;

  // Derived selectors — memoised on the arrays
  getBranch: (id: string) => Branch | undefined;
  getDivision: (id: string) => Division | undefined;
  getDepartment: (id: string) => Department | undefined;
  getSite: (id: string) => Site | undefined;
  getDepartmentsByDivision: (divisionId: string) => Department[];
  getDepartmentsByBranch: (branchId: string) => Department[];
  getSitesByBranch: (branchId: string) => Site[];
  getSitesByDepartment: (departmentId: string) => Site[];
}

export function useOrgTree(): OrgTree {
  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Branch[];
    },
    staleTime: 1000 * 60 * 5, // 5 min — org structure changes rarely
  });

  const divisionsQuery = useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('divisions')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Division[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Department[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const sitesQuery = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Site[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const branches = branchesQuery.data ?? [];
  const divisions = divisionsQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];
  const sites = sitesQuery.data ?? [];

  // Build lookup maps — only recompute when data reference changes
  const branchMap = useMemo(
    () => new Map(branches.map(b => [b.id, b])),
    [branches],
  );
  const divisionMap = useMemo(
    () => new Map(divisions.map(d => [d.id, d])),
    [divisions],
  );
  const departmentMap = useMemo(
    () => new Map(departments.map(d => [d.id, d])),
    [departments],
  );
  const siteMap = useMemo(
    () => new Map(sites.map(s => [s.id, s])),
    [sites],
  );

  // Derived selectors
  const getBranch = useMemo(() => (id: string) => branchMap.get(id), [branchMap]);
  const getDivision = useMemo(() => (id: string) => divisionMap.get(id), [divisionMap]);
  const getDepartment = useMemo(() => (id: string) => departmentMap.get(id), [departmentMap]);
  const getSite = useMemo(() => (id: string) => siteMap.get(id), [siteMap]);

  const getDepartmentsByDivision = useMemo(
    () => (divisionId: string) => departments.filter(d => d.division_id === divisionId),
    [departments],
  );
  const getDepartmentsByBranch = useMemo(
    () => (branchId: string) => departments.filter(d => d.branch_id === branchId),
    [departments],
  );
  const getSitesByBranch = useMemo(
    () => (branchId: string) => sites.filter(s => s.branch_id === branchId),
    [sites],
  );
  const getSitesByDepartment = useMemo(
    () => (departmentId: string) => sites.filter(s => s.department_id === departmentId),
    [sites],
  );

  return {
    branches,
    divisions,
    departments,
    sites,
    isLoading:
      branchesQuery.isLoading ||
      divisionsQuery.isLoading ||
      departmentsQuery.isLoading ||
      sitesQuery.isLoading,
    getBranch,
    getDivision,
    getDepartment,
    getSite,
    getDepartmentsByDivision,
    getDepartmentsByBranch,
    getSitesByBranch,
    getSitesByDepartment,
  };
}
