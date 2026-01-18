from fastapi import APIRouter, HTTPException, status

from app.models.subtask import SubtaskCreate, SubtaskResponse, SubtaskUpdate
from app.services import subtask_service

router = APIRouter()


@router.get("/tasks/{task_id}/subtasks", response_model=list[SubtaskResponse])
async def list_subtasks(task_id: int):
    """Get all subtasks for a task."""
    return await subtask_service.get_subtasks_for_task(task_id)


@router.post(
    "/tasks/{task_id}/subtasks",
    response_model=SubtaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_subtask(task_id: int, subtask: SubtaskCreate):
    """Create a new subtask for a task."""
    try:
        return await subtask_service.create_subtask(task_id, subtask)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.patch("/subtasks/{subtask_id}", response_model=SubtaskResponse)
async def update_subtask(subtask_id: int, update: SubtaskUpdate):
    """Update a subtask (toggle completion or change title)."""
    result = await subtask_service.update_subtask(subtask_id, update)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subtask {subtask_id} not found",
        )
    return result


@router.delete("/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtask(subtask_id: int):
    """Delete a subtask."""
    deleted = await subtask_service.delete_subtask(subtask_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subtask {subtask_id} not found",
        )
