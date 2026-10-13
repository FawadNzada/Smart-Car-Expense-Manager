using Core.DataTransferObjects;
using Core.Entities;

namespace Core.Contracts;

using System.Collections.Generic;
using System.Threading.Tasks;

using Base.Core.Contracts;

public interface IMDemoRepository : IGenericRepository<MDemo>
{
    Task<IList<MDemoDto>> GetOverviewAsync();
}