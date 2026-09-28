using Core.Contracts;

using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

using Base.Web.Controller;

using Core.Entities;

using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

using System;
using System.Threading.Tasks;

/// <summary>
/// REST Controller for Demo
/// </summary>
[Authorize(Policy = "AdminUser")]
[ApiController]
[Route("[controller]")]
public class AdminController : ControllerBase
{
    private readonly IUnitOfWork             _uow;
    private readonly IImportService          _importService;
    private readonly ILogger<DemoController> _logger;

    /// <summary>
    /// Constructor of AdminController.
    /// </summary>
    /// <param name="uow"></param>
    /// <param name="importService"></param>
    /// <param name="logger"></param>
    public AdminController(IUnitOfWork uow, IImportService importService, ILogger<DemoController> logger)
    {
        _uow                = uow;
        _importService = importService;
        _logger             = logger;
    }

    /// <summary>
    /// Do something important.
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    public async Task<ActionResult> DoSomethingAsync()
    {
        await Task.CompletedTask;
        return Ok();
    }
    /// <summary>
    /// Init Database.
    /// </summary>
    /// <returns></returns>
    [HttpPut]
    public async Task<ActionResult> InitDataBaseAsync()
    {
        await _uow.DeleteDatabaseAsync();
        await _uow.CreateDatabaseAsync();
        await _importService.ImportDbAsync();
        return Ok();
    }

}