using Base.Core.Entities;
using System;

namespace Core.Entities;

public class User : EntityObject
{
    public required string Username { get; set; }

    public required string FirstName { get; set; }

    public required string LastName { get; set; }

    public required string Email { get; set; }

    public string? Phone { get; set; }

    public string? Location { get; set; }

    public DateTime CreatedAt { get; set; }
}