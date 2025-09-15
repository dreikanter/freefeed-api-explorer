// Test the getStatusInfo function logic
function getStatusInfo(status: number) {
  if (status >= 200 && status < 300) {
    return {
      icon: 'check-circle-fill',
      color: 'text-success',
      text: `${status}`
    };
  } else if (status >= 300 && status < 400) {
    return {
      icon: 'arrow-right-circle-fill',
      color: 'text-warning',
      text: `${status}`
    };
  } else if (status >= 400) {
    return {
      icon: 'x-circle-fill',
      color: 'text-danger',
      text: `${status}`
    };
  } else {
    return {
      icon: 'x-circle-fill',
      color: 'text-danger',
      text: 'Error'
    };
  }
}

describe('ResponseStatus logic', () => {
  test('returns success info for 200 status', () => {
    const result = getStatusInfo(200);
    expect(result).toEqual({
      icon: 'check-circle-fill',
      color: 'text-success',
      text: '200'
    });
  });

  test('returns success info for 201 status', () => {
    const result = getStatusInfo(201);
    expect(result).toEqual({
      icon: 'check-circle-fill',
      color: 'text-success',
      text: '201'
    });
  });

  test('returns redirect info for 301 status', () => {
    const result = getStatusInfo(301);
    expect(result).toEqual({
      icon: 'arrow-right-circle-fill',
      color: 'text-warning',
      text: '301'
    });
  });

  test('returns redirect info for 302 status', () => {
    const result = getStatusInfo(302);
    expect(result).toEqual({
      icon: 'arrow-right-circle-fill',
      color: 'text-warning',
      text: '302'
    });
  });

  test('returns error info for 404 status', () => {
    const result = getStatusInfo(404);
    expect(result).toEqual({
      icon: 'x-circle-fill',
      color: 'text-danger',
      text: '404'
    });
  });

  test('returns error info for 500 status', () => {
    const result = getStatusInfo(500);
    expect(result).toEqual({
      icon: 'x-circle-fill',
      color: 'text-danger',
      text: '500'
    });
  });

  test('returns Error text for 0 status (network error)', () => {
    const result = getStatusInfo(0);
    expect(result).toEqual({
      icon: 'x-circle-fill',
      color: 'text-danger',
      text: 'Error'
    });
  });

  test('returns Error text for edge case 100 status (informational codes treated as errors)', () => {
    const result = getStatusInfo(100);
    expect(result).toEqual({
      icon: 'x-circle-fill',
      color: 'text-danger',
      text: 'Error'
    });
  });
});