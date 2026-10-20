using Base.Core.Contracts;
using Base.Persistence;
using Core.Contracts;
using Core.Entities;

namespace Persistence;

public class UnitOfWork : BaseUnitOfWork, IUnitOfWork
{
    // =========================================
    // Repositories
    // =========================================

    public IMDemoRepository MDemoRepository { get; }

    public IGenericRepository<Vehicle> VehicleRepository { get; }

    public IGenericRepository<Group> GroupRepository { get; }

    public IGenericRepository<User> UserRepository { get; }


    // =========================================
    // Constructor
    // =========================================

    public UnitOfWork(
        ApplicationDbContext context,
        IMDemoRepository mDemoRepository
    ) : base(context)
    {
        MDemoRepository = mDemoRepository;

        VehicleRepository =
            new GenericRepository<Vehicle>(context);

        GroupRepository =
            new GenericRepository<Group>(context);

        UserRepository =
            new GenericRepository<User>(context);
    }
}