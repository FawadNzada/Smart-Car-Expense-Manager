#pragma warning disable CS1591

using System;
using System.Collections.Generic;
using System.Globalization;
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
public class ExpenseController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public ExpenseController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // =========================================
    // DTOs
    // =========================================

    public record ExpenseDto(
        int Id,
        string Category,
        decimal Amount,
        string Date,
        string PaidBy,
        string VehicleName,
        string LicensePlate,
        int? TripId,
        string TripRoute,
        string Notes
    );

    public record ExpenseInputDto(
        string LicensePlate,
        string Category,
        decimal Amount,
        string Date,
        int? TripId,
        string? Notes
    );

    // =========================================
    // ENTITY -> DTO
    // =========================================

    private static ExpenseDto ToDto(Expense expense)
    {
        var vehicle = expense.Vehicle;
        var user = expense.PaidBy;
        var trip = expense.Trip;

        return new ExpenseDto(
            expense.Id,
            expense.Category,
            expense.Amount,
            expense.Date.ToString("yyyy-MM-dd"),
            user is null
                ? ""
                : $"{user.FirstName} {user.LastName}".Trim(),
            vehicle is null
                ? ""
                : $"{vehicle.Brand} {vehicle.Model}".Trim(),
            vehicle?.LicensePlate ?? "",
            expense.TripId,
            trip is null
                ? ""
                : $"{trip.StartLocation} → {trip.Destination}",
            expense.Notes ?? ""
        );
    }

    // =========================================
    // CURRENT KEYCLOAK USER
    // =========================================

    private async Task<Core.Entities.User?>
        FindCurrentUserAsync()
    {
        var keycloakId =
            User.FindFirst("sub")?.Value
            ?? User.FindFirst(
                ClaimTypes.NameIdentifier
            )?.Value;

        if (string.IsNullOrWhiteSpace(keycloakId))
        {
            return null;
        }

        var username = $"keycloak:{keycloakId}";

        var users =
            await _uow.UserRepository.GetNoTrackingAsync(
                user => user.Username == username
            );

        return users.FirstOrDefault();
    }

    // =========================================
    // VALIDATION
    // =========================================

    private static string? Validate(
        ExpenseInputDto input
    )
    {
        if (string.IsNullOrWhiteSpace(input.LicensePlate))
            return "Vehicle is required.";

        if (string.IsNullOrWhiteSpace(input.Category))
            return "Category is required.";

        if (input.Category.Trim().Length > 128)
            return "Category is too long.";

        if (input.Amount <= 0)
            return "Amount must be greater than zero.";

        if (input.Notes?.Length > 1024)
            return "Notes are too long.";

        if (!DateTime.TryParseExact(
            input.Date,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out _
        ))
        {
            return "Date must use yyyy-MM-dd.";
        }

        if (input.TripId is <= 0)
            return "Invalid trip ID.";

        return null;
    }

    // =========================================
    // GET /Expense
    // =========================================

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExpenseDto>>>
        GetAllAsync()
    {
        var currentUser =
            await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return Ok(new List<ExpenseDto>());
        }

        var expenses =
            await _uow.ExpenseRepository.GetNoTrackingAsync(
                expense => expense.PaidById == currentUser.Id,
                query => query.OrderByDescending(
                    expense => expense.Date
                ),
                nameof(Expense.Vehicle),
                nameof(Expense.PaidBy),
                nameof(Expense.Trip)
            );

        return Ok(expenses.Select(ToDto).ToList());
    }

    // =========================================
    // GET /Expense/{id}
    // =========================================

    [HttpGet("{id:int}", Name = "GetExpenseById")]
    public async Task<ActionResult<ExpenseDto>>
        GetByIdAsync(int id)
    {
        var currentUser =
            await FindCurrentUserAsync();

        if (currentUser is null)
            return NotFound();

        var expense =
            await _uow.ExpenseRepository.GetByIdAsync(
                id,
                nameof(Expense.Vehicle),
                nameof(Expense.PaidBy),
                nameof(Expense.Trip)
            );

        if (
            expense is null ||
            expense.PaidById != currentUser.Id
        )
        {
            return NotFound();
        }

        return Ok(ToDto(expense));
    }

    // =========================================
    // POST /Expense
    // =========================================

    [HttpPost]
    public async Task<ActionResult<ExpenseDto>>
        CreateAsync([FromBody] ExpenseInputDto input)
    {
        var validationError = Validate(input);

        if (validationError is not null)
            return BadRequest(validationError);

        var currentUser =
            await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return Conflict(
                "Current user was not found in the database."
            );
        }

        var vehicles =
            await _uow.VehicleRepository.GetAsync();

        var vehicle = vehicles.FirstOrDefault(
            v => string.Equals(
                v.LicensePlate,
                input.LicensePlate.Trim(),
                StringComparison.OrdinalIgnoreCase
            )
        );

        if (vehicle is null)
            return NotFound("Vehicle not found.");

        Trip? trip = null;

        if (input.TripId.HasValue)
        {
            trip = await _uow.TripRepository.GetByIdAsync(
                input.TripId.Value
            );

            if (
                trip is null ||
                trip.DriverId != currentUser.Id ||
                trip.VehicleId != vehicle.Id
            )
            {
                return BadRequest(
                    "Trip not found or does not match the vehicle."
                );
            }
        }

        DateTime.TryParseExact(
            input.Date,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var expenseDate
        );

        using var transaction =
            _uow.BeginTransaction();

        var expense = new Expense
        {
            Category = input.Category.Trim(),
            Amount = input.Amount,
            Date = expenseDate,
            PaidById = currentUser.Id,
            VehicleId = vehicle.Id,
            TripId = trip?.Id,
            Notes = input.Notes?.Trim()
        };

        await _uow.ExpenseRepository.AddAsync(expense);

        await transaction.CommitTransactionAsync();

        var created =
            await _uow.ExpenseRepository.GetByIdAsync(
                expense.Id,
                nameof(Expense.Vehicle),
                nameof(Expense.PaidBy),
                nameof(Expense.Trip)
            );

        return CreatedAtRoute(
            "GetExpenseById",
            new { id = expense.Id },
            ToDto(created!)
        );
    }

    // =========================================
    // PUT /Expense/{id}
    // =========================================

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateAsync(
        int id,
        [FromBody] ExpenseInputDto input
    )
    {
        var validationError = Validate(input);

        if (validationError is not null)
            return BadRequest(validationError);

        var currentUser =
            await FindCurrentUserAsync();

        if (currentUser is null)
            return NotFound();

        var expense =
            await _uow.ExpenseRepository.GetByIdAsync(id);

        if (
            expense is null ||
            expense.PaidById != currentUser.Id
        )
        {
            return NotFound();
        }

        var vehicles =
            await _uow.VehicleRepository.GetAsync();

        var vehicle = vehicles.FirstOrDefault(
            v => string.Equals(
                v.LicensePlate,
                input.LicensePlate.Trim(),
                StringComparison.OrdinalIgnoreCase
            )
        );

        if (vehicle is null)
            return NotFound("Vehicle not found.");

        Trip? trip = null;

        if (input.TripId.HasValue)
        {
            trip = await _uow.TripRepository.GetByIdAsync(
                input.TripId.Value
            );

            if (
                trip is null ||
                trip.DriverId != currentUser.Id ||
                trip.VehicleId != vehicle.Id
            )
            {
                return BadRequest(
                    "Trip not found or does not match the vehicle."
                );
            }
        }

        DateTime.TryParseExact(
            input.Date,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var expenseDate
        );

        using var transaction =
            _uow.BeginTransaction();

        expense.Category = input.Category.Trim();
        expense.Amount = input.Amount;
        expense.Date = expenseDate;
        expense.VehicleId = vehicle.Id;
        expense.TripId = trip?.Id;
        expense.Notes = input.Notes?.Trim();

        await transaction.CommitTransactionAsync();

        return NoContent();
    }

    // =========================================
    // DELETE /Expense/{id}
    // =========================================

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var currentUser =
            await FindCurrentUserAsync();

        if (currentUser is null)
            return NotFound();

        var expense =
            await _uow.ExpenseRepository.GetByIdAsync(
                id,
                nameof(Expense.Shares)
            );

        if (
            expense is null ||
            expense.PaidById != currentUser.Id
        )
        {
            return NotFound();
        }

        // Bereits aufgeteilte Kosten werden
        // nicht gelöscht, damit keine
        // Schuldeninformationen verloren gehen.

        if (expense.Shares.Any())
        {
            return Conflict(
                "This expense has existing shares and cannot be deleted."
            );
        }

        using var transaction =
            _uow.BeginTransaction();

        _uow.ExpenseRepository.Remove(expense);

        await transaction.CommitTransactionAsync();

        return NoContent();
    }
}

