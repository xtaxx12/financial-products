import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { map, first } from 'rxjs/operators';
@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode: boolean = false;
  productId: string | null = null;
  loading: boolean = false;
  submitted: boolean = false;
  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productForm = this.createForm();
  }
  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct();
    }
    this.productForm.get('date_release')?.valueChanges.subscribe(value => {
      this.updateDateRevision(value);
    });
  }
  private createForm(): FormGroup {
    return this.fb.group({
      id: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(10)]],
      name: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      logo: ['', [Validators.required]],
      date_release: ['', [Validators.required, this.dateValidator()]],
      date_revision: [{ value: '', disabled: true }, [Validators.required]]
    });
  }
  private dateValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return null;
      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today ? null : { dateInvalid: true };
    };
  }
  private updateDateRevision(dateRelease: string): void {
    if (!dateRelease) {
      this.productForm.get('date_revision')?.setValue('');
      return;
    }
    const releaseDate = new Date(dateRelease);
    const revisionDate = new Date(releaseDate);
    revisionDate.setFullYear(releaseDate.getFullYear() + 1);
    this.productForm.get('date_revision')?.setValue(revisionDate.toISOString().split('T')[0]);
  }
  private loadProduct(): void {
    if (!this.productId) return;

    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (response) => {
        const product = response.data.find(p => p.id === this.productId);
        if (product) {
          this.productForm.patchValue({
            id: product.id,
            name: product.name || '',
            description: product.description || '',
            logo: product.logo || '',
            date_release: this.formatDateForInput(product.date_release),
            date_revision: this.formatDateForInput(product.date_revision)
          });
          this.productForm.get('id')?.disable();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
  validateFechaRevision(): boolean {
    const dateRelease = this.productForm.get('date_release')?.value;
    const dateRevision = this.productForm.get('date_revision')?.value;
    if (!dateRelease || !dateRevision) {
      return false;
    }
    const releaseDate = new Date(dateRelease);
    const revisionDate = new Date(dateRevision);
    const oneYearLater = new Date(releaseDate);
    oneYearLater.setFullYear(releaseDate.getFullYear() + 1);
    return revisionDate.getTime() === oneYearLater.getTime();
  }

  getErrorMessage(controlName: string): string {
    const control = this.productForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;
    if (errors['required']) return 'Este campo es requerido';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['dateInvalid']) return 'La fecha debe ser igual o mayor a la actual';
    if (errors['idExists']) return 'Este ID ya existe';
    if (errors['revisionDateInvalid']) return 'La Fecha de Revisión debe ser exactamente un año posterior a la Fecha de Liberación.';

    return 'Campo inválido';
  }

  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
  onSubmit(): void {
    this.submitted = true;
    if (this.productForm.invalid) {
      Object.keys(this.productForm.controls).forEach(key => {
        const control = this.productForm.get(key);
        if (control?.invalid) control.markAsTouched();
      });
      return;
    }
    this.productForm.get('date_revision')?.setValue(this.formatDateForInput(this.productForm.get('date_revision')?.value));
    const formData = { ...this.productForm.getRawValue() };
    if (this.isEditMode) {
      this.updateProduct(formData);
    } else {
      this.createProduct(formData);
    }
  }
  private createProduct(formData: any): void {
    this.loading = true;
    this.productService.verifyProductId(formData.id).subscribe({
      next: (exists) => {
        if (exists) {
          this.productForm.get('id')?.setErrors({ idExists: true });
          this.loading = false;
          return;
        }
        this.productService.createProduct(formData).subscribe({
          next: () => this.router.navigate(['/products']),
          error: () => {
            this.loading = false;
          }
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }
  private updateProduct(formData: any): void {
    if (!this.productId) return;
    this.loading = true;
    const updateData = { ...formData };
    delete updateData.id;
    this.productService.updateProduct(this.productId, updateData).subscribe({
      next: () => this.router.navigate(['/products']),
      error: () => {
        this.loading = false;
      }
    });
  }
  onReset(): void {
    this.submitted = false;
    this.productForm.reset({
      id: '',
      name: '',
      description: '',
      logo: '',
      date_release: '',
      date_revision: ''
    });
  }
}