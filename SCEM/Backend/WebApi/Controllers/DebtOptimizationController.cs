#pragma warning disable CS1591

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

/// <summary>
/// Vorschau für optimierte Zahlungen. Es werden keine Daten gespeichert.
/// Der Zugriff auf echte Gruppenschulden wird später separat angebunden.
/// </summary>
[Authorize(Policy = "NormalUser")]
[ApiController]
[Route("Debt/optimization")]
public class DebtOptimizationController : ControllerBase
{
    public record PaymentDto(string From, string To, decimal Amount);

    // Positiv: Person bekommt Geld. Negativ: Person schuldet Geld.
    public record BalanceDto(string Person, decimal NetAmount);

    public record OptimizationResultDto(
        int OriginalTransfers,
        int OptimizedTransfers,
        int TransfersSaved,
        string Algorithm,
        List<PaymentDto> OriginalPayments,
        List<PaymentDto> OptimizedPayments,
        List<BalanceDto> NetBalances
    );

    // GET /Debt/optimization/demo
    // Testbar ohne weitere Keycloak-Benutzer oder Datenbankeinträge.
    [HttpGet("demo")]
    public ActionResult<OptimizationResultDto> Demo()
    {
        var example = new List<PaymentDto>
        {
            new("Person A", "Person B", 50m),
            new("Person B", "Person C", 50m),
            new("Person C", "Person A", 20m)
        };

        return Ok(Optimize(example));
    }

