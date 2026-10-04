<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\Comment;
use App\Models\Conversation;
use App\Models\Department;
use App\Models\DepartmentFolder;
use App\Models\Document;
use App\Models\Message;
use App\Models\MessageRead;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DemoDataSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DemoDataSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $this->seed(RoleSeeder::class);
    }

    public function test_seeder_creates_300_users_with_expected_role_distribution(): void
    {
        $this->seed(DemoDataSeeder::class);

        $totalUsers = User::query()->count();
        $this->assertSame(300, $totalUsers);

        $roleNames = Role::query()->pluck('name')->all();
        foreach (['Administrador', 'Líder', 'Colaborador', 'Nuevo Ingreso'] as $canonical) {
            $this->assertContains($canonical, $roleNames);
        }

        $admins = User::query()->whereHas('roles', fn ($q) => $q->where('name', Role::ROLE_ADMINISTRADOR))->count();
        $this->assertGreaterThanOrEqual(5, $admins);

        $leaders = User::query()->whereHas('roles', fn ($q) => $q->where('name', Role::ROLE_LIDER))->count();
        $this->assertGreaterThanOrEqual(15, $leaders);

        $newHires = User::query()->where('onboarding_pendiente', true)->count();
        $this->assertGreaterThanOrEqual(30, $newHires);

        $leaderRows = User::query()->where('es_lider', true)->count();
        $this->assertSame($leaders, $leaderRows);
    }

    public function test_seeder_creates_eight_canonical_departments(): void
    {
        $this->seed(DemoDataSeeder::class);

        $names = Department::query()->orderBy('name')->pluck('name')->all();
        $this->assertGreaterThanOrEqual(8, count($names));
        $this->assertContains('Tecnologia', $names);
        $this->assertContains('Marketing', $names);
        $this->assertContains('Ventas', $names);
    }

    public function test_seeder_creates_folders_documents_announcements_and_comments(): void
    {
        $this->seed(DemoDataSeeder::class);

        $this->assertGreaterThan(0, DepartmentFolder::query()->count());
        $this->assertGreaterThan(0, Document::query()->count());
        $this->assertGreaterThan(20, Announcement::query()->count());
        $this->assertGreaterThan(0, AnnouncementAttachment::query()->count());
        $this->assertGreaterThan(0, Comment::query()->count());
    }

    public function test_seeder_creates_conversations_messages_and_reads(): void
    {
        $this->seed(DemoDataSeeder::class);

        $conversationCount = Conversation::query()->count();
        $this->assertGreaterThan(100, $conversationCount);

        $messageCount = Message::query()->count();
        $this->assertGreaterThan(1000, $messageCount);

        $readCount = MessageRead::query()->count();
        $this->assertGreaterThan(0, $readCount);

        $privateConversations = Conversation::query()->where('type', 'private')->count();
        $groupConversations = Conversation::query()->where('type', 'group')->count();
        $this->assertGreaterThan(0, $privateConversations);
        $this->assertGreaterThan(0, $groupConversations);
    }

    public function test_seeder_creates_real_files_for_documents(): void
    {
        $this->seed(DemoDataSeeder::class);

        $sample = Document::query()->inRandomOrder()->first();
        $this->assertNotNull($sample);
        $this->assertTrue(Storage::disk('public')->exists($sample->file_path));
    }

    public function test_every_user_has_a_department_assignment(): void
    {
        $this->seed(DemoDataSeeder::class);

        $orphanCount = User::query()
            ->whereNull('department_id')
            ->where('email', 'not like', '%@test.local')
            ->count();
        $this->assertSame(0, $orphanCount);
    }

    public function test_seeder_is_skipped_when_300_users_already_exist(): void
    {
        $this->seed(DemoDataSeeder::class);
        $conversationsBefore = Conversation::query()->count();

        $exitCode = $this->artisan('db:seed', ['--class' => DemoDataSeeder::class])
            ->expectsConfirmation('Ya hay >= 300 usuarios. ¿Deseas re-sembrar de todas formas (borra los datos demo)?', 'no')
            ->run();

        $this->assertSame(0, $exitCode);
        $this->assertSame($conversationsBefore, Conversation::query()->count());
    }
}
