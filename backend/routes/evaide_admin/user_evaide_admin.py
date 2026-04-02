from fastapi import APIRouter
import services.evaide_admin.admin_user_services as services

router = APIRouter(prefix="/admin/users", tags=["Evaide Admin - Users"])


@router.get("/")
def list_all_users():
    return services.list_all_users()


@router.get("/agents")
def list_all_agents():
    return services.list_all_agents()


@router.get("/{user_id}")
def get_user(user_id: int):
    return services.get_user(user_id)


@router.patch("/enable/{user_id}")
def enable_user(user_id: int):
    return services.enable_user(user_id)


@router.patch("/disable/{user_id}")
def disable_user(user_id: int):
    return services.disable_user(user_id)


@router.patch("/role/{user_id}")
def change_user_role(user_id: int, new_role_id: int):
    return services.change_user_role(user_id, new_role_id)


@router.delete("/{user_id}")
def delete_user(user_id: int):
    return services.delete_user(user_id)
