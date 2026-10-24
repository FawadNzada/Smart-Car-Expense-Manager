#pragma warning disable CS1591

using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

using Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace WebApi.Controllers;

[Authorize(Policy = "NormalUser")]
[ApiController]
[Route("[controller]")]
public class DebtController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public DebtController(ApplicationDbContext db)
    {
        _db = db;
    }

    // =========================================
    // DTOs
    // =========================================

    public record DebtDto(
        int Id,
        int ExpenseId,
        string Category,
        int DebtorId,
        string Debtor,
        int CreditorId,
        string Creditor,
        decimal Amount,
        bool IsPaid,
        DateTime? PaidAt
    );

    public record CreateDebtDto(
        int ExpenseId,
        int DebtorId,
        decimal Amount
    );

    public record PaymentStatusDto(
        bool IsPaid
    );

    // =========================================
    // KEYCLOAK USER
    // =========================================

    private async Task<int?> GetCurrentUserIdAsync()
    {
        var keycloakId =
            User.FindFirst("sub")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(keycloakId))
        {
            return null;
        }

        var username = $"keycloak:{keycloakId}";

        return await _db.Set<Core.Entities.User>()
            .AsNoTracking()
            .Where(user => user.Username == username)
            .Select(user => (int?)user.Id)
            .FirstOrDefaultAsync();
    }

    // =========================================
    // ENTITY -> DTO
    // =========================================

    private static DebtDto ToDto(ExpenseShare share)
    {
        var expense = share.Expense;
        var creditor = expense?.PaidBy;
        var debtor = share.User;

        var creditorName = creditor == null
            ? ""
            : $"{creditor.FirstName} {creditor.LastName}".Trim();

        var debtorName = debtor == null
            ? ""
            : $"{debtor.FirstName} {debtor.LastName}".Trim();

        return new DebtDto(
            share.Id,
            share.ExpenseId,
            expense?.Category ?? "",
            share.UserId,
            debtorName,
            expense?.PaidById ?? 0,
            creditorName,
            share.Amount,
            share.IsPaid,
            share.PaidAt
        );
    }

    // =========================================
    // GET /Debt
    // EIGENE SCHULDEN ANZEIGEN
    // =========================================

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DebtDto>>> GetAll()
    {
        var userId = await GetCurrentUserIdAsync();

        if (userId == null)
        {
            return Ok(new List<DebtDto>());
        }

        var shares = await _db.Set<ExpenseShare>()
            .AsNoTracking()
            .Include(share => share.User)
            .Include(share => share.Expense)
                .ThenInclude(expense => expense!.PaidBy)
            .Where(share =>
                share.UserId == userId.Value ||
                share.Expense!.PaidById == userId.Value
            )
            .OrderByDescending(share => share.Id)
            .ToListAsync();

        return Ok(shares.Select(ToDto).ToList());
    }

    // =========================================
    // GET /Debt/{id}
    // =========================================

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DebtDto>> GetById(int id)
    {
        var userId = await GetCurrentUserIdAsync();

        if (userId == null)
        {
            return NotFound();
        }

        var share = await _db.Set<ExpenseShare>()
            .AsNoTracking()
            .Include(s => s.User)
            .Include(s => s.Expense)
                .ThenInclude(e => e!.PaidBy)
            .FirstOrDefaultAsync(s =>
                s.Id == id &&
                (
                    s.UserId == userId.Value ||
                    s.Expense!.PaidById == userId.Value
                )
            );

        if (share == null)
        {
            return NotFound();
        }

        return Ok(ToDto(share));
    }

    // =========================================
    // POST /Debt
    // SCHULD ERSTELLEN
    // =========================================

    [HttpPost]
    public async Task<ActionResult<DebtDto>> Create(
        [FromBody] CreateDebtDto input
    )
    {
        var userId = await GetCurrentUserIdAsync();

        if (userId == null)
        {
            return Unauthorized();
        }

        if (input.Amount <= 0)
        {
            return BadRequest(
                "Amount must be greater than zero."
            );
        }

        var expense = await _db.Set<Expense>()
            .FirstOrDefaultAsync(e =>
                e.Id == input.ExpenseId &&
                e.PaidById == userId.Value
            );

        if (expense == null)
        {
            return NotFound(
                "Expense not found or not owned by you."
            );
        }

        if (input.DebtorId == userId.Value)
        {
            return BadRequest(
                "You cannot owe money to yourself."
            );
        }

        var debtorExists = await _db.Set<Core.Entities.User>()
            .AnyAsync(u => u.Id == input.DebtorId);

        if (!debtorExists)
        {
            return BadRequest("Debtor not found.");
        }

        var existingShares = await _db.Set<ExpenseShare>()
            .Where(s => s.ExpenseId == input.ExpenseId)
            .ToListAsync();

        if (existingShares.Any(s => s.UserId == input.DebtorId))
        {
            return Conflict(
                "This user already has a share of this expense."
            );
        }

        var allocatedAmount = existingShares.Sum(s => s.Amount);

        if (allocatedAmount + input.Amount > expense.Amount)
        {
            return BadRequest(
                "Total shares cannot exceed the expense amount."
            );
        }

        var share = new ExpenseShare
        {
            ExpenseId = input.ExpenseId,
            UserId = input.DebtorId,
            Amount = input.Amount,
            IsPaid = false,
            PaidAt = null
        };

        _db.Set<ExpenseShare>().Add(share);

        await _db.SaveChangesAsync();

        var created = await _db.Set<ExpenseShare>()
            .AsNoTracking()
            .Include(s => s.User)
            .Include(s => s.Expense)
                .ThenInclude(e => e!.PaidBy)
            .FirstAsync(s => s.Id == share.Id);

        return CreatedAtAction(
            nameof(GetById),
            new { id = share.Id },
            ToDto(created)
        );
    }

    // =========================================
    // PUT /Debt/{id}/paid
    // BEZAHLSTATUS ÄNDERN
    // =========================================

    [HttpPut("{id:int}/paid")]
    public async Task<IActionResult> SetPaymentStatus(
        int id,
        [FromBody] PaymentStatusDto input
    )
    {
        var userId = await GetCurrentUserIdAsync();

        if (userId == null)
        {
            return Unauthorized();
        }

        var share = await _db.Set<ExpenseShare>()
            .Include(s => s.Expense)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (share == null)
        {
            return NotFound();
        }

        // Nur die Person, die bezahlt hat,
        // darf den Zahlungseingang bestätigen.
        if (share.Expense?.PaidById != userId.Value)
        {
            return Forbid();
        }

        share.IsPaid = input.IsPaid;

        share.PaidAt = input.IsPaid
            ? DateTime.UtcNow
            : null;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    // =========================================
    // DELETE /Debt/{id}
    // OFFENE SCHULD ENTFERNEN
    // =========================================

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = await GetCurrentUserIdAsync();

        if (userId == null)
        {
            return Unauthorized();
        }

        var share = await _db.Set<ExpenseShare>()
            .Include(s => s.Expense)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (share == null)
        {
            return NotFound();
        }

        if (share.Expense?.PaidById != userId.Value)
        {
            return Forbid();
        }

        if (share.IsPaid)
        {
            return Conflict(
                "Paid debts cannot be deleted."
            );
        }

        _db.Set<ExpenseShare>().Remove(share);

        await _db.SaveChangesAsync();

        return NoContent();
    }
}