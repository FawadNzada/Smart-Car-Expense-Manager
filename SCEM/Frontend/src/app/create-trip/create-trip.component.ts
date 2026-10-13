import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VehicleService } from '../../services/vehicle.service';
import { TripService } from '../../services/trip.service';
@Component({selector:'app-create-trip',standalone:true,imports:[FormsModule,RouterLink],templateUrl:'./create-trip.component.html',styleUrls:['./create-trip.component.css']})
export class CreateTripComponent{
 private readonly vehicleService=inject(VehicleService); private readonly tripService=inject(TripService); private readonly router=inject(Router);
 selectedLicensePlate='';driver='';startLocation='';destination='';tripDate=new Date().toISOString().slice(0,10);startTime='09:00';endTime='10:00';startMileage=0;notes='';errorMessage='';
 get vehicles(){return this.vehicleService.vehicles;} get selectedVehicle(){return this.vehicleService.findVehicle(this.selectedLicensePlate);}
 saveTrip(){this.errorMessage='';const v=this.selectedVehicle;if(!v)return void(this.errorMessage='Please select a vehicle.');if(!this.driver.trim())return void(this.errorMessage='Please enter a driver.');if(!this.startLocation.trim())return void(this.errorMessage='Please enter a start location.');if(!this.destination.trim())return void(this.errorMessage='Please enter a destination.');if(this.tripDate<new Date().toISOString().slice(0,10))return void(this.errorMessage='Trip date cannot be in the past.');if(this.endTime<=this.startTime)return void(this.errorMessage='End time must be after start time.');if(this.startMileage<0)return void(this.errorMessage='Start mileage cannot be negative.');this.tripService.addTrip({vehicleName:v.name,licensePlate:v.licensePlate,vehicleImage:v.image,driver:this.driver.trim(),startLocation:this.startLocation.trim(),destination:this.destination.trim(),date:this.tripDate,startTime:this.startTime,endTime:this.endTime,startMileage:this.startMileage,endMileage:0,status:'Planned',notes:this.notes.trim()});this.router.navigate(['/trips']);}
}
