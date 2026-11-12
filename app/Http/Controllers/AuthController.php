<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function me(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['user' => null]);
        }
        return response()->json(['user' => $user]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $username = trim($request->input('username'));
        $password = trim($request->input('password'));

        $user = User::where('username', $username)->where('status_aktif', true)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Username tidak ditemukan atau akun dinonaktifkan.',
            ], 401);
        }

        // Support plain PIN or hashed password
        $valid = Hash::check($password, $user->password) || ($user->pin_plain && $user->pin_plain === $password);

        if (!$valid) {
            return response()->json([
                'success' => false,
                'message' => 'PIN / Password salah.',
            ], 401);
        }

        Auth::login($user, true);

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }
}
