import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getMonthNames } from '../../../utils/month.utils';

import { TrendChart } from './trend-chart';

describe('TrendChart', () => {
  let component: TrendChart;
  let fixture: ComponentFixture<TrendChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrendChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render only the months provided in input without filling gaps', () => {
    fixture.componentRef.setInput('monthlyNetWort', [
      {
        date: new Date(2026, 0, 1),
        value: 150,
      },
      {
        date: new Date(2026, 2, 1),
        value: 300,
      },
    ]);
    fixture.detectChanges();

    expect(component.data()?.labels).toEqual([
      getMonthNames(new Date(2026, 0, 1)),
      getMonthNames(new Date(2026, 2, 1)),
    ]);
    expect(component.data()?.datasets[0]?.data).toEqual([150, 300]);
  });
});
