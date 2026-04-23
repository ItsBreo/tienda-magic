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
use OpenApi\Attributes as OA;

class TournamentController extends Controller
{
    use AuthorizesRequests;

    // ─── Listar torneos ───────────────────────────────────────

    #[OA\Get(
        path: "/api/tournaments",
        summary: "Lista de torneos",
        description: "Lista de torneos paginados y filtrados.",
        tags: ["Tournaments"]
    )]
    #[OA\Parameter(name: "format", in: "query", required: false, description: "Filtrar por formato", schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "status", in: "query", required: false, description: "Filtrar por estado (upcoming, in_progress, completed)", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Lista paginada de torneos")]
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

    #[OA\Get(
        path: "/api/tournaments/{tournament}",
        summary: "Detalles del torneo",
        description: "Muestra los detalles de un torneo y sus participantes confirmados.",
        tags: ["Tournaments"]
    )]
    #[OA\Parameter(name: "tournament", in: "path", required: true, description: "ID del torneo", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Detalles del torneo")]
 public function show(Tournament $tournament): TournamentResource
{
    $tournament->load(['creator:id,name', 'confirmedPlayers:id,name']);

    return new TournamentResource($tournament);
}

    // ─── Crear torneo ─────────────────────────────────────────

    #[OA\Post(
        path: "/api/tournaments",
        summary: "Crear torneo",
        description: "Crea un torneo (solo admin o con permisos).",
        tags: ["Tournaments"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 201, description: "Torneo creado")]
public function store(StoreTournamentRequest $request): TournamentResource
{
    $tournament = Tournament::create([
        ...$request->validated(),
        'created_by' => $request->user()->id,
    ]);

    return new TournamentResource($tournament);
}

    // ─── Editar torneo ─────────────────────────────────────────

    #[OA\Patch(
        path: "/api/tournaments/{tournament}",
        summary: "Editar torneo",
        description: "Edita datos de un torneo.",
        tags: ["Tournaments"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "tournament", in: "path", required: true, description: "ID del torneo", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Torneo editado")]
public function update(UpdateTournamentRequest $request, Tournament $tournament): TournamentResource
{
    $tournament->update($request->validated());

    return new TournamentResource($tournament->fresh());
}


    // ─── Cancelar/eliminar torneo ─────────────────────────────

    #[OA\Delete(
        path: "/api/tournaments/{tournament}",
        summary: "Cancelar/Eliminar torneo",
        description: "Borra/cancela un torneo y sus inscripciones.",
        tags: ["Tournaments"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "tournament", in: "path", required: true, description: "ID del torneo", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Torneo cancelado")]
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

    #[OA\Post(
        path: "/api/tournaments/{tournament}/register",
        summary: "Inscribirse a torneo",
        description: "Inscribe al usuario en el torneo.",
        tags: ["Tournaments"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "tournament", in: "path", required: true, description: "ID del torneo", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Inscrito exitosamente")]
    #[OA\Response(response: 422, description: "Torneo completo, ya inscrito o no admite inscripciones")]
public function register(Request $request, Tournament $tournament): RegistrationResource|JsonResponse
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

 $registration = TournamentRegistration::updateOrCreate(
        [
            'tournament_id' => $tournament->id,
            'user_id'       => $request->user()->id,
        ],
        [
            'status'        => 'confirmed',
            'confirmed_at'  => now(),
            'registered_at' => now(),
        ]
    );

    return new RegistrationResource($registration);
    }

    // ─── Cancelar inscripción ─────────────────────────────────

    #[OA\Delete(
        path: "/api/tournaments/{tournament}/register",
        summary: "Cancelar inscripción",
        description: "Borra la inscripción del usuario al torneo.",
        tags: ["Tournaments"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "tournament", in: "path", required: true, description: "ID del torneo", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Inscripción cancelada")]
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

    #[OA\Get(
        path: "/api/tournaments/{tournament}/registrations",
        summary: "Lista de inscritos",
        description: "Devuelve todos los inscritos (solo creador o admin).",
        tags: ["Tournaments"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "tournament", in: "path", required: true, description: "ID del torneo", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Lista de inscripciones")]
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

    #[OA\Patch(
        path: "/api/tournaments/{tournament}/registrations/{registration}/confirm",
        summary: "Confirmar inscripción",
        description: "Confirma un jugador en estado pendiente (solo creador/admin).",
        tags: ["Tournaments"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "tournament", in: "path", required: true, description: "ID del torneo", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "registration", in: "path", required: true, description: "ID de la inscripción", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Inscripción confirmada")]
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
