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
    // DTOs
    // =========================================

    public record GroupDto(
        int Id,
        string Name,
        string? Description,
        int OwnerId,
        DateTime CreatedAt,
        List<string> VehicleLicensePlates
    );

    public record CreateGroupDto(
        string Name,
        string? Description
    );

    public record UpdateGroupDto(
        string Name,
        string? Description
    );

    public record AssignGroupVehiclesDto(
        List<string> LicensePlates
    );

    public record AddGroupMemberDto(
        string Email
    );

    public record GroupMemberDto(
        int UserId,
        string FirstName,
        string LastName,
        string Email
    );

    // =========================================
    // ENTITY -> DTO
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

    private static GroupMemberDto ToMemberDto(Core.Entities.User user)
    {
        return new GroupMemberDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email
        );
    }

    // =========================================
    // KEYCLOAK
    // =========================================

    private string? GetKeycloakUserId()
    {
        return User.FindFirst("sub")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }

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
    // GET - ALLE EIGENEN GRUPPEN
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
    // GET - GRUPPE NACH ID
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
    // POST - GRUPPE ERSTELLEN
    // =========================================

    [HttpPost]
    public async Task<ActionResult<GroupDto>> CreateAsync(
        [FromBody] CreateGroupDto input)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
        {
            return BadRequest("Group name is required.");
        }

        if (input.Name.Trim().Length > 256)
        {
            return BadRequest("Group name is too long.");
        }

        if (input.Description?.Length > 512)
        {
            return BadRequest("Description is too long.");
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

            var group = new Group
            {
                Name = input.Name.Trim(),
                Description = input.Description?.Trim(),
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
    // PUT - GRUPPE BEARBEITEN
    // =========================================

    [HttpPut("{id:int}")]
    public async Task<ActionResult> UpdateAsync(
        int id,
        [FromBody] UpdateGroupDto input)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
        {
            return BadRequest("Group name is required.");
        }

        if (input.Name.Trim().Length > 256)
        {
            return BadRequest("Group name is too long.");
        }

        if (input.Description?.Length > 512)
        {
            return BadRequest("Description is too long.");
        }

        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        using (var transaction = _uow.BeginTransaction())
        {
            var group = await _uow.GroupRepository.GetByIdAsync(id);

            if (group is null || group.OwnerId != currentUser.Id)
            {
                return NotFound();
            }

            group.Name = input.Name.Trim();
            group.Description = input.Description?.Trim();

            await transaction.CommitTransactionAsync();
        }

        return NoContent();
    }

    // =========================================
    // PUT - FAHRZEUGE ZUORDNEN
    // =========================================

    [HttpPut("{id:int}/vehicles")]
    public async Task<ActionResult> AssignVehiclesAsync(
        int id,
        [FromBody] AssignGroupVehiclesDto input)
    {
        if (input?.LicensePlates is null)
        {
            return BadRequest("License plates are required.");
        }

        var licensePlates = input.LicensePlates
            .Select(plate => plate?.Trim() ?? "")
            .ToList();

        if (licensePlates.Any(string.IsNullOrWhiteSpace))
        {
            return BadRequest("License plates cannot be empty.");
        }

        if (
            licensePlates.Count !=
            licensePlates
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count()
        )
        {
            return BadRequest("Duplicate license plates are not allowed.");
        }

        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        using (var transaction = _uow.BeginTransaction())
        {
            var group = await _uow.GroupRepository.GetByIdAsync(
                id,
                nameof(Group.Vehicles)
            );

            if (group is null || group.OwnerId != currentUser.Id)
            {
                return NotFound();
            }

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

            group.Vehicles.Clear();

            foreach (var vehicle in selectedVehicles)
            {
                group.Vehicles.Add(vehicle);
            }

            await transaction.CommitTransactionAsync();
        }

        return NoContent();
    }

    // =========================================
    // GET - GRUPPENMITGLIEDER ANZEIGEN
    // =========================================

    [HttpGet("{id:int}/members")]
    public async Task<ActionResult<IEnumerable<GroupMemberDto>>> GetMembersAsync(int id)
    {
        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        var group = await _uow.GroupRepository.GetByIdAsync(
            id,
            nameof(Group.UserGroups)
        );

        if (group is null || group.OwnerId != currentUser.Id)
        {
            return NotFound();
        }

        var memberIds = group.UserGroups
            .Select(membership => membership.UserId)
            .ToList();

        if (memberIds.Count == 0)
        {
            return Ok(new List<GroupMemberDto>());
        }

        var users = await _uow.UserRepository.GetNoTrackingAsync(
            user => memberIds.Contains(user.Id)
        );

        var members = users
            .OrderBy(user => user.FirstName)
            .ThenBy(user => user.LastName)
            .Select(ToMemberDto)
            .ToList();

        return Ok(members);
    }

    // =========================================
    // POST - BENUTZER PER E-MAIL HINZUFUEGEN
    // =========================================

    [HttpPost("{id:int}/members")]
    public async Task<ActionResult<GroupMemberDto>> AddMemberAsync(
        int id,
        [FromBody] AddGroupMemberDto input)
    {
        if (input is null || string.IsNullOrWhiteSpace(input.Email))
        {
            return BadRequest("Member email is required.");
        }

        var email = input.Email.Trim().ToLowerInvariant();

        if (email.Length > 320)
        {
            return BadRequest("Email address is too long.");
        }

        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        using (var transaction = _uow.BeginTransaction())
        {
            var group = await _uow.GroupRepository.GetByIdAsync(
                id,
                nameof(Group.UserGroups)
            );

            if (group is null || group.OwnerId != currentUser.Id)
            {
                return NotFound();
            }

            var users = await _uow.UserRepository.GetNoTrackingAsync(
                user => user.Email.ToLower() == email
            );

            var member = users.FirstOrDefault();

            if (member is null)
            {
                return NotFound(
                    "No local user with this email exists yet. " +
                    "The user must first have an account stored in SCEM."
                );
            }

            if (member.Id == group.OwnerId)
            {
                return Conflict("The group owner is already part of the group.");
            }

            if (group.UserGroups.Any(item => item.UserId == member.Id))
            {
                return Conflict("This user is already a group member.");
            }

            group.UserGroups.Add(new UserGroup
            {
                UserId = member.Id,
                GroupId = group.Id,
                Group = group
            });

            await transaction.CommitTransactionAsync();

            return Ok(ToMemberDto(member));
        }
    }

    // =========================================
    // DELETE - GRUPPENMITGLIED ENTFERNEN
    // =========================================

    [HttpDelete("{id:int}/members/{userId:int}")]
    public async Task<ActionResult> RemoveMemberAsync(int id, int userId)
    {
        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        using (var transaction = _uow.BeginTransaction())
        {
            var group = await _uow.GroupRepository.GetByIdAsync(
                id,
                nameof(Group.UserGroups)
            );

            if (group is null || group.OwnerId != currentUser.Id)
            {
                return NotFound();
            }

            var membership = group.UserGroups.FirstOrDefault(
                item => item.UserId == userId
            );

            if (membership is null)
            {
                return NotFound("This user is not a member of this group.");
            }

            group.UserGroups.Remove(membership);

            await transaction.CommitTransactionAsync();
        }

        return NoContent();
    }

    // =========================================
    // DELETE - GRUPPE DAUERHAFT LÖSCHEN
    // =========================================

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteAsync(int id)
    {
        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        using (var transaction = _uow.BeginTransaction())
        {
            var group = await _uow.GroupRepository.GetByIdAsync(
                id,
                nameof(Group.Vehicles),
                nameof(Group.UserGroups)
            );

            if (group is null || group.OwnerId != currentUser.Id)
            {
                return NotFound();
            }

            // Gruppen mit gespeicherten Mitgliedschaften
            // behandeln wir später separat.
            if (group.UserGroups.Any())
            {
                return Conflict(
                    "Remove group memberships before deleting this group."
                );
            }

            // Fahrzeuge nur aus der Gruppe entfernen.
            // Die Fahrzeuge selbst NICHT löschen.
            group.Vehicles.Clear();

            _uow.GroupRepository.Remove(group);

            await transaction.CommitTransactionAsync();
        }

        return NoContent();
    }
}