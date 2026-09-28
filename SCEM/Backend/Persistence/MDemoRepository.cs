using Base.Persistence;

using Core.Contracts;
using Core.DataTransferObjects;
using Core.Entities;

using System.Linq;

using Microsoft.EntityFrameworkCore;

namespace Persistence;

using System.Collections.Generic;
using System.Threading.Tasks;

public class MDemoRepository : GenericRepository<MDemo>, IMDemoRepository
{
    public MDemoRepository(ApplicationDbContext dbContext) : base(dbContext)
    {
    }

    public async Task<IList<MDemoDto>> GetOverviewAsync()
    {
        return await DbSet
            .Include(s => s.DDemos)
            .Include(s => s.FDemo)
            .OrderBy(s => s.Name)
            .Select(s => new MDemoDto(
                s.Id,
                s.Name,
                s.FDemo!.Name,
                string.Join(",", s.DDemos!.Select(l => l.Name))))
            .ToListAsync();
    }
}