using Base.Core.Contracts;
using Core.Entities;

namespace Core.Contracts;

public interface IUnitOfWork : IBaseUnitOfWork
{
    IMDemoRepository MDemoRepository { get; }

    IGenericRepository<Vehicle> VehicleRepository { get; }

    IGenericRepository<Group> GroupRepository { get; }

    IGenericRepository<User> UserRepository { get; }

    IGenericRepository<Reservation> ReservationRepository { get; }

    IGenericRepository<Trip> TripRepository { get; }

    IGenericRepository<Expense> ExpenseRepository { get; }
}