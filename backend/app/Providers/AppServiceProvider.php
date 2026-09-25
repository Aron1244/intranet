<?php

namespace App\Providers;

use App\Models\Announcement;
use App\Models\Document;
use App\Policies\AnnouncementPolicy;
use App\Policies\DocumentPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Announcement::class, AnnouncementPolicy::class);
        Gate::policy(Document::class, DocumentPolicy::class);

        RateLimiter::for('login', function (Request $request): Limit {
            $email = strtolower((string) $request->input('email', ''));

            return Limit::perMinute(5)->by($request->ip().'|'.$email);
        });
    }
}
