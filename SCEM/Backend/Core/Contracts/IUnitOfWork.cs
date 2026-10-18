using Base.Core.Contracts;
using Core.Entities;

namespace Core.Contracts;

public interface IUnitOfWork : IBaseUnitOfWork
{
    IMDemoRepository MDemoRepository { get; }

    IGenericRepository<Vehicle> VehicleRepository { get; }
}