<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserRoleFlagsTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_user_has_es_lider_false_by_default(): void
    {
        $user = User::query()->create([
            'name' => 'Alice',
            'email' => 'alice@example.com',
            'password' => 'password',
        ]);

        $this->assertFalse((bool) $user->es_lider);
    }

    public function test_new_user_has_onboarding_pendiente_true_by_default(): void
    {
        $user = User::query()->create([
            'name' => 'Bob',
            'email' => 'bob@example.com',
            'password' => 'password',
        ]);

        $this->assertTrue((bool) $user->onboarding_pendiente);
    }

    public function test_es_lider_can_be_set_to_true(): void
    {
        $user = User::query()->create([
            'name' => 'Carol',
            'email' => 'carol@example.com',
            'password' => 'password',
            'es_lider' => true,
        ]);

        $this->assertTrue((bool) $user->fresh()->es_lider);
    }

    public function test_onboarding_pendiente_can_be_marked_done(): void
    {
        $user = User::query()->create([
            'name' => 'Dave',
            'email' => 'dave@example.com',
            'password' => 'password',
        ]);

        $user->update(['onboarding_pendiente' => false]);

        $this->assertFalse((bool) $user->fresh()->onboarding_pendiente);
    }
}
