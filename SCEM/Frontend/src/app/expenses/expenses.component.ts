import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Expense, ExpenseService } from '../../services/expense.service';
@Component({selector:'app-expenses',standalone:true,imports:[RouterLink,DatePipe],templateUrl:'./expenses.component.html',styleUrls:['./expenses.component.css']})
export class ExpensesComponent{
 private readonly expenseService=inject(ExpenseService);activeFilter='All';
 get totalExpenses(){return this.expenseService.expenses.reduce((s,e)=>s+e.amount,0);} get filteredExpenses():Expense[]{const list=[...this.expenseService.expenses].sort((a,b)=>(b.date+b.id).localeCompare(a.date+a.id));return this.activeFilter==='All'?list:list.filter(e=>e.category===this.activeFilter);} setFilter(f:string){this.activeFilter=f;} tabClass(f:string){return this.activeFilter===f?'tab-btn active':'tab-btn';} categoryTotal(c:string){return this.expenseService.expenses.filter(e=>e.category===c).reduce((s,e)=>s+e.amount,0);} money(v:number){return new Intl.NumberFormat('de-AT',{style:'currency',currency:'EUR'}).format(v);} categoryClass(c:string){return c.toLowerCase();} icon(c:string){return c==='Fuel'?'⛽':c==='Parking'?'🅿️':c==='Maintenance'?'🔧':'💳';}
}
