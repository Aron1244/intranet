<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class LoginRateLimitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('login');
    }

    public function test_login_returns_429_after_five_attempts_per_minute_for_same_ip_and_email(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        User::query()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'department_id' => $department->id,
        ]);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $response = $this->postJson('/api/login', [
                'email' => 'test@example.com',
                'password' => 'wrong-password',
            ]);
            $this->assertContains(
                $response->status(),
                [422, 429],
                "Attempt {$attempt} returned unexpected status {$response->status()}."
            );
            $this->assertNotSame(429, $response->status(), "Attempt {$attempt} should not be throttled yet.");
        }

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(429);
        $response->assertJsonStructure(['message', 'retry_after']);
        $this->assertGreaterThan(0, $response->json('retry_after'));
    }

    public function test_login_rate_limit_is_per_email_address(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        User::query()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'department_id' => $department->id,
        ]);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/login', [
                'email' => 'test@example.com',
                'password' => 'wrong-password',
            ]);
        }

        $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(429);

        $response = $this->postJson('/api/login', [
            'email' => 'other@example.com',
            'password' => 'wrong-password',
        ]);

        $this->assertNotSame(429, $response->status());
    }
}
