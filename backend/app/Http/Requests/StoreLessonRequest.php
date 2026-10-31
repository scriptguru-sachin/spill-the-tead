<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLessonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['nullable', 'uuid'],
            'topic' => ['required', 'string', 'min:2', 'max:300'],
            'level' => ['required', Rule::in(['Auto', 'Beginner', 'Intermediate', 'Advanced'])],
            'format' => ['required', Rule::in(['Group chat', 'Courtroom debate', 'Reality show', 'Interview'])],
            'drama' => ['required', 'integer', 'between:1,5'],
        ];
    }
}
