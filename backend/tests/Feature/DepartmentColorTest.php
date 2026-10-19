<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentColorTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): User
    {
        $role = Role::query()->firstOrCreate(['name' => 'admin']);
        $user = User::query()->create([
            'name' => 'Admin User',
            'email' => 'admin.color@example.com',
            'password' => 'password',
        ]);
        $user->roles()->attach($role->id);

        return $user;
    }

    public function test_admin_can_create_department_with_color(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/departments', [
                'name' => 'Marketing',
                'color' => '#db2777',
            ])
            ->assertCreated();

        $this->assertSame('#db2777', $response->json('data.color'));
        $this->assertSame('#db2777', Department::query()->where('name', 'Marketing')->value('color'));
    }

    public function test_admin_can_create_department_without_color(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/departments', ['name' => 'Legal'])
            ->assertCreated();

        // Sin color asignado la interfaz resuelve uno por defecto, asi que el
        // backend lo deja en null en vez de inventar un valor.
        $this->assertNull($response->json('data.color'));
    }

    public function test_department_color_must_be_a_hex_value(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/departments', [
                'name' => 'Ventas',
                'color' => 'rojo',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('color');
    }

    public function test_department_color_rejects_short_hex_value(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/departments', [
                'name' => 'Operaciones',
                'color' => '#fff',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('color');
    }

    public function test_admin_can_update_department_color(): void
    {
        $department = Department::query()->create(['name' => 'IT']);
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/departments/{$department->id}", ['color' => '#2563eb'])
            ->assertOk();

        $this->assertSame('#2563eb', $response->json('data.color'));
    }

    public function test_admin_can_clear_department_color(): void
    {
        $department = Department::query()->create(['name' => 'IT', 'color' => '#2563eb']);
        $admin = $this->makeAdmin();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/departments/{$department->id}", ['color' => null])
            ->assertOk();

        $this->assertNull($department->fresh()->color);
    }

    public function test_department_index_exposes_color(): void
    {
        Department::query()->create(['name' => 'IT', 'color' => '#0891b2']);
        Department::query()->create(['name' => 'Finanzas']);
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/departments')
            ->assertOk();

        // El indice viene ordenado por nombre, asi que se busca por clave y no
        // por posicion.
        $byName = collect($response->json('data'))->keyBy('name');

        $this->assertSame('#0891b2', $byName['IT']['color']);
        $this->assertNull($byName['Finanzas']['color']);
    }
}
