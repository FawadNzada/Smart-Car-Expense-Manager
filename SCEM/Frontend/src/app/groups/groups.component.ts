import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { VehicleService } from '../../services/vehicle.service';
@Component({selector:'app-groups',standalone:true,imports:[RouterLink,DatePipe],templateUrl:'./groups.component.html',styleUrls:['./groups.component.css']})
export class GroupsComponent{readonly groupService=inject(GroupService);readonly vehicleService=inject(VehicleService);get totalMembers(){return new Set(this.groupService.groups.flatMap(g=>g.members.map(m=>m.toLowerCase()))).size}get assignedVehicles(){return new Set(this.groupService.groups.flatMap(g=>g.vehicleLicensePlates.map(v=>v.toLowerCase()))).size}get availableVehicles(){return this.vehicleService.vehicles.filter(v=>v.status==='Available').length}initials(n:string){const p=n.trim().split(/\s+/);return (p.length===1?p[0][0]:p[0][0]+p[p.length-1][0]).toUpperCase()}vehicle(plate:string){return this.vehicleService.findVehicle(plate)}}
