import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TripService } from '../../services/trip.service';
@Component({selector:'app-trip-details',standalone:true,imports:[FormsModule,RouterLink],templateUrl:'./trip-details.component.html',styleUrls:['./trip-details.component.css']})
export class TripDetailsComponent{
 private readonly route=inject(ActivatedRoute);private readonly tripService=inject(TripService);showCompleteModal=false;showCancelModal=false;endMileage=0;errorMessage='';
 get trip(){const t=this.tripService.findTrip(Number(this.route.snapshot.paramMap.get('id')));if(t&&this.endMileage===0)this.endMileage=t.endMileage>0?t.endMileage:t.startMileage;return t;}
 statusClass(s:string){return s.toLowerCase();} distance(){const t=this.trip;return t&&t.endMileage>0&&t.endMileage>=t.startMileage?`${t.endMileage-t.startMileage} km`:'-';}
 completeTrip(){const t=this.trip;if(!t)return;if(this.endMileage<t.startMileage)return void(this.errorMessage='End mileage cannot be lower than start mileage.');t.endMileage=this.endMileage;t.status='Completed';this.showCompleteModal=false;this.errorMessage='';}
 cancelTrip(){if(this.trip)this.trip.status='Cancelled';this.showCancelModal=false;}
}
