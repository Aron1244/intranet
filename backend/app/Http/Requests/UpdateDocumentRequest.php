<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentRequest extends FormRequest
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
            'title' => ['sometimes', 'string', 'max:255'],
            'file' => ['sometimes', 'file', 'max:20480'],
            'department_folder_id' => ['sometimes', 'nullable', 'integer', 'exists:department_folders,id'],
            'visibility' => ['sometimes', 'in:public,department,private'],
        ];
    }
}
