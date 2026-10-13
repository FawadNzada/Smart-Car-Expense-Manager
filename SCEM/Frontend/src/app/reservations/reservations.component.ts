import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reservation, ReservationService } from '../../services/reservation.service';
@Component({selector:'app-reservations',standalone:true,imports:[RouterLink],templateUrl:'./reservations.component.html',styleUrls:['./reservations.component.css']})
export class ReservationsComponent{
 private readonly service=inject(ReservationService); activeFilter='All';
 get filteredReservations():Reservation[]{const today=new Date().toISOString().slice(0,10);const list=[...this.service.reservations].sort((a,b)=>(a.date+a.startTime).localeCompare(b.date+b.startTime));switch(this.activeFilter){case'Upcoming':return list.filter(r=>r.status!=='Cancelled'&&r.status!=='Completed'&&r.date>=today);case'Past':return list.filter(r=>r.status!=='Cancelled'&&r.status!=='Completed'&&r.date<today);case'Completed':return list.filter(r=>r.status==='Completed');case'Cancelled':return list.filter(r=>r.status==='Cancelled');default:return list;}}
 setFilter(f:string){this.activeFilter=f;} tabClass(f:string){return this.activeFilter===f?'tab-btn active':'tab-btn';}
 displayStatus(r:Reservation){const today=new Date().toISOString().slice(0,10);if(r.status==='Cancelled'||r.status==='Completed')return r.status;if(r.date<today)return'Past';return r.status;}
 statusClass(r:Reservation){return this.displayStatus(r).toLowerCase();}
 duration(r:Reservation){const toM=(x:string)=>{const[h,m]=x.split(':').map(Number);return h*60+m};const mins=toM(r.endTime)-toM(r.startTime);if(mins<=0)return'-';const h=Math.floor(mins/60),m=mins%60;return m?`${h} h ${m} min`:`${h} h`;}
 dateLong(d:string){return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d+'T12:00:00'));}
}
