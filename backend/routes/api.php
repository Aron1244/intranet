<?php

use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DepartmentFolderController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserRoleController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware(['api', 'auth:sanctum'])->group(function (): void {
    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('chat-partners', [UserController::class, 'chatPartners']);

    Route::middleware('admin')->group(function (): void {
        Route::apiResource('users', UserController::class);
        Route::get('users/{user}/roles', [UserRoleController::class, 'index']);
        Route::put('users/{user}/roles', [UserRoleController::class, 'update']);
    });
});

Route::middleware(['api', 'auth:sanctum'])->group(function (): void {
    Route::get('roles', [RoleController::class, 'index']);
    Route::get('roles/{role}', [RoleController::class, 'show']);
    Route::get('departments/{department}/roles', [RoleController::class, 'byDepartment']);
});

Route::middleware(['api', 'auth:sanctum', 'admin'])->group(function (): void {
    Route::post('roles', [RoleController::class, 'store']);
    Route::put('roles/{role}', [RoleController::class, 'update']);
    Route::patch('roles/{role}', [RoleController::class, 'update']);
    Route::delete('roles/{role}', [RoleController::class, 'destroy']);
});

Route::middleware(['api', 'auth:sanctum'])->group(function (): void {
    Route::get('documents/{document}/download', [DocumentController::class, 'download']);
    Route::apiResource('documents', DocumentController::class);

    Route::get('departments', [DepartmentController::class, 'index']);
    Route::get('departments/{department}', [DepartmentController::class, 'show']);
    Route::get(
        'departments/{department}/folders',
        [DepartmentFolderController::class, 'index']
    );
});

Route::middleware(['api', 'auth:sanctum', 'admin'])->group(function (): void {
    Route::post('departments', [DepartmentController::class, 'store']);
    Route::put('departments/{department}', [DepartmentController::class, 'update']);
    Route::patch('departments/{department}', [DepartmentController::class, 'update']);
    Route::delete('departments/{department}', [DepartmentController::class, 'destroy']);

    Route::post(
        'departments/{department}/folders',
        [DepartmentFolderController::class, 'store']
    );

    Route::post(
        'departments/{department}/folders/{folder}/documents',
        [DocumentController::class, 'storeDepartmentDocument']
    );
});

Route::middleware(['api', 'auth:sanctum'])->group(function (): void {
    Route::apiResource('announcements', AnnouncementController::class);
    Route::get('announcements/{announcement}/comments', [CommentController::class, 'indexByAnnouncement']);
    Route::post('announcements/{announcement}/comments', [CommentController::class, 'store']);
    Route::delete('comments/{comment}', [CommentController::class, 'destroy']);
    Route::get(
        'announcements/{announcement}/attachments/{attachment}/download',
        [AnnouncementController::class, 'downloadAttachment']
    );
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get(
        '/conversations/{conversation}/messages',
        [MessageController::class, 'index']
    );

    Route::post(
        '/messages',
        [MessageController::class, 'store']
    );

    Route::middleware('admin')->group(function (): void {
        Route::delete(
            '/messages/{message}',
            [MessageController::class, 'destroy']
        );

        Route::delete(
            '/conversations/{conversation}',
            [ConversationController::class, 'destroy']
        );
    });
});

Route::middleware('auth:sanctum')->group(function () {

    Route::get(
        '/conversations',
        [ConversationController::class, 'index']
    );

    Route::post(
        '/conversations',
        [ConversationController::class, 'store']
    );

});
