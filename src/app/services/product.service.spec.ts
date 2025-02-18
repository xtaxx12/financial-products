import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Product } from '../models/product';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:3002'; // Actualizado para usar la URL local

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get products', () => {
    const mockProducts = {
      data: [
        { 
          id: '1', 
          name: 'Test Product',
          description: 'Test Description',
          logo: 'test.png',
          date_release: '2024-02-19',
          date_revision: '2025-02-19'
        }
      ]
    };

    service.getProducts().subscribe(products => {
      expect(products).toEqual(mockProducts);
    });

    const req = httpMock.expectOne(`${baseUrl}/bp/products`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });

  it('should verify product ID', () => {
    const productId = 'test123';

    service.verifyProductId(productId).subscribe(result => {
      expect(result).toBe(true);
    });

    const req = httpMock.expectOne(`${baseUrl}/bp/products/verification/${productId}`);
    expect(req.request.method).toBe('GET');
    req.flush(true);
  });

  it('should create a product', () => {
    const newProduct: Product = {
      id: 'new123',
      name: 'New Product',
      description: 'New Description',
      logo: 'new.png',
      date_release: '2024-02-19',
      date_revision: '2025-02-19'
    };

    service.createProduct(newProduct).subscribe(response => {
      expect(response).toEqual(newProduct);
    });

    const req = httpMock.expectOne(`${baseUrl}/bp/products`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newProduct);
    req.flush(newProduct);
  });

  it('should update a product', () => {
    const productId = 'test123';
    const updateData = {
      name: 'Updated Product',
      description: 'Updated Description',
      logo: 'updated.png',
      date_release: '2024-02-19',
      date_revision: '2025-02-19'
    };

    service.updateProduct(productId, updateData).subscribe(response => {
      expect(response).toEqual(updateData);
    });

    const req = httpMock.expectOne(`${baseUrl}/bp/products/${productId}`);
    expect(req.request.method).toBe('PUT');
    // El cuerpo de la solicitud debería ser solo updateData, sin el id
    expect(req.request.body).toEqual(updateData);
    req.flush(updateData);
  });

  it('should delete a product', () => {
    const productId = 'test123';

    service.deleteProduct(productId).subscribe(response => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${baseUrl}/bp/products/${productId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should handle errors when getting products', () => {
    service.getProducts().subscribe({
      error: error => {
        expect(error.status).toBe(404);
      }
    });

    const req = httpMock.expectOne(`${baseUrl}/bp/products`);
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });

  it('should handle errors when creating product', () => {
    const newProduct: Product = {
      id: 'new123',
      name: 'New Product',
      description: 'New Description',
      logo: 'new.png',
      date_release: '2024-02-19',
      date_revision: '2025-02-19'
    };

    service.createProduct(newProduct).subscribe({
      error: error => {
        expect(error.status).toBe(400);
      }
    });

    const req = httpMock.expectOne(`${baseUrl}/bp/products`);
    req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
  });

  it('should handle errors when updating product', () => {
    const productId = 'test123';
    const updateData = {
      name: 'Updated Product',
      description: 'Updated Description'
    };

    service.updateProduct(productId, updateData).subscribe({
      error: error => {
        expect(error.status).toBe(400);
      }
    });

    const req = httpMock.expectOne(`${baseUrl}/bp/products/${productId}`);
    req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
  });
});