    // POST /Debt/optimization/preview
    // Erwartet ein JSON-Array mit Testschulden. Keine Speicherung.
    [HttpPost("preview")]
    public ActionResult<OptimizationResultDto> Preview(
        [FromBody] List<PaymentDto>? payments)
    {
        if (payments is null || payments.Count == 0)
            return BadRequest("Enter at least one debt.");

        if (payments.Count > 100)
            return BadRequest("A maximum of 100 debts is supported per preview.");

        foreach (var payment in payments)
        {
            if (payment is null ||
                string.IsNullOrWhiteSpace(payment.From) ||
                string.IsNullOrWhiteSpace(payment.To))
            {
                return BadRequest("Each debt needs a debtor and a creditor.");
            }

            if (payment.From.Trim().Length > 100 ||
                payment.To.Trim().Length > 100)
            {
                return BadRequest("Names cannot exceed 100 characters.");
            }

            if (string.Equals(payment.From.Trim(), payment.To.Trim(),
                StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("A person cannot owe money to themselves.");
            }

            if (payment.Amount <= 0m || payment.Amount > 1000000m ||
                decimal.Round(payment.Amount, 2) != payment.Amount)
            {
                return BadRequest(
                    "Each amount must be greater than zero, at most 1000000 EUR, " +
                    "and have at most two decimal places.");
            }
        }

        var cleaned = payments.Select(p => new PaymentDto(
            p.From.Trim(), p.To.Trim(), p.Amount)).ToList();

        return Ok(Optimize(cleaned));
    }

    private static OptimizationResultDto Optimize(List<PaymentDto> payments)
    {
        var net = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

        foreach (var payment in payments)
        {
            // From schuldet To: From -Betrag, To +Betrag.
            net.TryAdd(payment.From, 0m);
            net.TryAdd(payment.To, 0m);
            net[payment.From] -= payment.Amount;
            net[payment.To] += payment.Amount;
        }

        var balances = net
            .Where(entry => entry.Value != 0m)
            .OrderBy(entry => entry.Key, StringComparer.OrdinalIgnoreCase)
            .Select(entry => new BalanceDto(entry.Key, entry.Value))
            .ToList();

        List<PaymentDto> optimized;
        string algorithm;

        if (balances.Count <= 12)
        {
            optimized = FindMinimumPayments(balances);
            algorithm = "Exact minimum (up to 12 people)";
        }
        else
        {
            optimized = SettleGroup(balances);
            algorithm = "Greedy approximation (more than 12 people)";
        }

        return new OptimizationResultDto(
            payments.Count,
            optimized.Count,
            payments.Count - optimized.Count,
            algorithm,
            payments,
            optimized,
            balances
        );
    }

    // Bis zu 12 Personen: finde die maximale Anzahl unabhängiger
    // Nullsummen-Gruppen. So werden global möglichst wenige
    // Überweisungen benötigt (je Gruppe: Personenanzahl - 1).
    private static List<PaymentDto> FindMinimumPayments(
        List<BalanceDto> balances)
    {
        var count = balances.Count;
        if (count == 0)
            return new List<PaymentDto>();

        var size = 1 << count;
        var sums = new decimal[size];
        var bestGroups = Enumerable.Repeat(-1, size).ToArray();
        var chosenGroup = new int[size];
        bestGroups[0] = 0;

        for (var mask = 1; mask < size; mask++)
        {
            var lowestBit = mask & -mask;
            var index = 0;
            while ((lowestBit >> index) != 1)
                index++;

            sums[mask] = sums[mask ^ lowestBit] + balances[index].NetAmount;
        }

        for (var mask = 1; mask < size; mask++)
        {
            if (sums[mask] != 0m)
                continue;

            var firstBit = mask & -mask;

            // Jede Nullsummen-Teilmenge mit firstBit nur einmal prüfen.
            for (var group = mask; group > 0; group = (group - 1) & mask)
            {
                if ((group & firstBit) == 0 || sums[group] != 0m)
                    continue;

                var remaining = mask ^ group;
                if (bestGroups[remaining] < 0)
                    continue;

                var candidate = bestGroups[remaining] + 1;
                if (candidate > bestGroups[mask])
                {
                    bestGroups[mask] = candidate;
                    chosenGroup[mask] = group;
                }
            }
        }

        var result = new List<PaymentDto>();
        var current = size - 1;

        while (current != 0)
        {
            var groupMask = chosenGroup[current];
            var groupBalances = new List<BalanceDto>();

            for (var i = 0; i < count; i++)
            {
                if ((groupMask & (1 << i)) != 0)
                    groupBalances.Add(balances[i]);
            }

            result.AddRange(SettleGroup(groupBalances));
            current ^= groupMask;
        }

        return result;
    }

    // Innerhalb einer Nullsummen-Gruppe: Schuldner und Gläubiger
    // gegeneinander aufrechnen, ohne die Summe zu verändern.
    private static List<PaymentDto> SettleGroup(
        List<BalanceDto> balances)
    {
        var debtors = balances
            .Where(b => b.NetAmount < 0m)
            .Select(b => new { b.Person, Remaining = -b.NetAmount })
            .ToList();

        var creditors = balances
            .Where(b => b.NetAmount > 0m)
            .Select(b => new { b.Person, Remaining = b.NetAmount })
            .ToList();

        // Anonyme Objekte besitzen unveränderliche Eigenschaften;
        // die Restbeträge werden daher in separaten Arrays geführt.
        var debtorRest = debtors.Select(d => d.Remaining).ToArray();
        var creditorRest = creditors.Select(c => c.Remaining).ToArray();
        var result = new List<PaymentDto>();
        var debtorIndex = 0;
        var creditorIndex = 0;

        while (debtorIndex < debtors.Count && creditorIndex < creditors.Count)
        {
            var amount = Math.Min(
                debtorRest[debtorIndex],
                creditorRest[creditorIndex]);

            if (amount > 0m)
            {
                result.Add(new PaymentDto(
                    debtors[debtorIndex].Person,
                    creditors[creditorIndex].Person,
                    amount));
            }

            debtorRest[debtorIndex] -= amount;
            creditorRest[creditorIndex] -= amount;

            if (debtorRest[debtorIndex] == 0m)
                debtorIndex++;

            if (creditorRest[creditorIndex] == 0m)
                creditorIndex++;
        }

        return result;
    }
}
