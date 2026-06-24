import { readResourceValue, readResourceValueOr } from './resource.utils';

describe('resource utils', () => {
  it('should return undefined without reading the value when the resource is in error', () => {
    const valueSpy = jasmine.createSpy('value').and.throwError('resource failed');
    const resource = {
      hasValue: () => false,
      value: valueSpy,
    };

    expect(readResourceValue(resource)).toBeUndefined();
    expect(valueSpy).not.toHaveBeenCalled();
  });

  it('should return the fallback without reading the value when the resource is in error', () => {
    const valueSpy = jasmine.createSpy('value').and.throwError('resource failed');
    const resource = {
      hasValue: () => false,
      value: valueSpy,
    };

    expect(readResourceValueOr(resource, [])).toEqual([]);
    expect(valueSpy).not.toHaveBeenCalled();
  });
});
