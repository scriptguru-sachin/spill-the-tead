<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFeedbackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['client_id' => ['required', 'uuid'], 'helpful' => ['required', 'boolean'], 'comment' => ['nullable', 'string', 'max:1000']];
    }
}
