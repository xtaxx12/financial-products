// src/app/components/product-list/product-list.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm: string = '';
  pageSize: number = 5;
  pageSizeOptions: number[] = [5, 10, 20];
  loading: boolean = true;
  showDropdown: string | null = null;
  showDeleteModal: boolean = false;
  productIdToDelete: string | null = null;
  productNameToDelete: string | null = null;
  fechaRevision: string = '';
  fechaLiberacion: string = ''; // Assuming this is available
  errorMessage: string | null = null; // Add this property

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.fechaLiberacion = this.getCurrentDate(); // Set fechaLiberacion for testing
    this.fechaRevision = this.getCurrentDate();
  }
  onAddProduct(): void {
    this.router.navigate(['/product/add']);
  }
  

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.products = response.data;
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error loading products';
        console.error('Error loading products:', error);
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = this.products.slice(0, this.pageSize);
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products
      .filter(product => 
        product.name.toLowerCase().includes(searchTermLower) ||
        product.description.toLowerCase().includes(searchTermLower)
      )
      .slice(0, this.pageSize);
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilter();
  }

  onPageSizeChange(event: Event): void {
    this.pageSize = Number((event.target as HTMLSelectElement).value);
    this.applyFilter();
  }

  toggleDropdown(productId: string): void {
    this.showDropdown = this.showDropdown === productId ? null : productId;
  }

  onEdit(productId: string): void {
    this.router.navigate(['/product/edit', productId]);
    this.showDropdown = null;
  }

  onDelete(productId: string, productName: string): void {
    this.confirmDelete(productId, productName);
  }

  confirmDelete(productId: string, productName: string): void {
    this.productIdToDelete = productId;
    this.productNameToDelete = productName;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.productIdToDelete = null;
    this.productNameToDelete = null;
  }

  deleteProduct(): void {
    if (!this.productIdToDelete) return;

    this.productService.deleteProduct(this.productIdToDelete).subscribe({
      next: () => {
        this.filteredProducts = this.filteredProducts.filter(p => p.id !== this.productIdToDelete);
        this.showDeleteModal = false;
        this.productIdToDelete = null;
        this.productNameToDelete = null;
      },
      error: (error) => {
        this.errorMessage = 'Error deleting product';
        console.error('Error deleting product:', error);
        this.showDeleteModal = false;
        this.productIdToDelete = null;
        this.productNameToDelete = null;
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  validateFechaRevision(): boolean {
    if (!this.fechaLiberacion || !this.fechaRevision) {
      return false;
    }
    const liberacionDate = new Date(this.fechaLiberacion);
    const revisionDate = new Date(this.fechaRevision);
    const oneYearLater = new Date(liberacionDate);
    oneYearLater.setFullYear(liberacionDate.getFullYear() + 1);
    return revisionDate.getTime() === oneYearLater.getTime();
  }
}