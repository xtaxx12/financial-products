import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../services/product.service';
import { jest } from '@jest/globals';

interface ProductResponse {
  data: any[];
}

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let mockProductService: Partial<ProductService>;
  let mockRouter: Partial<Router>;

  // Intercepta y suprime los console.error
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(async () => {
    mockProductService = {
      getProducts: jest.fn(() => of({ data: [] } as ProductResponse)),
      deleteProduct: jest.fn(() => of({ message: 'Product deleted successfully' })),
    };

    mockRouter = {
      navigate: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ProductListComponent], // Como es un componente standalone, se importa aquí
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    const mockProducts = [
      { id: '1', name: 'Product A', description: 'Desc A', logo: 'logoA.png', date_release: '2023-01-01', date_revision: '2024-01-01' },
      { id: '2', name: 'Product B', description: 'Desc B', logo: 'logoB.png', date_release: '2023-02-01', date_revision: '2024-02-01' },
    ];

    (mockProductService.getProducts as jest.Mock).mockReturnValue(of({ data: mockProducts }));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.products.length).toBe(2);
    expect(component.filteredProducts.length).toBe(2);
    expect(component.loading).toBe(false);
  });

  it('should handle error when loading products', () => {
    (mockProductService.getProducts as jest.Mock).mockReturnValue(
      throwError(() => new Error('Error loading products'))
    );

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Error loading products');
    expect(component.loading).toBe(false);
  });

  it('should filter products based on searchTerm', () => {
    component.products = [
      { id: '1', name: 'Product A', description: 'Desc A', logo: 'logoA.png', date_release: '2023-01-01', date_revision: '2024-01-01' },
      { id: '2', name: 'Product B', description: 'Desc B', logo: 'logoB.png', date_release: '2023-02-01', date_revision: '2024-02-01' },
    ];

    component.searchTerm = 'B';
    component.applyFilter();

    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].name).toBe('Product B');
  });

  it('should navigate to add product page', () => {
    component.onAddProduct();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/product/add']);
  });

  it('should toggle dropdown menu visibility', () => {
    component.toggleDropdown('1');
    expect(component.showDropdown).toBe('1');

    component.toggleDropdown('1');
    expect(component.showDropdown).toBeNull();
  });

  it('should delete product successfully', () => {
    component.products = [
      { id: '1', name: 'Product A', description: 'Desc A', logo: 'logoA.png', date_release: '2023-01-01', date_revision: '2024-01-01' }
    ];
    component.filteredProducts = [...component.products];

    (mockProductService.deleteProduct as jest.Mock).mockReturnValue(
      of({ message: 'Product deleted successfully' })
    );

    component.confirmDelete('1', 'Product A');
    component.deleteProduct();

    expect(component.filteredProducts.length).toBe(0);
    expect(component.showDeleteModal).toBe(false);
  });

  it('should handle error when deleting product', () => {
    (mockProductService.deleteProduct as jest.Mock).mockReturnValue(
      throwError(() => new Error('Error deleting product'))
    );

    component.confirmDelete('1', 'Product A');
    component.deleteProduct();

    expect(component.errorMessage).toBe('Error deleting product');
    expect(component.showDeleteModal).toBe(false);
  });

  it('should validate fechaRevision correctly', () => {
    component.fechaLiberacion = '2024-02-18';
    component.fechaRevision = '2025-02-18';

    expect(component.validateFechaRevision()).toBe(true);

    component.fechaRevision = '2023-12-31';
    expect(component.validateFechaRevision()).toBe(false);
  });
});
