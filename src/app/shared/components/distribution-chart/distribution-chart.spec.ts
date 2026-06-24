import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributionChart } from './distribution-chart';

describe('DistributionChart', () => {
  let component: DistributionChart;
  let fixture: ComponentFixture<DistributionChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DistributionChart],
    }).compileComponents();

    fixture = TestBed.createComponent(DistributionChart);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('labels', ['Liquidita', 'Investimenti']);
    fixture.componentRef.setInput('values', [100, 200]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use explicit hover colors for pie slices', () => {
    const chartData = component.data();
    const dataset = chartData?.datasets[0];

    expect(dataset?.backgroundColor).toEqual(dataset?.hoverBackgroundColor);
  });
});
