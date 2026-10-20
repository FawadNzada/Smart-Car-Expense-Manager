#pragma warning disable CS1591

using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

using Core.Contracts;
using Core.Entities;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

[Authorize(Policy = "NormalUser")]
[ApiController]
[Route("[controller]")]
public class GroupController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public GroupController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // =========================================
    // DTO - Gruppendaten
    // =========================================

    public record GroupDto(
        int Id,
        string Name,
        string? Description,
        int OwnerId,
        DateTime CreatedAt,
        List<string> VehicleLicensePlates
    );

    // =========================================
    // DTO - Neue Gruppe
    // =========================================

    public record CreateGroupDto(
        string Name,
        string? Description
    );

    // =========================================
    // DTO - Fahrzeugzuordnung
    // =========================================

    public record AssignGroupVehiclesDto(
        List<string> LicensePlates
    );

    // =========================================
    // Entity in DTO umwandeln
    // =========================================

    private static GroupDto ToDto(Group group)
    {
        return new GroupDto(
            group.Id,
            group.Name,
            group.Description,
            group.OwnerId,
            group.CreatedAt,
            group.Vehicles
                .Select(vehicle => vehicle.LicensePlate)
                .ToList()
        );
    }

    // =========================================
    // Keycloak-Benutzer erkennen
    // =========================================

    private string? GetKeycloakUserId()
    {
        return User.FindFirst("sub")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }

    // =========================================
    // Angemeldeten Benutzer suchen
    // =========================================

    private async Task<Core.Entities.User?> FindCurrentUserAsync()
    {
        var keycloakId = GetKeycloakUserId();

        if (string.IsNullOrWhiteSpace(keycloakId))
        {
            return null;
        }

        var username = $"keycloak:{keycloakId}";

        var users = await _uow.UserRepository.GetNoTrackingAsync(
            user => user.Username == username
        );

        return users.FirstOrDefault();
    }

    // =========================================
    // GET - Eigene Gruppen anzeigen
    // =========================================

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GroupDto>>> GetAllAsync()
    {
        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return Ok(new List<GroupDto>());
        }

        var groups = await _uow.GroupRepository.GetNoTrackingAsync(
            group => group.OwnerId == currentUser.Id,
            query => query.OrderBy(group => group.Name),
            nameof(Group.Vehicles)
        );

        return Ok(groups.Select(ToDto).ToList());
    }

    // =========================================
    // GET - Einzelne Gruppe anzeigen
    // =========================================

    [HttpGet("{id:int}", Name = "GetGroupById")]
    public async Task<ActionResult<GroupDto>> GetByIdAsync(int id)
    {
        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        var group = await _uow.GroupRepository.GetByIdAsync(
            id,
            nameof(Group.Vehicles)
        );

        if (group is null || group.OwnerId != currentUser.Id)
        {
            return NotFound();
        }

        return Ok(ToDto(group));
    }

    // =========================================
    // POST - Neue Gruppe erstellen
    // =========================================

    [HttpPost]
    public async Task<ActionResult<GroupDto>> CreateAsync(
        [FromBody] CreateGroupDto input)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
        {
            return BadRequest("Group name is required.");
        }

        var keycloakId = GetKeycloakUserId();

        if (string.IsNullOrWhiteSpace(keycloakId))
        {
            return Unauthorized("Keycloak user ID is missing.");
        }

        var username = $"keycloak:{keycloakId}";

        using (var transaction = _uow.BeginTransaction())
        {
            var users = await _uow.UserRepository.GetAsync(
                user => user.Username == username
            );

            var currentUser = users.FirstOrDefault();

            // =========================================
            // Benutzer automatisch erstellen
            // =========================================

            if (currentUser is null)
            {
                var email = User.FindFirst("email")?.Value
                    ?? User.FindFirst(ClaimTypes.Email)?.Value;

                if (string.IsNullOrWhiteSpace(email))
                {
                    email = $"kc-{keycloakId}@users.invalid";
                }

                var existingEmails =
                    await _uow.UserRepository.GetNoTrackingAsync(
                        user => user.Email == email
                    );

                if (existingEmails.Any())
                {
                    return Conflict(
                        "A local account with this email already exists."
                    );
                }

                var firstName =
                    User.FindFirst("given_name")?.Value
                    ?? User.FindFirst(ClaimTypes.GivenName)?.Value
                    ?? User.FindFirst("preferred_username")?.Value
                    ?? "User";

                var lastName =
                    User.FindFirst("family_name")?.Value
                    ?? User.FindFirst(ClaimTypes.Surname)?.Value
                    ?? "Unknown";

                currentUser = new Core.Entities.User
                {
                    Username = username,
                    FirstName = firstName,
                    LastName = lastName,
                    Email = email,
                    CreatedAt = DateTime.UtcNow
                };

                await _uow.UserRepository.AddAsync(currentUser);
            }

            // =========================================
            // Gruppe erstellen
            // =========================================

            var group = new Group
            {
                Name = input.Name.Trim(),
                Description = input.Description,
                Owner = currentUser,
                CreatedAt = DateTime.UtcNow
            };

            await _uow.GroupRepository.AddAsync(group);

            await transaction.CommitTransactionAsync();

            return CreatedAtRoute(
                "GetGroupById",
                new { id = group.Id },
                ToDto(group)
            );
        }
    }

    // =========================================
    // PUT - Fahrzeuge einer Gruppe zuordnen
    // =========================================

    [HttpPut("{id:int}/vehicles")]
    public async Task<ActionResult> AssignVehiclesAsync(
        int id,
        [FromBody] AssignGroupVehiclesDto input)
    {
        // =========================================
        // Eingaben überprüfen
        // =========================================

        if (input?.LicensePlates is null)
        {
            return BadRequest(
                "License plates are required."
            );
        }

        var licensePlates = input.LicensePlates
            .Select(plate => plate?.Trim() ?? "")
            .ToList();

        if (licensePlates.Any(string.IsNullOrWhiteSpace))
        {
            return BadRequest(
                "License plates cannot be empty."
            );
        }

        if (
            licensePlates.Count !=
            licensePlates
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count()
        )
        {
            return BadRequest(
                "Duplicate license plates are not allowed."
            );
        }

        // =========================================
        // Benutzer überprüfen
        // =========================================

        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        using (var transaction = _uow.BeginTransaction())
        {
            // =========================================
            // Gruppe inklusive Fahrzeuge laden
            // =========================================

            var group = await _uow.GroupRepository.GetByIdAsync(
                id,
                nameof(Group.Vehicles)
            );

            if (group is null)
            {
                return NotFound();
            }

            // Nur der Besitzer darf Fahrzeuge zuordnen.

            if (group.OwnerId != currentUser.Id)
            {
                return NotFound();
            }

            // =========================================
            // Fahrzeuge suchen
            // =========================================

            var allVehicles =
                await _uow.VehicleRepository.GetAsync();

            var selectedVehicles = new List<Vehicle>();

            foreach (var plate in licensePlates)
            {
                var vehicle = allVehicles.FirstOrDefault(
                    v => string.Equals(
                        v.LicensePlate,
                        plate,
                        StringComparison.OrdinalIgnoreCase
                    )
                );

                if (vehicle is null)
                {
                    return BadRequest(
                        $"Vehicle '{plate}' was not found."
                    );
                }

                selectedVehicles.Add(vehicle);
            }

            // =========================================
            // Prüfen, ob ein Fahrzeug bereits
            // einer anderen Gruppe gehört
            // =========================================

            var otherGroups =
                await _uow.GroupRepository.GetNoTrackingAsync(
                    otherGroup => otherGroup.Id != id,
                    null,
                    nameof(Group.Vehicles)
                );

            var vehiclesInOtherGroups = otherGroups
                .SelectMany(otherGroup => otherGroup.Vehicles)
                .Select(vehicle => vehicle.Id)
                .ToHashSet();

            foreach (var vehicle in selectedVehicles)
            {
                if (vehiclesInOtherGroups.Contains(vehicle.Id))
                {
                    return Conflict(
                        $"Vehicle '{vehicle.LicensePlate}' " +
                        "already belongs to another group."
                    );
                }
            }

            // =========================================
            // Bisherige Zuordnung ersetzen
            // =========================================

            group.Vehicles.Clear();

            foreach (var vehicle in selectedVehicles)
            {
                group.Vehicles.Add(vehicle);
            }

            // =========================================
            // Änderungen dauerhaft speichern
            // =========================================

            await transaction.CommitTransactionAsync();
        }

        return NoContent();
    }
}