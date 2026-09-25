<?php

namespace Tests\Feature;

use App\Models\Role;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_creates_four_canonical_roles(): void
    {
        $this->seed(RoleSeeder::class);

        $expected = ['Administrador', 'Líder', 'Colaborador', 'Nuevo Ingreso'];

        foreach ($expected as $roleName) {
            $this->assertDatabaseHas('roles', ['name' => $roleName]);
        }

        $this->assertSame(
            4,
            Role::query()->whereIn('name', ['Administrador', 'Líder', 'Colaborador', 'Nuevo Ingreso'])->count(),
        );
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(RoleSeeder::class);

        $firstRunCount = Role::query()
            ->whereIn('name', ['Administrador', 'Líder', 'Colaborador', 'Nuevo Ingreso'])
            ->count();
        $this->assertSame(4, $firstRunCount);

        $this->seed(RoleSeeder::class);
        $this->seed(RoleSeeder::class);

        $afterRerunCount = Role::query()
            ->whereIn('name', ['Administrador', 'Líder', 'Colaborador', 'Nuevo Ingreso'])
            ->count();
        $this->assertSame(4, $afterRerunCount);
    }

    public function test_administrador_and_lider_can_post_announcements(): void
    {
        $this->seed(RoleSeeder::class);

        $this->assertTrue(Role::query()->where('name', 'Administrador')->first()->can_post_announcements);
        $this->assertTrue(Role::query()->where('name', 'Líder')->first()->can_post_announcements);
    }

    public function test_colaborador_and_nuevo_ingreso_cannot_post(): void
    {
        $this->seed(RoleSeeder::class);

        $this->assertFalse(Role::query()->where('name', 'Colaborador')->first()->can_post_announcements);
        $this->assertFalse(Role::query()->where('name', 'Nuevo Ingreso')->first()->can_post_announcements);
    }
}
