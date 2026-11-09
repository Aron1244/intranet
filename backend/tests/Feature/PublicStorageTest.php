<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicStorageTest extends TestCase
{
    /**
     * El frontend pide los adjuntos a /storage/{file_path}. Ese path solo
     * resolvia a traves del symlink public/storage, que no se versiona: sin el
     * symlink la request caia al disco `local` y devolvia 403, dejando las
     * imagenes de las publicaciones como icono roto con el nombre del archivo.
     */
    public function test_files_in_the_public_disk_are_served_over_http(): void
    {
        $path = 'testing/public-disk-probe.png';

        $image = imagecreatetruecolor(4, 4);
        ob_start();
        imagepng($image);
        $content = (string) ob_get_clean();
        imagedestroy($image);

        Storage::disk('public')->put($path, $content);

        try {
            $response = $this->get('/storage/'.$path);

            $response->assertOk();
            $this->assertSame('image/png', $response->headers->get('content-type'));

            // ServeFile agrega esta cabecera: prueba de que la respuesta la genero
            // Laravel leyendo el disco `public` y no el servidor estatico a traves
            // del symlink.
            $this->assertNotNull($response->headers->get('content-security-policy'));
        } finally {
            Storage::disk('public')->delete($path);
        }
    }

    public function test_the_storage_route_is_registered_for_the_public_disk(): void
    {
        $this->assertNotNull(
            $this->app['router']->getRoutes()->getByName('storage.public'),
            'La ruta storage.public debe servir el disco public sin depender de storage:link.',
        );
    }
}
