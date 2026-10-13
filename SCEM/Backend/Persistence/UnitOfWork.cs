using Core.Contracts;

namespace Persistence;

using Base.Persistence;

public class UnitOfWork : BaseUnitOfWork, IUnitOfWork
{
    public IMDemoRepository MDemoRepository { get; }

    public UnitOfWork(ApplicationDbContext context,
        IMDemoRepository                   mDemoRepository
    ) : base(context)
    {
        MDemoRepository = mDemoRepository;
    }
}