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

    /// <summary>
    /// Creates the vehicle controller.
    /// </summary>
    public VehicleController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    /// <summary>
    /// Vehicle data returned by the API.
    /// </summary>
    public record VehicleDto(
        int Id,
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

    /// <summary>
    /// Gets a vehicle by its ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<VehicleDto>> GetByIdAsync(int id)
    {
        var vehicle = await _uow.VehicleRepository.GetByIdAsync(id);

        if (vehicle is null)
        {
            return NotFound();
        }

        return Ok(ToDto(vehicle));
    }
}
