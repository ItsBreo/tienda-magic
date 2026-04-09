<?php
// app/Http/Controllers/TournamentController.php

namespace App\Http\Controllers\Tournament;

use App\Models\Tournament;
use App\Models\TournamentRegistration;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Http\Requests\StoreTournamentRequest;
use App\Http\Requests\UpdateTournamentRequest;
use App\Http\Resources\TournamentResource;
use App\Http\Resources\TournamentCollection;
use App\Http\Resources\RegistrationResource;
use App\Http\Controllers\Controller;

class TournamentController extends Controller
{
    use AuthorizesRequests;

    // ─── Listar torneos ───────────────────────────────────────

    public function index(Request $request): TournamentCollection
{
    $tournaments = Tournament::query()
        ->with(['creator:id,name', 'confirmedPlayers'])
        ->when($request->format, fn($q) => $q->byFormat($request->format))
        ->when($request->status, fn($q) => $q->where('status', $request->status))
        ->upcoming()
        ->paginate(10);

    return new TournamentCollection($tournaments);
}

    // ─── Ver detalle ──────────────────────────────────────────

 public function show(Tournament $tournament): TournamentResource
{
    $tournament->load(['creator:id,name', 'confirmedPlayers:id,name']);

    return new TournamentResource($tournament);
}

    // ─── Crear torneo ─────────────────────────────────────────

public function store(StoreTournamentRequest $request): TournamentResource
{
    $tournament = Tournament::create([
        ...$request->validated(),
        'created_by' => $request->user()->id,
    ]);

    return new TournamentResource($tournament);
}

    // ─── Editar torneo ─────────────────────────────────────────

public function update(UpdateTournamentRequest $request, Tournament $tournament): TournamentResource
{
    $tournament->update($request->validated());

    return new TournamentResource($tournament->fresh());
}


    // ─── Cancelar/eliminar torneo ─────────────────────────────

    public function destroy(Tournament $tournament): JsonResponse
    {
        $this->authorize('delete', $tournament);

        // Cancelar inscripciones pendientes/confirmadas antes de borrar
        $tournament->registrations()
                   ->whereIn('status', ['pending', 'confirmed'])
                   ->update(['status' => 'cancelled']);

        $tournament->delete(); // SoftDelete

        return response()->json(['message' => 'Torneo cancelado correctamente.']);
    }

    // ─── Inscribirse a un torneo ──────────────────────────────

public function register(Request $request, Tournament $tournament): RegistrationResource
{
        $user = $request->user();

        if ($tournament->status !== 'upcoming') {
            return response()->json(['message' => 'Este torneo no admite inscripciones.'], 422);
        }

        if ($tournament->isFull()) {
            return response()->json(['message' => 'El torneo está completo.'], 422);
        }

        if ($tournament->isRegistered($user->id)) {
            return response()->json(['message' => 'Ya estás inscrito en este torneo.'], 422);
        }

 $registration = TournamentRegistration::create([
        'tournament_id' => $tournament->id,
        'user_id'       => $request->user()->id,
        'status'        => 'confirmed',
        'confirmed_at'  => now(),
        'registered_at' => now(),
    ]);

    return new RegistrationResource($registration);
    }

    // ─── Cancelar inscripción ─────────────────────────────────

    public function unregister(Request $request, Tournament $tournament): JsonResponse
    {
        $registration = TournamentRegistration::where('tournament_id', $tournament->id)
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->firstOrFail();

        $registration->cancel();

        return response()->json(['message' => 'Inscripción cancelada.']);
    }

    // ─── Listar inscritos (solo creador/admin) ────────────────

public function registrations(Tournament $tournament): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
{
    $this->authorize('update', $tournament);

    $registrations = $tournament->registrations()
        ->with('user:id,name,email')
        ->orderBy('registered_at')
        ->get();

    return RegistrationResource::collection($registrations);
}

    // ─── Confirmar inscripción (solo creador/admin) ───────────

    public function confirmRegistration(Tournament $tournament, TournamentRegistration $registration): JsonResponse
    {
        $this->authorize('update', $tournament);

        if ($tournament->isFull()) {
            return response()->json(['message' => 'El torneo ya está completo.'], 422);
        }

        $registration->confirm();

        return response()->json($registration);
    }
}
