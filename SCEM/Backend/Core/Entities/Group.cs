using Base.Core.Entities;
using System;
using System.Collections.Generic;

namespace Core.Entities;

public class Group : EntityObject
{
    public required string Name { get; set; }

    public string? Description { get; set; }

    public int OwnerId { get; set; }

    public User? Owner { get; set; }

    public DateTime CreatedAt { get; set; }

    public IList<UserGroup> UserGroups { get; set; } = new List<UserGroup>();

    public IList<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
}