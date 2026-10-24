#pragma warning disable CS1591

using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace WebApi.Controllers;

[Authorize(Policy = "NormalUser")]
[ApiController]
[Route("Debt/users")]
public class DebtUsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public DebtUsersController(ApplicationDbContext db)
    {
        _db = db;
    }

    public record DebtUserDto(
        int Id,
        string Name
    );

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DebtUserDto>>> GetUsers()
    {
        var keycloakId =
            User.FindFirst("sub")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(keycloakId))
            return Unauthorized();

        var username = $"keycloak:{keycloakId}";

        var currentUser = await _db.Set<Core.Entities.User>()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username == username);

        if (currentUser == null)
            return Unauthorized();

        var users = await _db.Set<Core.Entities.User>()
            .AsNoTracking()
            .Where(u => u.Id != currentUser.Id)
            .OrderBy(u => u.FirstName)
            .Select(u => new DebtUserDto(
                u.Id,
                u.FirstName + " " + u.LastName
            ))
            .Take(20)
            .ToListAsync();

        return Ok(users);
    }
}