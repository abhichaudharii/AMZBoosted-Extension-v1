import React from 'react';
import { CreateScheduleDialog } from '../../components/CreateScheduleDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PlanRestrictionDialog } from '@/components/PlanRestrictionDialog';
import { SubscriptionState } from '@/lib/utils/subscription';
import type { Schedule as ScheduleType } from '@/lib/db/schema';


interface SchedulesDialogsProps {
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (open: boolean) => void;
  loadSchedules: () => void;
  allSchedules: ScheduleType[];
  editingScheduleId: string | null;
  handleScheduleCreation: (data: Partial<ScheduleType>) => Promise<void>;
  handleUpdateSchedule: (id: string, data: any) => Promise<void>;
  
  pendingToggle: any | null;
  setPendingToggle: (schedule: any | null) => void;
  confirmToggleSchedule: () => void;

  pendingDelete: any | null;
  setPendingDelete: (schedule: any | null) => void;
  confirmDeleteSchedule: () => void;

  pendingRun: any | null;
  setPendingRun: (schedule: any | null) => void;
  confirmRunSchedule: () => void;

  pendingBulkDelete: { schedules: any[], clearSelection: () => void } | null;
  setPendingBulkDelete: (data: any | null) => void;
  confirmBulkDelete: () => void;

  restrictionOpen: boolean;
  setRestrictionOpen: (open: boolean) => void;
  restrictionState: SubscriptionState;
}

export const SchedulesDialogs: React.FC<SchedulesDialogsProps> = ({
  isCreateDialogOpen,
  setIsCreateDialogOpen,
  loadSchedules,
  allSchedules,
  editingScheduleId,
  handleScheduleCreation,
  handleUpdateSchedule,
  pendingToggle,
  setPendingToggle,
  confirmToggleSchedule,
  pendingDelete,
  setPendingDelete,
  confirmDeleteSchedule,
  pendingRun,
  setPendingRun,
  confirmRunSchedule,
  pendingBulkDelete,
  setPendingBulkDelete,
  confirmBulkDelete,
  restrictionOpen,
  setRestrictionOpen,
  restrictionState,
}) => {
  return (
    <>
      <CreateScheduleDialog
        open={isCreateDialogOpen}
        setOpen={setIsCreateDialogOpen}
        onScheduleCreated={loadSchedules}
        scheduleToEdit={editingScheduleId ? allSchedules.find(s => s.id === editingScheduleId) as any : null}
        onCreateSchedule={handleScheduleCreation}
        onUpdateSchedule={handleUpdateSchedule}
      />

      <ConfirmDialog
        open={!!pendingToggle}
        onOpenChange={(open) => !open && setPendingToggle(null)}
        title={pendingToggle?.status === 'active' ? "Pause Schedule?" : "Resume Schedule?"}
        description={`Are you sure you want to ${pendingToggle?.status === 'active' ? 'pause' : 'resume'} "${pendingToggle?.name}"?`}
        confirmText={pendingToggle?.status === 'active' ? "Pause" : "Resume"}
        cancelText="Cancel"
        onConfirm={confirmToggleSchedule}
        variant={pendingToggle?.status === 'active' ? 'default' : 'default'}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete Schedule?"
        description={`Are you sure you want to delete "${pendingDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteSchedule}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!pendingBulkDelete}
        onOpenChange={(open) => !open && setPendingBulkDelete(null)}
        title={`Delete ${pendingBulkDelete?.schedules.length} Schedules?`}
        description={`Are you sure you want to delete these ${pendingBulkDelete?.schedules.length} schedules? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={confirmBulkDelete}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!pendingRun}
        onOpenChange={(open) => !open && setPendingRun(null)}
        title="Run Schedule Now?"
        description={`This will immediately execute "${pendingRun?.name}". It may consume credits.`}
        confirmText="Run Now"
        cancelText="Cancel"
        onConfirm={confirmRunSchedule}
      />

      <PlanRestrictionDialog
        open={restrictionOpen}
        onClose={() => setRestrictionOpen(false)}
        state={restrictionState}
      />
    </>
  );
};
