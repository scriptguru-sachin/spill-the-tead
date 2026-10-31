<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuizAttemptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['client_id' => ['nullable', 'uuid'], 'answers' => ['required', 'array'], 'answers.*' => ['required', 'integer', 'min:0', 'max:3']];
    }
}
