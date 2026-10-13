using Core.Contracts;

using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Base.Web.Controller;

using Core.DataTransferObjects;
using Core.Entities;

using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

/// <summary>
/// REST Controller for Demo
/// </summary>
[Authorize(Policy = "NormalUser")]
[ApiController]
[Route("[controller]")]
public class DemoController : ControllerBase
{
    private readonly IUnitOfWork             _uow;
    private readonly ILogger<DemoController> _logger;

    /// <summary>
    /// Constructor of DemoController.
    /// </summary>
    /// <param name="uow"></param>
    /// <param name="logger"></param>
    public DemoController(IUnitOfWork uow, ILogger<DemoController> logger)
    {
        _uow    = uow;
        _logger = logger;
    }

    #region Dto

    /// <summary>
    /// DemoDto
    /// </summary>
    public record DemoDto(
        int            Id,
        string         Name,
        int            FDemoId,
        string?        ForeignName,
        IList<string>? DetailNames
    );

    MDemo ToEntity(DemoDto dto)
    {
        return new MDemo()
        {
            Id      = dto.Id,
            Name    = dto.Name,
            FDemoId = dto.FDemoId
        };
    }

    DemoDto? ToDto(MDemo? entity)
    {
        if (entity is null)
        {
            return null;
        }

        return new DemoDto(
            entity.Id,
            entity.Name,
            entity.FDemoId,
            entity.FDemo?.Name ?? string.Empty,
            entity.DDemos?.Select(x => x.Name).ToList() ?? new List<string>()
        );
    }

    IList<DemoDto>? ToDto(IList<MDemo>? list)
    {
        if (list is null)
        {
            return null;
        }

        return list.Select(x => ToDto(x)!).ToList();
    }

    #endregion

    /// <summary>
    /// Get all DemoOverview.
    /// </summary>
    /// <returns></returns>
    [HttpGet("overview")]
    public async Task<ActionResult<IEnumerable<MDemoDto>>> GetOverviewAsync()
    {
        var allEntities = await _uow.MDemoRepository.GetOverviewAsync();

        return await this.NotFoundOrOk(allEntities);
    }

    #region default REST

    /// <summary>
    /// Get all Demos.
    /// </summary>
    /// <param name="sort">Optional sort by property.</param>
    /// <returns></returns>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DemoDto>>> GetAsync(string? sort)
    {
        Func<IQueryable<MDemo>, IOrderedQueryable<MDemo>>? orderBy =
            sort switch
            {
                nameof(MDemo.Id)   => (query) => query.OrderBy(o => o.Id),
                nameof(MDemo.Name) => (query) => query.OrderBy(o => o.Name),
                _                  => null
            };

        var allEntities = await _uow.MDemoRepository.GetNoTrackingAsync(
            null,
            orderBy,
            nameof(MDemo.FDemo),
            nameof(MDemo.DDemos)
        );

        return await this.NotFoundOrOk(ToDto(allEntities));
    }

    /// <summary>
    /// Get a specified Demo.
    /// </summary>
    /// <param name="id">The id of the Demo.</param>
    /// <returns></returns>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<DemoDto>> GetAsync(int id)
    {
        var entity = await _uow.MDemoRepository.GetByIdAsync(id,
            nameof(MDemo.FDemo),
            nameof(MDemo.DDemos)
        );
        ;
        return await this.NotFoundOrOk(ToDto(entity));
    }

    /// <summary>
    /// Add a new Demo to the database.
    /// </summary>
    /// <param name="value">Values of the new Demo.</param>
    /// <returns></returns>
    [HttpPost]
    public async Task<ActionResult<DemoDto>> AddAsync([FromBody] DemoDto value)
    {
        using (var trans = _uow.BeginTransaction())
        {
            var entity = ToEntity(value);
            await _uow.MDemoRepository.AddAsync(entity);

            await trans.CommitTransactionAsync();

            var newId  = entity.Id;
            var newUri = this.GetCurrentUri() + "/" + newId;
            return Created(newUri, ToDto(await _uow.MDemoRepository.GetByIdAsync(newId,
                nameof(MDemo.FDemo),
                nameof(MDemo.DDemos)
            )));
        }
    }

    /// <summary>
    /// Update the specified Demo.
    /// </summary>
    /// <param name="id">Id of the Demo.</param>
    /// <param name="value">New values of the Demo.</param>
    /// <returns></returns>
    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, [FromBody] DemoDto value)
    {
        if (id.CompareTo(value.Id) != 0)
        {
            return BadRequest("Mismatch between id and dto.Id");
        }

        using (var trans = _uow.BeginTransaction())
        {
            var entity = await _uow.MDemoRepository.GetByIdAsync(id);
            if (entity is null)
            {
                return NotFound();
            }

            entity.Name    = value.Name;
            entity.FDemoId = value.FDemoId;

            await trans.CommitTransactionAsync();
        }

        return NoContent();
    }

    /// <summary>
    /// Delete a Demo specified by the id.
    /// </summary>
    /// <param name="id">The id of the Demo.</param>
    /// <returns></returns>
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        using (var trans = _uow.BeginTransaction())
        {
            var entry = await _uow.MDemoRepository.GetByIdAsync(id);
            if (entry is not null)
            {
                _uow.MDemoRepository.Remove(entry);
            }

            await trans.CommitTransactionAsync();

            return NoContent();
        }
    }

    #endregion
}