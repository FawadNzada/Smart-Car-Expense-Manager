namespace Core.Entities;

using Base.Core.Entities;

public class DDemo : EntityObject
{
    public required string Name { get; set; }

    public decimal? Length { get; set; }

    public bool? IsElectric { get; set; }

    public int    MDemoId { get; set; }
    public MDemo? MDemo   { get; set; }
}