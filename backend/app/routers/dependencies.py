from fastapi import APIRouter, HTTPException, status

from app.models.dependency import DependencyCreate, DependencyResponse
from app.services import dependency_service

router = APIRouter()


@router.get("", response_model=list[DependencyResponse])
async def list_dependencies():
    """Get all dependencies."""
    return await dependency_service.get_dependencies()


@router.get("/task/{task_id}", response_model=list[DependencyResponse])
async def get_dependencies_for_task(task_id: int):
    """Get all dependencies for a specific task."""
    return await dependency_service.get_dependencies_for_task(task_id)


@router.post("", response_model=DependencyResponse, status_code=status.HTTP_201_CREATED)
async def create_dependency(dependency: DependencyCreate):
    """
    Create a new dependency between tasks.

    A dependency means task_id depends on depends_on_task_id
    (task_id cannot be completed until depends_on_task_id is done).

    This endpoint validates:
    - Both tasks exist
    - The dependency doesn't already exist
    - Adding the dependency won't create a cycle
    """
    try:
        return await dependency_service.create_dependency(dependency)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{dependency_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dependency(dependency_id: int):
    """Delete a dependency."""
    deleted = await dependency_service.delete_dependency(dependency_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dependency {dependency_id} not found",
        )
