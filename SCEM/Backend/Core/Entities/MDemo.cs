using Base.Core.Entities;

namespace Core.Entities;

using System.Collections.Generic;

public class MDemo : EntityObject
{
    public required string Name { get; set; }

    public int    FDemoId { get; set; }
    public FDemo? FDemo   { get; set; }

    public IList<DDemo>? DDemos { get; set; }
}