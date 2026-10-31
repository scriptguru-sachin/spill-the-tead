<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AskDoubtRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['nullable', 'uuid'],
            'message_id' => ['nullable', 'string', 'max:120'],
            'character_id' => ['required', 'string', 'max:100'],
            'question' => ['required', 'string', 'min:3', 'max:500'],
        ];
    }
}
