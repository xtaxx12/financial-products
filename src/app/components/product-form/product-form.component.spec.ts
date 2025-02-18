import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import { ProductFormComponent } from './product-form.component';
import { jest } from '@jest/globals';

// Mocks de ProductService con los métodos usados.
const mockProductService = {
  getProducts: jest.fn(),
  verifyProductId: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn()
};

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: jest.Mocked<ActivatedRoute>;

  beforeEach(async () => {
    // Por defecto, ActivatedRoute sin 'id' (modo creación)
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jest.fn(() => null)
        }
      }
    } as unknown as jest.Mocked<ActivatedRoute>;

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true as never)
    } as unknown as jest.Mocked<Router>;

    await TestBed.configureTestingModule({
      imports: [
        ProductFormComponent, 
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        CommonModule
      ],
      providers: [
        { provide: 'ProductService', useValue: mockProductService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    const formValue = component.productForm.getRawValue();
    expect(formValue).toEqual({
      id: '',
      name: '',
      description: '',
      logo: '',
      date_release: '',
      date_revision: ''
    });
  });

  it('should not load product if no id is present in route (creation mode)', () => {
    expect(component.isEditMode).toBe(false);
    expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalled();
  });

  it('should load product in edit mode and patch form values', fakeAsync(() => {
    // Re-crea el componente simulando que la ruta contiene un id
    mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('123');
    const productData = {
      id: '123',
      name: 'Test Product',
      description: 'Test Description',
      logo: 'logo.png',
      date_release: '2023-01-01',
      date_revision: '2024-01-01'
    };
    (mockProductService.getProducts as jest.Mock).mockReturnValue(of({ data: [productData] }));

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component.isEditMode).toBe(true);
    expect(component.productId).toBe('123');
    expect(component.productForm.get('name')?.value).toEqual('Test Product');

    // En modo edición, el control 'id' debe estar deshabilitado.
    expect(component.productForm.get('id')?.disabled).toBe(true);
  }));

  it('should handle error when loading product', fakeAsync(() => {
    mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('123');
    (mockProductService.getProducts as jest.Mock).mockReturnValue(throwError(() => new Error('Load error')));

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(component.loading).toBe(true);
  }));

  it('should update date_revision when date_release changes', () => {
    const today = new Date();
    // Fijamos una fecha de liberación (por ejemplo, mañana)
    const releaseDate = new Date(today);
    releaseDate.setDate(today.getDate() + 1);
    const releaseStr = releaseDate.toISOString().split('T')[0];
    component.productForm.get('date_release')?.setValue(releaseStr);
    // Se espera que date_revision sea un año después
    const expectedRevision = new Date(releaseDate);
    expectedRevision.setFullYear(expectedRevision.getFullYear() + 1);
    const expectedStr = expectedRevision.toISOString().split('T')[0];
    expect(component.productForm.get('date_revision')?.value).toEqual(expectedStr);
  });

  it('should mark all enabled controls as touched if form is invalid on submit', () => {
    // El formulario inicial es inválido (todos vacíos)
    component.onSubmit();
    fixture.detectChanges();
    Object.keys(component.productForm.controls).forEach(key => {
      const control = component.productForm.get(key);
      if (control && control.enabled) {
        expect(control.touched).toBe(true);
      }
    });
  });

  it('should create product on submit when not in edit mode', fakeAsync(() => {
    component.isEditMode = false;
    // Aseguramos que el control 'id' esté habilitado para la creación.
    component.productForm.get('id')?.enable();
    const validData = {
      id: 'P123',
      name: 'New Product',
      description: 'Valid Description',
      logo: 'logo.png',
      date_release: '2023-12-12',
      date_revision: '2024-12-12'
    };
    component.productForm.patchValue(validData);
    // Forzamos la validación asíncrona del 'id'
    component.productForm.get('id')?.updateValueAndValidity();
    tick();
    // Simulamos que el ID no existe.
    (mockProductService.verifyProductId as jest.Mock).mockReturnValue(of(false));
    (mockProductService.createProduct as jest.Mock).mockReturnValue(of({}));

    component.onSubmit();
    tick();
    fixture.detectChanges();

    expect(mockProductService.createProduct).toHaveBeenCalledWith(validData);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  }));

  it('should set id error if verifyProductId returns true on create', fakeAsync(() => {
    component.isEditMode = false;
    component.productForm.get('id')?.enable();
    const validData = {
      id: 'P123',
      name: 'New Product',
      description: 'Valid Description',
      logo: 'logo.png',
      date_release: '2023-12-12',
      date_revision: '2024-12-12'
    };
    component.productForm.patchValue(validData);
    component.productForm.get('id')?.updateValueAndValidity();
    tick();
    // Simula que el ID ya existe.
    (mockProductService.verifyProductId as jest.Mock).mockReturnValue(of(true));
    component.onSubmit();
    tick();
    fixture.detectChanges();

    expect(component.productForm.get('id')?.errors).toEqual({ idExists: true });
    expect(mockProductService.createProduct).not.toHaveBeenCalled();
  }));

  it('should update product on submit when in edit mode', fakeAsync(() => {
    component.isEditMode = true;
    component.productId = '123';
    // En modo edición, el control 'id' debe estar deshabilitado.
    component.productForm.get('id')?.disable();
    const validData = {
      id: 'P123',
      name: 'Updated Product',
      description: 'Updated Description',
      logo: 'logo.png',
      date_release: '2023-12-12',
      date_revision: '2024-12-12'
    };
    component.productForm.patchValue(validData);
    (mockProductService.updateProduct as jest.Mock).mockReturnValue(of({}));

    component.onSubmit();
    tick();
    fixture.detectChanges();

    const { id, ...expectedData } = validData;
    expect(mockProductService.updateProduct).toHaveBeenCalledWith('123', expectedData);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  }));

  it('should handle error on createProduct failure', fakeAsync(() => {
    component.isEditMode = false;
    component.productForm.get('id')?.enable();
    const validData = {
      id: 'P123',
      name: 'New Product',
      description: 'Valid Description',
      logo: 'logo.png',
      date_release: '2023-12-12',
      date_revision: '2024-12-12'
    };
    component.productForm.patchValue(validData);
    component.productForm.get('id')?.updateValueAndValidity();
    tick();
    (mockProductService.verifyProductId as jest.Mock).mockReturnValue(of(false));
    (mockProductService.createProduct as jest.Mock).mockReturnValue(throwError(() => new Error('Create error')));

    component.onSubmit();
    tick();
    fixture.detectChanges();

    expect(component.loading).toBe(false);
  }));

  it('should handle error on updateProduct failure', fakeAsync(() => {
    component.isEditMode = true;
    component.productId = '123';
    component.productForm.get('id')?.disable();
    const validData = {
      id: 'P123',
      name: 'Updated Product',
      description: 'Updated Description',
      logo: 'logo.png',
      date_release: '2023-12-12',
      date_revision: '2024-12-12'
    };
    component.productForm.patchValue(validData);
    (mockProductService.updateProduct as jest.Mock).mockReturnValue(throwError(() => new Error('Update error')));

    component.onSubmit();
    tick();
    fixture.detectChanges();

    expect(component.loading).toBe(false);
  }));

  it('should reset the form on onReset', () => {
    component.submitted = true;
    component.productForm.patchValue({ name: 'Something' });
    component.onReset();
    fixture.detectChanges();
    expect(component.submitted).toBe(false);
    // Después de reset, se espera que los controles vuelvan a su valor inicial (cadena vacía).
    expect(component.productForm.value.name).toBe('');
  });

  it('getErrorMessage should return correct messages based on control errors', () => {
    let control = component.productForm.get('name');
    // Simula error required.
    control?.setErrors({ required: true });
    control?.markAsTouched();
    expect(component.getErrorMessage('name')).toBe('Este campo es requerido');

    // Simula error minlength.
    control?.setErrors({ minlength: { requiredLength: 5 } });
    expect(component.getErrorMessage('name')).toBe('Mínimo 5 caracteres');

    // Simula error maxlength.
    control?.setErrors({ maxlength: { requiredLength: 100 } });
    expect(component.getErrorMessage('name')).toBe('Máximo 100 caracteres');

    // Para date_release.
    control = component.productForm.get('date_release');
    control?.setErrors({ dateInvalid: true });
    control?.markAsTouched();
    expect(component.getErrorMessage('date_release')).toBe('La fecha debe ser igual o mayor a la actual');

    // Para id.
    control = component.productForm.get('id');
    control?.setErrors({ idExists: true });
    control?.markAsTouched();
    expect(component.getErrorMessage('id')).toBe('Este ID ya existe');

    // Para date_revision, cuando validateFechaRevision() falla.
    control = component.productForm.get('date_revision');
    control?.setErrors({}); // Sin error específico, pero validación retorna false.
    component.productForm.get('date_release')?.setValue('2023-01-01');
    component.productForm.get('date_revision')?.setValue('2023-12-31');
    control?.markAsTouched();
    expect(component.getErrorMessage('date_revision')).toBe('La Fecha de Revisión debe ser exactamente un año posterior a la Fecha de Liberación.');
  });

  it('validateFechaRevision should return correct boolean', () => {
    component.productForm.get('date_release')?.setValue('2023-01-01');
    component.productForm.get('date_revision')?.setValue('2024-01-01'); // Exactamente un año después.
    expect(component.validateFechaRevision()).toBe(true);

    component.productForm.get('date_revision')?.setValue('2023-12-31'); // No es exactamente un año.
    expect(component.validateFechaRevision()).toBe(false);
  });
});
