import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VehicleService } from '../../services/vehicle.service';
import { Reservation, ReservationService } from '../../services/reservation.service';

@Component({ selector: 'app-edit-reservation', standalone: true, imports: [FormsModule, RouterLink], templateUrl: './edit-reservation.component.html', styleUrls: ['./edit-reservation.component.css'] })
export class EditReservationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly vehicleService = inject(VehicleService); private readonly reservationService = inject(ReservationService);
  reservation?: Reservation; selectedLicensePlate=''; driver=''; reservationDate=''; startTime='09:00'; endTime='10:00'; status='Planned'; notes=''; errorMessage='';
  get vehicles(){return this.vehicleService.vehicles;} get selectedVehicle(){return this.vehicleService.findVehicle(this.selectedLicensePlate);}
  ngOnInit():void{ const id=Number(this.route.snapshot.paramMap.get('id')); this.reservation=this.reservationService.findReservation(id); if(!this.reservation)return; const r=this.reservation; this.selectedLicensePlate=r.licensePlate; this.driver=r.driver; this.reservationDate=r.date; this.startTime=r.startTime; this.endTime=r.endTime; this.status=r.status; this.notes=r.notes; }
  saveChanges():void{ const r=this.reservation, v=this.selectedVehicle; this.errorMessage=''; if(!r)return; if(!v)return void(this.errorMessage='Please select a vehicle.'); if(!this.driver.trim())return void(this.errorMessage='Please enter a driver.'); if(this.reservationDate < new Date().toISOString().slice(0,10))return void(this.errorMessage='Reservation date cannot be in the past.'); if(this.endTime<=this.startTime)return void(this.errorMessage='End time must be after start time.'); if(this.status!=='Cancelled'&&this.status!=='Completed'&&this.reservationService.hasConflict(v.licensePlate,this.reservationDate,this.startTime,this.endTime,r.id))return void(this.errorMessage='This vehicle is already reserved during this time.'); Object.assign(r,{vehicleName:v.name,licensePlate:v.licensePlate,vehicleImage:v.image,driver:this.driver.trim(),date:this.reservationDate,startTime:this.startTime,endTime:this.endTime,status:this.status,notes:this.notes.trim()}); this.router.navigate(['/reservations',r.id]); }
  statusClass(){return this.status.toLowerCase();}

  dateLong(date: string): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .format(new Date(date + 'T12:00:00'));
  }

  durationText(): string {
    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number);
      return hours * 60 + minutes;
    };
    if (!this.startTime || !this.endTime || this.endTime <= this.startTime) return '-';
    const mins = toMinutes(this.endTime) - toMinutes(this.startTime);
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
  }
}
