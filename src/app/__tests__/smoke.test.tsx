import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

function Hello() { return <h1>portfolio</h1> }

describe('toolchain', () => {
  it('renders react components under vitest', () => {
    render(<Hello />)
    expect(screen.getByRole('heading')).toHaveTextContent('portfolio')
  })
})
