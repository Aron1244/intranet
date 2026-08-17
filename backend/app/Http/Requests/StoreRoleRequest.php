<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'can_post_announcements' => ['sometimes', 'boolean'],
        ];

        // Add department_id validation if migration has been applied
        if (\Illuminate\Support\Facades\Schema::hasColumn('roles', 'department_id')) {
            $rules['department_id'] = ['required', 'integer', 'exists:departments,id'];
        }

        return $rules;
    }
}
