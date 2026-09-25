<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

trait RejectsMimeMismatch
{
    /**
     * Override failedValidation so any MIME-related failure becomes HTTP 415
     * instead of the default 422.
     */
    protected function failedValidation(Validator $validator): void
    {
        foreach ($validator->errors()->messages() as $messages) {
            foreach ($messages as $message) {
                if (str_contains($message, 'must be a file of type')) {
                    throw new HttpResponseException(response()->json([
                        'message' => 'El tipo de archivo no es permitido.',
                        'errors' => $validator->errors()->toArray(),
                    ], 415));
                }
            }
        }

        parent::failedValidation($validator);
    }
}
