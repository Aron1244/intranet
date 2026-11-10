<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SyncUserRolesRequest extends FormRequest
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
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // present y no required: una lista vacia es valida y sirve para
            // quitarle todos los roles al usuario.
            'role_ids' => ['present', 'array'],
            'role_ids.*' => ['integer', 'distinct', 'exists:roles,id'],
        ];
    }
}
