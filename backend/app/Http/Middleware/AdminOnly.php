<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminOnly
{
    public function handle(Request $request, Closure $next)
    {
        abort_unless(
            $request->user()?->isAdministrator() ?? false,
            403
        );

        return $next($request);
    }
}
