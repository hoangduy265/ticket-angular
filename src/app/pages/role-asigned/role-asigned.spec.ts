import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleAsigned } from './role-asigned';

describe('RoleAsigned', () => {
  let component: RoleAsigned;
  let fixture: ComponentFixture<RoleAsigned>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleAsigned]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleAsigned);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
