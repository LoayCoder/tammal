import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EmployeeStatus } from '@/hooks/org/useEmployees';
import type { AccountStatus } from '@/components/employees/AccountStatusBadge';
import type { TaskFilters } from '@/components/workload/team/TeamTaskFilters';

type UiPreferences = {
  compactTables: boolean;
};

type UiState = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  directorySearch: string;
  directoryDepartmentFilter?: string;
  directoryStatusFilter?: EmployeeStatus;
  directoryAccountStatusFilter?: AccountStatus;
  setDirectorySearch: (value: string) => void;
  setDirectoryDepartmentFilter: (value: string | undefined) => void;
  setDirectoryStatusFilter: (value: EmployeeStatus | undefined) => void;
  setDirectoryAccountStatusFilter: (value: AccountStatus | undefined) => void;

  accessUserSearch: string;
  setAccessUserSearch: (value: string) => void;

  teamTaskFilters: TaskFilters;
  teamMemberSearch: string;
  teamSortBy: 'name' | 'overdue' | 'active' | 'progress';
  setTeamTaskFilters: (value: TaskFilters) => void;
  setTeamMemberSearch: (value: string) => void;
  setTeamSortBy: (value: 'name' | 'overdue' | 'active' | 'progress') => void;

  preferences: UiPreferences;
  setCompactTables: (value: boolean) => void;
};

const defaultTaskFilters: TaskFilters = {
  status: 'all',
  priority: 'all',
  employeeId: 'all',
  sourceType: 'all',
  search: '',
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      directorySearch: '',
      directoryDepartmentFilter: undefined,
      directoryStatusFilter: undefined,
      directoryAccountStatusFilter: undefined,
      setDirectorySearch: (value) => set({ directorySearch: value }),
      setDirectoryDepartmentFilter: (value) => set({ directoryDepartmentFilter: value }),
      setDirectoryStatusFilter: (value) => set({ directoryStatusFilter: value }),
      setDirectoryAccountStatusFilter: (value) => set({ directoryAccountStatusFilter: value }),

      accessUserSearch: '',
      setAccessUserSearch: (value) => set({ accessUserSearch: value }),

      teamTaskFilters: defaultTaskFilters,
      teamMemberSearch: '',
      teamSortBy: 'overdue',
      setTeamTaskFilters: (value) => set({ teamTaskFilters: value }),
      setTeamMemberSearch: (value) => set({ teamMemberSearch: value }),
      setTeamSortBy: (value) => set({ teamSortBy: value }),

      preferences: {
        compactTables: false,
      },
      setCompactTables: (value) =>
        set((state) => ({ preferences: { ...state.preferences, compactTables: value } })),
    }),
    {
      name: 'tammal-ui-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        directorySearch: state.directorySearch,
        directoryDepartmentFilter: state.directoryDepartmentFilter,
        directoryStatusFilter: state.directoryStatusFilter,
        directoryAccountStatusFilter: state.directoryAccountStatusFilter,
        accessUserSearch: state.accessUserSearch,
        teamTaskFilters: state.teamTaskFilters,
        teamMemberSearch: state.teamMemberSearch,
        teamSortBy: state.teamSortBy,
        preferences: state.preferences,
      }),
    },
  ),
);