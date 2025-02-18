// src/app/config/app.routes.ts

import { Routes } from '@angular/router';
import { ProductListComponent } from '././components/product-list/product-list.component';
import { ProductFormComponent } from '././components/product-form/product-form.component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'products', 
    pathMatch: 'full' 
  },
  {
    path: 'products',
    component: ProductListComponent
  },
  {
    path: 'product/add',
    component: ProductFormComponent
  },
  {
    path: 'product/edit/:id',
    component: ProductFormComponent
  }
];