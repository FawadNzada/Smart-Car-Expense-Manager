using Base.Core.Contracts;
using Core.Entities;

namespace Core.Contracts;

public interface IUnitOfWork : IBaseUnitOfWork
{
    // Demo
    IMDemoRepository MDemoRepository { get; }

    // Fahrzeuge
    IGenericRepository<Vehicle> VehicleRepository { get; }

    // Gruppen
    IGenericRepository<Group> GroupRepository { get; }

    // Benutzer
    IGenericRepository<User> UserRepository { get; }
}