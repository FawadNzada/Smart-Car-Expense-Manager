namespace frontend.Services;

public class GroupItem
{
    public int Id { get; set; }

    public string Name { get; set; } = "";

    public string Description { get; set; } = "";

    public string Owner { get; set; } = "";

    public DateTime CreatedAt { get; set; }

    public List<string> Members { get; set; } = new();

    public List<string> VehicleLicensePlates { get; set; } = new();
}


public class GroupStore
{
    private int nextId = 3;


    public List<GroupItem> Groups { get; } = new()
    {
        new GroupItem
        {
            Id = 1,

            Name = "Weekend Crew",

            Description = "Shared cars for weekend trips.",

            Owner = "Sebastian",

            CreatedAt = DateTime.Today.AddDays(-20),

            Members = new List<string>
            {
                "Sebastian",
                "Lisa",
                "Max"
            },

            VehicleLicensePlates = new List<string>
            {
                "L-123AB",
                "L-456CD"
            }
        },


        new GroupItem
        {
            Id = 2,

            Name = "Work Carsharing",

            Description = "Vehicles used for work related trips.",

            Owner = "Lisa",

            CreatedAt = DateTime.Today.AddDays(-8),

            Members = new List<string>
            {
                "Lisa",
                "Sebastian"
            },

            VehicleLicensePlates = new List<string>
            {
                "L-789EF"
            }
        }
    };


    public void AddGroup(GroupItem group)
    {
        group.Id = nextId++;

        Groups.Add(group);
    }


    public GroupItem? FindGroup(int id)
    {
        return Groups.FirstOrDefault(
            group => group.Id == id);
    }


    public void DeleteGroup(GroupItem group)
    {
        Groups.Remove(group);
    }


    public bool GroupNameExists(
        string name,
        GroupItem? ignoreGroup = null)
    {
        return Groups.Any(group =>
            group != ignoreGroup
            && group.Name.Equals(
                name,
                StringComparison.OrdinalIgnoreCase));
    }
}