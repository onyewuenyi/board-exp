import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// Mock dnd-kit since it requires complex setup
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
    isOver: false,
    active: null,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}))

// Mock framer-motion to simplify testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Import after mocks
import { SortableTaskCard } from './SortableTaskCard'
import { Task } from '@/types'

const mockTask: Task = {
  id: 'TEST-1',
  title: 'Test Task',
  priority: 'med',
  status: 'todo',
  createdAt: Date.now(),
}

describe('SortableTaskCard', () => {
  let mockOnClick: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnClick = vi.fn()
  })

  it('should call onClick when pointer down and up without movement', async () => {
    render(
      <SortableTaskCard
        task={mockTask}
        onClick={mockOnClick}
      />
    )

    // Find the clickable wrapper div (contains the task title)
    const taskTitle = screen.getByText('Test Task')
    const clickableWrapper = taskTitle.closest('[class*="rounded-lg"]')!

    // Simulate pointer down
    fireEvent.pointerDown(clickableWrapper, {
      clientX: 100,
      clientY: 100,
    })

    // Simulate pointer up at same position (click)
    fireEvent.pointerUp(clickableWrapper, {
      clientX: 100,
      clientY: 100,
    })

    expect(mockOnClick).toHaveBeenCalledWith(mockTask)
  })

  it('should NOT call onClick when pointer moves more than 5px (drag)', async () => {
    render(
      <SortableTaskCard
        task={mockTask}
        onClick={mockOnClick}
      />
    )

    const taskTitle = screen.getByText('Test Task')
    const clickableWrapper = taskTitle.closest('[class*="rounded-lg"]')!

    // Simulate pointer down
    fireEvent.pointerDown(clickableWrapper, {
      clientX: 100,
      clientY: 100,
    })

    // Simulate pointer up with significant movement (drag)
    fireEvent.pointerUp(clickableWrapper, {
      clientX: 150, // 50px movement
      clientY: 100,
    })

    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('should NOT call onClick when clicking on a button', async () => {
    render(
      <SortableTaskCard
        task={mockTask}
        onClick={mockOnClick}
      />
    )

    // Find a button inside the card (priority button)
    const buttons = screen.getAllByRole('button')
    const priorityButton = buttons[0]

    // Simulate pointer down on button
    fireEvent.pointerDown(priorityButton, {
      clientX: 100,
      clientY: 100,
    })

    // Simulate pointer up on button
    fireEvent.pointerUp(priorityButton, {
      clientX: 100,
      clientY: 100,
    })

    // Should not call onClick because target is a button
    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('should call onClick when clicking on task title text', async () => {
    render(
      <SortableTaskCard
        task={mockTask}
        onClick={mockOnClick}
      />
    )

    const taskTitle = screen.getByText('Test Task')

    // Simulate pointer events directly on the title
    fireEvent.pointerDown(taskTitle, {
      clientX: 100,
      clientY: 100,
    })

    fireEvent.pointerUp(taskTitle, {
      clientX: 100,
      clientY: 100,
    })

    expect(mockOnClick).toHaveBeenCalledWith(mockTask)
  })

  it('should NOT call onClick if pointerUp happens without pointerDown', async () => {
    render(
      <SortableTaskCard
        task={mockTask}
        onClick={mockOnClick}
      />
    )

    const taskTitle = screen.getByText('Test Task')
    const clickableWrapper = taskTitle.closest('[class*="rounded-lg"]')!

    // Only pointer up, no pointer down
    fireEvent.pointerUp(clickableWrapper, {
      clientX: 100,
      clientY: 100,
    })

    expect(mockOnClick).not.toHaveBeenCalled()
  })
})
