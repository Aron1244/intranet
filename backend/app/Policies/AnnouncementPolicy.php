<?php

namespace App\Policies;

use App\Models\Announcement;
use App\Models\User;

class AnnouncementPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Announcement $announcement): bool
    {
        if ($user->canManageAnnouncements()) {
            return true;
        }

        return $this->isVisibleTo($user, $announcement);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->canManageAnnouncements();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Announcement $announcement): bool
    {
        if ($user->canManageAnnouncements()) {
            if ($user->isAdministrator()) {
                return true;
            }

            return $user->belongsToDepartment($announcement->department_id);
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Announcement $announcement): bool
    {
        return $this->update($user, $announcement);
    }

    public function comment(User $user, Announcement $announcement): bool
    {
        return $this->isVisibleTo($user, $announcement);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Announcement $announcement): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Announcement $announcement): bool
    {
        return false;
    }

    /**
     * Una publicación general (sin departamento) la ven todos; una de
     * departamento, solo sus miembros.
     */
    private function isVisibleTo(User $user, Announcement $announcement): bool
    {
        if (! $announcement->is_visible) {
            return false;
        }

        return $announcement->department_id === null
            || $user->belongsToDepartment($announcement->department_id);
    }
}
