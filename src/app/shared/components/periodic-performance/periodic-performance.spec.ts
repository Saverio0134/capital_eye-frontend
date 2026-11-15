import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PeriodicPerformance } from './periodic-performance';

describe('PeriodicPerformance', () => {
  let component: PeriodicPerformance;
  let fixture: ComponentFixture<PeriodicPerformance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodicPerformance],
    }).compileComponents();

    fixture = TestBed.createComponent(PeriodicPerformance);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default selectedPeriod to 3 (quarterly)', () => {
    expect(component.selectedPeriod()).toBe(3);
  });

  it('should default selectedMetric to currency', () => {
    expect(component.selectedMetric()).toBe('currency');
  });

  it('should render empty message when data is insufficient', () => {
    fixture.componentRef.setInput('data', [{ date: new Date(), value: 100 }]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dati storici insufficienti');
  });

  it('should calculate and display periodic items when enough data is provided', () => {
    fixture.componentRef.setInput('data', [
      { date: new Date(2025, 0, 31), value: 1000 },
      { date: new Date(2025, 1, 28), value: 1100 },
      { date: new Date(2025, 2, 31), value: 1200 },
      { date: new Date(2025, 5, 30), value: 1500 },
    ]);
    fixture.detectChanges();

    expect(component.items().length).toBeGreaterThan(0);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Dati storici insufficienti');
  });

  it('should toggle selectedPeriod when user changes period', () => {
    component.selectedPeriod.set(1);
    expect(component.selectedPeriod()).toBe(1);

    component.selectedPeriod.set(6);
    expect(component.selectedPeriod()).toBe(6);

    component.selectedPeriod.set(12);
    expect(component.selectedPeriod()).toBe(12);
  });

  it('should toggle selectedMetric between currency and percent', () => {
    component.selectedMetric.set('percent');
    expect(component.selectedMetric()).toBe('percent');

    component.selectedMetric.set('currency');
    expect(component.selectedMetric()).toBe('currency');
  });
});
