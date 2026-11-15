import { apiFetch } from "./api";

const API = '/productos';

/*
* Obtiene todos los productos en bases de datos
*/
export const getProductos = async () =>{
    return await apiFetch(`${API}/`,{method:'GET'});
}

/*
* Obtiene el catálogo de marcas
*/
export const getMarcas = async () => {
    return await apiFetch('/marcas/', { method: 'GET' });
}

/*
* Obtiene el catálogo de categorías / presentaciones
*/
export const getCategoriasPresentacion = async () => {
    try {
        return await apiFetch('/categorias-presentaciones/', { method: 'GET' });
    } catch {
        return await apiFetch('/categorias/', { method: 'GET' });
    }
}

/*
* Consulta productos mediante dbo.sp_Productos_Seleccionar.
*/
export const getProductosId = async ({
    id
}) => {
    return await apiFetch(`${API}/`,{
        method:'POST',
        body: JSON.stringify({
            id:Number(id)
        })
    });
}

/*
* Actualiza un producto mediante dbo.sp_ActualizarProducto.
*/
export const actualizarProducto = async ({
    id,
    Nombre,
    Caracteristicas,
    Precio,
    IdMarcas,
    IdCategoriaPresentacion,
    IdProveedor
}) => {
    return await apiFetch(`${API}/actualizar/`,{
        method:'POST',
        body:JSON.stringify({
            id:Number(id),
            Nombre:Nombre,
            Caracteristicas:Caracteristicas,
            Precio: Number(Precio).toFixed(2),
            idMarcas:Number(IdMarcas),
            idCategoriaPresentacion:Number(IdCategoriaPresentacion),
            idProveedor: Number(IdProveedor)
        })
    });
}

/*
* Actualiza un producto mediante dbo.sp_ActualizarProducto.
*/
export const actualizarProductoPut = async ({
    id,
    Nombre,
    Caracteristicas,
    Precio,
    IdMarcas,
    IdCategoriaPresentacion,
    IdProveedor
}) => {
    return await apiFetch(`${API}/actualizar/`,{
        method:'PUT',
        body:JSON.stringify({
            id:Number(id),
            Nombre:Nombre,
            Caracteristicas:Caracteristicas,
            Precio: Number(Precio).toFixed(2),
            idMarcas:Number(IdMarcas),
            idCategoriaPresentacion:Number(IdCategoriaPresentacion),
            idProveedor: Number(IdProveedor)
        })
    });
}

/*
* Crea un producto mediante dbo.sp_Productos_Insertar.
*/
export const crearProducto = async ({
    id = null,
    Nombre,
    Caracteristicas,
    Precio,
    IdMarcas,
    IdCategoriaPresentacion,
    IdProveedor
}) => {
    return await apiFetch(`${API}/crear/`,{
        method:'POST',
        body:JSON.stringify({
            ...(id ? { id: Number(id) } : {}),
            Nombre:Nombre,
            Caracteristicas:Caracteristicas,
            Precio: Number(Precio).toFixed(2),
            idMarcas:Number(IdMarcas),
            idCategoriaPresentacion:Number(IdCategoriaPresentacion),
            IdProveedor: Number(IdProveedor)
        })
    });
}

/*
* Elimina un producto mediante dbo.sp_EliminarProducto
*/
export const eliminarProducto = async ({
    id
}) => {
    return await apiFetch(`${API}/eliminar/`,{
        method:'POST',
        body:JSON.stringify({
            id:Number(id)
        })
    });
}

/*
* Elimina un producto mediante dbo.sp_EliminarProducto
*/
export const deleteProducto = async ({
    id
}) => {
    return await apiFetch(`${API}/eliminar/`,{
        method:'DELETE',
        body:JSON.stringify({
            id:Number(id)
        })
    });
}


