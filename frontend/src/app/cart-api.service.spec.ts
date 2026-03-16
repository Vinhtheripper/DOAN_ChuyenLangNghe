import { TestBed } from '@angular/core/testing';

import { CartAPIService } from './cart-api.service';

describe('CartAPIService', () => {
  let service: CartAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
