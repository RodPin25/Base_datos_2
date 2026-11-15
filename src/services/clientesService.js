import { apiFetch } from "./api";

export const getClientes = async () =>{
    return await apiFetch('/clientes/',{ method:'GET' });
}

export const postClientes = async ({
    id
}) => {
    return await apiFetch('/clientes/',{
        method:'POST',
        body:JSON.stringify({
            id:Number(id)
        })
    });
}

export const actualizarClientes = async ({
    id,
    Nombre,
    Apellidos,
    NIT
}) => {
    return await apiFetch('/clientes/actualizar/',{
        method:'POST',
        body:JSON.stringify({
            id:Number(id),
            Nombres:Nombre,
            Apellidos:Apellidos,
            NIT:NIT
        })
    });
}

export const updateClientes = async ({
    id,
    Nombre,
    Apellidos,
    NIT
}) => {
    return await apiFetch('/clientes/actualizar/',{
        method:'PUT',
        body:JSON.stringify({
            id:Number(id),
            Nombres:Nombre,
            Apellidos:Apellidos,
            NIT:NIT
        })
    });
}

export const crearClientes = async ({
    id = null,
    Nombre,
    Apellidos,
    NIT
}) => {
    return await apiFetch('/clientes/crear/',{
        method:'POST',
        body:JSON.stringify({
            ...(id ? { id: Number(id) } : {}),
            Nombre:Nombre,
            Apellidos:Apellidos,
            NIT:NIT
        })
    });
}

export const eliminarClientes = async ({
    id
}) => {
    return await apiFetch('/clientes/eliminar/',{
        method:'POST',
        body:JSON.stringify({
            id:Number(id)
        })
    });
}

export const deleteClientes = async ({
    id
}) => {
    return await apiFetch('/clientes/eliminar/',{
        method:'DELETE',
        body:JSON.stringify({
            id:Number(id)
        })
    });
}