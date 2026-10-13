import { Routes } from '@angular/router';

import { MDemosComponent } from './mdemos/mdemos.component';
import { MDemoDetailComponent } from './mdemo.detail/mdemo.detail.component';
import { MDemoAddComponent } from './mdemo.add/mdemo.add.component';
import { MDemoUpdateComponent } from './mdemo.update/mdemo.update.component';

import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { VehiclesComponent } from './vehicles/vehicles.component';
import { VehicleDetailsComponent } from './vehicle-details/vehicle-details.component';
import { EditVehicleComponent } from './edit-vehicle/edit-vehicle.component';
import { CreateVehicleComponent } from './create-vehicle/create-vehicle.component';

import { ReservationsComponent } from './reservations/reservations.component';
import { CreateReservationComponent } from './create-reservation/create-reservation.component';
import { ReservationDetailsComponent } from './reservation-details/reservation-details.component';
import { EditReservationComponent } from './edit-reservation/edit-reservation.component';

import { TripsComponent } from './trips/trips.component';
import { CreateTripComponent } from './create-trip/create-trip.component';
import { TripDetailsComponent } from './trip-details/trip-details.component';
import { EditTripComponent } from './edit-trip/edit-trip.component';

import { ExpensesComponent } from './expenses/expenses.component';
import { CreateExpenseComponent } from './create-expense/create-expense.component';
import { ExpenseDetailsComponent } from './expense-details/expense-details.component';
import { EditExpenseComponent } from './edit-expense/edit-expense.component';

import { DebtsComponent } from './debts/debts.component';
import { CreateDebtComponent } from './create-debt/create-debt.component';
import { DebtDetailsComponent } from './debt-details/debt-details.component';
import { EditDebtComponent } from './edit-debt/edit-debt.component';

import { GroupsComponent } from './groups/groups.component';
import { CreateGroupComponent } from './create-group/create-group.component';
import { GroupDetailsComponent } from './group-details/group-details.component';
import { EditGroupComponent } from './edit-group/edit-group.component';

import { StatisticsComponent } from './statistics/statistics.component';

import { AdminComponent } from './admin/admin.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { canActivateAuthRole } from './guards/auth-role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },

  { path: 'vehicles', component: VehiclesComponent },
  { path: 'createvehicle', component: CreateVehicleComponent },
  { path: 'vehicles/edit/:licensePlate', component: EditVehicleComponent },
  { path: 'vehicles/:licensePlate', component: VehicleDetailsComponent },

  { path: 'reservations', component: ReservationsComponent },
  { path: 'createreservation', component: CreateReservationComponent },
  { path: 'reservations/edit/:id', component: EditReservationComponent },
  { path: 'reservations/:id', component: ReservationDetailsComponent },

  { path: 'trips', component: TripsComponent },
  { path: 'createtrip', component: CreateTripComponent },
  { path: 'trips/edit/:id', component: EditTripComponent },
  { path: 'trips/:id', component: TripDetailsComponent },

  { path: 'expenses', component: ExpensesComponent },
  { path: 'createexpense', component: CreateExpenseComponent },
  { path: 'expenses/edit/:id', component: EditExpenseComponent },
  { path: 'expenses/:id', component: ExpenseDetailsComponent },

  { path: 'debts', component: DebtsComponent },
  { path: 'createdebt', component: CreateDebtComponent },
  { path: 'debts/edit/:id', component: EditDebtComponent },
  { path: 'debts/:id', component: DebtDetailsComponent },

  { path: 'groups', component: GroupsComponent },
  { path: 'creategroup', component: CreateGroupComponent },
  { path: 'groups/edit/:id', component: EditGroupComponent },
  { path: 'groups/:id', component: GroupDetailsComponent },

  { path: 'statistics', component: StatisticsComponent },

  { path: 'mdemos', component: MDemosComponent, canActivate: [canActivateAuthRole], data: { role: 'myUserRole' } },
  { path: 'mdemo-add', component: MDemoAddComponent, canActivate: [canActivateAuthRole], data: { role: 'myUserRole' } },
  { path: 'mdemo-detail/:id', component: MDemoDetailComponent, canActivate: [canActivateAuthRole], data: { role: 'myUserRole' } },
  { path: 'mdemo-update/:id', component: MDemoUpdateComponent, canActivate: [canActivateAuthRole], data: { role: 'myUserRole' } },
  { path: 'admin', component: AdminComponent, canActivate: [canActivateAuthRole], data: { role: 'myAdminRole' } },
  { path: 'profile', component: UserProfileComponent },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: '**', redirectTo: '/home' }
];
