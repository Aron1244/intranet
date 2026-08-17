<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $rules = [
            'name' => ['sometimes', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($this->role)],
            'can_post_announcements' => ['sometimes', 'boolean'],
        ];

        // Add department_id validation if migration has been applied (but don't allow updating it)
        if (\Illuminate\Support\Facades\Schema::hasColumn('roles', 'department_id')) {
            // Note: department_id should not be updateable, only createable
        }

        return $rules;
    }
}
