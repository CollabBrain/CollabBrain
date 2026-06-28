import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('nên render text chính xác', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('nên trigger onClick khi được click', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('nên áp dụng đúng class variant và size', () => {
    const { container } = render(<Button variant="destructive" size="sm">Destructive</Button>);
    const button = container.firstChild as HTMLButtonElement;
    
    expect(button.className).toContain('bg-destructive');
    expect(button.className).toContain('h-9');
  });

  it('không nên gọi onClick khi bị disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click me</Button>);
    
    const button = screen.getByText('Click me');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
});
