using Base.Core.Contracts;
using Base.Persistence;
using Core.Contracts;
using Core.Entities;

namespace Persistence;

public class UnitOfWork : BaseUnitOfWork, IUnitOfWork
{
    public IMDemoRepository MDemoRepository { get; }

    public IGenericRepository<Vehicle> VehicleRepository { get; }

    public UnitOfWork(
        ApplicationDbContext context,
        IMDemoRepository mDemoRepository)
        : base(context)
    {
        MDemoRepository = mDemoRepository;
        VehicleRepository = new GenericRepository<Vehicle>(context);
    }
}