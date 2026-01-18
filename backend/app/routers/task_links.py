from fastapi import APIRouter, HTTPException, status

from app.models.task_link import TaskLinkCreate, TaskLinkResponse
from app.services import task_link_service

router = APIRouter()


@router.get("/tasks/{task_id}/links", response_model=list[TaskLinkResponse])
async def list_links(task_id: int):
    """Get all links for a task."""
    return await task_link_service.get_links_for_task(task_id)


@router.post(
    "/tasks/{task_id}/links",
    response_model=TaskLinkResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_link(task_id: int, link: TaskLinkCreate):
    """Create a new link for a task."""
    try:
        return await task_link_service.create_link(task_id, link)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete("/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link(link_id: int):
    """Delete a link."""
    deleted = await task_link_service.delete_link(link_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Link {link_id} not found",
        )
