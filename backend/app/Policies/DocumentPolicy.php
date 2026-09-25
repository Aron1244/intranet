<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    /**
     * Determine whether the user can view any documents.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the document.
     */
    public function view(User $user, Document $document): bool
    {
        return $this->canAccess($user, $document);
    }

    /**
     * Determine whether the user can upload a new document.
     *
     * Any authenticated user may upload; the resulting document is
     * owned by the uploader (user_id is always set to auth()->id()).
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the document.
     */
    public function update(User $user, Document $document): bool
    {
        return $this->canMutate($user, $document);
    }

    /**
     * Determine whether the user can delete the document.
     */
    public function delete(User $user, Document $document): bool
    {
        return $this->canMutate($user, $document);
    }

    /**
     * Determine whether the user can upload to a department folder.
     */
    public function uploadToDepartment(User $user, int $departmentId): bool
    {
        $isAdmin = $user->roles()->where('name', 'admin')->exists();
        if ($isAdmin) {
            return true;
        }

        return (int) $user->department_id === $departmentId;
    }

    private function canAccess(User $user, Document $document): bool
    {
        $isAdmin = $user->roles()->where('name', 'admin')->exists();
        if ($isAdmin) {
            return true;
        }

        if ((int) $document->user_id === (int) $user->id) {
            return true;
        }

        if ($document->visibility === 'public') {
            return true;
        }

        if (
            $document->visibility === 'department'
            && $document->folder
            && (int) $document->folder->department_id === (int) $user->department_id
        ) {
            return true;
        }

        return $document
            ->messages()
            ->whereHas('conversation.users', function ($conversationUserQuery) use ($user): void {
                $conversationUserQuery->whereKey($user->id);
            })
            ->exists();
    }

    private function canMutate(User $user, Document $document): bool
    {
        $isAdmin = $user->roles()->where('name', 'admin')->exists();
        if ($isAdmin) {
            return true;
        }

        return (int) $document->user_id === (int) $user->id;
    }
}
