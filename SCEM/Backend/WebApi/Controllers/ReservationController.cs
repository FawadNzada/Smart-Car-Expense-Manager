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
public class ReservationController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public ReservationController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // =========================================
    // DTOs
    // =========================================

    public record ReservationDto(
        int Id,
        string VehicleName,
        string LicensePlate,
        string VehicleImage,
        string Driver,
        string Date,
        string StartTime,
        string EndTime,
        string Status,
        string Notes
    );

    public record CreateReservationDto(
        string LicensePlate,
        string Date,
        string StartTime,
        string EndTime,
        string? Notes
    );

    public record UpdateReservationDto(
        string LicensePlate,
        string Date,
        string StartTime,
        string EndTime,
        string Status,
        string? Notes
    );

    // =========================================
    // RESERVATION -> DTO
    // =========================================

    private static ReservationDto ToDto(Reservation reservation)
    {
        var vehicle = reservation.Vehicle;
        var driver = reservation.Driver;

        var vehicleName = vehicle is null
            ? ""
            : $"{vehicle.Brand} {vehicle.Model}".Trim();

        var driverName = driver is null
            ? ""
            : $"{driver.FirstName} {driver.LastName}".Trim();

        return new ReservationDto(
            reservation.Id,
            vehicleName,
            vehicle?.LicensePlate ?? "",
            vehicle?.Image ?? "",
            driverName,
            reservation.Date.ToString(
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture
            ),
            reservation.StartTime.ToString(
                "HH:mm",
                CultureInfo.InvariantCulture
            ),
            reservation.EndTime.ToString(
                "HH:mm",
                CultureInfo.InvariantCulture
            ),
            reservation.Status,
            reservation.Notes ?? ""
        );
    }

    // =========================================
    // KEYCLOAK - AKTUELLEN BENUTZER FINDEN
    // =========================================

    private async Task<Core.Entities.User?> FindCurrentUserAsync()
    {
        var keycloakId =
            User.FindFirst("sub")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

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
    // DATUM UND ZEIT PRÜFEN
    // =========================================

    private static bool TryParseDateAndTimes(
        string dateText,
        string startText,
        string endText,
        out DateTime date,
        out TimeOnly startTime,
        out TimeOnly endTime
    )
    {
        date = default;
        startTime = default;
        endTime = default;

        if (!DateOnly.TryParseExact(
            dateText,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var parsedDate))
        {
            return false;
        }

        var timeFormats = new[]
        {
            "HH:mm",
            "HH:mm:ss"
        };

        if (!TimeOnly.TryParseExact(
            startText,
            timeFormats,
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out startTime))
        {
            return false;
        }

        if (!TimeOnly.TryParseExact(
            endText,
            timeFormats,
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out endTime))
        {
            return false;
        }

        if (endTime <= startTime)
        {
            return false;
        }

        date = parsedDate.ToDateTime(TimeOnly.MinValue);

        return true;
    }

    // =========================================
    // FAHRZEUG ÜBER KENNZEICHEN FINDEN
    // =========================================

    private async Task<Vehicle?> FindVehicleAsync(
        string licensePlate
    )
    {
        var normalizedPlate =
            licensePlate.Trim().ToLowerInvariant();

        var vehicles =
            await _uow.VehicleRepository.GetNoTrackingAsync(
                vehicle =>
                    vehicle.LicensePlate.ToLower()
                    == normalizedPlate
            );

        return vehicles.FirstOrDefault();
    }

    // =========================================
    // DOPPELBUCHUNGEN PRÜFEN
    // =========================================

    private async Task<bool> HasConflictAsync(
        int vehicleId,
        DateTime date,
        TimeOnly startTime,
        TimeOnly endTime,
        int? ignoreReservationId = null
    )
    {
        var reservations =
            await _uow.ReservationRepository.GetNoTrackingAsync(
                reservation =>
                    reservation.VehicleId == vehicleId
                    && reservation.Date == date
                    && reservation.Status != "Cancelled"
                    && reservation.Status != "Completed"
            );

        return reservations.Any(
            reservation =>
                reservation.Id != ignoreReservationId
                && startTime < reservation.EndTime
                && endTime > reservation.StartTime
        );
    }

    // =========================================
    // GET - EIGENE RESERVIERUNGEN
    // =========================================

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReservationDto>>>
        GetAllAsync()
    {
        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return Ok(new List<ReservationDto>());
        }

        var reservations =
            await _uow.ReservationRepository.GetNoTrackingAsync(
                reservation =>
                    reservation.DriverId == currentUser.Id,
                query => query
                    .OrderBy(reservation => reservation.Date)
                    .ThenBy(reservation => reservation.StartTime),
                nameof(Reservation.Vehicle),
                nameof(Reservation.Driver)
            );

        return Ok(reservations.Select(ToDto).ToList());
    }

    // =========================================
    // GET - RESERVIERUNG NACH ID
    // =========================================

    [HttpGet("{id:int}", Name = "GetReservationById")]
    public async Task<ActionResult<ReservationDto>>
        GetByIdAsync(int id)
    {
        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        var reservation =
            await _uow.ReservationRepository.GetByIdAsync(
                id,
                nameof(Reservation.Vehicle),
                nameof(Reservation.Driver)
            );

        if (
            reservation is null
            || reservation.DriverId != currentUser.Id
        )
        {
            return NotFound();
        }

        return Ok(ToDto(reservation));
    }

    // =========================================
    // POST - RESERVIERUNG ERSTELLEN
    // =========================================

    [HttpPost]
    public async Task<ActionResult<ReservationDto>>
        CreateAsync([FromBody] CreateReservationDto input)
    {
        if (string.IsNullOrWhiteSpace(input.LicensePlate))
        {
            return BadRequest("Please select a vehicle.");
        }

        if (!TryParseDateAndTimes(
            input.Date,
            input.StartTime,
            input.EndTime,
            out var date,
            out var startTime,
            out var endTime))
        {
            return BadRequest(
                "Invalid date or time. Use yyyy-MM-dd and HH:mm. " +
                "End time must be after start time."
            );
        }

        if (input.Notes?.Length > 1024)
        {
            return BadRequest("Notes are too long.");
        }

        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return BadRequest(
                "Your SCEM user account was not found."
            );
        }

        var vehicle = await FindVehicleAsync(
            input.LicensePlate
        );

        if (vehicle is null)
        {
            return NotFound("Vehicle not found.");
        }

        using (var transaction = _uow.BeginTransaction())
        {
            if (await HasConflictAsync(
                vehicle.Id,
                date,
                startTime,
                endTime))
            {
                return Conflict(
                    "This vehicle is already reserved " +
                    "during the selected time."
                );
            }

            var reservation = new Reservation
            {
                VehicleId = vehicle.Id,
                DriverId = currentUser.Id,
                Date = date,
                StartTime = startTime,
                EndTime = endTime,
                Status = "Planned",
                Notes = input.Notes?.Trim()
            };

            await _uow.ReservationRepository.AddAsync(
                reservation
            );

            await transaction.CommitTransactionAsync();

            var created =
                await _uow.ReservationRepository.GetByIdAsync(
                    reservation.Id,
                    nameof(Reservation.Vehicle),
                    nameof(Reservation.Driver)
                );

            return CreatedAtRoute(
                "GetReservationById",
                new { id = reservation.Id },
                ToDto(created!)
            );
        }
    }

    // =========================================
    // PUT - RESERVIERUNG BEARBEITEN
    // =========================================

    [HttpPut("{id:int}")]
    public async Task<ActionResult> UpdateAsync(
        int id,
        [FromBody] UpdateReservationDto input
    )
    {
        if (string.IsNullOrWhiteSpace(input.LicensePlate))
        {
            return BadRequest("Please select a vehicle.");
        }

        if (!TryParseDateAndTimes(
            input.Date,
            input.StartTime,
            input.EndTime,
            out var date,
            out var startTime,
            out var endTime))
        {
            return BadRequest(
                "Invalid date or time. Use yyyy-MM-dd and HH:mm."
            );
        }

        var allowedStatuses = new[]
        {
            "Planned",
            "Upcoming",
            "Completed",
            "Cancelled"
        };

        if (
            string.IsNullOrWhiteSpace(input.Status)
            || !allowedStatuses.Contains(input.Status)
        )
        {
            return BadRequest("Invalid reservation status.");
        }

        if (input.Notes?.Length > 1024)
        {
            return BadRequest("Notes are too long.");
        }

        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        var vehicle = await FindVehicleAsync(
            input.LicensePlate
        );

        if (vehicle is null)
        {
            return NotFound("Vehicle not found.");
        }

        using (var transaction = _uow.BeginTransaction())
        {
            var reservation =
                await _uow.ReservationRepository.GetByIdAsync(id);

            if (
                reservation is null
                || reservation.DriverId != currentUser.Id
            )
            {
                return NotFound();
            }

            if (reservation.Status == "Cancelled")
            {
                return Conflict(
                    "Cancelled reservations cannot be edited."
                );
            }

            if (
                input.Status != "Cancelled"
                && input.Status != "Completed"
                && await HasConflictAsync(
                    vehicle.Id,
                    date,
                    startTime,
                    endTime,
                    reservation.Id
                )
            )
            {
                return Conflict(
                    "This vehicle is already reserved " +
                    "during the selected time."
                );
            }

            reservation.VehicleId = vehicle.Id;
            reservation.Date = date;
            reservation.StartTime = startTime;
            reservation.EndTime = endTime;
            reservation.Status = input.Status;
            reservation.Notes = input.Notes?.Trim();

            await transaction.CommitTransactionAsync();
        }

        return NoContent();
    }

    // =========================================
    // DELETE - RESERVIERUNG STORNIEREN
    // =========================================

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> CancelAsync(int id)
    {
        var currentUser = await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        using (var transaction = _uow.BeginTransaction())
        {
            var reservation =
                await _uow.ReservationRepository.GetByIdAsync(id);

            if (
                reservation is null
                || reservation.DriverId != currentUser.Id
            )
            {
                return NotFound();
            }

            reservation.Status = "Cancelled";

            await transaction.CommitTransactionAsync();
        }

        return NoContent();
    }
}