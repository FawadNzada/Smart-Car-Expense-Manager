#pragma warning disable CS1591

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


using Core.Contracts;
using Core.Entities;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

/// <summary>
/// Provides access to vehicles.
/// </summary>
[Authorize(Policy = "NormalUser")]
[ApiController]
[Route("[controller]")]
public class VehicleController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public VehicleController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // =========================================
    // DTO - Daten für das Frontend
    // =========================================

    public record VehicleDto(
        int Id,
        string Brand,
        string Model,
        string LicensePlate,
        int FuelLevel,
        string Status,
        string? Image
    );

    // =========================================
    // DTO - Daten zum Erstellen/Bearbeiten
    // =========================================

    public record VehicleInputDto(
        string Brand,
        string Model,
        string LicensePlate,
        int FuelLevel,
        string Status,
        string? Image
    );

    private static VehicleDto ToDto(Vehicle vehicle)
    {
        return new VehicleDto(
            vehicle.Id,
            vehicle.Brand,
            vehicle.Model,
            vehicle.LicensePlate,
            vehicle.FuelLevel,
            vehicle.Status,
            vehicle.Image
        );
    }

    // =========================================
    // GET - Alle Fahrzeuge anzeigen
    // =========================================

    /// <summary>
    /// Gets all vehicles ordered by brand and model.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VehicleDto>>> GetAllAsync()
    {
        var vehicles = await _uow.VehicleRepository.GetNoTrackingAsync(
            null,
            query => query
                .OrderBy(vehicle => vehicle.Brand)
                .ThenBy(vehicle => vehicle.Model)
        );

        return Ok(vehicles.Select(ToDto).ToList());
    }

    // =========================================
    // GET - Einzelnes Fahrzeug anzeigen
    // =========================================

    /// <summary>
    /// Gets a vehicle by its ID.
    /// </summary>
    [HttpGet("{id:int}", Name = "GetVehicleById")]
    public async Task<ActionResult<VehicleDto>> GetByIdAsync(int id)
    {
        var vehicle = await _uow.VehicleRepository.GetByIdAsync(id);

        if (vehicle is null)
        {
            return NotFound();
        }

        return Ok(ToDto(vehicle));
    }

    // =========================================
    // POST - Fahrzeug hinzufügen
    // =========================================

    /// <summary>
    /// Creates a new vehicle.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<VehicleDto>> CreateAsync(
        [FromBody] VehicleInputDto input)
    {
        if (input.FuelLevel < 0 || input.FuelLevel > 100)
        {
            return BadRequest("Fuel level must be between 0 and 100.");
        }

        var vehicle = new Vehicle
        {
            Brand = input.Brand,
            Model = input.Model,
            LicensePlate = input.LicensePlate,
            FuelLevel = input.FuelLevel,
            Status = input.Status,
            Image = input.Image
        };

        using (var transaction = _uow.BeginTransaction())
        {
            await _uow.VehicleRepository.AddAsync(vehicle);

            await transaction.CommitTransactionAsync();
        }

        return CreatedAtRoute(
            "GetVehicleById",
            new { id = vehicle.Id },
            ToDto(vehicle)
        );
    }

    // =========================================
    // PUT - Fahrzeug bearbeiten
    // =========================================

    /// <summary>
    /// Updates an existing vehicle.
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult> UpdateAsync(
        int id,
        [FromBody] VehicleInputDto input)
    {
        if (input.FuelLevel < 0 || input.FuelLevel > 100)
        {
            return BadRequest("Fuel level must be between 0 and 100.");
        }

        using (var transaction = _uow.BeginTransaction())
        {
            var vehicle = await _uow.VehicleRepository.GetByIdAsync(id);

            if (vehicle is null)
            {
                return NotFound();
            }

            vehicle.Brand = input.Brand;
            vehicle.Model = input.Model;
            vehicle.LicensePlate = input.LicensePlate;
            vehicle.FuelLevel = input.FuelLevel;
            vehicle.Status = input.Status;
            vehicle.Image = input.Image;

            await transaction.CommitTransactionAsync();
        }

        return NoContent();
    }

    // =========================================
    // DELETE - Fahrzeug löschen
    // =========================================

    /// <summary>
    /// Deletes a vehicle by its ID.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteAsync(int id)
    {
        using (var transaction = _uow.BeginTransaction())
        {
            var vehicle = await _uow.VehicleRepository.GetByIdAsync(id);

            if (vehicle is null)
            {
                return NotFound();
            }

            _uow.VehicleRepository.Remove(vehicle);

            await transaction.CommitTransactionAsync();
        }

        return NoContent();
    }
}