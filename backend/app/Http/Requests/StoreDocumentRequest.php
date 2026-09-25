<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\RejectsMimeMismatch;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    use RejectsMimeMismatch;

    /**
     * MIME types allowed across the platform.
     *
     * @return list<string>
     */
    public static function allowedMimes(): array
    {
        return [
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            'txt', 'csv', 'rtf',
            'jpg', 'jpeg', 'png', 'gif', 'webp',
            'zip',
        ];
    }

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
            'title' => ['nullable', 'string', 'max:255'],
            'file' => ['required', 'file', 'max:20480', 'mimes:'.implode(',', self::allowedMimes())],
            'department_folder_id' => ['nullable', 'integer', 'exists:department_folders,id'],
            'visibility' => ['nullable', 'in:public,department,private'],
        ];
    }
}
