<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\Comment;
use App\Models\Conversation;
use App\Models\Department;
use App\Models\DepartmentFolder;
use App\Models\Document;
use App\Models\Message;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    private const TOTAL_USERS = 300;

    private const MIN_DEPARTMENT_COUNT = 8;

    private const CONVERSATION_TARGET = 180;

    private const MAX_MESSAGES_PER_CONVERSATION = 30;

    private const MIN_MESSAGES_PER_CONVERSATION = 5;

    private const ANNOUNCEMENT_TARGET_PER_DEPARTMENT = 4;

    private const FOLDER_TARGET_PER_DEPARTMENT = 2;

    private const ATTACHMENT_PROBABILITY = 0.5;

    private const READ_PROBABILITY = 0.55;

    private const PLACEHOLDER_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

    private array $departments = [];

    private array $users = [];

    private array $roles = [];

    private array $folders = [];

    public function run(): void
    {
        if (User::query()->count() >= self::TOTAL_USERS && ! $this->command->confirm('Ya hay >= '.self::TOTAL_USERS.' usuarios. ¿Deseas re-sembrar de todas formas (borra los datos demo)?', false)) {
            $this->command->warn('Seeder omitido: ya hay datos demo suficientes.');

            return;
        }

        $this->command->info('Sembrando datos demo (esto puede tomar ~1 min)...');

        DB::transaction(function (): void {
            $this->roles = $this->ensureRoles();
            $this->departments = $this->seedDepartments();
            $this->users = $this->seedUsers();
            $this->folders = $this->seedFolders();
            $this->seedDocuments();
            $announcements = $this->seedAnnouncements();
            $this->seedAttachments($announcements);
            $this->seedComments($announcements);
            $conversations = $this->seedConversations();
            $messages = $this->seedMessages($conversations);
            $this->seedMessageReads($messages, $conversations);
        });

        $this->command->info('Datos demo listos.');
    }

    /**
     * @return array<string, Role>
     */
    private function ensureRoles(): array
    {
        $roles = [
            Role::query()->firstOrCreate(['name' => Role::ROLE_ADMINISTRADOR], ['can_post_announcements' => true]),
            Role::query()->firstOrCreate(['name' => Role::ROLE_LIDER], ['can_post_announcements' => true]),
            Role::query()->firstOrCreate(['name' => Role::ROLE_COLABORADOR], ['can_post_announcements' => false]),
            Role::query()->firstOrCreate(['name' => Role::ROLE_NUEVO_INGRESO], ['can_post_announcements' => false]),
            Role::query()->firstOrCreate(['name' => 'admin'], ['can_post_announcements' => true]),
        ];

        return [
            'admin' => $roles[0],
            'leader' => $roles[1],
            'collaborator' => $roles[2],
            'new_hire' => $roles[3],
            'legacy_admin' => $roles[4],
        ];
    }

    /**
     * @return array<int, Department>
     */
    private function seedDepartments(): array
    {
        $seeds = [
            ['Tecnologia', 'Equipo de desarrollo e infraestructura'],
            ['Recursos Humanos', 'Gestion de personas y talento'],
            ['Marketing', 'Comunicacion y marca'],
            ['Ventas', 'Equipo comercial'],
            ['Operaciones', 'Logistica y operaciones internas'],
            ['Finanzas', 'Contabilidad y control financiero'],
            ['Diseno', 'Producto y diseno visual'],
            ['Legal', 'Asesoria juridica'],
        ];

        $departments = [];
        foreach ($seeds as [$name, $description]) {
            $departments[] = Department::query()->firstOrCreate(
                ['name' => $name],
                ['description' => $description],
            );
        }

        return $departments;
    }

    /**
     * @return array<int, User>
     */
    private function seedUsers(): array
    {
        $existing = User::query()->count();
        $toCreate = max(0, self::TOTAL_USERS - $existing);

        if ($toCreate === 0) {
            return User::query()->orderBy('id')->get()->all();
        }

        $users = [];

        for ($i = 0; $i < $toCreate; $i++) {
            $department = $this->departments[array_rand($this->departments)];

            $user = User::query()->create([
                'name' => fake()->name(),
                'email' => 'demo.'.Str::lower(Str::random(8)).'@coherev.test',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'department_id' => $department->id,
                'es_lider' => false,
                'onboarding_pendiente' => false,
                'remember_token' => Str::random(10),
            ]);

            $users[] = $user;
        }

        $adminCount = max(5, (int) round(count($users) * 0.015));
        $leaderCount = max(15, (int) round(count($users) * 0.05));
        $newHireCount = max(35, (int) round(count($users) * 0.12));

        shuffle($users);

        $admins = array_slice($users, 0, $adminCount);
        $leaders = array_slice($users, $adminCount, $leaderCount);
        $newHires = array_slice($users, $adminCount + $leaderCount, $newHireCount);

        foreach ($admins as $admin) {
            $admin->roles()->syncWithoutDetaching([
                $this->roles['admin']->id,
                $this->roles['legacy_admin']->id,
            ]);
        }

        foreach ($leaders as $leader) {
            $leader->roles()->syncWithoutDetaching([$this->roles['leader']->id]);
            $leader->update(['es_lider' => true]);
        }

        foreach ($newHires as $newHire) {
            $newHire->roles()->syncWithoutDetaching([$this->roles['new_hire']->id]);
            $newHire->update(['onboarding_pendiente' => true]);
        }

        $collaborators = array_slice($users, $adminCount + $leaderCount + $newHireCount);
        foreach ($collaborators as $collaborator) {
            $collaborator->roles()->syncWithoutDetaching([$this->roles['collaborator']->id]);
        }

        return User::query()->orderBy('id')->get()->all();
    }

    /**
     * @return array<int, DepartmentFolder>
     */
    private function seedFolders(): array
    {
        $folders = [];

        foreach ($this->departments as $department) {
            $folderNames = ['General', 'Onboarding'];
            for ($i = 1; $i <= self::FOLDER_TARGET_PER_DEPARTMENT; $i++) {
                $name = $folderNames[$i - 1] ?? 'Carpeta '.fake()->word();
                $creator = $this->pickRandomUserInDepartment((int) $department->id, preferAdmin: true);
                if (! $creator) {
                    continue;
                }

                $folders[] = DepartmentFolder::query()->firstOrCreate(
                    [
                        'department_id' => $department->id,
                        'parent_id' => null,
                        'name' => $name,
                    ],
                    [
                        'created_by' => $creator->id,
                    ],
                );
            }
        }

        return $folders;
    }

    private function seedDocuments(): void
    {
        $sampleTitles = [
            'Politica interna', 'Manual de bienvenida', 'Reporte mensual',
            'Plantilla presentacion', 'Contrato tipo', 'Procedimiento operativo',
            'Checklist onboarding', 'Guia de estilo', 'Presupuesto Q3',
            'Minuta reunion', 'Cronograma proyecto', 'Acta de conformidad',
        ];

        $mimeTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/png',
        ];

        foreach ($this->folders as $folder) {
            $count = random_int(2, 4);
            for ($i = 0; $i < $count; $i++) {
                $owner = $this->pickRandomUserInDepartment((int) $folder->department_id);
                if (! $owner) {
                    continue;
                }

                $title = $sampleTitles[array_rand($sampleTitles)];
                $mime = $mimeTypes[array_rand($mimeTypes)];
                $extension = match ($mime) {
                    'application/pdf' => 'pdf',
                    'text/plain' => 'txt',
                    str_contains($mime, 'spreadsheet') => 'xlsx',
                    str_contains($mime, 'wordprocessing') => 'docx',
                    default => 'png',
                };

                $relativePath = "documents/department/{$folder->department_id}/{$folder->id}/".Str::slug($title).'.'.$extension;
                $this->writePlaceholderFile($relativePath, $mime);

                Document::query()->create([
                    'title' => $title,
                    'file_path' => $relativePath,
                    'original_name' => Str::slug($title).'.'.$extension,
                    'mime_type' => $mime,
                    'size_bytes' => random_int(2048, 5_242_880),
                    'user_id' => $owner->id,
                    'department_folder_id' => $folder->id,
                    'visibility' => 'department',
                ]);
            }
        }

        $generalCount = random_int(8, 12);
        for ($i = 0; $i < $generalCount; $i++) {
            $owner = $this->users[array_rand($this->users)];
            $title = $sampleTitles[array_rand($sampleTitles)].' (privado)';
            $mime = $mimeTypes[array_rand($mimeTypes)];
            $extension = match ($mime) {
                'application/pdf' => 'pdf',
                'text/plain' => 'txt',
                str_contains($mime, 'spreadsheet') => 'xlsx',
                str_contains($mime, 'wordprocessing') => 'docx',
                default => 'png',
            };
            $relativePath = "documents/general/{$owner->id}/".Str::slug($title).'.'.$extension;
            $this->writePlaceholderFile($relativePath, $mime);

            Document::query()->create([
                'title' => $title,
                'file_path' => $relativePath,
                'original_name' => Str::slug($title).'.'.$extension,
                'mime_type' => $mime,
                'size_bytes' => random_int(2048, 2_097_152),
                'user_id' => $owner->id,
                'department_folder_id' => null,
                'visibility' => 'private',
            ]);
        }
    }

    /**
     * @return array<int, Announcement>
     */
    private function seedAnnouncements(): array
    {
        $titles = [
            'Resultados del trimestre',
            'Nueva politica de trabajo hibrido',
            'Celebracion de aniversario',
            'Lanzamiento de producto',
            'Convocatoria a capacitacion',
            'Cambio en beneficios',
            'Bienvenida al nuevo equipo',
            'Cierre temporal de oficina',
            'Resultados de la encuesta interna',
            'Actualizacion de procedimientos',
        ];

        $announcements = [];

        foreach ($this->departments as $department) {
            $count = self::ANNOUNCEMENT_TARGET_PER_DEPARTMENT;
            for ($i = 0; $i < $count; $i++) {
                $author = $this->pickRandomUserInDepartment((int) $department->id, preferAdminOrLeader: true);
                if (! $author) {
                    continue;
                }

                $title = $titles[array_rand($titles)];
                $isVisible = (bool) random_int(0, 1);

                $announcement = Announcement::query()->create([
                    'title' => $title,
                    'content' => fake()->paragraphs(random_int(2, 4), true),
                    'is_visible' => $isVisible,
                    'department_id' => $department->id,
                    'created_by' => $author->id,
                ]);

                $announcements[] = $announcement;
            }
        }

        return $announcements;
    }

    /**
     * @param  array<int, Announcement>  $announcements
     */
    private function seedAttachments(array $announcements): void
    {
        foreach ($announcements as $announcement) {
            if (lcg_value() > self::ATTACHMENT_PROBABILITY) {
                continue;
            }

            $count = random_int(1, 2);
            for ($i = 0; $i < $count; $i++) {
                $relativePath = "announcements/{$announcement->id}/".Str::slug($announcement->title).'-'.$i.'.png';
                $this->writeImage($relativePath);

                AnnouncementAttachment::query()->create([
                    'announcement_id' => $announcement->id,
                    'user_id' => $announcement->created_by,
                    'file_path' => $relativePath,
                    'original_name' => Str::slug($announcement->title).'-'.$i.'.png',
                    'mime_type' => 'image/png',
                    'size_bytes' => random_int(10_240, 524_288),
                ]);
            }
        }
    }

    /**
     * @param  array<int, Announcement>  $announcements
     */
    private function seedComments(array $announcements): void
    {
        $sampleComments = [
            'Excelente iniciativa!',
            'Gracias por la informacion.',
            'Tenemos algunas dudas, podemos agendar una reunion?',
            'Cuando empieza el periodo de prueba?',
            'Se comparte con todos los departamentos?',
            'Donde puedo descargar el documento?',
            'Muy buen resumen.',
            'Quedo atento a los siguientes pasos.',
            'Hay capacitacion previa?',
            'Sugerencia: agregar un FAQ.',
        ];

        foreach ($announcements as $announcement) {
            $commentCount = random_int(0, 4);
            for ($i = 0; $i < $commentCount; $i++) {
                $commenter = $this->pickRandomUserInDepartment((int) $announcement->department_id) ?? $this->users[array_rand($this->users)];
                if (! $commenter) {
                    continue;
                }

                Comment::query()->create([
                    'user_id' => $commenter->id,
                    'announcement_id' => $announcement->id,
                    'content' => $sampleComments[array_rand($sampleComments)],
                ]);
            }
        }
    }

    /**
     * @return array<int, Conversation>
     */
    private function seedConversations(): array
    {
        $conversations = [];

        $privateTarget = (int) round(self::CONVERSATION_TARGET * 0.6);
        $groupTarget = self::CONVERSATION_TARGET - $privateTarget;

        for ($i = 0; $i < $privateTarget; $i++) {
            [$a, $b] = $this->pickRandomPair();
            if ($a === null || $b === null) {
                continue;
            }

            $conversation = Conversation::query()->create(['type' => 'private', 'name' => null]);
            $conversation->users()->attach([$a->id, $b->id]);
            $conversations[] = $conversation;
        }

        for ($i = 0; $i < $groupTarget; $i++) {
            $size = random_int(3, 8);
            $participants = $this->pickRandomUniqueUsers($size);
            if (count($participants) < 3) {
                continue;
            }

            $conversation = Conversation::query()->create([
                'type' => 'group',
                'name' => fake()->randomElement([
                    'Sync semanal '.fake()->word(),
                    'Proyecto '.fake()->word(),
                    'Equipo '.fake()->word(),
                    'Canal '.fake()->word(),
                ]),
            ]);
            $conversation->users()->attach(array_map(fn ($u) => $u->id, $participants));
            $conversations[] = $conversation;
        }

        return $conversations;
    }

    /**
     * @param  array<int, Conversation>  $conversations
     * @return array<int, Message>
     */
    private function seedMessages(array $conversations): array
    {
        $messages = [];
        $samples = [
            'Hola, como van?',
            'Ya quedo listo el reporte.',
            'Puedes revisar el archivo adjunto?',
            'Tengo una duda rapida.',
            'Confirmado, nos vemos a las 3.',
            'Gracias!',
            'Mando el resumen por aca.',
            'Ok, procedo.',
            'Necesitamos aprobar esto antes del viernes.',
            'Avance actualizado, todo en tiempo.',
            'Adjunto la minuta de hoy.',
            'Tienes 5 min?',
            'Listo para la demo.',
            'Buenas tardes equipo.',
            'Recibido, gracias.',
        ];

        foreach ($conversations as $conversation) {
            $participants = $conversation->users()->get(['users.id', 'users.name'])->all();
            if (count($participants) < 2) {
                continue;
            }

            $count = random_int(self::MIN_MESSAGES_PER_CONVERSATION, self::MAX_MESSAGES_PER_CONVERSATION);
            $now = now();

            for ($i = 0; $i < $count; $i++) {
                $sender = $participants[array_rand($participants)];
                $isFile = lcg_value() < 0.08;
                $content = $isFile ? '' : $samples[array_rand($samples)];

                $documentId = null;
                if ($isFile) {
                    $document = Document::query()->where('user_id', $sender->id)->inRandomOrder()->first()
                        ?? $this->createEphemeralDocument((int) $sender->id);
                    $documentId = $document?->id;
                    if ($documentId === null) {
                        $isFile = false;
                        $content = $samples[array_rand($samples)];
                    }
                }

                $message = Message::query()->create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $sender->id,
                    'content' => $content,
                    'document_id' => $documentId,
                    'type' => $isFile ? 'file' : 'text',
                    'created_at' => $now->copy()->subMinutes(random_int(1, 60 * 24 * 30)),
                    'updated_at' => $now->copy()->subMinutes(random_int(1, 60 * 24 * 30)),
                ]);

                $messages[] = $message;
            }
        }

        return $messages;
    }

    /**
     * @param  array<int, Message>  $messages
     * @param  array<int, Conversation>  $conversations
     */
    private function seedMessageReads(array $messages, array $conversations): void
    {
        $conversationParticipants = [];
        foreach ($conversations as $conversation) {
            $conversationParticipants[$conversation->id] = $conversation->users()->pluck('users.id')->all();
        }

        $rows = [];
        $now = now();

        foreach ($messages as $message) {
            $participants = $conversationParticipants[$message->conversation_id] ?? [];
            foreach ($participants as $userId) {
                if ($userId === $message->sender_id) {
                    continue;
                }
                if (lcg_value() > self::READ_PROBABILITY) {
                    continue;
                }
                $rows[] = [
                    'message_id' => $message->id,
                    'user_id' => $userId,
                    'read_at' => $now->copy()->subMinutes(random_int(1, 60 * 24 * 7)),
                ];
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('message_reads')->insert($chunk);
        }
    }

    /**
     * @return array{0: ?User, 1: ?User}
     */
    private function pickRandomPair(): array
    {
        $count = count($this->users);
        if ($count < 2) {
            return [null, null];
        }

        $first = $this->users[array_rand($this->users)];
        $second = $first;
        while ($second === $first) {
            $second = $this->users[array_rand($this->users)];
        }

        return [$first, $second];
    }

    /**
     * @return array<int, User>
     */
    private function pickRandomUniqueUsers(int $count): array
    {
        $pool = $this->users;
        shuffle($pool);
        $count = min($count, count($pool));

        return array_slice($pool, 0, $count);
    }

    private function pickRandomUserInDepartment(int $departmentId, bool $preferAdmin = false, bool $preferAdminOrLeader = false): ?User
    {
        $candidates = array_values(array_filter(
            $this->users,
            fn (User $user) => (int) $user->department_id === $departmentId,
        ));

        if (empty($candidates)) {
            return null;
        }

        if ($preferAdmin || $preferAdminOrLeader) {
            $admins = array_values(array_filter($candidates, fn (User $u) => $u->isAdministrator()));
            if (! empty($admins) && lcg_value() < 0.7) {
                return $admins[array_rand($admins)];
            }

            if ($preferAdminOrLeader) {
                $leaders = array_values(array_filter(
                    $candidates,
                    fn (User $u) => $u->roles()->where('name', Role::ROLE_LIDER)->exists(),
                ));
                if (! empty($leaders)) {
                    return $leaders[array_rand($leaders)];
                }
            }
        }

        return $candidates[array_rand($candidates)];
    }

    private function createEphemeralDocument(int $ownerId): ?Document
    {
        $relativePath = "documents/chat/{$ownerId}/placeholder-".Str::random(6).'.txt';
        $this->writePlaceholderFile($relativePath, 'text/plain');

        return Document::query()->create([
            'title' => 'Archivo adjunto',
            'file_path' => $relativePath,
            'original_name' => basename($relativePath),
            'mime_type' => 'text/plain',
            'size_bytes' => random_int(512, 10_240),
            'user_id' => $ownerId,
            'department_folder_id' => null,
            'visibility' => 'private',
        ]);
    }

    private function writePlaceholderFile(string $relativePath, string $mimeType): void
    {
        if (Storage::disk('public')->exists($relativePath)) {
            return;
        }

        $content = match ($mimeType) {
            'application/pdf' => "%PDF-1.4\n% Demo placeholder file generated by DemoDataSeeder.",
            default => 'Demo placeholder generated by DemoDataSeeder at '.now()->toIso8601String()."\n",
        };

        Storage::disk('public')->put($relativePath, $content);
    }

    private function writeImage(string $relativePath): void
    {
        if (Storage::disk('public')->exists($relativePath)) {
            return;
        }

        Storage::disk('public')->put($relativePath, base64_decode(self::PLACEHOLDER_PNG));
    }
}
