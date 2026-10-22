<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;

class StoreDepartmentRequest extends FormRequest
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
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255', 'unique:departments,name'],
            'description' => ['nullable', 'string'],
            'initial_user_ids' => ['sometimes', 'array'],
            'initial_user_ids.*' => ['integer', 'exists:users,id'],
        ];

        // El color se agrega en una migracion posterior, asi que se valida solo
        // si la columna ya existe en la base de datos activa.
        if (Schema::hasColumn('departments', 'color')) {
            $rules['color'] = ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del departamento es obligatorio.',
            'name.unique' => 'Ya existe un departamento con ese nombre.',
            'color.regex' => 'El color debe ser un valor hexadecimal de la forma #RRGGBB.',
        ];
    }
}
