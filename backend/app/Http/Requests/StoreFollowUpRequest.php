<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFollowUpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['client_id' => ['nullable', 'uuid'], 'mode' => ['required', Rule::in(['weak_spots', 'go_deeper', 'practical', 'compare'])], 'weak_concepts' => ['nullable', 'array', 'max:4'], 'weak_concepts.*' => ['string', 'max:120'], 'comparison_target' => ['nullable', 'string', 'max:150']];
    }
}
