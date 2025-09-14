import { render } from '@testing-library/svelte';
import MethodBadge from './MethodBadge.svelte';

describe('MethodBadge', () => {
  test('renders GET method with success styling', () => {
    const { getByText } = render(MethodBadge, { props: { method: 'GET' } });

    const badge = getByText('GET');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge');
    expect(badge).toHaveClass('bg-success');
  });

  test('renders POST method with primary styling', () => {
    const { getByText } = render(MethodBadge, { props: { method: 'POST' } });

    const badge = getByText('POST');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge');
    expect(badge).toHaveClass('bg-primary');
  });

  test('renders PUT method with warning styling', () => {
    const { getByText } = render(MethodBadge, { props: { method: 'PUT' } });

    const badge = getByText('PUT');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge');
    expect(badge).toHaveClass('bg-warning');
  });

  test('renders DELETE method with danger styling', () => {
    const { getByText } = render(MethodBadge, { props: { method: 'DELETE' } });

    const badge = getByText('DELETE');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge');
    expect(badge).toHaveClass('bg-danger');
  });

  test('renders unknown method with secondary styling', () => {
    const { getByText } = render(MethodBadge, { props: { method: 'PATCH' } });

    const badge = getByText('PATCH');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge');
    expect(badge).toHaveClass('bg-secondary');
  });
});
