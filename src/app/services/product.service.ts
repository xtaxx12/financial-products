// src/app/services/product.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductResponse, ProductCreateResponse } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_URL = 'http://localhost:3002/bp/products';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(this.API_URL);
  }

  createProduct(product: Product): Observable<ProductCreateResponse> {
    return this.http.post<ProductCreateResponse>(this.API_URL, product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<ProductCreateResponse> {
    return this.http.put<ProductCreateResponse>(`${this.API_URL}/${id}`, product);
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`);
  }

  verifyProductId(id: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.API_URL}/verification/${id}`);
  }
}