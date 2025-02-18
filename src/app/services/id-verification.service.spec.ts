import { TestBed } from '@angular/core/testing';

import { IdVerificationService } from './id-verification.service';

describe('IdVerificationService', () => {
  let service: IdVerificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdVerificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
